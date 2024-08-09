(ns frontend.worker.rtc.remote-update
  "Fns about applying remote updates"
  (:require [clojure.data :as data]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.schema-register :as sr]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.rtc.log-and-state :as rtc-log-and-state]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [logseq.clj-fractional-indexing :as index]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.property.util :as db-property-util]
            [logseq.graph-parser.whiteboard :as gp-whiteboard]
            [logseq.outliner.batch-tx :as batch-tx]
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

(defmethod transact-db! :update-block-order-directly [_ _repo conn block-uuid block-parent-uuid block-order]
  ;; transact :block/parent and :block/order directly,
  ;; check :block/order has any conflicts with other blocks
  (let [parent-ent (when block-parent-uuid (d/entity @conn [:block/uuid block-parent-uuid]))
        sorted-order+block-uuid-coll (sort-by first (map (juxt :block/order :block/uuid) (:block/_parent parent-ent)))
        block-order*
        (if-let [[start-order end-order]
                 (reduce
                  (fn [[start-order] [current-order current-block-uuid]]
                    (when start-order
                      (if (= current-block-uuid block-uuid)
                        (reduced nil)
                        (reduced [start-order current-order])))
                    (let [compare-order (compare current-order block-order)]
                      (cond
                        (and (zero? compare-order)
                             (not= current-block-uuid block-uuid))
                        ;; found conflict order
                        [current-order nil]

                        (and (zero? compare-order)
                             (= current-block-uuid block-uuid))
                        ;; this block already has expected :block/order
                        (reduced nil)

                        (pos? compare-order) ;not found conflict order
                        (reduced nil)

                        (neg? compare-order)
                        nil)))
                  nil sorted-order+block-uuid-coll)]
          (index/generate-key-between start-order end-order)
          block-order)]
    (ldb/transact! conn [{:block/uuid block-uuid :block/order block-order*}])
    ;; TODO: add ops when block-order* != block-order
    ))

(defmethod transact-db! :move-blocks&persist-op [_ & args]
  (outliner-tx/transact!
   {:persist-op? true
    :gen-undo-ops? false
    :outliner-op :move-blocks
    :transact-opts {:repo (first args)
                    :conn (second args)}}
   (apply outliner-core/move-blocks! args)))

