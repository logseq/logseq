(ns logseq.outliner.db-pipeline
  "This ns provides a datascript listener for DB graphs that is useful for CLIs
  and testing (since it doesn't assume a frontend worker exists). The listener adds
  additional changes that the frontend also adds per transact.  Missing features
  from frontend.worker.pipeline including:
   * Deleted blocks don't update effected :block/tx-id
   * Delete empty property parent"
  (:require [datascript.core :as d]
            [logseq.outliner.datascript-report :as ds-report]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(defn- rebuild-block-refs
  [{:keys [db-after]} blocks]
  (mapcat (fn [block]
            (when (d/entity db-after (:db/id block))
              (let [refs (outliner-pipeline/db-rebuild-block-refs db-after block)]
                (when (seq refs)
                  [[:db/retract (:db/id block) :block/refs]
                   {:db/id (:db/id block)
                    :block/refs refs}]))))
          blocks))

(defn- invoke-hooks
  "Modified copy of frontend.worker.pipeline/invoke-hooks that doesn't
  handle :block/tx-id"
  [conn tx-report]
  (when (not (get-in tx-report [:tx-meta :pipeline-replace?]))
    (let [{:keys [blocks]} (ds-report/get-blocks-and-pages tx-report)
          refs-tx-report (when-let [refs-tx (and (seq blocks) (rebuild-block-refs tx-report blocks))]
                           (d/transact! conn refs-tx {:pipeline-replace? true}))
          blocks' (if refs-tx-report
                    (keep (fn [b] (d/entity (:db-after refs-tx-report) (:db/id b))) blocks)
                    blocks)
          block-path-refs-tx (distinct (outliner-pipeline/compute-block-path-refs-tx tx-report blocks'))]
      (when (seq block-path-refs-tx)
        (d/transact! conn block-path-refs-tx {:pipeline-replace? true})))))

(defn ^:api add-listener
  "Adds a listener to the datascript connection to add additional changes from outliner.pipeline"
  [conn]
  (d/listen! conn :pipeline-updates (fn pipeline-updates [tx-report]
                                      (invoke-hooks conn tx-report))))