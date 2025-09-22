(ns frontend.worker.rtc.client
  "Fns about push local updates"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.missionary :as c.m]
            [frontend.worker.flows :as worker-flows]
            [frontend.worker.rtc.branch-graph :as r.branch-graph]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.exception :as r.ex]
            [frontend.worker.rtc.log-and-state :as rtc-log-and-state]
            [frontend.worker.rtc.malli-schema :as rtc-schema]
            [frontend.worker.rtc.remote-update :as r.remote-update]
            [frontend.worker.rtc.skeleton :as r.skeleton]
            [frontend.worker.rtc.throttle :as r.throttle]
            [frontend.worker.rtc.ws :as ws]
            [frontend.worker.rtc.ws-util :as ws-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [missionary.core :as m]
            [tick.core :as tick]))

(defn- apply-remote-updates-from-apply-ops
  [apply-ops-resp graph-uuid repo conn date-formatter add-log-fn]
  (if-let [remote-ex (:ex-data apply-ops-resp)]
    (do (add-log-fn :rtc.log/pull-remote-data (assoc remote-ex :sub-type :pull-remote-data-exception))
        (case (:type remote-ex)
          :graph-lock-failed nil
          :graph-lock-missing
          (throw r.ex/ex-remote-graph-lock-missing)
          :rtc.exception/get-s3-object-failed
          (throw (ex-info (:ex-message apply-ops-resp) (:ex-data apply-ops-resp)))
          ;;else
          (throw (ex-info "Unavailable3" {:remote-ex remote-ex}))))
    (do (assert (pos? (:t apply-ops-resp)) apply-ops-resp)
        (r.remote-update/apply-remote-update
         graph-uuid repo conn date-formatter {:type :remote-update :value apply-ops-resp} add-log-fn))))

(defn- new-task--init-request
  [get-ws-create-task graph-uuid major-schema-version repo conn *last-calibrate-t *server-schema-version add-log-fn]
  (m/sp
    (let [t-before (client-op/get-local-tx repo)
          get-graph-skeleton? (or (nil? @*last-calibrate-t)
                                  (< 500 (- t-before @*last-calibrate-t)))]
      (try
        (let [{remote-t :t
               server-schema-version :server-schema-version
               server-builtin-db-idents :server-builtin-db-idents
               :as resp}
              (m/? (ws-util/send&recv get-ws-create-task {:action "init-request"
                                                          :graph-uuid graph-uuid
                                                          :schema-version (str major-schema-version)
                                                          :t-before t-before
                                                          :get-graph-skeleton get-graph-skeleton?}))]
          (if-let [remote-ex (:ex-data resp)]
            (do
              (add-log-fn :rtc.log/init-request remote-ex)
              (case (:type remote-ex)
                :graph-lock-failed nil
                :graph-lock-missing (throw r.ex/ex-remote-graph-lock-missing)
                ;; else
                (throw (ex-info "Unavailable4" {:remote-ex remote-ex}))))
            (do
              (when server-schema-version
                (reset! *server-schema-version server-schema-version)
                (reset! *last-calibrate-t remote-t))
              (when remote-t
                (rtc-log-and-state/update-remote-t graph-uuid remote-t)
                (when (not t-before)
                  (client-op/update-local-tx repo remote-t)))
              (when (and server-schema-version server-builtin-db-idents)
                (r.skeleton/calibrate-graph-skeleton server-schema-version server-builtin-db-idents @conn))
              resp)))
        (catch :default e
          (if (= :rtc.exception/remote-graph-not-ready (:type (ex-data e)))
            (throw (ex-info "remote graph is still creating" {:missionary/retry true} e))
            (throw e)))))))

(def ^:private *register-graph-updates-sent
  "ws -> [bool, added-inst, [graph-uuid,major-schema-version,repo]]"
  (atom {}))

(defn- clean-old-keys-in-sent!
  []
  (let [hours-ago (tick/<< (tick/instant) (tick/new-duration 3 :hours))
        old-ks
        (keep (fn [[k [_ added-inst]]]
                (when (tick/< added-inst hours-ago)
                  k))
              @*register-graph-updates-sent)]
    (doseq [k old-ks]
      (swap! *register-graph-updates-sent dissoc k))))

