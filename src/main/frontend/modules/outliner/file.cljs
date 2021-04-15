(ns frontend.modules.outliner.file
  (:require [frontend.db.model :as model]
            [frontend.db :as db]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.file.core :as file]
            [clojure.core.async :as async]
            [lambdaisland.glogi :as log]))

(def write-chan (async/chan))

(defn do-write-file
  [page-db-id]
  (let [page-block (db/pull page-db-id)
        page-db-id (:db/id page-block)
        blocks (model/get-blocks-by-page page-db-id)
        tree (tree/blocks->vec-tree blocks (:block/name page-block))]
    (file/save-tree page-block tree)))

(def batch-write-interval 1000)

(defn poll-and-write
  []
  (loop [page-db-ids []]
    (let [i (async/poll! write-chan)]
      (if (some? i)
        (recur (conj page-db-ids i))
        (do (when (seq page-db-ids)
              (doseq [i (set page-db-ids)]
                (try (do-write-file i)
                     (catch js/Error e
                       (log/error :file/write-file-error {:error e})))))
            (js/setTimeout poll-and-write batch-write-interval))))))

(poll-and-write)

(defn sync-to-file
  [{page-db-id :db/id :as page-block}]
  (async/put! write-chan page-db-id))
