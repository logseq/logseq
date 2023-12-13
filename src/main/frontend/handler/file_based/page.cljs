(ns frontend.handler.file-based.page
  "Page handlers for file based graphs"
  (:require [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.db.model :as model]
            [frontend.handler.file-based.property :as file-property-handler]
            [frontend.handler.property.file :as property-file]
            [frontend.handler.file-based.page-property :as file-page-property]
            [frontend.handler.file-based.recent :as file-recent-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.fs :as fs-util]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.fs :as fs]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [datascript.core :as d]
            [clojure.walk :as walk]
            [clojure.string :as string]))

(defn- replace-page-ref!
  "Unsanitized names"
  [content old-name new-name]
  (let [[original-old-name original-new-name] (map string/trim [old-name new-name])
        [old-ref new-ref] (map page-ref/->page-ref [old-name new-name])
        [old-name new-name] (map #(if (string/includes? % "/")
                                    (string/replace % "/" ".")
                                    %)
                                 [original-old-name original-new-name])
        old-org-ref (and (= :org (state/get-preferred-format))
                         (:org-mode/insert-file-link? (state/get-config))
                         (re-find
                          (re-pattern
                           (util/format
                            "\\[\\[file:\\.*/.*%s\\.org\\]\\[(.*?)\\]\\]" old-name))
                          content))]
    (-> (if old-org-ref
          (let [[old-full-ref old-label] old-org-ref
                new-label (if (= old-label original-old-name)
                            original-new-name
                            old-label)
                new-full-ref (-> (string/replace old-full-ref old-name new-name)
                                 (string/replace (str "[" old-label "]")
                                                 (str "[" new-label "]")))]
            (string/replace content old-full-ref new-full-ref))
          content)
        (string/replace old-ref new-ref))))

