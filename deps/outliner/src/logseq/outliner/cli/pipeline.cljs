(ns ^:node-only logseq.outliner.cli.pipeline
  "This ns provides a datascript listener for DB graphs to add additional changes
   that the frontend also adds per transact.
   Known limitations:
   * Deleted blocks don't update effected :block/tx-id"
  (:require [datascript.core :as d]
            [logseq.outliner.datascript-report :as ds-report]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(defn- invoke-hooks
  "Modified copy of frontend.modules.outliner.pipeline/invoke-hooks that doesn't
  handle :block/tx-id"
  [conn tx-report]
  (when (not (get-in tx-report [:tx-meta :replace?]))
    (let [{:keys [blocks]} (ds-report/get-blocks-and-pages tx-report)
          block-path-refs-tx (outliner-pipeline/compute-block-path-refs-tx tx-report blocks)]
      (d/transact! conn block-path-refs-tx {:replace? true}))))

(defn add-listener
  "Adds a listener to the datascript connection to add additional changes from outliner.pipeline"
  [conn]
  (d/listen! conn :pipeline-updates (fn pipeline-updates [tx-report]
                                      (invoke-hooks conn tx-report))))
