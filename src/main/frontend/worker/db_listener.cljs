(ns frontend.worker.db-listener
  "Db listeners for worker-db."
  (:require [cljs-bean.core :as bean]
            [datascript.core :as d]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.search :as search]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [logseq.common.util :as common-util]
            [logseq.outliner.batch-tx :as batch-tx]
            [promesa.core :as p]))

(defmulti listen-db-changes
  (fn [listen-key & _] listen-key))

(defn- sync-db-to-main-thread
  "Return tx-report"
  [repo conn {:keys [tx-meta] :as tx-report}]
  (let [{:keys [from-disk?]} tx-meta
        result (worker-pipeline/invoke-hooks repo conn tx-report (worker-state/get-context))
        tx-report' (:tx-report result)]
    (when (and result (not (:rtc-download-graph? tx-meta)))
      (let [data (merge
                  {:request-id (:request-id tx-meta)
                   :repo repo
                   :tx-data (:tx-data tx-report')
                   :tx-meta tx-meta}
                  (dissoc result :tx-report))]
        (worker-util/post-message :sync-db-changes data))

      (when-not from-disk?
        (p/do!
         (let [{:keys [blocks-to-remove-set blocks-to-add]} (search/sync-search-indice repo tx-report')
               ^js wo (worker-state/get-worker-object)]
           (when wo
             (when (seq blocks-to-remove-set)
               (.search-delete-blocks wo repo (bean/->js blocks-to-remove-set)))
             (when (seq blocks-to-add)
               (.search-upsert-blocks wo repo (bean/->js blocks-to-add))))))))
    tx-report'))

(comment
  (defmethod listen-db-changes :debug-listen-db-changes
    [_ {} {:keys [tx-data tx-meta]}]
    (prn :debug-listen-db-changes)
    (prn :tx-data tx-data)
    (prn :tx-meta tx-meta)))

(defn listen-db-changes!
  [repo conn & {:keys [handler-keys]}]
  (let [handlers (if (seq handler-keys)
                   (select-keys (methods listen-db-changes) handler-keys)
                   (methods listen-db-changes))
        sync-db-to-main-thread?
        (or (nil? handler-keys)
            (contains? (set handler-keys) :sync-db-to-main-thread))]
    (d/unlisten! conn ::listen-db-changes!)
    (prn :listen-db-changes! (keys handlers) :repo repo)
    (let [*batch-all-txs (volatile! [])
          get-batch-txs #(->> @*batch-all-txs
                              (sort-by :tx)
                              (common-util/distinct-by-last-wins (fn [[e a v _tx added]] [e a v added])))
          additional-args (fn [tx-data]
                            (let [datom-vec-coll (map vec tx-data)
                                  id->same-entity-datoms (group-by first datom-vec-coll)
                                  id-order (distinct (map first datom-vec-coll))
                                  same-entity-datoms-coll (map id->same-entity-datoms id-order)]
                              [[:same-entity-datoms-coll same-entity-datoms-coll]
                               [:id->same-entity-datoms id->same-entity-datoms]]))]
      (d/listen! conn ::listen-db-changes!
                 (fn listen-db-changes!-inner
                   [{:keys [tx-data _db-before _db-after tx-meta] :as tx-report}]
                   (let [tx-meta (merge (batch-tx/get-batch-opts) tx-meta)
                         pipeline-replace? (:pipeline-replace? tx-meta)
                         in-batch-tx-mode? (:batch-tx/batch-tx-mode? tx-meta)]
                     (when-not pipeline-replace?
                       (when in-batch-tx-mode?
                         (batch-tx/set-batch-opts (dissoc tx-meta :pipeline-replace?)))
                       (cond
                         (and in-batch-tx-mode?
                              (not (:batch-tx/exit? tx-meta)))
                         ;; still in batch mode
                         (vswap! *batch-all-txs into tx-data)

                         in-batch-tx-mode?
                         ;; exit batch mode
                         (when-let [tx-data (not-empty (get-batch-txs))]
                           (vreset! *batch-all-txs [])
                           (let [db-before (batch-tx/get-batch-db-before)
                                 tx-meta (dissoc tx-meta :batch-tx/batch-tx-mode? :batch-tx/exit?)
                                 tx-report (assoc tx-report
                                                  :tx-data tx-data
                                                  :db-before db-before
                                                  :tx-meta tx-meta)
                                 tx-report' (if sync-db-to-main-thread?
                                              (sync-db-to-main-thread repo conn tx-report)
                                              tx-report)
                                 opt (into {:repo repo}
                                           (additional-args (:tx-data tx-report')))]
                             (doseq [[k handler-fn] handlers]
                               (handler-fn k opt tx-report'))))

                         (seq tx-data)
                         ;; raw transact
                         (let [tx-report' (if sync-db-to-main-thread?
                                            (sync-db-to-main-thread repo conn tx-report)
                                            tx-report)
                               opt (into {:repo repo}
                                         (additional-args (:tx-data tx-report')))]
                           (doseq [[k handler-fn] handlers]
                             (handler-fn k opt tx-report')))))))))))
