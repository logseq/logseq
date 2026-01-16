(ns frontend.worker.rtc.remote-update
  "Fns about applying remote updates"
  (:require [clojure.data :as data]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.crypt :as crypt]
            [frontend.common.missionary :as c.m]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.rtc.asset :as r.asset]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.rtc.log-and-state :as rtc-log-and-state]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq-schema.rtc-api-schema :as rtc-api-schema]
            [logseq.clj-fractional-indexing :as index]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]
            [missionary.core :as m]))

(defmulti ^:private transact-db! (fn [action & _args] action))

(defn- block-reuse-db-id
  [block]
  (if-let [old-eid (@worker-state/*deleted-block-uuid->db-id (:block/uuid block))]
    (assoc block
           :db/id old-eid
           :block.temp/use-old-db-id? true)
    block))

(defmethod transact-db! :delete-blocks [_ & args]
  (outliner-tx/transact!
   {:persist-op? false
    :gen-undo-ops? false
    :outliner-op :delete-blocks
    :transact-opts {:conn (first args)}}
   (apply outliner-core/delete-blocks! args)))

(defmethod transact-db! :move-blocks [_ & args]
  (outliner-tx/transact!
   {:persist-op? false
    :gen-undo-ops? false
    :outliner-op :move-blocks
    :transact-opts {:conn (first args)}}
   (apply outliner-core/move-blocks! args)))

(defmethod transact-db! :update-block-order-directly [_ conn block-uuid block-parent-uuid block-order]
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
    (ldb/transact! conn [{:block/uuid block-uuid :block/order block-order*}]
                   {:rtc-op? true
                    :persist-op? false
                    :gen-undo-ops? false})
    ;; TODO: add ops when block-order* != block-order
    ))

(defmethod transact-db! :move-blocks&persist-op [_ & args]
  (outliner-tx/transact!
   {:persist-op? true
    :gen-undo-ops? false
    :outliner-op :move-blocks
    :transact-opts {:conn (first args)}}
   (apply outliner-core/move-blocks! args)))

(defmethod transact-db! :insert-blocks [_ conn blocks target opts]
  (outliner-tx/transact!
   {:persist-op? false
    :gen-undo-ops? false
    :outliner-op :insert-blocks
    :transact-opts {:conn conn}}
   (let [opts' (assoc opts :keep-block-order? true)
         blocks' (map block-reuse-db-id blocks)]
     (outliner-core/insert-blocks! conn blocks' target opts')))
  (doseq [block blocks]
    (assert (some? (d/entity @conn [:block/uuid (:block/uuid block)]))
            {:msg "insert-block failed"
             :block block
             :target target})))

(defmethod transact-db! :insert-no-order-blocks [_ conn block-uuid+parent-coll]
  (ldb/transact! conn
                 (mapv (fn [[block-uuid block-parent]]
                         ;; add block/content block/format to satisfy the normal-block schema
                         (cond-> {:block/uuid block-uuid}
                           block-parent (assoc :block/parent [:block/uuid block-parent])))
                       block-uuid+parent-coll)
                 {:persist-op? false
                  :gen-undo-ops? false
                  :rtc-op? true}))

(defmethod transact-db! :delete-whiteboard-blocks [_ conn block-uuids]
  (ldb/transact! conn
                 (mapv (fn [block-uuid] [:db/retractEntity [:block/uuid block-uuid]]) block-uuids)
                 {:persist-op? false
                  :gen-undo-ops? false
                  :rtc-op? true}))

(defmethod transact-db! :upsert-whiteboard-block [_ conn blocks]
  (ldb/transact! conn blocks {:persist-op? false
                              :gen-undo-ops? false
                              :rtc-op? true}))

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
  [conn remove-ops]
  (let [{whiteboard-block-ops true other-ops false} (group-remote-remove-ops-by-whiteboard-block @conn remove-ops)]
    (transact-db! :delete-whiteboard-blocks conn (map :block-uuid whiteboard-block-ops))

    (let [{:keys [block-uuids-need-move block-uuids-to-remove]}
          (apply-remote-remove-ops-helper conn other-ops)]
      ;; move to page-block's first child
      (doseq [block-uuid block-uuids-need-move]
        (when-let [b (d/entity @conn [:block/uuid block-uuid])]
          (when-let [target-b
                     (d/entity @conn (:db/id (:block/page (d/entity @conn [:block/uuid block-uuid]))))]
            (transact-db! :move-blocks&persist-op conn [b] target-b {:sibling? false}))))
      (let [deleting-blocks (keep (fn [block-uuid]
                                    (d/entity @conn [:block/uuid block-uuid]))
                                  block-uuids-to-remove)]
        (when (seq deleting-blocks)
          (transact-db! :delete-blocks conn deleting-blocks {}))))))

(defn- insert-or-move-block
  [conn block-uuid remote-parents remote-block-order move? op-value]
  (when (or (seq remote-parents) remote-block-order) ;at least one of parent|order exists
    (let [first-remote-parent (first remote-parents)
          local-parent (when first-remote-parent (d/entity @conn [:block/uuid first-remote-parent]))
          whiteboard-page-block? (ldb/whiteboard? local-parent)
          b (d/entity @conn [:block/uuid block-uuid])]
      (case [whiteboard-page-block? (some? local-parent) (some? remote-block-order)]
        [false true true]
        (do
          (if move?
            (transact-db! :move-blocks conn [(block-reuse-db-id b)] local-parent {:sibling? false})
            (transact-db! :insert-blocks conn
                          [{:block/uuid block-uuid}]
                          local-parent {:sibling? false :keep-uuid? true}))
          (transact-db! :update-block-order-directly conn block-uuid first-remote-parent remote-block-order))

        [false true false]
        (if move?
          (transact-db! :move-blocks conn [b] local-parent
                        {:sibling? false})
          (transact-db! :insert-no-order-blocks conn [[block-uuid first-remote-parent]]))

        [false false true] ;no parent, only update order. e.g. update property's order
        (when (and (empty? remote-parents) move?)
          (transact-db! :update-block-order-directly conn block-uuid nil remote-block-order))

        ([true false false] [true false true] [true true false] [true true true])
        (throw (ex-info "Not implemented yet for whiteboard" {:op-value op-value}))

        (let [e (ex-info "Don't know where to insert" {:block-uuid block-uuid
                                                       :remote-parents remote-parents
                                                       :remote-block-order remote-block-order
                                                       :move? move?
                                                       :op-value op-value})]
          (log/error :insert-or-move-block e)
          (throw e))))))

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
  [conn remove-page-ops]
  (doseq [op remove-page-ops]
    (worker-page/delete! conn (:block-uuid op) {:persist-op? false})))

(defn- get-schema-ref+cardinality
  [db-schema attr]
  (when-let [k-schema (get db-schema attr)]
    [(= :db.type/ref (:db/valueType k-schema))
     (= :db.cardinality/many (:db/cardinality k-schema))]))

(defn- patch-remote-attr-map-by-local-av-coll
  [remote-attr-map local-av-coll]
  (let [a->add->v-set
        (reduce
         (fn [m [a v _t add?]]
           (let [{add-vset true retract-vset false} (get m a {true #{} false #{}})]
             (assoc m a {true ((if add? conj disj) add-vset v)
                         false ((if add? disj conj) retract-vset v)})))
         {} local-av-coll)
        updated-remote-attr-map1
        (keep
         (fn [[remote-a remote-v]]
           (when-let [{add-vset true retract-vset false} (get a->add->v-set remote-a)]
             [remote-a
              (if (coll? remote-v)
                (-> (set remote-v)
                    (set/union add-vset)
                    (set/difference retract-vset)
                    vec)
                (cond
                  (seq add-vset) (first add-vset)
                  (contains? retract-vset remote-v) nil))]))
         remote-attr-map)
        updated-remote-attr-map2
        (keep
         (fn [[a add->v-set]]
           (when-let [ns (namespace a)]
             (when (and (not (contains? #{"block"} ns))
                        ;; FIXME: only handle non-block/xxx attrs,
                        ;; because some :block/xxx attrs are card-one, we only generate card-many values here
                        (not (contains? remote-attr-map a)))
               (when-let [v-set (not-empty (get add->v-set true))]
                 [a (vec v-set)]))))
         a->add->v-set)]
    (into remote-attr-map
          (concat updated-remote-attr-map1 updated-remote-attr-map2))))

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
         :remove
         ;; TODO: if this block's updated by others, we shouldn't remove it
         ;; but now, we don't know who updated this block recv from remote
         ;; once we have this attr(:block/updated-by, :block/created-by), we can finish this TODO
         (let [block-uuid (:block-uuid local-op-value)]
           (dissoc affected-blocks-map block-uuid))

         ;;else
         affected-blocks-map)))
   affected-blocks-map local-unpushed-ops))

(defn- affected-blocks->diff-type-ops
  [repo affected-blocks]
  (let [unpushed-block-ops (client-op/get-all-block-ops repo)
        affected-blocks-map* (if unpushed-block-ops
                               (update-remote-data-by-local-unpushed-ops
                                affected-blocks unpushed-block-ops)
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

(def ^:private update-op-watched-attrs
  #{:block/title
    :block/updated-at
    :block/created-at
    :block/alias
    :block/tags
    :block/link
    :block/journal-day
    :logseq.property/classes
    :logseq.property/value})

(def ^:private watched-attr-ns
  (conj db-property/logseq-property-namespaces "logseq.class"))

(defn- update-op-watched-attr?
  [attr]
  (or (contains? update-op-watched-attrs attr)
      (when-let [ns (namespace attr)]
        (or (contains? watched-attr-ns ns)
            (string/ends-with? ns ".property")
            (string/ends-with? ns ".class")))))

(defn- diff-block-kv->tx-data
  [db db-schema e k local-v remote-v]
  (when-let [[ref? card-many?] (get-schema-ref+cardinality db-schema k)]
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
          (if (nil? remote-block-uuid)
            [[:db/retract e k]]
            (when-let [db-id (:db/id (d/entity db [:block/uuid remote-block-uuid]))]
              [[:db/add e k db-id]]))))

      [false false]
      (let [remote-v* (if (coll? remote-v)
                        (first (map ldb/read-transit-str remote-v))
                        (ldb/read-transit-str remote-v))]
        (when (not= local-v remote-v*)
          (if (nil? remote-v*)
            ;; FIXME: The following judgment is a temporary fix for incomplete server blocks,
            ;;        remove it once it's confirmed that server blocks will not be incomplete.
            (when-not (contains? #{:block/created-at :block/updated-at} k)
              [[:db/retract e k]])
            [[:db/add e k remote-v*]])))

      [false true]
      (let [_ (assert (or (nil? remote-v) (coll? remote-v)) {:remote-v remote-v :a k :e e})
            remote-v* (set (map ldb/read-transit-str remote-v))
            [local-only remote-only] (data/diff (set local-v) remote-v*)]
        (cond-> []
          (seq local-only) (concat (map (fn [v]
                                          [:db/retract e k v]) local-only))
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
  "ignore-attr-set: don't update local attrs in this set"
  [db ent op-value ignore-attr-set]
  (assert (some? (:db/id ent)) ent)
  (let [db-schema (d/schema db)
        local-block-map (->> ent
                             (filter (fn [[attr _]]
                                       (and (update-op-watched-attr? attr)
                                            (not (contains? ignore-attr-set attr)))))
                             (keep (fn [[k v]]
                                     (when-let [[ref? card-many?] (get-schema-ref+cardinality db-schema k)]
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
                              (keep (fn [[k v]]
                                     ;; all non-built-in attrs is card-many in remote-op,
                                     ;; convert them according to the client db-schema
                                      (when-let [[_ref? card-many?] (get-schema-ref+cardinality db-schema k)]
                                        [k
                                         (if (and (coll? v) (not card-many?))
                                           (first v)
                                           v)])))
                              (into {}))]
    (diff-block-map->tx-data db (:db/id ent) local-block-map remote-block-map)))

(defn- remote-op-value->schema-tx-data
  [block-uuid op-value]
  (when-let [db-ident (:db/ident op-value)]
    (let [schema-map (some-> op-value :client/schema ldb/read-transit-str)]
      [(merge {:block/uuid block-uuid :db/ident db-ident} schema-map)])))

(defn- update-block-order
  [e op-value]
  (if-let [order (:block/order op-value)]
    {:op-value (dissoc op-value :block/order)
     :tx-data [[:db/add e :block/order order]]}
    {:op-value op-value}))

(defn- update-block-attrs
  [conn block-uuid op-value]
  (when-let [ent (d/entity @conn [:block/uuid block-uuid])]
    (when (some (fn [k] (= "block" (namespace k))) (keys op-value)) ; there exists some :block/xxx attrs
      (let [{update-block-order-tx-data :tx-data op-value :op-value} (update-block-order (:db/id ent) op-value)
            tx-meta {:persist-op? false :gen-undo-ops? false :rtc-op? true}]
        (when-let [schema-tx-data (remote-op-value->schema-tx-data block-uuid op-value)]
          (ldb/transact! conn schema-tx-data tx-meta))
        (when-let [tx-data (seq (remote-op-value->tx-data @conn ent (dissoc op-value :client/schema)
                                                          rtc-const/ignore-attrs-when-syncing))]
          (ldb/transact! conn (concat tx-data update-block-order-tx-data) tx-meta))))))

(defn- apply-remote-update-ops
  [conn update-ops]
  (doseq [{:keys [parents self] block-order :block/order :as op-value} update-ops]
    (when (and parents block-order)
      (let [r (check-block-pos @conn self parents block-order)]
        (case r
          :not-exist
          (insert-or-move-block conn self parents block-order false op-value)
          :wrong-pos
          (insert-or-move-block conn self parents block-order true op-value)
          nil)))
    (update-block-attrs conn self op-value)))

(defn- apply-remote-move-ops
  [conn sorted-move-ops]
  (doseq [{:keys [parents self] block-order :block/order :as op-value} sorted-move-ops]
    (let [r (check-block-pos @conn self parents block-order)]
      (case r
        :not-exist
        (do (insert-or-move-block conn self parents block-order false op-value)
            (update-block-attrs conn self op-value))
        :wrong-pos
        (insert-or-move-block conn self parents block-order true op-value)
        ;; else
        nil))))

(defn- need-update-block-attrs-when-apply-update-page-op?
  [update-page-op-value]
  (seq (set/difference (set (keys update-page-op-value)) #{:op :self :page-name :block/title})))

(defn- apply-remote-update-page-ops
  [repo conn update-page-ops]
  (doseq [{:keys [self _page-name]
           title :block/title
           :as op-value} update-page-ops]
    (let [db-ident (:db/ident op-value)]
      (when-not (or
                   ;; property or class exists
                 (and db-ident (d/entity @conn db-ident))
                   ;; journal with the same block/uuid exists
                 (ldb/journal? (d/entity @conn [:block/uuid self])))
        (let [create-opts {:uuid self
                           :old-db-id (@worker-state/*deleted-block-uuid->db-id self)}
              [_ page-name page-uuid] (worker-page/rtc-create-page! conn
                                                                    (ldb/read-transit-str title)
                                                                    (worker-state/get-date-formatter repo)
                                                                    create-opts)]
            ;; TODO: current page-create fn is buggy, even provide :uuid option, it will create-page with different uuid,
            ;; if there's already existing same name page
          (assert (= page-uuid self) {:page-name page-name :page-uuid page-uuid :should-be self})
          (assert (some? (d/entity @conn [:block/uuid page-uuid])) {:page-uuid page-uuid :page-name page-name})))
      (when (need-update-block-attrs-when-apply-update-page-op? op-value)
        (update-block-attrs conn self op-value)))))

(defn- ensure-refed-blocks-exist
  "Ensure refed-blocks from remote existing in client"
  [repo conn refed-blocks]
  (let [sorted-refed-blocks (common-util/sort-coll-by-dependency :block/uuid :block/parent refed-blocks)]
    (doseq [refed-block sorted-refed-blocks]
      (let [ent (d/entity @conn [:block/uuid (:block/uuid refed-block)])]
        (when-not ent
          (log/info :ensure-refed-blocks-exist refed-block)
          (if (:block/name refed-block)
            (apply-remote-update-page-ops repo conn [(-> refed-block
                                                         (assoc :self (:block/uuid refed-block))
                                                         (dissoc :block/uuid))])
            (apply-remote-move-ops conn [(-> refed-block
                                             (assoc :self (:block/uuid refed-block)
                                                    :parents [(:block/parent refed-block)])
                                             (dissoc :block/uuid))])))))))

(defn task--decrypt-blocks-in-remote-update-data
  [aes-key encrypt-attr-set remote-update-data]
  (assert aes-key)
  (m/sp
    (let [{affected-blocks-map :affected-blocks refed-blocks :refed-blocks} remote-update-data
          affected-blocks-map'
          (loop [[[block-uuid affected-block] & rest-affected-blocks] affected-blocks-map
                 affected-blocks-map-result {}]
            (if-not block-uuid
              affected-blocks-map-result
              (let [affected-block' (c.m/<? (crypt/<decrypt-map aes-key encrypt-attr-set affected-block))]
                (recur rest-affected-blocks (assoc affected-blocks-map-result block-uuid affected-block')))))
          refed-blocks'
          (loop [[refed-block & rest-refed-blocks] refed-blocks
                 refed-blocks-result []]
            (if-not refed-block
              refed-blocks-result
              (let [refed-block' (c.m/<? (crypt/<decrypt-map aes-key encrypt-attr-set refed-block))]
                (recur rest-refed-blocks (conj refed-blocks-result refed-block')))))]
      (assoc remote-update-data
             :affected-blocks affected-blocks-map'
             :refed-blocks refed-blocks'))))

(defn apply-remote-update-check
  "If the check passes, return true"
  [repo remote-update-event add-log-fn]
  (let [remote-update-data (:value remote-update-event)]
    (assert (rtc-api-schema/data-from-ws-validator remote-update-data) remote-update-data)
    (let [{remote-latest-t :t
           remote-t-before :t-before
           remote-t :t-query-end} remote-update-data
          remote-t (or remote-t remote-latest-t) ;TODO: remove this, be compatible with old-clients for now
          local-tx (client-op/get-local-tx repo)]
      (cond
        (not (and (pos? remote-t)
                  (pos? remote-t-before)))
        (throw (ex-info "invalid remote-data" {:data remote-update-data}))

        (<= remote-t local-tx)
        (do (add-log-fn :rtc.log/apply-remote-update
                        {:sub-type :skip
                         :remote-t remote-t
                         :remote-latest-t remote-latest-t
                         :local-t local-tx})
            false)

        (< local-tx remote-t-before)
        (do (add-log-fn :rtc.log/apply-remote-update {:sub-type :need-pull-remote-data
                                                      :remote-latest-t remote-latest-t
                                                      :remote-t remote-t
                                                      :local-t local-tx
                                                      :remote-t-before remote-t-before})
            (throw (ex-info "need pull earlier remote-data"
                            {:type :rtc.exception/local-graph-too-old
                             :local-tx local-tx})))

        (<= remote-t-before local-tx remote-t) true

        :else (throw (ex-info "unreachable" {:remote-t remote-t
                                             :remote-t-before remote-t-before
                                             :remote-latest-t remote-latest-t
                                             :local-t local-tx}))))))

(defn task--apply-remote-update
  "Apply remote-update(`remote-update-event`)"
  [graph-uuid repo conn remote-update-event aes-key add-log-fn]
  (m/sp
    (when (apply-remote-update-check repo remote-update-event add-log-fn)
      (let [remote-update-data (:value remote-update-event)
            remote-update-data (if aes-key
                                 (m/? (task--decrypt-blocks-in-remote-update-data
                                       aes-key rtc-const/encrypt-attr-set
                                       remote-update-data))
                                 remote-update-data)
            ;; TODO: remove this 'or', be compatible with old-clients for now
            remote-t (or (:t-query-end remote-update-data) (:t remote-update-data))
            {affected-blocks-map :affected-blocks refed-blocks :refed-blocks} remote-update-data
            {:keys [remove-ops-map move-ops-map update-ops-map update-page-ops-map remove-page-ops-map]}
            (affected-blocks->diff-type-ops repo affected-blocks-map)
            remove-ops (vals remove-ops-map)
            sorted-move-ops (move-ops-map->sorted-move-ops move-ops-map)
            update-ops (vals update-ops-map)
            update-page-ops (vals update-page-ops-map)
            remove-page-ops (vals remove-page-ops-map)
            db-before @conn
            tx-meta {:rtc-tx? true
                     :persist-op? false
                     :gen-undo-ops? false}]
        (rtc-log-and-state/update-remote-t graph-uuid remote-t repo)
        (js/console.groupCollapsed "rtc/apply-remote-ops-log")
        (ldb/transact-with-temp-conn!
         conn tx-meta
         (fn [temp-conn]
           (worker-util/profile :ensure-refed-blocks-exist (ensure-refed-blocks-exist repo temp-conn refed-blocks))
           (worker-util/profile :apply-remote-update-page-ops (apply-remote-update-page-ops repo temp-conn update-page-ops))
           (worker-util/profile :apply-remote-move-ops (apply-remote-move-ops temp-conn sorted-move-ops))
           (worker-util/profile :apply-remote-update-ops (apply-remote-update-ops temp-conn update-ops))
           (worker-util/profile :apply-remote-remove-page-ops (apply-remote-remove-page-ops temp-conn remove-page-ops))))

        ;; NOTE: we cannot set :persist-op? = true when batch-tx/with-batch-tx-mode (already set to false)
        ;; and there're some transactions in `apply-remote-remove-ops` need to :persist-op?=true
        (worker-util/profile :apply-remote-remove-ops (apply-remote-remove-ops conn remove-ops))

        ;; wait all remote-ops transacted into db,
        ;; then start to check any asset-updates in remote
        (let [db-after @conn]
          (r.asset/emit-remote-asset-updates-from-block-ops db-before db-after remove-ops update-ops))
        (js/console.groupEnd)

        (client-op/update-local-tx repo remote-t)
        (rtc-log-and-state/update-local-t graph-uuid remote-t)))))