(defn ensure-register-graph-updates--memoized
  "Return a task: get or create a mws(missionary wrapped websocket).
  see also `ws/get-mws-create`.
  But ensure `init-request` and `calibrate-graph-skeleton` has been sent"
  [get-ws-create-task graph-uuid major-schema-version repo conn date-formatter
   *last-calibrate-t *online-users *server-schema-version add-log-fn]
  (m/sp
    (let [ws (m/? get-ws-create-task)
          sent-3rd-value [graph-uuid major-schema-version repo]
          origin-v (@*register-graph-updates-sent ws)]
      (when (or (nil? origin-v)
                (not= (last origin-v) sent-3rd-value))
        (swap! *register-graph-updates-sent assoc ws [false (tick/instant) sent-3rd-value])
        (clean-old-keys-in-sent!))
      (when (not (first (@*register-graph-updates-sent ws)))
        (swap! *register-graph-updates-sent assoc-in [ws 0] true)
        (let [recv-flow (ws/recv-flow (m/? get-ws-create-task))]
          (c.m/run-task :update-online-user-when-register-graph-updates
            (m/sp
              (when-let [online-users (:online-users
                                       (m/?
                                        (m/timeout
                                         (m/reduce
                                          (fn [_ v]
                                            (when (= "online-users-updated" (:req-id v))
                                              (reduced v)))
                                          recv-flow)
                                         10000)))]
                (reset! *online-users online-users)))
            :succ (constantly nil)))
        (let [{:keys [max-remote-schema-version] :as init-request-resp}
              (try
                (m/?
                 (c.m/backoff
                  {:delay-seq ;retry 5 times if remote-graph is creating (4000 8000 16000 32000 64000)
                   (take 5 (drop 2 c.m/delays))
                   :reset-flow worker-flows/online-event-flow}
                  (new-task--init-request
                   get-ws-create-task graph-uuid major-schema-version repo conn
                   *last-calibrate-t *server-schema-version
                   add-log-fn)))
                (catch :default e
                  (swap! *register-graph-updates-sent assoc-in [ws 0] false)
                  (throw e)))]
          (when max-remote-schema-version
            (add-log-fn :rtc.log/higher-remote-schema-version-exists
                        {:sub-type (r.branch-graph/compare-schemas
                                    max-remote-schema-version db-schema/version major-schema-version)
                         :repo repo
                         :graph-uuid graph-uuid
                         :remote-schema-version max-remote-schema-version}))
          (apply-remote-updates-from-apply-ops init-request-resp graph-uuid repo conn date-formatter add-log-fn)))
      ws)))

(defn- ->pos
  [parent-uuid order]
  [parent-uuid order])

(defmulti ^:private local-block-ops->remote-ops-aux (fn [tp & _] tp))

(defmethod local-block-ops->remote-ops-aux :move-op
  [_ & {:keys [parent-uuid block-order block-uuid *remote-ops *depend-on-block-uuid-set]}]
  (let [pos (->pos parent-uuid block-order)]
    (swap! *remote-ops conj [:move {:block-uuid block-uuid :pos pos}])
    (when parent-uuid
      (swap! *depend-on-block-uuid-set conj parent-uuid))))

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
      (vals r)
      (let [[a v _t _add?] av
            av-key (if (card-many-attr? db a) [a v] a)]
        (if-let [old-av (get r av-key)]
          (recur others
                 (cond
                   (< (nth old-av 2) (nth av 2)) (assoc r av-key av)
                   (> (nth old-av 2) (nth av 2)) r
                   (true? (nth av 3)) (assoc r av-key av)
                   :else r))
          (recur others (assoc r av-key av)))))))

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
    (when-let [ent (d/entity db db-ident)]
      (when (ldb/property? ent)
        [:update-schema
         (cond-> {:block-uuid block-uuid
                  :db/ident db-ident
                  :db/valueType (or (:db/valueType ent) :db.type/string)}
           (:db/cardinality ent) (assoc :db/cardinality (:db/cardinality ent))
           (:db/index ent) (assoc :db/index (:db/index ent)))]))))

