(ns frontend.worker.rtc.client
  "Fns about push local updates"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.missionary-util :as c.m]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.rtc.exception :as r.ex]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [frontend.worker.rtc.remote-update :as r.remote-update]
            [frontend.worker.rtc.ws :as ws]
            [missionary.core :as m]))

(defn- handle-remote-ex
  [resp]
  (if-let [e ({:graph-not-exist r.ex/ex-remote-graph-not-exist
               :graph-not-ready r.ex/ex-remote-graph-not-ready}
              (:type (:ex-data resp)))]
    (throw e)
    resp))

(defn send&recv
  "Return a task: throw exception if recv ex-data response"
  [get-ws-create-task message]
  (m/sp
    (let [ws (m/? get-ws-create-task)]
      (handle-remote-ex (m/? (ws/send&recv ws message))))))

(defn- register-graph-updates
  [get-ws-create-task graph-uuid]
  (m/sp
    (try
      (m/? (send&recv get-ws-create-task {:action "register-graph-updates"
                                          :graph-uuid graph-uuid}))
      (catch :default e
        (if (= :rtc.exception/remote-graph-not-ready (:type (ex-data e)))
          (throw (ex-info "remote graph is still creating" {:missionary/retry true} e))
          (throw e))))))

(defn- ensure-register-graph-updates*
  "Return a task: get or create a mws(missionary wrapped websocket).
  see also `ws/get-mws-create`.
  But ensure `register-graph-updates` has been sent"
  [get-ws-create-task graph-uuid]
  (assert (some? graph-uuid))
  (let [*sent (atom {}) ;; ws->bool
        ]
    (m/sp
      (let [ws (m/? get-ws-create-task)]
        (when-not (contains? @*sent ws)
          (swap! *sent assoc ws false))
        (when (not (@*sent ws))
          (m/? (c.m/backoff
                (take 5 (drop 2 c.m/delays))     ;retry 5 times if remote-graph is creating (4000 8000 16000 32000 64000)
                (register-graph-updates get-ws-create-task graph-uuid)))
          (swap! *sent assoc ws true))
        ws))))

(def ensure-register-graph-updates (memoize ensure-register-graph-updates*))

(defn- ->pos
  [parent-uuid order]
  [parent-uuid order])

(defmulti ^:private local-block-ops->remote-ops-aux (fn [tp & _] tp))

(defmethod local-block-ops->remote-ops-aux :move-op
  [_ & {:keys [parent-uuid block-order block-uuid *remote-ops *depend-on-block-uuid-set]}]
  (when parent-uuid
    (let [pos (->pos parent-uuid block-order)]
      (swap! *remote-ops conj [:move {:block-uuid block-uuid :pos pos}])
      (when parent-uuid
        (swap! *depend-on-block-uuid-set conj parent-uuid)))))

(defn- card-many-attr?
  [db attr]
  (= :db.cardinality/many (get-in (d/schema db) [attr :db/cardinality])))

