(ns frontend.worker.db-listener
  "Db listeners for worker-db."
  (:require [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.markdown-mirror :as markdown-mirror]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defmulti listen-db-changes
  (fn [listen-key & _] listen-key))

(defn- perf-time-ms []
  (if (and (exists? js/performance)
           (.-now js/performance))
    (.now js/performance)
    (js/Date.now)))

(defn- log-outliner-op-perf!
  [data]
  (when (and goog.DEBUG (:perf-id data))
    (log/info :db-worker/outliner-op-perf data)))

(defn- transit-safe-tx-meta
  [tx-meta]
  (when (map? tx-meta)
    (->> tx-meta
         (remove (fn [[k v]]
                   (or (= :error-handler k)
                       (fn? v))))
         (into {}))))

(defn- main-thread-sync-result
  "Return the processed tx-report and deferred main-thread broadcast data."
  [repo conn {:keys [tx-meta] :as tx-report}]
  (when repo (worker-state/set-db-latest-tx-time! repo))
  (when-not (:rtc-download-graph? tx-meta)
    (let [started-at (perf-time-ms)
          result (worker-pipeline/invoke-hooks conn tx-report (worker-state/get-context))
          pipeline-at (perf-time-ms)
          tx-report' (:tx-report result)]
      (when result
        {:tx-report tx-report'
         :started-at started-at
         :pipeline-at pipeline-at
         :data (merge {:repo repo
                       :request-id (:request-id tx-meta)
                       :tx-data (:tx-data tx-report')
                       :tx-meta (transit-safe-tx-meta tx-meta)}
                      (dissoc result :tx-report))}))))

(defn- broadcast-main-thread-sync!
  [repo {:keys [tx-meta]} {:keys [tx-report started-at pipeline-at data]}]
  (when data
    (shared-service/broadcast-to-clients! :sync-db-changes data)
    (log-outliner-op-perf!
     {:stage :sync-db-to-main-thread
      :perf-id (:ui/perf-id tx-meta)
      :outliner-op (:outliner-op tx-meta)
      :tx-count (count (:tx-data tx-report))
      :pipeline-ms (- pipeline-at started-at)
      :broadcast-ms (- (perf-time-ms) pipeline-at)})
    (when-not (:from-disk? tx-meta)
      (p/do!
       (let [{:keys [blocks-to-remove-set blocks-to-add]}
             (search/sync-search-indice tx-report
                                        {:include-vector-title? (some? (worker-state/get-vector-index repo))})]
         (when (seq blocks-to-remove-set)
           ((@thread-api/*thread-apis :thread-api/search-delete-blocks)
            repo
            blocks-to-remove-set))
         (when (seq blocks-to-add)
           ((@thread-api/*thread-apis :thread-api/search-upsert-blocks)
            repo
            blocks-to-add)))))))

(comment
  (defmethod listen-db-changes :debug-listen-db-changes
    [_ {} {:keys [tx-data tx-meta]}]
    (prn :debug-listen-db-changes)
    (prn :tx-data tx-data)
    (prn :tx-meta tx-meta)))

(defmethod listen-db-changes :db-sync
  [_ {:keys [repo]} tx-report]
  (db-sync/handle-local-tx! repo tx-report))

(defmethod listen-db-changes :markdown-mirror
  [_ {:keys [repo]} tx-report]
  (markdown-mirror/<handle-tx-report! repo nil tx-report {:defer? true}))

(defn listen-db-changes!
  [repo conn & {:keys [handler-keys]}]
  (let [handlers (if (seq handler-keys)
                   (select-keys (methods listen-db-changes) handler-keys)
                   (methods listen-db-changes))
        sync-db-to-main-thread?
        (or (nil? handler-keys)
            (contains? (set handler-keys) :sync-db-to-main-thread))]
    (d/unlisten! conn ::listen-db-changes!)
    (d/listen! conn ::listen-db-changes!
               (fn listen-db-changes!-inner
                 [{:keys [tx-data tx-meta] :as tx-report}]
                 (when (seq tx-data)
                   (let [update-checksum? (or (:batch-final-tx-report? tx-meta)
                                               (not (:batch-tx-report? tx-meta)))]
                     (when update-checksum?
                       (let [started-at (perf-time-ms)]
                         (db-sync/update-local-sync-checksum! repo tx-report)
                         (let [checksum-at (perf-time-ms)
                               sync-result (when sync-db-to-main-thread?
                                             (main-thread-sync-result repo conn tx-report))
                               tx-report' (if sync-db-to-main-thread?
                                            (:tx-report sync-result)
                                            tx-report)
                               sync-main-at (perf-time-ms)
                               opt {:repo repo}
                               handler-timings (atom [])]
                           (when tx-report'
                             (doseq [[k handler-fn] handlers]
                               (let [handler-started-at (perf-time-ms)]
                                 (handler-fn k opt tx-report')
                                 (swap! handler-timings conj
                                        [k (- (perf-time-ms) handler-started-at)]))))
                           (when sync-result
                             (broadcast-main-thread-sync! repo tx-report sync-result))
                           (log-outliner-op-perf!
                            {:stage :db-listener-complete
                             :perf-id (:ui/perf-id tx-meta)
                             :outliner-op (:outliner-op tx-meta)
                             :tx-count (count tx-data)
                             :checksum-ms (- checksum-at started-at)
                             :sync-main-ms (- sync-main-at checksum-at)
                             :handlers-ms @handler-timings
                             :total-ms (- (perf-time-ms) started-at)}))))))))))
