(ns ^:node-only logseq.outliner.cli.persist-graph
  "This ns allows DB graphs to persist datascript changes to their respective
  sqlite db. Since changes are persisted, this can be used to create or update graphs.
   Known limitations:
   * Deleted blocks don't update effected :block/tx-id"
  (:require [datascript.core :as d]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.outliner.datascript-report :as ds-report]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(defn- invoke-hooks
  "Modified copy of frontend.modules.outliner.pipeline/invoke-hooks that doesn't
  handle :block/tx-id"
  [conn tx-report]
  (when (not (get-in tx-report [:tx-meta :replace?]))
    (let [{:keys [blocks]} (ds-report/get-blocks-and-pages tx-report)
          block-path-refs-tx (outliner-pipeline/compute-block-path-refs-tx tx-report blocks)]
      (d/transact! conn block-path-refs-tx {:replace? true})
      ;; frontend also passes original tx-report
      tx-report)))

(defn- update-sqlite-db
  "Same as :db-transact-data defmethod in electron.handler"
  [db-name tx-report]
  (sqlite-db/transact! db-name (:tx-data tx-report) (:tx-meta tx-report)))

(defn add-listener
  "Adds a listener to the datascript connection to persist changes to the given
  sqlite db name"
  [conn db-name]
  (d/listen! conn :persist-to-sqlite (fn persist-to-sqlite [tx-report]
                                       (update-sqlite-db db-name (invoke-hooks conn tx-report)))))
