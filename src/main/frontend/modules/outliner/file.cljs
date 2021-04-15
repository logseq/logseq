(ns frontend.modules.outliner.file
  (:require [frontend.db.model :as model]
            [frontend.db :as db]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.file.core :as file]
            [lambdaisland.glogi :as log]
            [clojure.core.async :as async]
            [frontend.util :as util]
            [frontend.handler.notification :as notification]
            [goog.object :as gobj]))

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
           (notification/show!
            "Write file failed, please copy the changes to other editors in case of losing data."
            [:div "Error: " (str (gobj/get e "stack"))]
            :error)
           (log/error :file/write-file-error {:error e})))))

(defn sync-to-file
  [{page-db-id :db/id :as page-block}]
  (async/put! write-chan page-db-id))

(util/batch write-chan batch-write-interval write-files!)