(defn- remove-redundant-av
  "Remove previous av if later-av has same [a v] or a"
  [db av-coll]
  (loop [[av & others] av-coll
         r {} ;; [a v] or `a` -> [a v t add?]
              ;; [a v] as key for card-many attr, `a` as key for card-one attr
         ]
    (if-not av
      (sort-by #(nth % 2) (vals r))
      (let [[a v _t _add?] av
            av-key (if (card-many-attr? db a) [a v] a)]
        (recur others (assoc r av-key av))))))

(defn- remove-non-exist-ref-av
  "Remove av if its v is ref(block-uuid) and not exist"
  [db av-coll]
  (remove
   (fn [av]
     (let [[_a v _t add?] av]
       ;; when add?=false, no need to care this ref exists or not
       (and add?
            (uuid? v)
            (nil? (d/entity db [:block/uuid v])))))
   av-coll))

(defn- group-by-schema-attrs
  [av-coll]
  (let [{schema-av-coll true other-av-coll false}
        (group-by (fn [av] (contains? #{:db/valueType :db/cardinality :db/index} (first av))) av-coll)]
    [schema-av-coll other-av-coll]))

(defn- schema-av-coll->update-schema-op
  [db block-uuid db-ident schema-av-coll]
  (when (and (seq schema-av-coll) db-ident)
    (let [db-ident-ns (namespace db-ident)]
      (when (and (string/ends-with? db-ident-ns ".property")
                 (not= db-ident-ns "logseq.property"))
        (when-let [ent (d/entity db db-ident)]
          [:update-schema
           (cond-> {:block-uuid block-uuid
                    :db/ident db-ident
                    :db/valueType (or (:db/valueType ent) :db.type/string)}
             (:db/cardinality ent) (assoc :db/cardinality (:db/cardinality ent))
             (:db/index ent) (assoc :db/index (:db/index ent)))])))))

(defn- av-coll->card-one-attrs
  [db-schema av-coll]
  (let [a-coll (distinct (map first av-coll))]
    (filter
     (fn [a]
       (when-let [ns (namespace a)]
         (and
          (or (= "logseq.task" ns)
              (string/starts-with? ns "logseq.property")
              (string/ends-with? ns ".property"))
          (= :db.cardinality/one (:db/cardinality (db-schema a)))))) a-coll)))

(defmethod local-block-ops->remote-ops-aux :update-op
  [_ & {:keys [db block update-op block-order parent-uuid *remote-ops *depend-on-block-uuid-set]}]
  (let [block-uuid (:block/uuid block)
        pos (->pos parent-uuid block-order)
        av-coll (->> (:av-coll (last update-op))
                     (remove-redundant-av db)
                     (remove-non-exist-ref-av db))
        [schema-av-coll other-av-coll] (group-by-schema-attrs av-coll)
        update-schema-op (schema-av-coll->update-schema-op db block-uuid (:db/ident block) schema-av-coll)
        depend-on-block-uuids (keep (fn [[_a v]] (when (uuid? v) v)) other-av-coll)
        card-one-attrs (seq (av-coll->card-one-attrs (d/schema db) other-av-coll))]
    (when (seq other-av-coll)
      (swap! *remote-ops conj
             [:update (cond-> {:block-uuid block-uuid
                               :pos pos
                               :av-coll other-av-coll}
                        card-one-attrs (assoc :card-one-attrs card-one-attrs))]))
    (when update-schema-op
      (swap! *remote-ops conj update-schema-op))
    (swap! *depend-on-block-uuid-set (partial apply conj) depend-on-block-uuids)))

(defmethod local-block-ops->remote-ops-aux :update-page-op
  [_ & {:keys [db block-uuid *remote-ops]}]
  (when-let [{page-name :block/name original-name :block/original-name}
             (d/entity db [:block/uuid block-uuid])]
    (swap! *remote-ops conj
           [:update-page {:block-uuid block-uuid
                          :page-name page-name
                          :original-name (or original-name page-name)}])))

(defmethod local-block-ops->remote-ops-aux :remove-op
  [_ & {:keys [db remove-op *remote-ops]}]
  (when-let [block-uuid (:block-uuid (last remove-op))]
    (when (nil? (d/entity db [:block/uuid block-uuid]))
      (swap! *remote-ops conj [:remove {:block-uuids [block-uuid]}]))))

(defmethod local-block-ops->remote-ops-aux :remove-page-op
  [_ & {:keys [db remove-page-op *remote-ops]}]
  (when-let [block-uuid (:block-uuid (last remove-page-op))]
    (when (nil? (d/entity db [:block/uuid block-uuid]))
      (swap! *remote-ops conj [:remove-page {:block-uuid block-uuid}]))))

(defn- local-block-ops->remote-ops
  [db block-ops]
  (let [*depend-on-block-uuid-set (atom #{})
        *remote-ops (atom [])
        {move-op :move remove-op :remove update-op :update update-page-op :update-page remove-page-op :remove-page}
        block-ops]
    (when-let [block-uuid (some (comp :block-uuid last) [move-op update-op update-page-op])]
      (when-let [block (d/entity db [:block/uuid block-uuid])]
        (let [parent-uuid (some-> block :block/parent :block/uuid)]
          (when parent-uuid
            ;; remote-move-op
            (when move-op
              (local-block-ops->remote-ops-aux :move-op
                                               :parent-uuid parent-uuid
                                               :block-order (:block/order block)
                                               :block-uuid block-uuid
                                               :*remote-ops *remote-ops
                                               :*depend-on-block-uuid-set *depend-on-block-uuid-set)))
          ;; remote-update-op
          (when update-op
            (local-block-ops->remote-ops-aux :update-op
                                             :db db
                                             :block block
                                             :update-op update-op
                                             :parent-uuid parent-uuid
                                             :block-order (:block/order block)
                                             :*remote-ops *remote-ops
                                             :*depend-on-block-uuid-set *depend-on-block-uuid-set)))
        ;; remote-update-page-op
        (when update-page-op
          (local-block-ops->remote-ops-aux :update-page-op
                                           :db db
                                           :block-uuid block-uuid
                                           :*remote-ops *remote-ops))))
    ;; remote-remove-op
    (when remove-op
      (local-block-ops->remote-ops-aux :remove-op
                                       :db db
                                       :remove-op remove-op
                                       :*remote-ops *remote-ops))

    ;; remote-remove-page-op
    (when remove-page-op
      (local-block-ops->remote-ops-aux :remove-page-op
                                       :db db
                                       :remove-page-op remove-page-op
                                       :*remote-ops *remote-ops))

    {:remote-ops @*remote-ops
     :depend-on-block-uuids @*depend-on-block-uuid-set}))

(defn- gen-block-uuid->remote-ops
  [repo conn & {:keys [n] :or {n 50}}]
  (loop [current-handling-block-ops nil
         current-handling-block-uuid nil
         depend-on-block-uuid-coll nil
         r {}]
    (cond
      (and (empty? current-handling-block-ops)
           (empty? depend-on-block-uuid-coll)
           (>= (count r) n))
      r

      (and (empty? current-handling-block-ops)
           (empty? depend-on-block-uuid-coll))
      (if-let [{min-t-block-ops :ops block-uuid :block-uuid} (op-mem-layer/get-min-t-block-ops repo)]
        (do (assert (not (contains? r block-uuid)) {:r r :block-uuid block-uuid})
            (op-mem-layer/remove-block-ops! repo block-uuid)
            (recur min-t-block-ops block-uuid depend-on-block-uuid-coll r))
        ;; finish
        r)

      (and (empty? current-handling-block-ops)
           (seq depend-on-block-uuid-coll))
      (let [[block-uuid & other-block-uuids] depend-on-block-uuid-coll
            block-ops (op-mem-layer/get-block-ops repo block-uuid)]
        (op-mem-layer/remove-block-ops! repo block-uuid)
        (recur block-ops block-uuid other-block-uuids r))

      (seq current-handling-block-ops)
      (let [{:keys [remote-ops depend-on-block-uuids]}
            (local-block-ops->remote-ops @conn current-handling-block-ops)]
        (recur nil nil
               (set/union (set depend-on-block-uuid-coll)
                          (op-mem-layer/intersection-block-uuids repo depend-on-block-uuids))
               (assoc r current-handling-block-uuid (into {} remote-ops)))))))

(defn- merge-remove-remove-ops
  [remote-remove-ops]
  (when-let [block-uuids (->> remote-remove-ops
                              (mapcat (fn [[_ {:keys [block-uuids]}]] block-uuids))
                              distinct
                              seq)]
    [[:remove {:block-uuids block-uuids}]]))

(defn- sort-remote-ops
  [block-uuid->remote-ops]
  (let [block-uuid->dep-uuid
        (into {}
              (keep (fn [[block-uuid remote-ops]]
                      (when-let [move-op (get remote-ops :move)]
                        [block-uuid (:target-uuid move-op)])))
              block-uuid->remote-ops)
        all-move-uuids (set (keys block-uuid->dep-uuid))
        ;; TODO: use `sort-coll-by-dependency`
        sorted-uuids
        (loop [r []
               rest-uuids all-move-uuids
               uuid (first rest-uuids)]
          (if-not uuid
            r
            (let [dep-uuid (block-uuid->dep-uuid uuid)]
              (if-let [next-uuid (get rest-uuids dep-uuid)]
                (recur r rest-uuids next-uuid)
                (let [rest-uuids* (disj rest-uuids uuid)]
                  (recur (conj r uuid) rest-uuids* (first rest-uuids*)))))))
        sorted-move-ops (keep
                         (fn [block-uuid]
                           (some->> (get-in block-uuid->remote-ops [block-uuid :move])
                                    (vector :move)))
                         sorted-uuids)
        update-schema-ops (keep
                           (fn [[_ remote-ops]]
                             (some->> (:update-schema remote-ops) (vector :update-schema)))
                           block-uuid->remote-ops)
        remove-ops (merge-remove-remove-ops
                    (keep
                     (fn [[_ remote-ops]]
                       (some->> (:remove remote-ops) (vector :remove)))
                     block-uuid->remote-ops))
        update-ops (keep
                    (fn [[_ remote-ops]]
                      (some->> (:update remote-ops) (vector :update)))
                    block-uuid->remote-ops)
        update-page-ops (keep
                         (fn [[_ remote-ops]]
                           (some->> (:update-page remote-ops) (vector :update-page)))
                         block-uuid->remote-ops)
        remove-page-ops (keep
                         (fn [[_ remote-ops]]
                           (some->> (:remove-page remote-ops) (vector :remove-page)))
                         block-uuid->remote-ops)]
    (concat update-schema-ops update-page-ops remove-ops sorted-move-ops update-ops remove-page-ops)))

(defn new-task--push-local-ops
  "Return a task: push local updates"
  [repo conn graph-uuid date-formatter get-ws-create-task add-log-fn]
  (m/sp
    (op-mem-layer/new-branch! repo)
    (if-let [remote-ops (not-empty (gen-block-uuid->remote-ops repo conn))]
      (when-let [ops-for-remote (rtc-const/to-ws-ops-decoder
                                 (sort-remote-ops
                                  remote-ops))]
        (let [local-tx (op-mem-layer/get-local-tx repo)
              r (m/? (send&recv get-ws-create-task {:action "apply-ops" :graph-uuid graph-uuid
                                                    :ops ops-for-remote :t-before (or local-tx 1)}))]
          (if-let [remote-ex (:ex-data r)]
            (do (add-log-fn remote-ex)
                (case (:type remote-ex)
                  ;; - :graph-lock-failed
                  ;;   conflict-update remote-graph, keep these local-pending-ops
                  ;;   and try to send ops later
                  :graph-lock-failed
                  (do (op-mem-layer/rollback! repo)
                      nil)
                  ;; - :graph-lock-missing
                  ;;   this case means something wrong in remote-graph data,
                  ;;   nothing to do at client-side
                  :graph-lock-missing
                  (do (op-mem-layer/rollback! repo)
                      (throw r.ex/ex-remote-graph-lock-missing))

                  :rtc.exception/get-s3-object-failed
                  (do (op-mem-layer/rollback! repo)
                      nil)
                  ;; else
                  (do (op-mem-layer/rollback! repo)
                      (throw (ex-info "Unavailable" {:remote-ex remote-ex})))))

            (do (assert (pos? (:t r)) r)
                (op-mem-layer/commit! repo)
                (r.remote-update/apply-remote-update
                 repo conn date-formatter {:type :remote-update :value r} add-log-fn)
                (add-log-fn {:type ::push-client-updates :remote-t (:t r)})))))
      (op-mem-layer/rollback! repo))))

(defn new-task--pull-remote-data
  [repo conn graph-uuid date-formatter get-ws-create-task add-log-fn]
  (m/sp
    (let [local-tx (op-mem-layer/get-local-tx repo)
          r (m/? (send&recv get-ws-create-task {:action "apply-ops" :graph-uuid graph-uuid
                                                :ops [] :t-before (or local-tx 1)}))]
      (if-let [remote-ex (:ex-data r)]
        (do (add-log-fn remote-ex)
            (case (:type remote-ex)
              :graph-lock-failed nil
              :graph-lock-missing (throw r.ex/ex-remote-graph-lock-missing)
              :rtc.exception/get-s3-object-failed nil
              ;;else
              (throw (ex-info "Unavailable" {:remote-ex remote-ex}))))
        (do (assert (pos? (:t r)) r)
            (r.remote-update/apply-remote-update
             repo conn date-formatter {:type :remote-update :value r} add-log-fn)
            (add-log-fn {:type ::pull-remote-data :remote-t (:t r) :local-t local-tx}))))))
