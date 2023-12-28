(ns frontend.worker.file
  "Save pages to files for file-based graphs"
  (:require [clojure.core.async :as async]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.worker.file.core :as file]
            [logseq.outliner.tree :as otree]
            [frontend.util :as util]
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
  [repo conn page-db-id outliner-op context]
  (let [page-block (db/pull repo '[*] page-db-id)
        page-db-id (:db/id page-block)
        whiteboard? (contains? (:block/type page-block) "whiteboard")
        blocks-count (model/get-page-blocks-count repo page-db-id)
        blocks-just-deleted? (and (zero? blocks-count)
                                  (contains? #{:delete-blocks :move-blocks} outliner-op))]
    (when (or (>= blocks-count 1) blocks-just-deleted?)
      (if (or (and (> blocks-count 500)
                   (not (state/input-idle? repo {:diff 3000}))) ;; long page
              ;; when this whiteboard page is just being updated
              (and whiteboard? (not (state/whiteboard-idle? repo))))
        (async/put! (state/get-file-write-chan) [repo page-db-id outliner-op (tc/to-long (t/now))])
        (let [pull-keys (if whiteboard? whiteboard-blocks-pull-keys-with-persisted-ids '[*])
              blocks (model/get-page-blocks-no-cache repo (:block/name page-block) {:pull-keys pull-keys})
              blocks (if whiteboard? (map cleanup-whiteboard-block blocks) blocks)]
          (when-not (and (= 1 (count blocks))
                         (string/blank? (:block/content (first blocks)))
                         (nil? (:block/file page-block)))
            (let [tree-or-blocks (if whiteboard? blocks
                                     (otree/blocks->vec-tree repo @conn blocks (:block/name page-block)))]
              (if page-block
                (file/save-tree! repo conn page-block tree-or-blocks blocks-just-deleted? context)
                (js/console.error (str "can't find page id: " page-db-id))))))))))

(defn write-files!
  [conn pages context]
  (when (seq pages)
    (doseq [[repo page-id outliner-op] (set (map #(take 3 %) pages))] ; remove time to dedupe pages to write
      (try (do-write-file! repo conn page-id outliner-op context)
           (catch :default e
             ;; FIXME: notification
             ;; (notification/show!
             ;;  [:div
             ;;   [:p "Write file failed, please copy the changes to other editors in case of losing data."]
             ;;   "Error: " (str (gobj/get e "stack"))]
             ;;  :error)
             (log/error :file/write-file-error {:error e}))))))

(defn sync-to-file
  [repo {page-db-id :db/id} outliner-op tx-meta]
  (when (and repo page-db-id
             (not (:created-from-journal-template? tx-meta))
             (not (:delete-files? tx-meta)))
    (async/put! (state/get-file-write-chan) [repo page-db-id outliner-op (tc/to-long (t/now))])))

(def *writes-finished? (atom {}))

(defn <ratelimit-file-writes!
  [conn context]
  (util/<ratelimit (state/get-file-write-chan) batch-write-interval
                   :filter-fn
                   (fn [[repo _ _ time]]
                     (swap! *writes-finished? assoc repo {:time time
                                                          :value false})
                     true)
                   :flush-fn
                   (fn [col]
                     (let [start-time (tc/to-long (t/now))
                           repos (distinct (map first col))]
                       (write-files! conn col context)
                       (doseq [repo repos]
                         (let [last-write-time (get-in @*writes-finished? [repo :time])]
                           (when (> start-time last-write-time)
                             (swap! *writes-finished? assoc repo {:value true}))))))))
