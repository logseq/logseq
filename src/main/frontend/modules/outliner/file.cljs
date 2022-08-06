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

(def whiteboard-blocks-pull-keys-with-persisted-ids
  '[:block/properties
    :block/uuid
    :block/content
    :block/format
    {:block/page      [:block/name :block/uuid]}
    {:block/left      [:block/name :block/uuid]}
    {:block/parent    [:block/name :block/uuid]}])

(defn- cleanup-whiteboard-block
  [block]
  (if (get-in block [:block/properties :ls-type] false)
    (dissoc block
            :block/uuid ;; shape block uuid is read from properties
            :block/content
            :block/format
            :block/left
            :block/page
            :block/parent) ;; these are auto-generated for whiteboard shapes
    (dissoc block :block/page)))

(defn do-write-file!
  [repo page-db-id]
  (let [page-block (db/pull repo '[*] page-db-id)
        page-db-id (:db/id page-block)
        whiteboard? (:block/whiteboard? page-block)
        pull-keys (if whiteboard? whiteboard-blocks-pull-keys-with-persisted-ids '[*])
        blocks (model/get-page-blocks-no-cache repo (:block/name page-block) {:pull-keys pull-keys})
        blocks (if whiteboard? (map cleanup-whiteboard-block blocks) blocks)]

    (when-not (and (= 1 (count blocks))
                   (string/blank? (:block/content (first blocks)))
                   (nil? (:block/file page-block)))
      (let [tree (tree/blocks->vec-tree repo blocks (:block/name page-block))]
        (if page-block
          (file/save-tree! page-block (if whiteboard? blocks tree))
          (js/console.error (str "can't find page id: " page-db-id)))))))

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
