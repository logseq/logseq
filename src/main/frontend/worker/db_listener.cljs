(ns frontend.worker.db-listener
  "Db listeners for worker-db."
  (:require [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.markdown-mirror :as markdown-mirror]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.platform :as platform]
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

(defonce ^:private *outliner-op-perf (atom {}))

(defn take-outliner-op-perf!
  [perf-id]
  (let [result (get @*outliner-op-perf perf-id)]
    (swap! *outliner-op-perf dissoc perf-id)
    result))

(defn- log-outliner-op-perf!
  [data]
  (when-let [perf-id (and goog.DEBUG (:perf-id data))]
    (swap! *outliner-op-perf update perf-id (fnil conj []) data)
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
                       :tx-meta (transit-safe-tx-meta tx-meta)
                       :tx-data (:tx-data tx-report')}
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

(defn- invoke-listener-handler!
  [handler-timings k handler-fn opt tx-report]
  (let [handler-started-at (perf-time-ms)]
    (handler-fn k opt tx-report)
    (swap! handler-timings conj
           [k (- (perf-time-ms) handler-started-at)])))

(defn- report-post-commit-error!
  [repo tx-meta stage error]
  (let [data {:repo repo
              :stage stage
              :outliner-op (:outliner-op tx-meta)
              :error error}]
    (log/error :db-worker/post-commit-handler-failed data)
    (try
      (platform/post-message!
       (platform/current)
       :capture-error
       {:error error
        :payload (dissoc data :error)})
      (catch :default report-error
        (log/error :db-worker/report-post-commit-handler-failed
                   {:repo repo
                    :stage stage
                    :error report-error})))))

(defn- run-post-commit!
  [repo tx-meta stage f]
  (try
    (f)
    (catch :default error
      (report-post-commit-error! repo tx-meta stage error))))

(defn listen-db-changes!
  [repo conn & {:keys [handler-keys]}]
  (let [handlers (if (seq handler-keys)
                   (select-keys (methods listen-db-changes) handler-keys)
                   (methods listen-db-changes))
        persist-local-tx-handler (get handlers :db-sync)
        deferred-handlers (dissoc handlers :db-sync)
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
                         (run-post-commit!
                          repo tx-meta :update-checksum
                          #(db-sync/update-local-sync-checksum! repo tx-report))
                         (let [checksum-at (perf-time-ms)
                               opt {:repo repo}
                               handler-timings (atom [])]
                           (when persist-local-tx-handler
                             (run-post-commit!
                              repo tx-meta :persist-local-tx
                              #(invoke-listener-handler! handler-timings
                                                        :db-sync
                                                        persist-local-tx-handler
                                                        opt
                                                        tx-report)))
                           (let [persist-at (perf-time-ms)
                                 sync-result (when sync-db-to-main-thread?
                                               (main-thread-sync-result repo conn tx-report))
                                 tx-report' (if sync-db-to-main-thread?
                                              (:tx-report sync-result)
                                              tx-report)
                                 sync-main-at (perf-time-ms)]
                             (when tx-report'
                               (doseq [[k handler-fn] deferred-handlers]
                                 (invoke-listener-handler! handler-timings k handler-fn opt tx-report')))
                             (when sync-result
                               (broadcast-main-thread-sync! repo tx-report sync-result))
                             (log-outliner-op-perf!
                              {:stage :db-listener-complete
                               :perf-id (:ui/perf-id tx-meta)
                               :outliner-op (:outliner-op tx-meta)
                               :tx-count (count tx-data)
                               :checksum-ms (- checksum-at started-at)
                               :persist-ms (- persist-at checksum-at)
                               :sync-main-ms (- sync-main-at persist-at)
                               :handlers-ms @handler-timings
                               :total-ms (- (perf-time-ms) started-at)})))))))))))