(defn- av-coll->card-one-attrs
  [db-schema av-coll]
  (let [a-coll (distinct (map first av-coll))]
    (filter
     (fn [a]
       (when-let [ns (namespace a)]
         (and
          (or (string/starts-with? ns "logseq.property")
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
                        (:db/ident block) (assoc :db/ident (:db/ident block))
                        card-one-attrs (assoc :card-one-attrs card-one-attrs))]))
    (when update-schema-op
      (swap! *remote-ops conj update-schema-op))
    (swap! *depend-on-block-uuid-set (partial apply conj) depend-on-block-uuids)))

(defmethod local-block-ops->remote-ops-aux :update-page-op
  [_ & {:keys [db block-uuid *remote-ops]}]
  (when-let [{page-name :block/name title :block/title db-ident :db/ident}
             (d/entity db [:block/uuid block-uuid])]
    (swap! *remote-ops conj
           [:update-page (cond-> {:block-uuid block-uuid
                                  :page-name page-name
                                  :block/title (or title page-name)}
                           db-ident (assoc :db/ident db-ident))])))

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
          ;; remote-move-op
          (when move-op
            (local-block-ops->remote-ops-aux :move-op
                                             :parent-uuid parent-uuid
                                             :block-order (:block/order block)
                                             :block-uuid block-uuid
                                             :*remote-ops *remote-ops
                                             :*depend-on-block-uuid-set *depend-on-block-uuid-set))
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

    {:remote-ops (into {} @*remote-ops)
     :depend-on-block-uuids @*depend-on-block-uuid-set}))

(defn- gen-block-uuid->remote-ops
  [db block-ops-map-coll]
  (into {}
        (map
         (fn [block-ops-map]
           [(:block/uuid block-ops-map)
            (:remote-ops (local-block-ops->remote-ops db block-ops-map))]))
        block-ops-map-coll))

(defn- local-update-kv-value-ops->remote-ops
  [update-kv-value-ops-map]
  (keep
   (fn [[op-type op]]
     (when (= :update-kv-value op-type)
       (let [{:keys [db-ident value]} (last op)]
         [:update-kv-value {:db-ident db-ident :value (ldb/write-transit-str value)}])))
   update-kv-value-ops-map))

(defn- gen-update-kv-value-remote-ops
  [update-kv-value-ops-map-coll]
  (mapcat local-update-kv-value-ops->remote-ops update-kv-value-ops-map-coll))

(defn- local-rename-db-ident-ops->remote-ops
  [rename-db-ident-ops-map]
  (keep (fn [[op-type op]]
          (when (keyword-identical? :rename-db-ident op-type)
            [:rename-db-ident (select-keys (last op) [:db-ident-or-block-uuid :new-db-ident])]))
        rename-db-ident-ops-map))

(defn- gen-rename-db-ident-remote-ops
  [rename-db-ident-ops-map-coll]
  (mapcat local-rename-db-ident-ops->remote-ops rename-db-ident-ops-map-coll))

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

(defn- rollback
  [repo block-ops-map-coll update-kv-value-ops-map-coll rename-db-ident-ops-map-coll]
  (let [block-ops
        (mapcat
         (fn [m]
           (keep (fn [[k op]]
                   (when-not (keyword-identical? :block/uuid k)
                     op))
                 m))
         block-ops-map-coll)
        update-kv-value-ops
        (mapcat
         (fn [m]
           (keep (fn [[k op]]
                   (when (keyword-identical? :update-kv-value k)
                     op))
                 m))
         update-kv-value-ops-map-coll)
        rename-db-ident-ops
        (mapcat
         (fn [m]
           (keep (fn [[k op]]
                   (when (keyword-identical? :rename-db-ident k)
                     op))
                 m))
         rename-db-ident-ops-map-coll)]
    (client-op/add-ops! repo block-ops)
    (client-op/add-ops! repo update-kv-value-ops)
    (client-op/add-ops! repo rename-db-ident-ops)
    nil))

