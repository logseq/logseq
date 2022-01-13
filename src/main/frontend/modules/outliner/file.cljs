(ns frontend.modules.outliner.file
  (:require [clojure.core.async :as async]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.handler.notification :as notification]
            [frontend.modules.file.core :as file]
            [frontend.modules.outliner.tree :as tree]
            [frontend.util :as util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]))

(def write-chan (async/chan))

(def batch-write-interval 1000)

;; FIXME name conflicts between multiple graphs
(defn do-write-file!
  [page-db-id]
  (let [page-block (db/pull page-db-id)
        page-db-id (:db/id page-block)
        blocks (model/get-blocks-by-page page-db-id)]
    (when-not (and (= 1 (count blocks))
                   (string/blank? (:block/content (first blocks)))
                   (nil? (:block/file page-block)))
      (let [tree (tree/blocks->vec-tree blocks (:block/name page-block))]
        (if page-block
          (file/save-tree page-block tree)
          (js/console.error (str "can't find page id: " page-db-id)))))))

(defn write-files!
  [page-db-ids]
  (when (seq page-db-ids)
    (when-not config/publishing?
      (doseq [page-db-id (set page-db-ids)]
        (try (do-write-file! page-db-id)
             (catch js/Error e
               (notification/show!
                [:div
                 [:p "Write file failed, please copy the changes to other editors in case of losing data."]
                 "Error: " (str (gobj/get e "stack"))]
                :error)
               (log/error :file/write-file-error {:error e})))))))

(defn sync-to-file
  [{page-db-id :db/id}]
  (if (nil? page-db-id)
    (notification/show!
     "Write file failed, can't find the current page!"
     :error)
    (async/put! write-chan page-db-id)))

(util/batch write-chan
            batch-write-interval
            write-files!)
