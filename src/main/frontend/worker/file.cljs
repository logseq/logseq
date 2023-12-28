(ns frontend.worker.file
  "Save pages to files for file-based graphs"
  (:require [clojure.core.async :as async]
            [clojure.string :as string]
            [frontend.worker.file.core :as file]
            [logseq.outliner.tree :as otree]
            [lambdaisland.glogi :as log]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [frontend.worker.util :as worker-util]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [malli.core :as m]
            [frontend.worker.state :as state]
            [goog.object :as gobj]))

(defonce file-writes-chan
  (let [coercer (m/coercer [:catn
                            [:repo :string]
                            [:page-id :any]
                            [:outliner-op :any]
                            [:epoch :int]])]
    (async/chan 10000 (map coercer))))

(def batch-write-interval 1000)

(def *writes-finished? (atom {}))

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
  (let [page-block (d/pull @conn '[*] page-db-id)
        page-db-id (:db/id page-block)
        whiteboard? (contains? (:block/type page-block) "whiteboard")
        blocks-count (ldb/get-page-blocks-count @conn page-db-id)
        blocks-just-deleted? (and (zero? blocks-count)
                                  (contains? #{:delete-blocks :move-blocks} outliner-op))]
    (when (or (>= blocks-count 1) blocks-just-deleted?)
      (if (and (or (> blocks-count 500) whiteboard?)
               (not (state/tx-idle? repo {:diff 3000})))
        (async/put! file-writes-chan [repo page-db-id outliner-op (tc/to-long (t/now))])
        (let [pull-keys (if whiteboard? whiteboard-blocks-pull-keys-with-persisted-ids '[*])
              blocks (ldb/get-page-blocks @conn (:block/name page-block) {:pull-keys pull-keys})
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
             (worker-util/post-message :notification
                                       (pr-str
                                        [[:div
                                          [:p "Write file failed, please copy the changes to other editors in case of losing data."]
                                          "Error: " (str (gobj/get e "stack"))]
                                         :error]))
             (log/error :file/write-file-error {:error e}))))))

(defn sync-to-file
  [repo page-id tx-meta]
  (when (and repo page-id
             (not (:created-from-journal-template? tx-meta))
             (not (:delete-files? tx-meta)))
    (async/put! file-writes-chan [repo page-id (:outliner-op tx-meta) (tc/to-long (t/now))])))

(defn <ratelimit-file-writes!
  []
  (worker-util/<ratelimit file-writes-chan batch-write-interval
                          :filter-fn
                          (fn [[_repo _ _ time]]
                            (reset! *writes-finished? {:time time
                                                       :value false})
                            true)
                          :flush-fn
                          (fn [col]
                            (when (seq col)
                              (let [start-time (tc/to-long (t/now))
                                    repo (ffirst col)
                                    conn (state/get-datascript-conn repo)]
                                (if conn
                                  (do
                                    (write-files! conn col (state/get-context))
                                    (let [last-write-time (:time @*writes-finished?)]
                                      (when (> start-time last-write-time)
                                        (reset! *writes-finished? {:value true}))))
                                  (js/console.error (str "DB is not found for ") repo)))))))
