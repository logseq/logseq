(ns frontend.modules.outliner.file
  (:require [frontend.db.model :as model]
            [frontend.db :as db]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.file.core :as file]
            [lambdaisland.glogi :as log]
            [clojure.core.async :as async]
            [frontend.util :as util]))

(def write-chan (async/chan))

(def batch-write-interval 2000)

;; FIXME name conflicts between multiple graphs
(defn do-write-file!
  [page-db-id]
  (let [page-block (db/pull page-db-id)
        page-db-id (:db/id page-block)
        blocks (model/get-blocks-by-page page-db-id)
        tree (tree/blocks->vec-tree blocks (:block/name page-block))]
    (file/save-tree page-block tree)))

(defn write-files!
  [pages]
  (doseq [page pages]
    (try (do-write-file! page)
         (catch js/Error e
           (log/error :file/write-file-error {:error e})))))

(defn sync-to-file
  [{page-db-id :db/id :as page-block}]
  (async/put! write-chan page-db-id))

(util/batch write-chan batch-write-interval write-files!)

(defn batch [in max-time handler]
  (async/go-loop [buf [] t (async/timeout max-time)]
    (let [[v p] (async/alts! [in t])]
      (cond
        (= p t)
        (do
          (handler buf)
          (recur [] (async/timeout max-time)))

        (nil? v)                        ; stop
        (when (seq buf)
          (handler buf))

        :else
        (recur (conj buf v) t)))))
