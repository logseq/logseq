(ns frontend.modules.outliner.file
  (:require [frontend.db.model :as model]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.file.core :as file]))

(defn sync-to-file
  [{page-db-id :db/id :as page-block}]
  (let [blocks (model/get-blocks-by-page page-db-id)
        tree (tree/blocks->vec-tree blocks (:block/name page-block))]
    (file/save-tree page-block tree)))