(defn- replace-tag-ref!
  [content old-name new-name]
  (let [old-tag (util/format "#%s" old-name)
        new-tag (if (re-find #"[\s\t]+" new-name)
                  (util/format "#[[%s]]" new-name)
                  (str "#" new-name))]
    ;; hash tag parsing rules https://github.com/logseq/mldoc/blob/701243eaf9b4157348f235670718f6ad19ebe7f8/test/test_markdown.ml#L631
    ;; Safari doesn't support look behind, don't use
    ;; TODO: parse via mldoc
    (string/replace content
                    (re-pattern (str "(?i)(^|\\s)(" (util/escape-regex-chars old-tag) ")(?=[,\\.]*($|\\s))"))
                    ;;    case_insense^    ^lhs   ^_grp2                       look_ahead^         ^_grp3
                    (fn [[_match lhs _grp2 _grp3]]
                      (str lhs new-tag)))))

(defn- replace-property-ref!
  [content old-name new-name format]
  (let [new-name (keyword (string/replace (string/lower-case new-name) #"\s+" "-"))
        org-format? (= :org format)
        old-property (if org-format? (gp-property/colons-org old-name) (str old-name gp-property/colons))
        new-property (if org-format? (gp-property/colons-org (name new-name)) (str (name new-name) gp-property/colons))]
    (util/replace-ignore-case content old-property new-property)))

(defn- replace-old-page!
  "Unsanitized names"
  [content old-name new-name format]
  (when (and (string? content) (string? old-name) (string? new-name))
    (-> content
        (replace-page-ref! old-name new-name)
        (replace-tag-ref! old-name new-name)
        (replace-property-ref! old-name new-name format))))

(defn- walk-replace-old-page!
  "Unsanitized names"
  [form old-name new-name format]
  (walk/postwalk (fn [f]
                   (cond
                     (and (vector? f)
                          (contains? #{"Search" "Label"} (first f))
                          (string/starts-with? (second f) (str old-name "/")))
                     [(first f) (string/replace-first (second f)
                                                      (str old-name "/")
                                                      (str new-name "/"))]

                     (string? f)
                     (if (= f old-name)
                       new-name
                       (replace-old-page! f old-name new-name format))

                     (and (keyword f) (= (name f) old-name))
                     (keyword (string/replace (string/lower-case new-name) #"\s+" "-"))

                     :else
                     f))
                 form))

(defn- rename-update-block-refs!
  [refs from-id to-id]
  (->> refs
       (remove #{{:db/id from-id}})
       (cons {:db/id to-id})
       (distinct)
       (vec)))

(defn- rename-update-refs!
  "Unsanitized only"
  [page old-original-name new-name]
  ;; update all pages which have references to this page
  (let [repo (state/get-current-repo)
        to-page (db/entity [:block/name (util/page-name-sanity-lc new-name)])
        blocks (:block/_refs (db/entity (:db/id page)))
        page-ids (->> (map (fn [b]
                             {:db/id (:db/id (:block/page b))}) blocks)
                      (set))
        tx       (->> (map (fn [{:block/keys [uuid content properties format] :as block}]
                             (let [content    (let [content' (replace-old-page! content old-original-name new-name format)]
                                                (when-not (= content' content)
                                                  content'))
                                   properties (let [properties' (walk-replace-old-page! properties old-original-name new-name format)]
                                                (when-not (= properties' properties)
                                                  properties'))]
                               (when (or content properties)
                                 (util/remove-nils-non-nested
                                  {:block/uuid       uuid
                                   :block/content    content
                                   :block/properties properties
                                   :block/properties-order (when (seq properties)
                                                             (map first properties))
                                   :block/refs (->> (rename-update-block-refs! (:block/refs block) (:db/id page) (:db/id to-page))
                                                    (map :db/id)
                                                    (set))})))) blocks)
                      (remove nil?))]
    (db/transact! repo tx)
    (doseq [page-id page-ids]
      (outliner-file/sync-to-file page-id))))

(defn- compute-new-file-path
  "Construct the full path given old full path and the file sanitized body.
   Ext. included in the `old-path`."
  [old-path new-file-name-body]
  (let [result (string/split old-path "/")
        ext (last (string/split (last result) "."))
        new-file (str new-file-name-body "." ext)
        parts (concat (butlast result) [new-file])]
    (util/string-join-path parts)))

(defn rename-file!
  "emit file-rename events to :file/rename-event-chan
   force-fs? - when true, rename file event the db transact is failed."
  ([file new-file-name-body ok-handler]
   (rename-file! file new-file-name-body ok-handler false))
  ([file new-file-name-body ok-handler force-fs?]
   (let [repo (state/get-current-repo)
         file (db/pull (:db/id file))
         old-path (:file/path file)
         new-path (compute-new-file-path old-path new-file-name-body)
         transact #(db/transact! repo [{:db/id (:db/id file)
                                        :file/path new-path}])]
    ;; update db
     (if force-fs?
       (try (transact) ;; capture error and continue FS rename if failed
            (catch :default e
              (log/error :rename-file e)))
       (transact)) ;; interrupted if failed

     (->
      (p/let [_ (state/offer-file-rename-event-chan! {:repo repo
                                                      :old-path old-path
                                                      :new-path new-path})
              _ (fs/rename! repo old-path new-path)]
        (ok-handler))
      (p/catch (fn [error]
                 (println "file rename failed: " error)))))))

(defn- rename-page-aux
  "Only accepts unsanitized page names"
  [old-name new-name redirect?]
  (let [old-page-name       (util/page-name-sanity-lc old-name)
        new-file-name-body  (fs-util/file-name-sanity new-name) ;; w/o file extension
        new-page-name       (util/page-name-sanity-lc new-name)
        repo                (state/get-current-repo)
        page                (db/pull [:block/name old-page-name])]
    (when (and repo page)
      (let [old-original-name   (:block/original-name page)
            file                (:block/file page)
            journal?            (:block/journal? page)
            properties-block    (:data (outliner-tree/-get-down (outliner-core/block page)))
            properties-content  (:block/content properties-block)
            properties-block-tx (when (and properties-block
                                           properties-content
                                           (string/includes? (util/page-name-sanity-lc properties-content)
                                                             old-page-name))
                                  (let [front-matter? (and (property-file/front-matter?-when-file-based properties-content)
                                                           (= :markdown (:block/format properties-block)))]
                                    {:db/id         (:db/id properties-block)
                                     :block/content (file-property-handler/insert-property
                                                     (:block/format properties-block)
                                                     properties-content
                                                     :title
                                                     new-name
                                                     front-matter?)}))
            page-txs            [{:db/id               (:db/id page)
                                  :block/uuid          (:block/uuid page)
                                  :block/name          new-page-name
                                  :block/original-name new-name}]
            page-txs            (if properties-block-tx (conj page-txs properties-block-tx) page-txs)]

        (db/transact! repo page-txs)

        (when (fs-util/create-title-property? new-page-name)
          (file-page-property/add-property! new-page-name :title new-name))

        (when (and file (not journal?))
          (rename-file! file new-file-name-body (fn [] nil)))

        (let [home (get (state/get-config) :default-home {})]
          (when (= old-page-name (util/page-name-sanity-lc (get home :page "")))
            (config-handler/set-config! :default-home (assoc home :page new-name))))

        (rename-update-refs! page old-original-name new-name)

        (page-common-handler/rename-update-namespace! page old-original-name new-name)

        (outliner-file/sync-to-file page))

      ;; Redirect to the newly renamed page
      (when redirect?
        (route-handler/redirect! {:to          (if (model/whiteboard-page? page) :whiteboard :page)
                                  :push        false
                                  :path-params {:name new-page-name}}))

      (when (page-common-handler/favorited? old-page-name)
        (p/do!
         (page-common-handler/unfavorite-page! old-page-name)
         (page-common-handler/favorite-page! new-page-name)))

      (file-recent-handler/update-or-add-renamed-page repo old-page-name new-page-name)

      (ui-handler/re-render-root!))))

(defn- rename-nested-pages
  "Unsanitized names only"
  [old-ns-name new-ns-name]
  (let [repo            (state/get-current-repo)
        nested-page-str (page-ref/->page-ref (util/page-name-sanity-lc old-ns-name))
        ns-prefix-format-str (str page-ref/left-brackets "%s/")
        ns-prefix       (util/format ns-prefix-format-str (util/page-name-sanity-lc old-ns-name))
        nested-pages    (db/get-pages-by-name-partition repo nested-page-str)
        nested-pages-ns (db/get-pages-by-name-partition repo ns-prefix)]
    (when nested-pages
      ;; rename page "[[obsidian]] is a tool" to "[[logseq]] is a tool"
      (doseq [{:block/keys [name original-name]} nested-pages]
        (let [old-page-title (or original-name name)
              new-page-title (string/replace
                              old-page-title
                              (page-ref/->page-ref old-ns-name)
                              (page-ref/->page-ref new-ns-name))]
          (when (and old-page-title new-page-title)
            (p/do!
             (rename-page-aux old-page-title new-page-title false)
             (println "Renamed " old-page-title " to " new-page-title))))))
    (when nested-pages-ns
      ;; rename page "[[obsidian/page1]] is a tool" to "[[logseq/page1]] is a tool"
      (doseq [{:block/keys [name original-name]} nested-pages-ns]
        (let [old-page-title (or original-name name)
              new-page-title (string/replace
                              old-page-title
                              (util/format ns-prefix-format-str old-ns-name)
                              (util/format ns-prefix-format-str new-ns-name))]
          (when (and old-page-title new-page-title)
            (p/do!
             (rename-page-aux old-page-title new-page-title false)
             (println "Renamed " old-page-title " to " new-page-title))))))))

(defn- rename-namespace-pages!
  "Original names (unsanitized only)"
  [repo old-name new-name]
  (let [pages (db/get-namespace-pages repo old-name)
        page (db/pull [:block/name (util/page-name-sanity-lc old-name)])
        pages (cons page pages)]
    (doseq [{:block/keys [name original-name]} pages]
      (let [old-page-title (or original-name name)
            ;; only replace one time, for the case that the namespace is a sub-string of the sub-namespace page name
            ;; Example: has pages [[work]] [[work/worklog]],
            ;; we want to rename [[work/worklog]] to [[work1/worklog]] when rename [[work]] to [[work1]],
            ;; but don't rename [[work/worklog]] to [[work1/work1log]]
            new-page-title (string/replace-first old-page-title old-name new-name)
            redirect? (= name (:block/name page))]
        (when (and old-page-title new-page-title)
          (p/let [_ (rename-page-aux old-page-title new-page-title redirect?)]
            (println "Renamed " old-page-title " to " new-page-title)))))))

(defn merge-pages!
  "Only accepts sanitized page names"
  [from-page-name to-page-name]
  (when (and (db/page-exists? from-page-name)
             (db/page-exists? to-page-name)
             (not= from-page-name to-page-name))
    (let [to-page (db/entity [:block/name to-page-name])
          to-id (:db/id to-page)
          from-page (db/entity [:block/name from-page-name])
          from-id (:db/id from-page)
          from-first-child (some->> (db/pull from-id)
                                    (outliner-core/block)
                                    (outliner-tree/-get-down)
                                    (outliner-core/get-data))
          to-last-direct-child-id (model/get-block-last-direct-child-id (db/get-db) to-id)
          repo (state/get-current-repo)
          conn (conn/get-db repo false)
          datoms (d/datoms @conn :avet :block/page from-id)
          block-eids (mapv :e datoms)
          blocks (db-utils/pull-many repo '[:db/id :block/page :block/refs :block/path-refs :block/left :block/parent] block-eids)
          tx-data (map (fn [block]
                         (let [id (:db/id block)]
                           (cond->
                            {:db/id id
                             :block/page {:db/id to-id}
                             :block/refs (rename-update-block-refs! (:block/refs block) from-id to-id)}

                             (and from-first-child (= id (:db/id from-first-child)))
                             (assoc :block/left {:db/id (or to-last-direct-child-id to-id)})

                             (= (:block/parent block) {:db/id from-id})
                             (assoc :block/parent {:db/id to-id})))) blocks)]
      (db/transact! repo tx-data)
      (outliner-file/sync-to-file {:db/id to-id})

      (rename-update-refs! from-page
                           (util/get-page-original-name from-page)
                           (util/get-page-original-name to-page))

      (page-common-handler/rename-update-namespace! from-page
                                                    (util/get-page-original-name from-page)
                                                    (util/get-page-original-name to-page)))


    (page-common-handler/delete! from-page-name nil)

    (route-handler/redirect! {:to          :page
                              :push        false
                              :path-params {:name to-page-name}})))

(defn rename!
  "Accepts unsanitized page names"
  ([old-name new-name] (rename! old-name new-name true))
  ([old-name new-name redirect?]
   (let [repo          (state/get-current-repo)
         old-name      (string/trim old-name)
         new-name      (string/trim new-name)
         old-page-name (util/page-name-sanity-lc old-name)
         new-page-name (util/page-name-sanity-lc new-name)
         name-changed? (not= old-name new-name)]
     (if (and old-name
              new-name
              (not (string/blank? new-name))
              name-changed?)
       (do
         (cond
           (= old-page-name new-page-name)
           (rename-page-aux old-name new-name redirect?)

           (db/pull [:block/name new-page-name])
           (merge-pages! old-page-name new-page-name)

           :else
           (rename-namespace-pages! repo old-name new-name))
         (rename-nested-pages old-name new-name))
       (when (string/blank? new-name)
         (notification/show! "Please use a valid name, empty name is not allowed!" :error)))
     (ui-handler/re-render-root!))))
