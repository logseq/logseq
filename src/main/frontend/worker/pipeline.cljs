(ns frontend.worker.pipeline
  "Pipeline work after transaction"
  (:require [datascript.core :as d]
            [logseq.outliner.datascript-report :as ds-report]
            [logseq.outliner.pipeline :as outliner-pipeline]
            [frontend.worker.react :as worker-react]
            [frontend.worker.file :as file]
            [frontend.worker.util :as worker-util]
            [frontend.worker.state :as worker-state]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.util :as sqlite-util]
            [frontend.worker.db.fix :as db-fix]
            [logseq.db :as ldb]))

(defn- path-refs-need-recalculated?
  [tx-meta]
  (let [outliner-op (:outliner-op tx-meta)]
    (not (or
          (contains? #{:collapse-expand-blocks :delete-blocks} outliner-op)
          (:undo? tx-meta) (:redo? tx-meta)))))

(defn compute-block-path-refs-tx
  [{:keys [tx-meta] :as tx-report} blocks]
  (when (or (and (:outliner-op tx-meta) (path-refs-need-recalculated? tx-meta))
            (:from-disk? tx-meta)
            (:new-graph? tx-meta))
    (outliner-pipeline/compute-block-path-refs-tx tx-report blocks)))

(defn- delete-property-parent-block-if-empty
  [tx-report deleted-block-uuids]
  (let [after-db (:db-after tx-report)
        empty-property-parents (->> (keep (fn [child-id]
                                            (let [e (d/entity (:db-before tx-report) [:block/uuid child-id])]
                                              (when (get (:block/parent e) :logseq.property/created-from-property)
                                                (let [parent-now (d/entity after-db (:db/id (:block/parent e)))]
                                                  (when (empty? (:block/_parent parent-now))
                                                    parent-now))))) deleted-block-uuids)
                                    distinct)]
    (when (seq empty-property-parents)
      (->>
       (mapcat (fn [b]
                 (let [created-from-block (get b :logseq.property/created-from-block)
                       created-from-property (get b :logseq.property/created-from-property)
                       created-block (d/entity after-db (:db/id created-from-block))]
                   (when (and created-block created-from-property)
                     [[:db/retractEntity (:db/id b)]
                      [:db/add (:db/id created-block) (:db/ident created-from-property) ""]])))
               empty-property-parents)
       (remove nil?)))))

(defn fix-db!
  [conn {:keys [db-before db-after tx-data]}]
  (let [changed-pages (->> (filter (fn [d] (contains? #{:block/left :block/parent} (:a d))) tx-data)
                           (map :e)
                           distinct
                           (map (fn [id]
                                  (-> (or (d/entity db-after id)
                                          (d/entity db-before id))
                                      :block/page
                                      :db/id)))
                           (remove nil?)
                           (distinct))]
    (doseq [changed-page-id changed-pages]
      (db-fix/fix-page-if-broken! conn changed-page-id {}))))

(defn validate-and-fix-db!
  [repo conn tx-report context]
  (when (and (:dev? context) (not (:importing? context)) (sqlite-util/db-based-graph? repo))
    (let [valid? (db-validate/validate-tx-report! tx-report (:validate-db-options context))]
      (when (and (get-in context [:validate-db-options :fail-invalid?]) (not valid?))
        (worker-util/post-message :notification
                                  [["Invalid DB!"] :error]))))
  (when (and (:dev? context)
             (not (:node-test? context)))
    (fix-db! conn tx-report)))

(defonce *enable-db-validate? (atom false))

(defn invoke-hooks
  [repo conn tx-report context]
  (when-not (:pipeline-replace? (:tx-meta tx-report))
    (let [tx-meta (:tx-meta tx-report)
          {:keys [from-disk? new-graph? undo? redo?]} tx-meta
          {:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report)]
      (if (or from-disk? new-graph?)
        (let [path-refs (set (compute-block-path-refs-tx tx-report blocks))
              tx-report' (or
                          (when (seq path-refs)
                            (ldb/transact! conn path-refs {:replace? true
                                                           :pipeline-replace? true}))
                          (do
                            (when-not (exists? js/process) (d/store @conn))
                            tx-report))
              full-tx-data (concat (:tx-data tx-report) (:tx-data tx-report'))
              final-tx-report (assoc tx-report'
                                     :tx-meta (:tx-meta tx-report)
                                     :tx-data full-tx-data
                                     :db-before (:db-before tx-report))]
          {:tx-report final-tx-report})
        (let [_ (when (sqlite-util/local-file-based-graph? repo)
                  (let [page-ids (distinct (map :db/id pages))]
                    (doseq [page-id page-ids]
                      (when (d/entity @conn page-id)
                        (file/sync-to-file repo page-id tx-meta)))))
              deleted-block-uuids (set (outliner-pipeline/filter-deleted-blocks (:tx-data tx-report)))
              replace-tx (when-not (or undo? redo?)
                           (concat
                            ;; block path refs
                            (set (compute-block-path-refs-tx tx-report blocks))

                            ;; delete empty property parent block
                            (when (seq deleted-block-uuids)
                              (delete-property-parent-block-if-empty tx-report deleted-block-uuids))

                            ;; update block/tx-id
                            (let [updated-blocks (remove (fn [b] (contains? (set deleted-block-uuids) (:block/uuid b)))
                                                         (concat pages blocks))
                                  tx-id (get-in tx-report [:tempids :db/current-tx])]
                              (->>
                               (map (fn [b]
                                      (when-let [db-id (:db/id b)]
                                        {:db/id db-id
                                         :block/tx-id tx-id})) updated-blocks)
                               (remove nil?)))))
              tx-report' (or
                          (when (seq replace-tx)
                            ;; TODO: remove this since transact! is really slow
                            (ldb/transact! conn replace-tx {:replace? true
                                                            :pipeline-replace? true}))
                          (do
                            (when-not (exists? js/process) (d/store @conn))
                            tx-report))
              fix-tx-data (when @*enable-db-validate? (validate-and-fix-db! repo conn tx-report context))
              full-tx-data (concat (:tx-data tx-report) fix-tx-data (:tx-data tx-report'))
              final-tx-report (assoc tx-report'
                                     :tx-data full-tx-data
                                     :db-before (:db-before tx-report))
              batch-processing? (worker-state/rtc-batch-processing?)
              affected-query-keys (when-not (or (:importing? context)
                                                batch-processing?)
                                    (worker-react/get-affected-queries-keys final-tx-report))]
          (when batch-processing?
            (worker-state/conj-batch-txs! full-tx-data))
          {:tx-report final-tx-report
           :affected-keys affected-query-keys
           :deleted-block-uuids deleted-block-uuids
           :pages pages
           :blocks blocks})))))
