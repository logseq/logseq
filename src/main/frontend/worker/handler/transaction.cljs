(ns frontend.worker.handler.transaction
  "Transaction, outliner operation, and worker-state synchronization operations."
  (:require
   [datascript.core :as d]
   [frontend.common.thread-api :refer [def-thread-api]]
   [frontend.worker-common.util :as worker-util]
   [frontend.worker.db-listener :as db-listener]
   [frontend.worker.plain-value :as worker-plain]
   [frontend.worker.shared-service :as shared-service]
   [frontend.worker.state :as worker-state]
   [lambdaisland.glogi :as log]
   [logseq.common.util :as common-util]
   [logseq.db :as ldb]
   [logseq.db.common.order :as db-order]
   [logseq.outliner.op :as outliner-op]
   [logseq.outliner.recycle :as outliner-recycle]))

(def ^:private recycle-gc-kv :logseq.kv/recycle-last-gc-at)

(defn maybe-run-recycle-gc!
  [conn]
  (let [now (common-util/time-ms)
        last-gc-at (:kv/value (d/entity @conn recycle-gc-kv))]
    (when (or (not (number? last-gc-at))
              (> (- now last-gc-at) outliner-recycle/gc-interval-ms))
      (outliner-recycle/gc! conn {:now-ms now})
      (ldb/transact! conn [{:db/ident recycle-gc-kv
                            :kv/value now}]
                     {:persist-op? false
                      :skip-validate-db? true}))))

(def-thread-api :thread-api/set-context
  [context]
  (when context (worker-state/update-context! context))
  nil)

(def-thread-api :thread-api/transact
  [repo tx-data tx-meta context]
  (assert (some? repo))
  (worker-state/set-db-latest-tx-time! repo)
  (let [conn (worker-state/get-datascript-conn repo)]
    (assert (some? conn) {:repo repo})
    (try
      (let [tx-data' (if (contains? #{:insert-blocks} (:outliner-op tx-meta))
                       (map (fn [tx]
                              (if (and (map? tx) (nil? (:block/order tx)))
                                (assoc tx :block/order (db-order/gen-key nil))
                                tx)) tx-data)
                       tx-data)
            _ (when context (worker-state/set-context! context))
            tx-meta' (dissoc tx-meta :insert-blocks?)]
        (when-not (and (:create-today-journal? tx-meta)
                       (:today-journal-name tx-meta)
                       (seq tx-data')
                       (ldb/get-page @conn (:today-journal-name tx-meta)))
          (worker-util/profile "Worker db transact"
                               (ldb/transact! conn tx-data' tx-meta')))
        (maybe-run-recycle-gc! conn)
        nil)
      (catch :default error
        (prn :debug :worker-transact-failed :tx-meta tx-meta :tx-data tx-data)
        (log/error ::worker-transact-failed error)
        (throw error)))))

(defn- perf-time-ms []
  (if (and (exists? js/performance)
           (.-now js/performance))
    (.now js/performance)
    (js/Date.now)))

(defn- log-outliner-op-perf!
  [data]
  (when (and goog.DEBUG (:perf-id data))
    (log/info :db-worker/outliner-op-perf data)))

(def-thread-api :thread-api/apply-outliner-ops
  [repo ops opts]
  (let [conn (or (worker-state/get-datascript-conn repo)
                 (throw (ex-info "Missing worker graph connection"
                                 {:type :db/missing-connection
                                  :repo repo})))]
    (try
      (let [started-at (perf-time-ms)
            perf-id (:ui/perf-id opts)
            editor-row-uuids (:editor-row-uuids opts)
            operation-opts (dissoc opts
                                   :affected-block-uuids
                                   :editor-row-uuids
                                   :return-updated-blocks?)
            apply-started-at (perf-time-ms)
            operation-result (worker-util/profile
                              "apply outliner ops"
                              (outliner-op/apply-ops! conn ops operation-opts))
            applied-at (perf-time-ms)
            delta (db-listener/take-outliner-op-delta! perf-id)
            listener-perf (db-listener/take-outliner-op-perf! perf-id)
            listener-at (perf-time-ms)
            response (cond-> {:result (worker-plain/worker-plain-value
                                       @conn operation-result)}
                       delta (assoc :delta delta)
                       (and delta (seq editor-row-uuids))
                       (assoc :editor-row-uuids editor-row-uuids))
            plain-at (perf-time-ms)
            perf-data {:apply-ms (- applied-at apply-started-at)
                       :listener-ms (- listener-at applied-at)
                       :plain-ms (- plain-at listener-at)
                       :total-ms (- plain-at started-at)
                       :listener listener-perf}
            response-with-perf (cond-> response
                                 goog.DEBUG (assoc :perf perf-data))]
        (log-outliner-op-perf!
         (merge (dissoc perf-data :listener)
                {:perf-id perf-id
                 :op-names (mapv first ops)
                 :op-count (count ops)}))
        response-with-perf)
      (catch :default error
        (let [data (ex-data error)
              {:keys [type payload]} (when (map? data) data)]
          (case type
            :notification
            (do
              (log/error ::apply-outliner-ops-failed error)
              (shared-service/broadcast-to-clients! :notification [(:message payload) (:type payload) (:clear? payload) (:uid payload) (:timeout payload)
                                                                   (select-keys payload [:i18n-key :i18n-args])])
              (throw error))
            (throw error)))))))

(def-thread-api :thread-api/sync-app-state
  [new-state]
  (when (and (contains? new-state :git/current-repo)
             (nil? (:git/current-repo new-state)))
    (log/error :thread-api/sync-app-state new-state))
  (worker-state/set-new-state! new-state)
  nil)