(defmethod transact-db! :insert-blocks [_ repo conn blocks target opts]
  (outliner-tx/transact!
   {:persist-op? false
    :gen-undo-ops? false
    :outliner-op :insert-blocks
    :transact-opts {:repo repo
                    :conn conn}}
   (let [opts' (assoc opts :keep-block-order? true)]
     (outliner-core/insert-blocks! repo conn blocks target opts'))))

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

(defn- group-remote-remove-ops-by-whiteboard-block
  "return {true [<whiteboard-block-ops>], false [<other-ops>]}"
  [db remote-remove-ops]
  (group-by (fn [{:keys [block-uuid]}]
              (boolean
               (when-let [block (d/entity db [:block/uuid block-uuid])]
                 (ldb/whiteboard? (:block/parent block)))))
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
  [repo conn block-uuid remote-parents remote-block-order move? op-value]
  (when (seq remote-parents)
    (let [first-remote-parent (first remote-parents)
          local-parent (d/entity @conn [:block/uuid first-remote-parent])
          whiteboard-page-block? (ldb/whiteboard? local-parent)
          b (d/entity @conn [:block/uuid block-uuid])]
      (case [whiteboard-page-block? (some? local-parent) (some? remote-block-order)]
        [false true true]
        (do (if move?
              (transact-db! :move-blocks repo conn [b] local-parent false)
              (transact-db! :insert-blocks repo conn
                            [{:block/uuid block-uuid
                              :block/title ""
                              :block/format :markdown}]
                            local-parent {:sibling? false :keep-uuid? true}))
            (transact-db! :update-block-order-directly repo conn block-uuid first-remote-parent remote-block-order))

        [false true false]
        (if move?
          (transact-db! :move-blocks repo conn [b] local-parent false)
          (transact-db! :insert-no-order-blocks conn [[block-uuid first-remote-parent]]))

        ([true false false] [true false true] [true true false] [true true true])
        (throw (ex-info "Not implemented yet for whiteboard" {:op-value op-value}))

        (throw (ex-info "Don't know where to insert" {:block-uuid block-uuid
                                                      :remote-parents remote-parents
                                                      :remote-block-order remote-block-order
                                                      :op-value op-value}))))))

(defn- move-ops-map->sorted-move-ops
  [move-ops-map]
  (let [uuid->dep-uuids (into {} (map (fn [[uuid env]] [uuid (set (conj (:parents env)))]) move-ops-map))
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
    (worker-page/delete! repo conn (:block-uuid op) {:persist-op? false})))

(defn- patch-remote-attr-map-by-local-av-coll
  [attr-map av-coll]
  (let [a->add->v+t (reduce
                     (fn [m [a v t add?]]
                       (assoc-in m [a add?] [v t]))
                     {} av-coll)]
    (into attr-map
          (keep
           (fn [[remote-a _remote-v]]
             (when-let [v (get-in a->add->v+t [remote-a true 0])]
               [remote-a v])))
          attr-map)))

(defn- update-remote-data-by-local-unpushed-ops
  "when remote-data request client to move/update/remove/... blocks,
  these updates maybe not needed or need to update, because this client just updated some of these blocks,
  so we need to update these remote-data by local-ops"
  [affected-blocks-map local-unpushed-ops]
  (assert (client-op/ops-coercer local-unpushed-ops) local-unpushed-ops)
  (reduce
   (fn [affected-blocks-map local-op]
     (let [local-op-value (last local-op)]
       (case (first local-op)
         :move
         (let [block-uuid (:block-uuid local-op-value)
               remote-op (get affected-blocks-map block-uuid)]
           (case (:op remote-op)
             :remove (dissoc affected-blocks-map (:block-uuid remote-op))
             :move (dissoc affected-blocks-map (:self remote-op))
             ;; remove block/order, parents in update-attrs, if there're some unpushed local move-ops
             (:update-attrs :move+update-attrs)
             (update affected-blocks-map (:self remote-op) dissoc :block/order :parents)
             ;; default
             affected-blocks-map))

         :update
         (let [block-uuid (:block-uuid local-op-value)]
           (if-let [remote-op (get affected-blocks-map block-uuid)]
             (let [remote-op* (if (#{:update-attrs :move :move+update-attrs} (:op remote-op))
                                (patch-remote-attr-map-by-local-av-coll remote-op (:av-coll local-op-value))
                                remote-op)]
               (assoc affected-blocks-map block-uuid remote-op*))
             affected-blocks-map))
         ;;else
         affected-blocks-map)))
   affected-blocks-map local-unpushed-ops))

(defn- affected-blocks->diff-type-ops
  [repo affected-blocks]
  (let [unpushed-ops (client-op/get-all-ops repo)
        affected-blocks-map* (if unpushed-ops
                               (update-remote-data-by-local-unpushed-ops
                                affected-blocks unpushed-ops)
                               affected-blocks)
        {remove-ops-map :remove move-ops-map :move update-ops-map :update-attrs
         move+update-ops-map :move+update-attrs
         update-page-ops-map :update-page remove-page-ops-map :remove-page}
        (update-vals
         (group-by (fn [[_ env]] (get env :op)) affected-blocks-map*)
         (partial into {}))]
    {:remove-ops-map remove-ops-map
     :move-ops-map (merge move-ops-map move+update-ops-map)
     :update-ops-map (merge update-ops-map move+update-ops-map)
     :update-page-ops-map update-page-ops-map
     :remove-page-ops-map remove-page-ops-map}))

(defn- check-block-pos
  "NOTE: some blocks don't have :block/order (e.g. whiteboard blocks)"
  [db block-uuid remote-parents remote-block-order]
  (let [local-b (d/entity db [:block/uuid block-uuid])
        remote-parent-uuid (first remote-parents)]
    (cond
      (nil? local-b)
      :not-exist

      (not= [remote-block-order remote-parent-uuid]
            [(:block/order local-b) (:block/uuid (:block/parent local-b))])
      :wrong-pos

      :else nil)))

(defn- upsert-whiteboard-block
  [repo conn {:keys [parents properties] :as _op-value}]
  (let [db @conn
        first-remote-parent (first parents)]
    (when-let [local-parent (d/entity db [:block/uuid first-remote-parent])]
      (let [page-id (:db/id local-parent)
            properties* (ldb/read-transit-str properties)
            shape-property-id (db-property-util/get-pid repo :logseq.property.tldraw/shape)
            shape (and (map? properties*)
                       (get properties* shape-property-id))]
        (assert (some? page-id) local-parent)
        (assert (some? shape) properties*)
        (transact-db! :upsert-whiteboard-block conn [(gp-whiteboard/shape->block repo shape page-id)])))))

(def ^:private update-op-watched-attrs
  #{:block/title
    :block/updated-at
    :block/created-at
    :block/alias
    :block/type
    :block/schema
    :block/tags
    :block/link
    :block/journal-day
    :class/parent
    :class/schema.properties
    :property/schema.classes
    :property.value/content})

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
            whiteboard-page-block? (ldb/whiteboard? local-parent)]
        (if whiteboard-page-block?
          (upsert-whiteboard-block repo conn op-value)
          (do (when-let [schema-tx-data (remote-op-value->schema-tx-data block-uuid op-value)]
                (ldb/transact! conn schema-tx-data {:persist-op? false :gen-undo-ops? false}))
              (when-let [tx-data (seq (remote-op-value->tx-data @conn ent (dissoc op-value :client/schema)))]
                (ldb/transact! conn (concat tx-data update-block-order-tx-data)
                               {:persist-op? false :gen-undo-ops? false}))))))))

(defn- apply-remote-update-ops
  [repo conn update-ops]
  (doseq [{:keys [parents self] block-order :block/order :as op-value} update-ops]
    (when (and parents block-order)
      (let [r (check-block-pos @conn self parents block-order)]
        (case r
          :not-exist
          (insert-or-move-block repo conn self parents block-order false op-value)
          :wrong-pos
          (insert-or-move-block repo conn self parents block-order true op-value)
          nil)))
    (update-block-attrs repo conn self op-value)))

(defn- apply-remote-move-ops
  [repo conn sorted-move-ops]
  (doseq [{:keys [parents self] block-order :block/order :as op-value} sorted-move-ops]
    (let [r (check-block-pos @conn self parents block-order)]
      (case r
        :not-exist
        (insert-or-move-block repo conn self parents block-order false op-value)
        :wrong-pos
        (insert-or-move-block repo conn self parents block-order true op-value)
        ;; else
        nil))))

(defn- apply-remote-update-page-ops
  [repo conn update-page-ops]
  (let [config (worker-state/get-config repo)]
    (doseq [{:keys [self _page-name]
             title :block/title
             :as op-value} update-page-ops]
      (let [create-opts {:uuid self}
            [_ page-name page-uuid] (worker-page/rtc-create-page! conn config (ldb/read-transit-str title) create-opts)]
        ;; TODO: current page-create fn is buggy, even provide :uuid option, it will create-page with different uuid,
        ;; if there's already existing same name page
        (assert (= page-uuid self) {:page-name page-name :page-uuid page-uuid :should-be self})
        (update-block-attrs repo conn self op-value)))))

(defn- ensure-refed-blocks-exist
  "Ensure refed-blocks from remote existing in client"
  [repo conn refed-blocks]
  (let [sorted-refed-blocks (common-util/sort-coll-by-dependency :block/uuid :block/parent refed-blocks)]
    (doseq [refed-block sorted-refed-blocks]
      (let [ent (d/entity @conn [:block/uuid (:block/uuid refed-block)])]
        (when-not ent
          (prn :ensure-refed-blocks-exist refed-block)
          (if (:block/name refed-block)
            (apply-remote-update-page-ops repo conn [(-> refed-block
                                                         (assoc :self (:block/uuid refed-block))
                                                         (dissoc :block/uuid))])
            (apply-remote-move-ops repo conn [(-> refed-block
                                                  (assoc :self (:block/uuid refed-block)
                                                         :parents [(:block/parent refed-block)])
                                                  (dissoc :block/uuid))])))))))

(defn apply-remote-update
  "Apply remote-update(`remote-update-event`)"
  [graph-uuid repo conn date-formatter remote-update-event add-log-fn]
  (let [remote-update-data (:value remote-update-event)]
    (assert (rtc-const/data-from-ws-validator remote-update-data) remote-update-data)
    (let [remote-t (:t remote-update-data)
          remote-t-before (:t-before remote-update-data)
          local-tx (client-op/get-local-tx repo)]
      (rtc-log-and-state/update-remote-t graph-uuid remote-t)
      (cond
        (not (and (pos? remote-t)
                  (pos? remote-t-before)))
        (throw (ex-info "invalid remote-data" {:data remote-update-data}))

        (<= remote-t local-tx)
        (add-log-fn :rtc.log/apply-remote-update {:sub-type :skip :remote-t remote-t :local-t local-tx})

        (< local-tx remote-t-before)
        (do (add-log-fn :rtc.log/apply-remote-update {:sub-type :need-pull-remote-data
                                                      :remote-t remote-t :local-t local-tx})
            (throw (ex-info "need pull earlier remote-data"
                            {:type ::need-pull-remote-data
                             :local-tx local-tx})))

        (<= remote-t-before local-tx remote-t)
        (let [{affected-blocks-map :affected-blocks refed-blocks :refed-blocks} remote-update-data
              {:keys [remove-ops-map move-ops-map update-ops-map update-page-ops-map remove-page-ops-map]}
              (affected-blocks->diff-type-ops repo affected-blocks-map)
              remove-ops (vals remove-ops-map)
              sorted-move-ops (move-ops-map->sorted-move-ops move-ops-map)
              update-ops (vals update-ops-map)
              update-page-ops (vals update-page-ops-map)
              remove-page-ops (vals remove-page-ops-map)]

          (js/console.groupCollapsed "rtc/apply-remote-ops-log")
          (batch-tx/with-batch-tx-mode conn {:rtc-tx? true :persist-op? false :gen-undo-ops? false}
            (worker-util/profile :ensure-refed-blocks-exist (ensure-refed-blocks-exist repo conn refed-blocks))
            (worker-util/profile :apply-remote-update-page-ops (apply-remote-update-page-ops repo conn update-page-ops))
            (worker-util/profile :apply-remote-move-ops (apply-remote-move-ops repo conn sorted-move-ops))
            (worker-util/profile :apply-remote-update-ops (apply-remote-update-ops repo conn update-ops))
            (worker-util/profile :apply-remote-remove-page-ops (apply-remote-remove-page-ops repo conn remove-page-ops)))
          ;; NOTE: we cannot set :persist-op? = true when batch-tx/with-batch-tx-mode (already set to false)
          ;; and there're some transactions in `apply-remote-remove-ops` need to :persist-op?=true
          (worker-util/profile :apply-remote-remove-ops (apply-remote-remove-ops repo conn date-formatter remove-ops))
          (js/console.groupEnd)

          (client-op/update-local-tx repo remote-t)
          (rtc-log-and-state/update-local-t graph-uuid remote-t))
        :else (throw (ex-info "unreachable" {:remote-t remote-t
                                             :remote-t-before remote-t-before
                                             :local-t local-tx}))))))
