(ns logseq.api.test-helper
  "Local-db worker stubs so plugin API tests can run without a db worker."
  (:require [cljs.reader]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as conn]
            [frontend.db.transact :as db-transact]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.util :as util]
            [logseq.api.db-based.tools :as api-tools]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.inputs :as db-inputs]
            [logseq.db.frontend.property :as db-property]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.tree :as otree]
            [promesa.core :as p]))

(def test-plugin-id :test-plugin)

(def ^:private block-pull-selector
  '[*
    {:block/tags [:db/id :db/ident :block/uuid :block/title]}
    {:block/parent [:db/id :block/uuid]}
    {:block/page [:db/id :block/uuid :block/title :block/name]}
    {:block/refs [:db/id :block/uuid :block/title]}])

(defn- current-db
  []
  (conn/get-db (state/get-current-repo)))

(defn- current-conn
  []
  (conn/get-db (state/get-current-repo) false))

(defn- reader-character-literal?
  [input value]
  (and (string? input)
       (string/starts-with? input "\\")
       (char? value)))

(defn- query-input-value
  [input]
  (if (and (string? input)
           (not (page-ref/page-ref? input)))
    (try
      (let [value (cljs.reader/read-string input)]
        (if (or (symbol? value) (reader-character-literal? input value))
          input
          value))
      (catch :default _
        input))
    input))

(defn- resolve-block-entity
  [db id]
  (cond
    (uuid? id)
    (d/entity db [:block/uuid id])

    (integer? id)
    (d/entity db id)

    (keyword? id)
    (d/entity db id)

    (and (vector? id) (= 2 (count id)))
    (d/entity db id)

    (string? id)
    (if (util/uuid-string? id)
      (d/entity db [:block/uuid (uuid id)])
      (or (ldb/get-page db id)
          (ldb/get-case-page db id)))

    :else
    nil))

(defn- entity->plain-summary
  [entity]
  (when entity
    (cond-> {:db/id (:db/id entity)}
      (:db/ident entity) (assoc :db/ident (:db/ident entity))
      (:block/uuid entity) (assoc :block/uuid (:block/uuid entity))
      (:block/title entity) (assoc :block/title (:block/title entity))
      (:block/name entity) (assoc :block/name (:block/name entity))
      (contains? entity :logseq.property/value)
      (assoc :logseq.property/value (:logseq.property/value entity))
      (:logseq.property/type entity)
      (assoc :logseq.property/type (:logseq.property/type entity)))))

(defn- sanitize-api-value
  "Plugin host APIs walk maps with clojure.walk. Live Datascript entities
  include reverse refs, so converting them as maps overflows the stack."
  [value]
  (walk/prewalk
   (fn [item]
     (if (de/entity? item)
       (entity->plain-summary item)
       item))
   value))

(defn- properties-map
  [entity]
  (->> (db-property/properties entity)
       (map (fn [[k v]] [k (sanitize-api-value v)]))
       (into {})))

(defn- entity->api-map
  [db entity]
  (when entity
    (let [pulled (d/pull db block-pull-selector (:db/id entity))]
      (assoc pulled
             :block/properties (properties-map entity)
             :block.temp/has-children? (boolean (first (d/datoms db :avet :block/parent (:db/id entity))))))))

