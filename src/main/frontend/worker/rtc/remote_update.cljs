(ns frontend.worker.rtc.remote-update
  "Fns about applying remote updates"
  (:require [clojure.data :as data]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.schema-register :as sr]
            [frontend.worker.batch-tx :as batch-tx]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.property.util :as db-property-util]
            [logseq.graph-parser.whiteboard :as gp-whiteboard]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]))

(sr/defkeyword ::need-pull-remote-data
  "remote-update's :remote-t-before > :local-tx,
   so need to pull earlier remote-data from websocket.")

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

(defmethod transact-db! :insert-no-order-blocks [_ conn block-uuid+parent-coll]
  (ldb/transact! conn
                 (mapv (fn [[block-uuid block-parent]]
                         ;; add block/content block/format to satisfy the normal-block schema
                         (cond-> {:block/uuid block-uuid}
                           block-parent (assoc :block/parent [:block/uuid block-parent])))
                       block-uuid+parent-coll)
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
          (transact-db! :insert-no-order-blocks conn [[block-uuid first-remote-parent]]))

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

(defn- check-block-pos
  "NOTE: some blocks don't have :block/order (e.g. whiteboard blocks)"
  [db block-uuid remote-parents remote-left-uuid]
  (let [local-b (d/entity db [:block/uuid block-uuid])
        remote-parent-uuid (first remote-parents)]
    (cond
      (nil? local-b)
      :not-exist

      (not= [remote-left-uuid remote-parent-uuid]
            [(:block/uuid (ldb/get-left-sibling local-b)) (:block/uuid (:block/parent local-b))])
      :wrong-pos

      :else nil)))

(defn- upsert-whiteboard-block
  [repo conn {:keys [parents properties] :as _op-value}]
  (let [db @conn
        first-remote-parent (first parents)]
    (when-let [local-parent (d/entity db [:block/uuid first-remote-parent])]
      (let [page-name (:block/name local-parent)
            properties* (ldb/read-transit-str properties)
            shape-property-id (db-property-util/get-pid repo :logseq.property.tldraw/shape)
            shape (and (map? properties*)
                       (get properties* shape-property-id))]
        (assert (some? page-name) local-parent)
        (assert (some? shape) properties*)
        (transact-db! :upsert-whiteboard-block conn [(gp-whiteboard/shape->block repo shape page-name)])))))

(def ^:private update-op-watched-attrs
  #{:block/content
    :block/updated-at
    :block/created-at
    :block/alias
    :block/type
    :block/schema
    :block/tags
    :block/link
    :block/journal-day
    :block/order
    :class/parent
    :class/schema.properties
    :property/schema.classes})

(defn- update-op-watched-attr?
  [attr]
  (or (contains? update-op-watched-attrs attr)
      (when-let [ns (namespace attr)]
        (or (= "logseq.task" ns)
            (string/ends-with? ns ".property")))))

(defn- diff-block-kv->tx-data
  [db db-schema e k local-v remote-v]
  (let [k-schema (get db-schema k)
        ref? (= :db.type/ref (:db/valueType k-schema))
        card-many? (= :db.cardinality/many (:db/cardinality k-schema))]
    (case [ref? card-many?]
      [true true]
      (let [[local-only remote-only] (data/diff (set local-v) (set remote-v))]
        (cond-> []
          (seq local-only) (concat (map (fn [block-uuid] [:db/retract e k [:block/uuid block-uuid]]) local-only))
          (seq remote-only) (concat (keep (fn [block-uuid]
                                            (when-let [db-id (:db/id (d/entity db [:block/uuid block-uuid]))]
                                              [:db/add e k db-id])) remote-only))))

      [true false]
      (let [remote-block-uuid (if (coll? remote-v) (first remote-v) remote-v)]
        (when (not= local-v remote-block-uuid)
          (when-let [db-id (:db/id (d/entity db [:block/uuid remote-block-uuid]))]
            [[:db/add e k db-id]])))
      [false false]
      (let [remote-v* (if (coll? remote-v)
                        (first (map ldb/read-transit-str remote-v))
                        (ldb/read-transit-str remote-v))]
        (when (not= local-v remote-v*)
          (if (nil? remote-v*)
            [[:db/retract e k local-v]]
            [[:db/add e k remote-v*]])))

      [false true]
      (let [_ (assert (or (nil? remote-v) (coll? remote-v)) {:remote-v remote-v :a k :e e})
            remote-v* (set (map ldb/read-transit-str remote-v))
            [local-only remote-only] (data/diff (set local-v) remote-v*)]
        (cond-> []
          (seq local-only) (concat (map (fn [v] [:db/retract e k v]) local-only))
          (seq remote-only) (concat (map (fn [v] [:db/add e k v]) remote-only)))))))

(defn- diff-block-map->tx-data
  [db e local-block-map remote-block-map]
  (let [db-schema (d/schema db)
        tx-data1
        (mapcat
         (fn [[k local-v]]
           (let [remote-v (get remote-block-map k)]
             (seq (diff-block-kv->tx-data db db-schema e k local-v remote-v))))
         local-block-map)
        tx-data2
        (mapcat
         (fn [[k remote-v]]
           (let [local-v (get local-block-map k)]
             (seq (diff-block-kv->tx-data db db-schema e k local-v remote-v))))
         (apply dissoc remote-block-map (keys local-block-map)))]
    (concat tx-data1 tx-data2)))

(defn- remote-op-value->tx-data
  [db ent op-value]
  (assert (some? (:db/id ent)) ent)
  (let [db-schema (d/schema db)
        local-block-map (->> ent
                             (filter (comp update-op-watched-attr? first))
                             (map (fn [[k v]]
                                    (let [k-schema (get db-schema k)
                                          ref? (= :db.type/ref (:db/valueType k-schema))
                                          card-many? (= :db.cardinality/many (:db/cardinality k-schema))]
                                      [k
                                       (case [ref? card-many?]
                                         [true true]
                                         (keep (fn [x] (when-let [e (:db/id x)] (:block/uuid (d/entity db e)))) v)
                                         [true false]
                                         (let [v* (some->> (:db/id v) (d/entity db) :block/uuid)]
                                           (assert (some? v*) v)
                                           v*)
                                         ;; else
                                         v)])))
                             (into {}))
        remote-block-map (->> op-value
                              (filter (comp update-op-watched-attr? first))
                              (map (fn [[k v]]
                                     ;; all non-built-in attrs is card-many in remote-op,
                                     ;; convert them according to the client db-schema
                                     (let [k-schema (get db-schema k)
                                           card-many? (= :db.cardinality/many (:db/cardinality k-schema))]
                                       [k
                                        (if (and (coll? v) (not card-many?))
                                          (first v)
                                          v)])))
                              (into {}))]
    (diff-block-map->tx-data db (:db/id ent) local-block-map remote-block-map)))

(defn- remote-op-value->schema-tx-data
  [block-uuid op-value]
  (when-let [schema-map (some-> op-value :client/schema ldb/read-transit-str)]
    (when-let [db-ident (:db/ident op-value)]
      [(merge {:block/uuid block-uuid :db/ident db-ident} schema-map)])))

(defn- update-block-order
  [e op-value]
  (if-let [order (:block/order op-value)]
    {:op-value (dissoc op-value :block/order)
     :tx-data [[:db/add e :block/order order]]}
    {:op-value op-value}))

(defn- update-block-attrs
  [repo conn block-uuid {:keys [parents] :as op-value}]
  (when-let [ent (d/entity @conn [:block/uuid block-uuid])]
    (when (some (fn [k] (= "block" (namespace k))) (keys op-value)) ; there exists some :block/xxx attrs
      (let [{update-block-order-tx-data :tx-data op-value :op-value} (update-block-order (:db/id ent) op-value)
            first-remote-parent (first parents)
            local-parent (d/entity @conn [:block/uuid first-remote-parent])
            whiteboard-page-block? (whiteboard-page-block? local-parent)]
        (if whiteboard-page-block?
          (upsert-whiteboard-block repo conn op-value)
          (do (when-let [schema-tx-data (remote-op-value->schema-tx-data block-uuid op-value)]
                (ldb/transact! conn schema-tx-data {:persist-op? false :gen-undo-ops? false}))
              (when-let [tx-data (seq (remote-op-value->tx-data @conn ent (dissoc op-value :client/schema)))]
                (ldb/transact! conn (concat tx-data update-block-order-tx-data)
                               {:persist-op? false :gen-undo-ops? false}))))))))

(defn- apply-remote-update-ops
  [repo conn update-ops]
  (doseq [{:keys [parents left self] :as op-value} update-ops]
    (when (and parents left)
      (let [r (check-block-pos @conn self parents left)]
        (case r
          :not-exist
          (insert-or-move-block repo conn self parents left false op-value)
          :wrong-pos
          (insert-or-move-block repo conn self parents left true op-value)
          nil)))
    (update-block-attrs repo conn self op-value)))

(defn- apply-remote-move-ops
  [repo conn sorted-move-ops]
  (doseq [{:keys [parents left self] :as op-value} sorted-move-ops]
    (let [r (check-block-pos @conn self parents left)]
      (case r
        :not-exist
        (insert-or-move-block repo conn self parents left false op-value)
        :wrong-pos
        (insert-or-move-block repo conn self parents left true op-value)
        nil                             ; do nothing
        nil)
      (update-block-attrs repo conn self op-value))))

(defn- apply-remote-update-page-ops
  [repo conn update-page-ops]
  (let [config (worker-state/get-config repo)]
    (doseq [{:keys [self _page-name]
             original-name :block/original-name
             :as op-value} update-page-ops]
      (let [create-opts {:create-first-block? false
                         :uuid self
                         :persist-op? false
                         :create-even-page-exists? true}
            [_ x y] (worker-page/create! repo conn config (ldb/read-transit-str original-name) create-opts)]
        ;; TODO: current page-create fn is buggy, even provide :uuid option, it will create-page with different uuid,
        ;; if there's already existing same name page
        (prn :debug-create-page x y self)
        (update-block-attrs repo conn self op-value)))))

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

          (js/console.groupCollapsed "rtc/apply-remote-ops-log")
          (batch-tx/with-batch-tx-mode conn {:rtc-tx? true :persist-op? false :gen-undo-ops? false}
            (worker-util/profile :apply-remote-update-page-ops (apply-remote-update-page-ops repo conn update-page-ops))
            (worker-util/profile :apply-remote-move-ops (apply-remote-move-ops repo conn sorted-move-ops))
            (worker-util/profile :apply-remote-update-ops (apply-remote-update-ops repo conn update-ops))
            (worker-util/profile :apply-remote-remove-page-ops (apply-remote-remove-page-ops repo conn remove-page-ops)))
          ;; NOTE: we cannot set :persist-op? = true when batch-tx/with-batch-tx-mode (already set to false)
          ;; and there're some transactions in `apply-remote-remove-ops` need to :persist-op?=true
          (worker-util/profile :apply-remote-remove-ops (apply-remote-remove-ops repo conn date-formatter remove-ops))
          (js/console.groupEnd)

          (op-mem-layer/update-local-tx! repo remote-t))
        :else (throw (ex-info "unreachable" {:remote-t remote-t
                                             :remote-t-before remote-t-before
                                             :local-t local-tx}))))))
