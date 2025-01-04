(ns logseq.outliner.db-pipeline
  "This ns provides a datascript listener for DB graphs that is useful for CLIs
  and testing (since it doesn't assume a frontend worker exists). The listener adds
  additional changes that the frontend also adds per transact.  Missing features
  from frontend.worker.pipeline including:
   * Deleted blocks don't update effected :block/tx-id
   * Delete empty property parent"
  (:require [datascript.core :as d]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(defn- invoke-hooks
  "Modified copy of frontend.worker.pipeline/invoke-hooks that handles new DB graphs but
   doesn't handle updating DB graphs well yet e.g. doesn't handle :block/tx-id"
  [conn tx-report]
  (when (not (get-in tx-report [:tx-meta :pipeline-replace?]))
    ;; TODO: Handle block edits with separate :block/refs rebuild as deleting property values is buggy
    (outliner-pipeline/transact-new-db-graph-refs conn tx-report)))

(defn ^:api add-listener
  "Adds a listener to the datascript connection to add additional changes from outliner.pipeline"
  [conn]
  (d/listen! conn :pipeline-updates (fn pipeline-updates [tx-report]
                                      (invoke-hooks conn tx-report))))
