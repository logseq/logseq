(ns frontend.modules.outliner.file
  (:require [frontend.state :as state]
            [frontend.db.model :as model]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.file.core :as file]
            [frontend.debug :as debug]
            [frontend.db.utils :as db-utils]))

(defn sync-to-file
  [updated-block]
  {:pre [(tree/satisfied-inode? updated-block)]}
  (let [page-db-id (-> updated-block :data :block/page :db/id)
        page-block (db-utils/pull page-db-id)
        blocks (model/get-blocks-by-page page-db-id)
        tree (tree/blocks->vec-tree blocks (:block/name page-block))]
    (file/save-tree page-block tree)))
