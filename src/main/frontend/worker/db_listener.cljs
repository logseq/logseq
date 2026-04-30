(ns frontend.worker.db-listener
  "Db listeners for worker-db."
  (:require [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.sync :as db-sync]
            [promesa.core :as p]))

(defmulti listen-db-changes
  (fn [listen-key & _] listen-key))

(defn- transit-safe-tx-meta
  [tx-meta]
  (when (map? tx-meta)
    (->> tx-meta
         (remove (fn [[k v]]
                   (or (= :error-handler k)
                       (fn? v))))
         (into {}))))

(defn- sync-db-to-main-thread
  "Return tx-report"
  [repo conn {:keys [tx-meta] :as tx-report}]
  (when repo (worker-state/set-db-latest-tx-time! repo))
  (when-not (:rtc-download-graph? tx-meta)
    (let [{:keys [from-disk?]} tx-meta
          result (worker-pipeline/invoke-hooks conn tx-report (worker-state/get-context))
          tx-report' (:tx-report result)]
      (when result
        (let [data (merge
                    {:repo repo
                     :request-id (:request-id tx-meta)
                     :tx-data (:tx-data tx-report')
                     :tx-meta (transit-safe-tx-meta tx-meta)}
                    (dissoc result :tx-report))]
          (shared-service/broadcast-to-clients! :sync-db-changes data))

        (when-not from-disk?
          (p/do!
           ;; Sync SQLite search
           (let [{:keys [blocks-to-remove-set blocks-to-add]} (search/sync-search-indice repo tx-report')]
             (when (seq blocks-to-remove-set)
               ((@thread-api/*thread-apis :thread-api/search-delete-blocks) repo blocks-to-remove-set))
             (when (seq blocks-to-add)
               ((@thread-api/*thread-apis :thread-api/search-upsert-blocks) repo blocks-to-add))))))
      tx-report')))

(comment
  (defmethod listen-db-changes :debug-listen-db-changes
    [_ {} {:keys [tx-data tx-meta]}]
    (prn :debug-listen-db-changes)
    (prn :tx-data tx-data)
    (prn :tx-meta tx-meta)))

(defmethod listen-db-changes :db-sync
  [_ {:keys [repo]} tx-report]
  (db-sync/handle-local-tx! repo tx-report))

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
                   (when (and worker-util/dev-or-test?
                              (not (:batch-final-tx-report? tx-meta)))
                     (db-sync/update-local-sync-checksum! repo tx-report))
                   (when-not (:batch-tx? @conn)
                     (let [tx-report' (if sync-db-to-main-thread?
                                        (sync-db-to-main-thread repo conn tx-report)
                                        tx-report)
                           opt {:repo repo}]
                       (when tx-report'
                         (doseq [[k handler-fn] handlers]
                           (handler-fn k opt tx-report'))))))))))
