(ns ^:node-only logseq.outliner.cli.persist-graph
  "This ns allows DB graphs to persist datascript changes to their respective
  sqlite db. Since changes are persisted, this can be used to create or update graphs.
   Known limitations:
   * Deleted blocks don't update effected :block/tx-id"
  (:require [datascript.core :as d]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.sqlite.util :as sqlite-util]
            [cljs-bean.core :as bean]
            [logseq.outliner.datascript-report :as ds-report]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(defn- invoke-hooks
  "Modified copy of frontend.modules.outliner.pipeline/invoke-hooks that doesn't
  handle :block/tx-id"
  [conn {:keys [db-after] :as tx-report}]
  (when (not (get-in tx-report [:tx-meta :replace?]))
    (let [{:keys [blocks]} (ds-report/get-blocks-and-pages tx-report)
          block-path-refs-tx (outliner-pipeline/compute-block-path-refs-tx tx-report blocks)
          db-after' (if (seq block-path-refs-tx)
                      (:db-after (d/transact! conn block-path-refs-tx {:replace? true}))
                      db-after)
          deleted-block-uuids (set (outliner-pipeline/filter-deleted-blocks (:tx-data tx-report)))
          upsert-blocks (outliner-pipeline/build-upsert-blocks blocks deleted-block-uuids db-after')]
      {:blocks upsert-blocks
       :deleted-block-uuids deleted-block-uuids})))

(defn- update-sqlite-db
  "Modified copy of :db-transact-data defmethod in electron.handler"
  [db-name {:keys [blocks deleted-block-uuids]}]
  (when (seq deleted-block-uuids)
    (sqlite-db/delete-blocks! db-name deleted-block-uuids))
  (when (seq blocks)
    (let [blocks' (mapv sqlite-util/ds->sqlite-block blocks)]
      (sqlite-db/upsert-blocks! db-name (bean/->js blocks')))))

(defn add-listener
  "Adds a listener to the datascript connection to persist changes to the given
  sqlite db name"
  [conn db-name]
  (d/listen! conn :persist-to-sqlite (fn persist-to-sqlite [tx-report]
                                       (update-sqlite-db db-name (invoke-hooks conn tx-report)))))
