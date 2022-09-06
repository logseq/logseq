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

(def batch-write-interval 1000)

(defn do-write-file!
  [repo page-db-id]
  (let [page-block (db/pull repo '[*] page-db-id)
        page-db-id (:db/id page-block)
        blocks-count (model/get-page-blocks-count repo page-db-id)]
    (if (and (> blocks-count 500)
             (not (state/input-idle? repo :diff 3000))) ; long page
      (async/put! (state/get-file-write-chan) [repo page-db-id])
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
      (if (:graph/importing @state/state) ; write immediately
        (write-files! [[repo page-db-id]])
        (async/put! (state/get-file-write-chan) [repo page-db-id])))))

(def *writes-finished? (atom true))

(defn <ratelimit-file-writes!
  []
  (util/<ratelimit (state/get-file-write-chan) batch-write-interval
                 :filter-fn
                 #(do (reset! *writes-finished? false) true)
                 :flush-fn
                 #(do
                    (write-files! %)
                    (reset! *writes-finished? true))))
