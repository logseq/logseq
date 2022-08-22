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
            [lambdaisland.glogi :as log]
            [frontend.state :as state]))

(defonce write-chan (async/chan 100))
(defonce write-chan-batch-buf (atom []))

(def batch-write-interval 1000)

(defn writes-finished?
  []
  (empty? @write-chan-batch-buf))

(defn do-write-file!
  [repo page-db-id]
  (let [page-block (db/pull repo '[*] page-db-id)
        page-db-id (:db/id page-block)
        blocks-count (model/get-page-blocks-count repo page-db-id)]
    (if (and (> blocks-count 500)
             (not (state/input-idle? repo :diff 3000)))           ; long page
      (async/put! write-chan [repo page-db-id])
      (let [blocks (model/get-page-blocks-no-cache repo (:block/name page-block))]
        (when-not (and (= 1 (count blocks))
                       (string/blank? (:block/content (first blocks)))
                       (nil? (:block/file page-block)))
          (let [tree (tree/blocks->vec-tree repo blocks (:block/name page-block))]
            (if page-block
              (file/save-tree page-block tree)
              (js/console.error (str "can't find page id: " page-db-id)))))))))

(defn write-files!
  [pages]
  (when (seq pages)
    (when-not config/publishing?
      (doseq [[repo page-id] (set pages)]
        (try (do-write-file! repo page-id)
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
    (when-let [repo (state/get-current-repo)]
      (async/put! write-chan [repo page-db-id]))))

(util/batch write-chan
            batch-write-interval
            write-files!
            write-chan-batch-buf)