(defn- children-maps
  [db parent]
  (mapv #(entity->api-map db %) (ldb/get-children db (:block/uuid parent))))

(defn- descendant-maps
  [db parent]
  (->> (common-initial-data/get-block-children-ids db (:db/id parent))
       (map #(d/entity db %))
       (mapv #(entity->api-map db %))))

(defn- get-blocks-response
  [db requests]
  (mapv (fn [{:keys [id opts]}]
          (if-let [entity (resolve-block-entity db id)]
            (let [block (entity->api-map db entity)]
              (if (:children? opts)
                {:block block
                 :children (descendant-maps db entity)}
                {:block block}))
            nil))
        requests))

(defn- pull-entity
  [db selector id]
  (let [eid (if (and (vector? id) (= :block/name (first id)))
              (:db/id (ldb/get-page db (second id)))
              (or (:db/id (resolve-block-entity db id)) id))]
    (some->> eid
             (d/pull db selector)
             (common-initial-data/with-parent db))))

(defn- apply-ops!
  [ops opts]
  (let [result (outliner-op/apply-ops! (current-conn) ops (dissoc opts :editor/edit-block-fn))]
    (when-let [edit-block-f (:editor/edit-block-fn opts)]
      (edit-block-f nil))
    result))

(defn apply-test-outliner-ops!
  [_conn ops opts]
  (apply-ops! ops opts))

(defn- handle-block-worker
  [db api args]
  (case api
    :thread-api/get-blocks
    (let [[_repo requests] args]
      (get-blocks-response db requests))

    :thread-api/pull
    (let [[_repo selector id] args]
      (pull-entity db selector id))

    :thread-api/q
    (let [[_repo inputs] args]
      (apply d/q (first inputs) db (rest inputs)))

    :thread-api/datoms
    (let [[_repo index & components] args]
      (apply d/datoms db index components))

    :thread-api/transact
    (let [[_repo tx-data tx-meta] args]
      (ldb/transact! (current-conn) tx-data tx-meta)
      nil)

    :thread-api/apply-outliner-ops
    (let [[_repo ops opts] args]
      (apply-ops! ops opts))

    :thread-api/get-block-immediate-children
    (let [[_repo block-uuid] args]
      (when-let [entity (resolve-block-entity db block-uuid)]
        (children-maps db entity)))

    :thread-api/get-block-sibling
    (let [[_repo block-id direction] args]
      (when-let [block (d/entity db block-id)]
        (let [sibling (case direction
                        :left (ldb/get-left-sibling block)
                        :right (ldb/get-right-sibling block)
                        :last-child (some->> (:db/id block)
                                             (ldb/get-block-last-direct-child-id db)
                                             (d/entity db))
                        nil)]
          (entity->api-map db sibling))))

    :thread-api/get-block-parent
    (let [[_repo block-uuid] args]
      (some->> (resolve-block-entity db block-uuid)
               :block/parent
               (entity->api-map db)))

    :thread-api/get-block-parents
    (let [[_repo id depth] args]
      (when-let [block-uuid (:block/uuid (d/entity db id))]
        (mapv #(into {} %) (ldb/get-block-parents db block-uuid {:depth (or depth 3)}))))

    :thread-api/get-block-page-info
    (let [[_repo block-ref] args]
      (when-let [page (:block/page (resolve-block-entity db block-ref))]
        {:db/id (:db/id page)
         :block/uuid (:block/uuid page)
         :block/title (:block/title page)
         :block/name (:block/name page)}))
    ::unhandled))

(defn- handle-page-worker
  [db api args]
  (case api
    :thread-api/get-page-blocks-tree
    (let [[_repo page-id-name-or-uuid] args]
      (when-let [page (or (resolve-block-entity db page-id-name-or-uuid)
                          (ldb/get-page db page-id-name-or-uuid))]
        (otree/blocks->vec-tree db (ldb/get-page-blocks db (:db/id page)) (:db/id page))))

    :thread-api/get-tags-by-name
    (let [[_repo name] args]
      (->> (entity-util/get-pages-by-name db name)
           (keep (fn [datom] (d/entity db (:e datom))))
           (filter ldb/class?)
           (mapv #(entity->api-map db %))))

    :thread-api/get-case-page
    (let [[_repo page-name-or-uuid] args]
      (entity->api-map db (or (resolve-block-entity db page-name-or-uuid)
                              (ldb/get-case-page db page-name-or-uuid))))

    :thread-api/get-all-classes
    (let [[_repo opts] args
          except-root-class? (:except-root-class? opts true)]
      (cond->> (d/datoms db :avet :block/tags :logseq.class/Tag)
        true (map (fn [datom] (d/entity db (:e datom))))
        true (remove ldb/recycled?)
        except-root-class? (remove #(= :logseq.class/Root (:db/ident %)))
        true (mapv #(entity->api-map db %))))

    :thread-api/get-all-properties
    (mapv #(entity->api-map db %) (ldb/get-all-properties db))

    :thread-api/get-class-objects
    (let [[_repo class-id] args]
      (mapv #(entity->api-map db %) (db-class/get-class-objects db class-id)))

    :thread-api/get-file-content
    (let [[_repo path] args]
      (:file/content (d/entity db [:file/path path])))

    :thread-api/resolve-query-inputs
    (let [[_repo inputs {:keys [current-page current-page-title today-title]}] args
          current-page-title (or current-page-title
                                 (some-> (when current-page
                                           (ldb/get-page db current-page))
                                         :block/title))]
      (mapv (fn [input]
              (db-inputs/resolve-input db
                                       (query-input-value input)
                                       {:current-page-fn (fn []
                                                           (or current-page-title
                                                               today-title))}))
            inputs))

    :thread-api/get-journal-page-by-day
    (let [[_repo journal-day] args]
      (entity->api-map db (ldb/get-journal-page-by-day db journal-day)))

    :thread-api/get-block-refs
    (let [[_repo eid] args]
      (->> (d/q '[:find [?e ...]
                  :in $ ?id
                  :where
                  [?e :block/refs ?id]]
                db eid)
           (mapv #(entity->api-map db (d/entity db %)))))

    :thread-api/get-recent-pages
    (let [[_repo ids] args]
      (mapv #(entity->api-map db (d/entity db %)) ids))
    ::unhandled))

(defn- handle-cli-worker
  [db api args]
  (case api
    :thread-api/get-block-class-default-properties
    {}

    :thread-api/get-structured-children
    []

    :thread-api/validate-block-tag
    {:valid? true}

    :thread-api/page-exists?
    (let [[_repo page-name tags] args]
      (boolean
       (when-let [page (ldb/get-page db page-name)]
         (or (empty? tags)
             (some (fn [tag]
                     (some #(= tag (:db/ident %)) (:block/tags page)))
                   tags)))))

    :thread-api/get-favorite-pages
    []

    :thread-api/favorited-page?
    false

    :thread-api/api-list-tags
    (let [[_repo options] args]
      (api-tools/list-tags db options))

    :thread-api/api-list-properties
    (let [[_repo options] args]
      (api-tools/list-properties db options))

    :thread-api/api-list-pages
    (let [[_repo options] args]
      (api-tools/list-pages db options))

    :thread-api/api-get-page-data
    (let [[_repo page-title] args]
      (api-tools/get-page-data db page-title))

    :thread-api/api-build-upsert-nodes-edn
    (let [[_repo ops] args]
      (api-tools/build-upsert-nodes-edn db ops))

    :thread-api/export-edn
    {:export-edn-error "Export EDN is not available in plugin API unit tests"}

    (:thread-api/update-thread-atom
     :thread-api/undo-redo-set-pending-editor-info
     :thread-api/undo-redo-record-editor-info
     :thread-api/undo-redo-record-ui-state)
    nil
    ::unhandled))

(defn- handle-worker
  [api args]
  (let [db (current-db)]
    (loop [handlers [handle-block-worker handle-page-worker handle-cli-worker]]
      (if-let [handler (first handlers)]
        (let [value (handler db api args)]
          (if (= ::unhandled value)
            (recur (rest handlers))
            value))
        (throw (ex-info (str "Unhandled test worker api: " api)
                        {:api api :args args}))))))

(defn <invoke-test-worker
  [api & args]
  (p/resolved (sanitize-api-value (handle-worker api args))))

(defn install-test-plugin!
  ([]
   (install-test-plugin! test-plugin-id))
  ([pid]
   (state/swap-state! assoc-in [:plugin/installed-plugins pid]
                      {:id pid
                       :name (name pid)
                       :title (name pid)})))

(defn reset-get-blocks-batch-state!
  []
  (reset! (deref #'db-async/*get-blocks-batch-state)
          {:scheduled? false
           :queue []
           :in-flight {}}))

(defn- ensure-js-window!
  []
  (when-not (exists? js/window)
    (set! (.-window js/globalThis) js/globalThis)))

(defn with-plugin-api
  [f]
  (p/with-redefs [state/<invoke-db-worker <invoke-test-worker
                  db-transact/apply-outliner-ops apply-test-outliner-ops!
                  route-handler/redirect-to-page! (fn [& _])
                  editor-handler/edit-block! (fn [& _])
                  editor-handler/collapsable? (fn [& _] true)
                  editor-handler/save-current-block! (fn [& _] (p/resolved nil))
                  ui-handler/re-render-root! (fn [& _])
                  notification/show! (fn [& _] :plugin-api-test/notification)]
    (f)))

(defn start-plugin-api-db!
  []
  (ensure-js-window!)
  (test-helper/start-test-db! {:build-init-data? true})
  (reset! state/*db-worker <invoke-test-worker)
  (install-test-plugin!)
  (reset-get-blocks-batch-state!))

(defn destroy-plugin-api-db!
  []
  (reset-get-blocks-batch-state!)
  (reset! state/*db-worker nil)
  (test-helper/destroy-test-db!)
  (state/set-current-repo! nil))

(defn js->clj-kw
  [value]
  (js->clj value :keywordize-keys true))

(defn api-title
  [value]
  (let [m (js->clj-kw value)]
    (or (:title m)
        (:block/title m)
        (get m "title")
        (when (and (object? value) (not (map? value)))
          (or (aget value "title")
              (aget value "block/title"))))))
