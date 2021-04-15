(ns frontend.modules.outliner.file
  (:require [frontend.db.model :as model]
            [frontend.db :as db]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.file.core :as file]
            [clojure.core.async :as async]))

(def write-chan (async/chan))

(defn do-write-file
  [{page-db-id :db/id :as page-block}]
  (let [page-block (if (:block/name page-block)
                     (db/pull page-db-id)
                     (some-> (db/entity page-db-id)
                       :block/page
                       :db/id
                       db/pull))
        blocks (model/get-blocks-by-page page-db-id)
        tree (tree/blocks->vec-tree blocks (:block/name page-block))]
    (file/save-tree page-block tree)))

(defn a
  []
  (loop [page-blocks []]
    (try
      (let [i (async/poll! write-chan)]
        (if (some? i)
          (recur (conj page-blocks i))
          (when (seq page-blocks)
            ))))))

(defn sync-to-file
  [{page-db-id :db/id :as page-block}]
  (async/put! write-chan page-block))