(defn new-task--push-local-ops
  "Return a task: push local updates"
  [repo conn graph-uuid major-schema-version date-formatter get-ws-create-task *remote-profile? add-log-fn]
  (m/sp
    (let [block-ops-map-coll (client-op/get&remove-all-block-ops repo)
          update-kv-value-ops-map-coll (client-op/get&remove-all-update-kv-value-ops repo)
          rename-db-ident-ops-map-coll (client-op/get&remove-all-rename-db-ident-ops repo)
          block-uuid->remote-ops (not-empty (gen-block-uuid->remote-ops @conn block-ops-map-coll))
          rename-db-ident-remote-ops (gen-rename-db-ident-remote-ops rename-db-ident-ops-map-coll)
          other-remote-ops (gen-update-kv-value-remote-ops update-kv-value-ops-map-coll)
          remote-ops (concat
                      rename-db-ident-remote-ops
                      (when block-uuid->remote-ops (sort-remote-ops block-uuid->remote-ops))
                      other-remote-ops)]
      (when-let [ops-for-remote (rtc-schema/to-ws-ops-decoder remote-ops)]
        (let [local-tx (client-op/get-local-tx repo)
              r (try
                  (let [message (cond-> {:action "apply-ops"
                                         :graph-uuid graph-uuid :schema-version (str major-schema-version)
                                         :ops ops-for-remote :t-before local-tx}
                                  (true? @*remote-profile?) (assoc :profile true))
                        r (m/? (ws-util/send&recv get-ws-create-task message))]
                    (r.throttle/add-rtc-api-call-record! message)
                    r)
                  (catch :default e
                    (rollback repo block-ops-map-coll update-kv-value-ops-map-coll rename-db-ident-ops-map-coll)
                    (throw e)))]
          (if-let [remote-ex (:ex-data r)]
            (do (add-log-fn :rtc.log/push-local-update remote-ex)
                (case (:type remote-ex)
                  ;; - :graph-lock-failed
                  ;;   conflict-update remote-graph, keep these local-pending-ops
                  ;;   and try to send ops later
                  :graph-lock-failed
                  (rollback repo block-ops-map-coll update-kv-value-ops-map-coll rename-db-ident-ops-map-coll)
                  ;; - :graph-lock-missing
                  ;;   this case means something wrong in remote-graph data,
                  ;;   nothing to do at client-side
                  :graph-lock-missing
                  (do (rollback repo block-ops-map-coll update-kv-value-ops-map-coll rename-db-ident-ops-map-coll)
                      (throw r.ex/ex-remote-graph-lock-missing))

                  :rtc.exception/get-s3-object-failed
                  (rollback repo block-ops-map-coll update-kv-value-ops-map-coll rename-db-ident-ops-map-coll)
                  ;; else
                  (do (rollback repo block-ops-map-coll update-kv-value-ops-map-coll rename-db-ident-ops-map-coll)
                      (throw (ex-info "Unavailable1" {:remote-ex remote-ex})))))

            (do (assert (pos? (:t r)) r)
                (r.remote-update/apply-remote-update
                 graph-uuid repo conn date-formatter {:type :remote-update :value r} add-log-fn)
                (add-log-fn :rtc.log/push-local-update {:remote-t (:t r)}))))))))

(defn new-task--pull-remote-data
  [repo conn graph-uuid major-schema-version date-formatter get-ws-create-task add-log-fn]
  (m/sp
    (let [local-tx (client-op/get-local-tx repo)
          message {:action "apply-ops"
                   :graph-uuid graph-uuid :schema-version (str major-schema-version)
                   :ops [] :t-before (or local-tx 1)}
          r (m/? (ws-util/send&recv get-ws-create-task message))]
      (r.throttle/add-rtc-api-call-record! message)
      (apply-remote-updates-from-apply-ops r graph-uuid repo conn date-formatter add-log-fn))))
