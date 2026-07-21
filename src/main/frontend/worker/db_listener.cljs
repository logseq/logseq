(ns frontend.worker.db-listener
  "Db listeners for worker-db."
  (:require [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.handler.block :as block-handler]
            [frontend.worker.markdown-mirror :as markdown-mirror]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.platform :as platform]
            [frontend.worker.render-delta :as render-delta]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [lambdaisland.glogi :as log]
            [logseq.db.sqlite.export :as sqlite-export]
            [promesa.core :as p]))

(defmulti listen-db-changes
  (fn [listen-key & _] listen-key))

(defn- perf-time-ms []
  (if (and (exists? js/performance)
           (.-now js/performance))
    (.now js/performance)
    (js/Date.now)))

(defonce ^:private *outliner-op-perf (atom {}))
(defonce ^:private *outliner-op-deltas (atom {}))

(defn take-outliner-op-perf!
  [perf-id]
  (let [result (get @*outliner-op-perf perf-id)]
    (swap! *outliner-op-perf dissoc perf-id)
    result))

(defn take-outliner-op-delta!
  [perf-id]
  (let [delta (get @*outliner-op-deltas perf-id)]
    (swap! *outliner-op-deltas dissoc perf-id)
    delta))

(defn- log-outliner-op-perf!
  [data]
  (when-let [perf-id (and goog.DEBUG (:perf-id data))]
    (swap! *outliner-op-perf update perf-id (fnil conj []) data)
    (log/info :db-worker/outliner-op-perf data)))

(def ^:private renderer-tx-meta-keys
  [:initial-pages?
   :end?
   :client-id
   :outliner-op
   :deleted-page
   :data])

(defn- renderer-tx-meta
  [tx-meta]
  (select-keys tx-meta renderer-tx-meta-keys))

(defn- publish-render-delta?
  [tx-meta]
  (not (or (:rtc-download-graph? tx-meta)
           (:sync-download-graph? tx-meta)
           (:skip-validate-db? tx-meta))))

(defn- canonical-replacements
  [{:keys [db-after tx-data]}]
  (into {}
        (comp
         (filter (fn [datom]
                   (and (:added datom)
                        (= :block/tx-id (:a datom)))))
         (map (fn [datom]
                (let [block (block-handler/canonical-block
                             db-after
                             (d/entity db-after (:e datom)))]
                  [(:block/uuid block) block]))))
        tx-data))

(defn- build-render-delta
  [repo {:keys [db-after tx-meta] :as tx-report}
   {:keys [affected-keys deleted-block-uuids]}]
  (let [delta-tx-report (if (::sqlite-export/imported-data? tx-meta)
                          (assoc tx-report :tx-data [])
                          tx-report)]
    (render-delta/build
     {:graph-id repo
      :rev (:max-tx db-after)
      :op-id (:db-sync/tx-id tx-meta)
      :blocks (canonical-replacements tx-report)
      :deleted-block-uuids deleted-block-uuids
      :affected-keys (set affected-keys)
      :tx-report delta-tx-report})))

(defn- main-thread-sync-result
  "Build the renderer delta and deferred broadcast data."
  [repo conn {:keys [tx-meta] :as tx-report}]
  (when repo (worker-state/set-db-latest-tx-time! repo))
  (when (publish-render-delta? tx-meta)
    (let [started-at (perf-time-ms)
          render-result (worker-pipeline/invoke-hooks
                         conn tx-report (worker-state/get-context))
          pipeline-at (perf-time-ms)
          processed-tx-report (:tx-report render-result)
          delta (when render-result
                  (build-render-delta repo processed-tx-report render-result))
          delta-at (perf-time-ms)
          payload (when delta
                    {:repo repo
                     :tx-meta (renderer-tx-meta tx-meta)
                     :delta delta})]
      (when (and delta (:ui/perf-id tx-meta))
        (swap! *outliner-op-deltas assoc (:ui/perf-id tx-meta) delta))
      (when payload
        {:tx-report processed-tx-report
         :started-at started-at
         :pipeline-at pipeline-at
         :delta-at delta-at
         :payload payload}))))

(defn- broadcast-main-thread-sync!
  [{:keys [tx-meta]} {:keys [tx-report started-at pipeline-at delta-at payload]}]
  (when payload
    (let [broadcast-at (perf-time-ms)]
      (shared-service/broadcast-to-clients! :sync-db-changes payload)
      (log-outliner-op-perf!
       {:stage :sync-db-to-main-thread
        :perf-id (:ui/perf-id tx-meta)
        :outliner-op (:outliner-op tx-meta)
        :tx-count (count (:tx-data tx-report))
        :pipeline-ms (- pipeline-at started-at)
        :delta-ms (- delta-at pipeline-at)
        :broadcast-ms (- (perf-time-ms) broadcast-at)}))))

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

(defmethod listen-db-changes :search
  [_ {:keys [repo]} {:keys [tx-meta] :as tx-report}]
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
          blocks-to-add))))))

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
                                 tx-report' (or (:tx-report sync-result)
                                                tx-report)
                                 sync-main-at (perf-time-ms)]
                             (when tx-report'
                               (doseq [[k handler-fn] deferred-handlers]
                                 (invoke-listener-handler! handler-timings k handler-fn opt tx-report')))
                             (when sync-result
                               (broadcast-main-thread-sync! tx-report sync-result))
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
