(ns frontend.modules.outliner.file
  (:require [frontend.db.model :as model]
            [frontend.db :as db]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.file.core :as file]
            [lambdaisland.glogi :as log]
            [clojure.core.async :as async]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.handler.notification :as notification]
            [goog.object :as gobj]
            [frontend.state :as state]))

(def write-chan (async/chan))

(def batch-write-interval 1000)

;; FIXME name conflicts between multiple graphs
(defn do-write-file!
  [page-db-id]
  (let [page-block (db/pull page-db-id)
        page-db-id (:db/id page-block)
        blocks (model/get-blocks-by-page page-db-id)
        tree (tree/blocks->vec-tree blocks (:block/name page-block))]
    (file/save-tree page-block tree)))

(defn write-files!
  [page-db-ids]
  (doseq [page-db-id (set page-db-ids)]
    (try (do-write-file! page-db-id)
         (catch js/Error e
           (notification/show!
            "Write file failed, please copy the changes to other editors in case of losing data."
            [:div "Error: " (str (gobj/get e "stack"))]
            :error)
           (log/error :file/write-file-error {:error e})))))

(defn sync-to-file
  [{page-db-id :db/id}]
  (async/put! write-chan page-db-id))

(util/batch write-chan
            batch-write-interval
            #(state/input-idle? (state/get-current-repo))
            write-files!)
