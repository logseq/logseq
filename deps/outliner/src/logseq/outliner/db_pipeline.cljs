(ns ^:node-only logseq.outliner.db-pipeline
  "This ns provides a datascript listener for DB graphs to add additional changes
   that the frontend also adds per transact.
   Missing features from frontend.worker.pipeline including:
   * Deleted blocks don't update effected :block/tx-id
   * Delete empty property parent"
  (:require [datascript.core :as d]
            [logseq.outliner.pipeline :as outliner-pipeline]
            [logseq.outliner.datascript-report :as ds-report]))

(defn- invoke-hooks
  "Modified copy of frontend.worker.pipeline/invoke-hooks that doesn't
  handle :block/tx-id"
  [conn tx-report]
  (when (not (get-in tx-report [:tx-meta :pipeline-replace?]))
    (let [{:keys [blocks]} (ds-report/get-blocks-and-pages tx-report)
          block-path-refs-tx (distinct (outliner-pipeline/compute-block-path-refs-tx tx-report blocks))]
      (when (seq block-path-refs-tx)
        (d/transact! conn block-path-refs-tx {:pipeline-replace? true})))))

(defn add-listener
  "Adds a listener to the datascript connection to add additional changes from outliner.pipeline"
  [conn]
  (d/listen! conn :pipeline-updates (fn pipeline-updates [tx-report]
                                      (invoke-hooks conn tx-report))))
