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
            [frontend.state :as state]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]))

(def batch-write-interval 1000)

(def whiteboard-blocks-pull-keys-with-persisted-ids
  '[:block/properties
    :block/uuid
    :block/content
    :block/format
    :block/created-at
    :block/updated-at
    :block/collapsed?
    {:block/page      [:block/uuid]}
    {:block/left      [:block/uuid]}
    {:block/parent    [:block/uuid]}])

(defn- cleanup-whiteboard-block
  [block]
  (if (get-in block [:block/properties :ls-type] false)
    (dissoc block
            :db/id
            :block/uuid ;; shape block uuid is read from properties
            :block/collapsed?
            :block/content
            :block/format
            :block/left
            :block/page
            :block/parent) ;; these are auto-generated for whiteboard shapes
    (dissoc block :db/id :block/page)))


(defn do-write-file!
  [repo page-db-id outliner-op]
  (let [page-block (db/pull repo '[*] page-db-id)
        page-db-id (:db/id page-block)
        whiteboard? (= "whiteboard" (:block/type page-block))
        blocks-count (model/get-page-blocks-count repo page-db-id)
        blocks-just-deleted? (and (zero? blocks-count)
                                  (contains? #{:delete-blocks :move-blocks} outliner-op))]
    (when (or (>= blocks-count 1) blocks-just-deleted?)
      (if (or (and (> blocks-count 500)
                   (not (state/input-idle? repo {:diff 3000}))) ;; long page
              ;; when this whiteboard page is just being updated
              (and whiteboard? (not (state/whiteboard-page-idle? repo page-block))))
        (async/put! (state/get-file-write-chan) [repo page-db-id outliner-op])
        (let [pull-keys (if whiteboard? whiteboard-blocks-pull-keys-with-persisted-ids '[*])
              blocks (model/get-page-blocks-no-cache repo (:block/name page-block) {:pull-keys pull-keys})
              blocks (if whiteboard? (map cleanup-whiteboard-block blocks) blocks)]
          (when-not (and (= 1 (count blocks))
                         (string/blank? (:block/content (first blocks)))
                         (nil? (:block/file page-block)))
            (let [tree-or-blocks (if whiteboard? blocks
                                     (tree/blocks->vec-tree repo blocks (:block/name page-block)))]
              (if page-block
                (file/save-tree! page-block tree-or-blocks blocks-just-deleted?)
                (js/console.error (str "can't find page id: " page-db-id))))))))))

(defn write-files!
  [pages]
  (when (seq pages)
    (when-not config/publishing?
      (doseq [[repo page-id outliner-op] (set pages)]
        (try (do-write-file! repo page-id outliner-op)
             (catch :default e
               (notification/show!
                [:div
                 [:p "Write file failed, please copy the changes to other editors in case of losing data."]
                 "Error: " (str (gobj/get e "stack"))]
                :error)
               (log/error :file/write-file-error {:error e})))))))

(defn sync-to-file
  ([page]
   (sync-to-file page nil))
  ([{page-db-id :db/id} outliner-op]
   (if (nil? page-db-id)
     (notification/show!
      "Write file failed, can't find the current page!"
      :error)
     (when-let [repo (state/get-current-repo)]
       (if (:graph/importing @state/state) ; write immediately
         (write-files! [[repo page-db-id outliner-op]])
         (async/put! (state/get-file-write-chan) [repo page-db-id outliner-op (tc/to-long (t/now))]))))))

(def *writes-finished? (atom {}))

(defn <ratelimit-file-writes!
  []
  (util/<ratelimit (state/get-file-write-chan) batch-write-interval
                 :filter-fn
                 (fn [[repo _ time]]
                   (swap! *writes-finished? assoc repo {:time time
                                                        :value false})
                   true)
                 :flush-fn
                 (fn [col]
                   (let [start-time (tc/to-long (t/now))
                         repos (distinct (map first col))]
                     (write-files! col)
                     (doseq [repo repos]
                       (let [last-write-time (get-in @*writes-finished? [repo :time])]
                         (when (> start-time last-write-time)
                           (swap! *writes-finished? assoc repo {:value true}))))))))
