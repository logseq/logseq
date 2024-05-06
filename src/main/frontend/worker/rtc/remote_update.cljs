(ns frontend.worker.rtc.remote-update
  "Fns about applying remote updates"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.set :as set]
            [clojure.string :as string]
            [cognitect.transit :as transit]
            [datascript.core :as d]
            [frontend.schema-register :as sr]
            [frontend.worker.batch-tx :as batch-tx]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.handler.page.db-based.rename :as worker-page-rename]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property.util :as db-property-util]
            [logseq.graph-parser.whiteboard :as gp-whiteboard]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]))

(sr/defkeyword ::need-pull-remote-data
  "remote-update's :remote-t-before > :local-tx,
   so need to pull earlier remote-data from websocket.")

(def ^:private transit-r (transit/reader :json))

(defmulti ^:private transact-db! (fn [action & _args] action))

(defmethod transact-db! :delete-blocks [_ & args]
  (outliner-tx/transact!
   {:persist-op? false
    :gen-undo-ops? false
    :outliner-op :delete-blocks
    :transact-opts {:repo (first args)
                    :conn (second args)}}
   (apply outliner-core/delete-blocks! args)))

(defmethod transact-db! :move-blocks [_ & args]
  (outliner-tx/transact!
   {:persist-op? false
    :gen-undo-ops? false
    :outliner-op :move-blocks
    :transact-opts {:repo (first args)
                    :conn (second args)}}
   (apply outliner-core/move-blocks! args)))

(defmethod transact-db! :move-blocks&persist-op [_ & args]
  (outliner-tx/transact!
   {:persist-op? true
    :gen-undo-ops? false
    :outliner-op :move-blocks
    :transact-opts {:repo (first args)
                    :conn (second args)}}
   (apply outliner-core/move-blocks! args)))

(defmethod transact-db! :insert-blocks [_ & args]
  (outliner-tx/transact!
   {:persist-op? false
    :gen-undo-ops? false
    :outliner-op :insert-blocks
    :transact-opts {:repo (first args)
                    :conn (second args)}}
   (apply outliner-core/insert-blocks! args)))

(defmethod transact-db! :insert-no-order-blocks [_ conn block-uuids]
  (ldb/transact! conn
                 (mapv (fn [block-uuid]
                         ;; add block/content block/format to satisfy the normal-block schema
                         {:block/uuid block-uuid
                          ;; NOTE: block without :block/left
                          ;; must be `logseq.db.frontend.malli-schema.closed-value-block`
                          :block/type #{"closed value"}})
                       block-uuids)
                 {:persist-op? false
                  :gen-undo-ops? false}))

(defmethod transact-db! :save-block [_ & args]
  (outliner-tx/transact!
   {:persist-op? false
    :gen-undo-ops? false
    :outliner-op :save-block
    :transact-opts {:repo (first args)
                    :conn (second args)}}
   (apply outliner-core/save-block! args)))

(defmethod transact-db! :delete-whiteboard-blocks [_ conn block-uuids]
  (ldb/transact! conn
                 (mapv (fn [block-uuid] [:db/retractEntity [:block/uuid block-uuid]]) block-uuids)
                 {:persist-op? false
                  :gen-undo-ops? false}))

(defmethod transact-db! :upsert-whiteboard-block [_ conn blocks]
  (ldb/transact! conn blocks {:persist-op? false
                              :gen-undo-ops? false}))

(defn- whiteboard-page-block?
  [block]
  (contains? (set (:block/type block)) "whiteboard"))

(defn- group-remote-remove-ops-by-whiteboard-block
  "return {true [<whiteboard-block-ops>], false [<other-ops>]}"
  [db remote-remove-ops]
  (group-by (fn [{:keys [block-uuid]}]
              (boolean
               (when-let [block (d/entity db [:block/uuid block-uuid])]
                 (whiteboard-page-block? (:block/parent block)))))
            remote-remove-ops))

(defn- apply-remote-remove-ops-helper
  [conn remove-ops]
  (let [block-uuid->entity (into {}
                                 (keep
                                  (fn [op]
                                    (when-let [block-uuid (:block-uuid op)]
                                      (when-let [ent (d/entity @conn [:block/uuid block-uuid])]
                                        [block-uuid ent])))
                                  remove-ops))
        block-uuid-set (set (keys block-uuid->entity))
        block-uuids-need-move
        (set
         (mapcat
          (fn [[_block-uuid ent]]
            (set/difference (set (map :block/uuid (:block/_parent ent))) block-uuid-set))
          block-uuid->entity))]
    {:block-uuids-need-move block-uuids-need-move
     :block-uuids-to-remove block-uuid-set}))

(defn- apply-remote-remove-ops
  [repo conn date-formatter remove-ops]
  (let [{whiteboard-block-ops true other-ops false} (group-remote-remove-ops-by-whiteboard-block @conn remove-ops)]
    (transact-db! :delete-whiteboard-blocks conn (map :block-uuid whiteboard-block-ops))

    (let [{:keys [block-uuids-need-move block-uuids-to-remove]}
          (apply-remote-remove-ops-helper conn other-ops)]
      ;; move to page-block's first child
      (doseq [block-uuid block-uuids-need-move]
        (transact-db! :move-blocks&persist-op
                      repo conn
                      [(d/entity @conn [:block/uuid block-uuid])]
                      (d/entity @conn (:db/id (:block/page (d/entity @conn [:block/uuid block-uuid]))))
                      false))
      (doseq [block-uuid block-uuids-to-remove]
        (transact-db! :delete-blocks
                      repo conn date-formatter
                      [(d/entity @conn [:block/uuid block-uuid])]
                      {})))))

(defn- insert-or-move-block
  [repo conn block-uuid remote-parents remote-left-uuid move? op-value]
  (when (seq remote-parents)
    (let [first-remote-parent (first remote-parents)
          local-parent (d/entity @conn [:block/uuid first-remote-parent])
          whiteboard-page-block? (whiteboard-page-block? local-parent)
          ;; when insert blocks in whiteboard, local-left is ignored
          ;; remote-left-uuid is nil when it's :no-order block
          local-left (when-not whiteboard-page-block?
                       (when remote-left-uuid
                         (d/entity @conn [:block/uuid remote-left-uuid])))
          b (d/entity @conn [:block/uuid block-uuid])]
      (case [whiteboard-page-block? (some? local-parent) (some? local-left) (some? remote-left-uuid)]
        [false false true true]
        (if move?
          (transact-db! :move-blocks repo conn [b] local-left true)
          (transact-db! :insert-blocks repo conn
                        [{:block/uuid block-uuid
                          :block/content ""
                          :block/format :markdown}]
                        local-left {:sibling? true :keep-uuid? true}))

        [false true true true]
        (let [sibling? (not= (:block/uuid local-parent) (:block/uuid local-left))]
          (if move?
            (transact-db! :move-blocks repo conn [b] local-left sibling?)
            (transact-db! :insert-blocks repo conn
                          [{:block/uuid block-uuid :block/content ""
                            :block/format :markdown}]
                          local-left {:sibling? sibling? :keep-uuid? true})))

        [false true false true]
        (if move?
          (transact-db! :move-blocks repo conn [b] local-parent false)
          (transact-db! :insert-blocks repo conn
                        [{:block/uuid block-uuid :block/content ""
                          :block/format :markdown}]
                        local-parent {:sibling? false :keep-uuid? true}))

        [false true false false]
        (if move?
          (transact-db! :move-blocks repo conn [b] local-parent false)
          (transact-db! :insert-no-order-blocks conn [block-uuid]))

        ;; Don't need to insert-whiteboard-block here,
        ;; will do :upsert-whiteboard-block in `update-block-attrs`
        ([true true false true] [true true false false])
        (when (nil? (:properties op-value))
          ;; when :properties is nil, this block should be treat as normal block
          (if move?
            (transact-db! :move-blocks repo conn [b] local-parent false)
            (transact-db! :insert-blocks repo conn [{:block/uuid block-uuid :block/content "" :block/format :markdown}]
                          local-parent {:sibling? false :keep-uuid? true})))
        ([true true true true] [true true true false])
        (when (nil? (:properties op-value))
          (let [sibling? (not= (:block/uuid local-parent) (:block/uuid local-left))]
            (if move?
              (transact-db! :move-blocks repo conn [b] local-left sibling?)
              (transact-db! :insert-blocks repo conn [{:block/uuid block-uuid :block/content "" :block/format :markdown}]
                            local-left {:sibling? sibling? :keep-uuid? true}))))

        (throw (ex-info "Don't know where to insert" {:block-uuid block-uuid :remote-parents remote-parents
                                                      :remote-left remote-left-uuid}))))))

(defn- move-ops-map->sorted-move-ops
  [move-ops-map]
  (let [uuid->dep-uuids (into {} (map (fn [[uuid env]] [uuid (set (conj (:parents env) (:left env)))]) move-ops-map))
        all-uuids (set (keys move-ops-map))
        sorted-uuids
        (loop [r []
               rest-uuids all-uuids
               uuid (first rest-uuids)]
          (if-not uuid
            r
            (let [dep-uuids (uuid->dep-uuids uuid)]
              (if-let [next-uuid (first (set/intersection dep-uuids rest-uuids))]
                (recur r rest-uuids next-uuid)
                (let [rest-uuids* (disj rest-uuids uuid)]
                  (recur (conj r uuid) rest-uuids* (first rest-uuids*)))))))]
    (mapv move-ops-map sorted-uuids)))

(defn- apply-remote-remove-page-ops
  [repo conn remove-page-ops]
  (doseq [op remove-page-ops]
    (when-let [page-name (:block/name (d/entity @conn [:block/uuid (:block-uuid op)]))]
      (worker-page/delete! repo conn page-name {:persist-op? false}))))

(defn- filter-remote-data-by-local-unpushed-ops
  "when remote-data request client to move/update/remove/... blocks,
  these updates maybe not needed, because this client just updated some of these blocks,
  so we need to filter these just-updated blocks out, according to the unpushed-local-ops"
  [affected-blocks-map local-unpushed-ops]
  ;; (assert (op-mem-layer/ops-coercer local-unpushed-ops) local-unpushed-ops)
  (reduce
   (fn [affected-blocks-map local-op]
     (case (first local-op)
       "move"
       (let [block-uuid (:block-uuid (second local-op))
             remote-op (get affected-blocks-map block-uuid)]
         (case (:op remote-op)
           :remove (dissoc affected-blocks-map (:block-uuid remote-op))
           :move (dissoc affected-blocks-map (:self remote-op))
           ;; default
           affected-blocks-map))

       "update"
       (let [block-uuid (:block-uuid (second local-op))
             local-updated-attr-set (set (keys (:updated-attrs (second local-op))))]
         (if-let [remote-op (get affected-blocks-map block-uuid)]
           (assoc affected-blocks-map block-uuid
                  (if (#{:update-attrs :move} (:op remote-op))
                    (apply dissoc remote-op local-updated-attr-set)
                    remote-op))
           affected-blocks-map))
       ;;else
       affected-blocks-map))
   affected-blocks-map local-unpushed-ops))

(defn- affected-blocks->diff-type-ops
  [repo affected-blocks]
  (let [unpushed-ops (op-mem-layer/get-all-ops repo)
        affected-blocks-map* (if unpushed-ops
                               (filter-remote-data-by-local-unpushed-ops
                                affected-blocks unpushed-ops)
                               affected-blocks)
        {remove-ops-map :remove move-ops-map :move update-ops-map :update-attrs
         update-page-ops-map :update-page remove-page-ops-map :remove-page}
        (update-vals
         (group-by (fn [[_ env]] (get env :op)) affected-blocks-map*)
         (partial into {}))]
    {:remove-ops-map remove-ops-map
     :move-ops-map move-ops-map
     :update-ops-map update-ops-map
     :update-page-ops-map update-page-ops-map
     :remove-page-ops-map remove-page-ops-map}))

(defn- empty-page?
  "1. page has no child-block
  2. page has child-blocks and all these blocks only have empty :block/content"
  [page-entity]
  (not
   (when-let [children-blocks (and page-entity
                                   (seq (map #(into {} %) (:block/_parent page-entity))))]
     (some
      (fn [block]
        (not= {:block/content ""}
              (-> (apply dissoc block [:block/tx-id
                                       :block/uuid
                                       :block/updated-at
                                       :block/left
                                       :block/created-at
                                       :block/format
                                       :db/id
                                       :block/parent
                                       :block/page
                                       :block/path-refs])
                  (update :block/content string/trim))))
      children-blocks))))

(defn- check-block-pos
  "NOTE: some blocks don't have :block/left (e.g. whiteboard blocks)"
  [db block-uuid remote-parents remote-left-uuid]
  (let [local-b (d/entity db [:block/uuid block-uuid])
        remote-parent-uuid (first remote-parents)]
    (cond
      (nil? local-b)
      :not-exist

      (not= [remote-left-uuid remote-parent-uuid]
            [(:block/uuid (:block/left local-b)) (:block/uuid (:block/parent local-b))])
      :wrong-pos

      :else nil)))

(defn- upsert-whiteboard-block
  [repo conn {:keys [parents properties] :as _op-value}]
  (let [db @conn
        first-remote-parent (first parents)]
    (when-let [local-parent (d/entity db [:block/uuid first-remote-parent])]
      (let [page-name (:block/name local-parent)
            properties* (transit/read transit-r properties)
            shape-property-id (db-property-util/get-pid repo :logseq.property.tldraw/shape)
            shape (and (map? properties*)
                       (get properties* shape-property-id))]
        (assert (some? page-name) local-parent)
        (assert (some? shape) properties*)
        (transact-db! :upsert-whiteboard-block conn [(gp-whiteboard/shape->block repo shape page-name)])))))

(defn- need-update-block?
  [conn block-uuid op-value]
  (let [ent (d/entity @conn [:block/uuid block-uuid])]
    (worker-util/profile
     :need-update-block?
     (let [r (some (fn [[k v]]
                     (case k
                       :content     (not= v (:block/raw-content ent))
                       :updated-at  (not= v (:block/updated-at ent))
                       :created-at  (not= v (:block/created-at ent))
                       :alias       (not= (set v) (set (map :block/uuid (:block/alias ent))))
                       :type        (not= (set v) (set (:block/type ent)))
                       :schema      (not= (transit/read transit-r v) (:block/schema ent))
                       :tags        (not= (set v) (set (map :block/uuid (:block/tags ent))))
                       :properties  (not= (transit/read transit-r v) (:block/properties ent))
                       :link        (not= v (:block/uuid (:block/link ent)))
                       :journal-day (not= v (:block/journal-day ent))
                       false))
                   op-value)]
       (prn :need-update-block? r)
       r))))

(defn- update-block-attrs
  [repo conn date-formatter block-uuid {:keys [parents properties _content] :as op-value}]
  (let [key-set (set/intersection
                 (conj rtc-const/general-attr-set :content)
                 (set (keys op-value)))]
    (when (seq key-set)
      (let [first-remote-parent (first parents)
            local-parent (d/entity @conn [:block/uuid first-remote-parent])
            whiteboard-page-block? (whiteboard-page-block? local-parent)]
        (cond
          (and whiteboard-page-block? properties)
          (upsert-whiteboard-block repo conn op-value)

          (need-update-block? conn block-uuid op-value)
          (let [b-ent (d/entity @conn [:block/uuid block-uuid])
                db-id (:db/id b-ent)
                new-block
                (cond-> b-ent
                  (and (contains? key-set :content)
                       (not= (:content op-value)
                             (:block/raw-content b-ent)))
                  (assoc :block/content
                         (db-content/db-special-id-ref->page @conn (:content op-value)))

                  (contains? key-set :updated-at)     (assoc :block/updated-at (:updated-at op-value))
                  (contains? key-set :created-at)     (assoc :block/created-at (:created-at op-value))
                  (contains? key-set :alias)          (assoc :block/alias (some->> (seq (:alias op-value))
                                                                                   (map (partial vector :block/uuid))
                                                                                   (d/pull-many @conn [:db/id])
                                                                                   (keep :db/id)))
                  (contains? key-set :type)           (assoc :block/type (:type op-value))
                  (and (contains? key-set :schema)
                       (some? (:schema op-value)))
                  (assoc :block/schema (transit/read transit-r (:schema op-value)))

                  (contains? key-set :tags)           (assoc :block/tags (some->> (seq (:tags op-value))
                                                                                  (map (partial vector :block/uuid))
                                                                                  (d/pull-many @conn [:db/id])
                                                                                  (keep :db/id)))
                  (contains? key-set :properties)     (assoc :block/properties
                                                             (transit/read transit-r (:properties op-value)))
                  (and (contains? key-set :link)
                       (some? (:link op-value)))
                  (assoc :block/link (some->> (:link op-value)
                                              (vector :block/uuid)
                                              (d/pull @conn [:db/id])
                                              :db/id))

                  (and (contains? key-set :journal-day)
                       (some? (:journal-day op-value)))
                  (assoc :block/journal-day (:journal-day op-value)
                         :block/journal? true))
                *other-tx-data (atom [])]
            ;; 'save-block' dont handle card-many attrs well?
            (when (contains? key-set :alias)
              (swap! *other-tx-data conj [:db/retract db-id :block/alias]))
            (when (contains? key-set :tags)
              (swap! *other-tx-data conj [:db/retract db-id :block/tags]))
            (when (contains? key-set :type)
              (swap! *other-tx-data conj [:db/retract db-id :block/type]))
            (when (and (contains? key-set :link) (nil? (:link op-value)))
              (swap! *other-tx-data conj [:db/retract db-id :block/link]))
            (when (and (contains? key-set :schema) (nil? (:schema op-value)))
              (swap! *other-tx-data conj [:db/retract db-id :block/schema]))
            (when (and (contains? key-set :properties) (nil? (:properties op-value)))
              (swap! *other-tx-data conj [:db/retract db-id :block/properties]))
            (when (and (contains? key-set :journal-day) (nil? (:journal-day op-value)))
              (swap! *other-tx-data conj
                     [:db/retract db-id :block/journal-day]
                     [:db/retract db-id :block/journal?]))
            (when (seq @*other-tx-data)
              (ldb/transact! conn @*other-tx-data {:persist-op? false
                                                   :gen-undo-ops? false}))
            (transact-db! :save-block repo conn date-formatter new-block)))))))

(defn- apply-remote-update-ops
  [repo conn date-formatter update-ops]
  (doseq [{:keys [parents left self] :as op-value} update-ops]
    (when (and parents left)
      (let [r (check-block-pos @conn self parents left)]
        (case r
          :not-exist
          (insert-or-move-block repo conn self parents left false op-value)
          :wrong-pos
          (insert-or-move-block repo conn self parents left true op-value)
          nil)))
    (update-block-attrs repo conn date-formatter self op-value)))

(defn- move-all-blocks-to-another-page
  [repo conn from-page-name to-page-name]
  (let [blocks (ldb/get-page-blocks @conn from-page-name {})
        target-page-block (d/entity @conn [:block/name to-page-name])]
    (when (and (seq blocks) target-page-block)
      (let [blocks* (ldb/sort-by-order blocks)]
        (outliner-tx/transact!
         {:persist-op? true
          :gen-undo-ops? false
          :transact-opts {:repo repo
                          :conn conn}}
         (outliner-core/move-blocks! repo conn blocks* target-page-block false))))))

(defn- apply-remote-move-ops
  [repo conn date-formatter sorted-move-ops]
  (doseq [{:keys [parents left self] :as op-value} sorted-move-ops]
    (let [r (check-block-pos @conn self parents left)]
      (case r
        :not-exist
        (insert-or-move-block repo conn self parents left false op-value)
        :wrong-pos
        (insert-or-move-block repo conn self parents left true op-value)
        nil                             ; do nothing
        nil)
      (update-block-attrs repo conn date-formatter self op-value))))

(defn- apply-remote-update-page-ops
  [repo conn date-formatter update-page-ops]
  (let [config (worker-state/get-config repo)]
    (doseq [{:keys [self page-name original-name] :as op-value} update-page-ops]
      (let [old-page-original-name (:block/original-name (d/entity @conn [:block/uuid self]))
            exist-page (d/entity @conn [:block/name page-name])
            create-opts {:create-first-block? false
                         :uuid self :persist-op? false}]
        (cond
          ;; same name but different uuid, and local-existed-page is empty(`empty-page?`)
          ;; just remove local-existed-page
          (and exist-page
               (not= (:block/uuid exist-page) self)
               (empty-page? exist-page))
          (do (worker-page/delete! repo conn page-name {:persist-op? false})
              (worker-page/create! repo conn config original-name create-opts))

          ;; same name but different uuid
          ;; remote page has same block/name as local's, but they don't have same block/uuid.
          ;; 1. rename local page's name to '<origin-name>-<ms-epoch>-Conflict'
          ;; 2. create page, name=<origin-name>, uuid=remote-uuid
          (and exist-page
               (not= (:block/uuid exist-page) self))
          (let [conflict-page-name (common-util/format "%s-%s-CONFLICT" original-name (tc/to-long (t/now)))]
            (worker-page-rename/rename! repo conn config original-name conflict-page-name {:persist-op? false})
            (worker-page/create! repo conn config original-name create-opts)
            (move-all-blocks-to-another-page repo conn conflict-page-name original-name))

          ;; a client-page has same uuid as remote but different page-names,
          ;; then we need to rename the client-page to remote-page-name
          (and old-page-original-name (not= old-page-original-name original-name))
          (worker-page-rename/rename! repo conn config old-page-original-name original-name {:persist-op? false})

          ;; no such page, name=remote-page-name, OR, uuid=remote-block-uuid
          ;; just create-page
          :else
          (worker-page/create! repo conn config original-name create-opts))

        (update-block-attrs repo conn date-formatter self op-value)))))

(defn apply-remote-update
  "Apply remote-update(`remote-update-event`)"
  [repo conn date-formatter remote-update-event add-log-fn]
  (let [remote-update-data (:value remote-update-event)]
    (assert (rtc-const/data-from-ws-validator remote-update-data) remote-update-data)
    (let [remote-t (:t remote-update-data)
          remote-t-before (:t-before remote-update-data)
          local-tx (op-mem-layer/get-local-tx repo)]
      (cond
        (not (and (pos? remote-t)
                  (pos? remote-t-before)))
        (throw (ex-info "invalid remote-data" {:data remote-update-data}))

        (<= remote-t local-tx)
        (add-log-fn {:type ::skip :remote-t remote-t :local-t local-tx})

        (< local-tx remote-t-before)
        (do (add-log-fn {:type ::need-pull-remote-data :remote-t remote-t :local-t local-tx})
            (throw (ex-info "need pull earlier remote-data"
                            {:type ::need-pull-remote-data
                             :local-tx local-tx})))

        (<= remote-t-before local-tx remote-t)
        (let [affected-blocks-map (:affected-blocks remote-update-data)
              {:keys [remove-ops-map move-ops-map update-ops-map update-page-ops-map remove-page-ops-map]}
              (affected-blocks->diff-type-ops repo affected-blocks-map)
              remove-ops (vals remove-ops-map)
              sorted-move-ops (move-ops-map->sorted-move-ops move-ops-map)
              update-ops (vals update-ops-map)
              update-page-ops (vals update-page-ops-map)
              remove-page-ops (vals remove-page-ops-map)]

          (batch-tx/with-batch-tx-mode conn {:rtc-tx? true}
            (js/console.groupCollapsed "rtc/apply-remote-ops-log")
            (worker-util/profile :apply-remote-update-page-ops (apply-remote-update-page-ops repo conn date-formatter update-page-ops))
            (worker-util/profile :apply-remote-remove-ops (apply-remote-remove-ops repo conn date-formatter remove-ops))
            (worker-util/profile :apply-remote-move-ops (apply-remote-move-ops repo conn date-formatter sorted-move-ops))
            (worker-util/profile :apply-remote-update-ops (apply-remote-update-ops repo conn date-formatter update-ops))
            (worker-util/profile :apply-remote-remove-page-ops (apply-remote-remove-page-ops repo conn remove-page-ops))
            (js/console.groupEnd))

          (op-mem-layer/update-local-tx! repo remote-t))
        :else (throw (ex-info "unreachable" {:remote-t remote-t
                                             :remote-t-before remote-t-before
                                             :local-t local-tx}))))))
