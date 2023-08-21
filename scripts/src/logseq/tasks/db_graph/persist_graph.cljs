(ns logseq.tasks.db-graph.persist-graph
  "This ns allows DB graphs to persist datascript changes to their respective
  sqlite db. Since changes are persisted, this can be used to create or update graphs.
   Known limitations:
   * Changes to block references don't update :block/path-refs"
  (:require [datascript.core :as d]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.sqlite.util :as sqlite-util]
            [cljs-bean.core :as bean]
            ;; TODO: Move these namespaces to more stable deps/ namespaces
            [frontend.modules.datascript-report.core :as ds-report]
            [frontend.modules.outliner.pipeline-util :as pipeline-util]))

(defn- invoke-hooks
  "Modified copy frontend.modules.outliner.pipeline/invoke-hooks that doesn't
  handle :block/path-refs recalculation"
  [{:keys [db-after] :as tx-report}]
  (let [{:keys [blocks]} (ds-report/get-blocks-and-pages tx-report)
        deleted-block-uuids (set (pipeline-util/filter-deleted-blocks (:tx-data tx-report)))
        upsert-blocks (pipeline-util/build-upsert-blocks blocks deleted-block-uuids db-after)]
    {:blocks upsert-blocks
     :deleted-block-uuids deleted-block-uuids}))

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
                                       (update-sqlite-db db-name (invoke-hooks tx-report)))))
