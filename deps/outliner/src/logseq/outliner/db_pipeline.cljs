(ns logseq.outliner.db-pipeline
  "This ns provides a datascript listener for DB graphs that is useful for CLIs
  and testing (since it doesn't assume a frontend worker exists). The listener adds
  additional changes that the frontend also adds per transact.  Missing features
  from frontend.worker.pipeline including:
   * Deleted blocks don't update effected :block/tx-id
   * Delete empty property parent"
  (:require [datascript.core :as d]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(defn skip-imported-graph-refs?
  "File-graph import rebuilds :block/refs once after export-file-graph.
  Skip the per-transact listener for those txs, matching worker pipeline
  which does not run when ::new-graph? is set."
  [conn tx-meta]
  (or (:transact-new-graph-refs? tx-meta)
      (:skip-store? @conn)
      (:logseq.graph-parser.exporter/new-graph? tx-meta)
      (:logseq.graph-parser.exporter/imported-data? tx-meta)
      (:logseq.db.sqlite.export/imported-data? tx-meta)))

(defn- invoke-hooks
  "Modified copy of frontend.worker.pipeline/invoke-hooks that handles new DB graphs but
   doesn't handle updating DB graphs well yet e.g. doesn't handle :block/tx-id"
  [conn tx-report]
  (when-not (skip-imported-graph-refs? conn (:tx-meta tx-report))
    ;; TODO: Handle block edits with separate :block/refs rebuild as deleting property values is buggy
    (outliner-pipeline/transact-new-db-graph-refs conn tx-report)))

(defn ^:api add-listener
  "Adds a listener to the datascript connection to add additional changes from outliner.pipeline"
  [conn]
  (d/listen! conn :pipeline-updates (fn pipeline-updates [tx-report]
                                      (invoke-hooks conn tx-report))))
