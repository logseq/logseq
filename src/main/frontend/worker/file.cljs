(ns frontend.worker.file
  "Save pages to files for file-based graphs"
  (:require [clojure.core.async :as async]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.common.file.core :as common-file]
            [logseq.outliner.tree :as otree]
            [lambdaisland.glogi :as log]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [frontend.worker.util :as worker-util]
            [frontend.common.async-util :as async-util]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [malli.core :as m]
            [frontend.worker.state :as worker-state]
            [goog.object :as gobj]
            [logseq.common.util :as common-util]))

(def *writes common-file/*writes)
(def dissoc-request! common-file/dissoc-request!)
(def conj-page-write! common-file/conj-page-write!)

(defonce file-writes-chan
  (let [coercer (m/coercer [:catn
                            [:repo :string]
                            [:page-id :any]
                            [:outliner-op :any]
                            [:epoch :int]
                            [:request-id :int]])]
    (async/chan 10000 (map coercer))))

(def batch-write-interval 1000)

(def whiteboard-blocks-pull-keys-with-persisted-ids
  '[:block/properties
    :block/uuid
    :block/order
    :block/title
    :block/format
    :block/created-at
    :block/updated-at
    :block/collapsed?
    {:block/page      [:block/uuid]}
    {:block/parent    [:block/uuid]}])

(defn- cleanup-whiteboard-block
  [block]
  (if (get-in block [:block/properties :ls-type] false)
    (dissoc block
            :db/id
            :block/uuid ;; shape block uuid is read from properties
            :block/collapsed?
            :block/title
            :block/format
            :block/order
            :block/page
            :block/parent) ;; these are auto-generated for whiteboard shapes
    (dissoc block :db/id :block/page)))

(defn do-write-file!
  [repo conn page-db-id outliner-op context request-id]
  (let [page-block (d/pull @conn '[*] page-db-id)
        page-db-id (:db/id page-block)
        whiteboard? (ldb/whiteboard? page-block)
        blocks-count (ldb/get-page-blocks-count @conn page-db-id)
        blocks-just-deleted? (and (zero? blocks-count)
                                  (contains? #{:delete-blocks :move-blocks} outliner-op))]
    (if (or (>= blocks-count 1) blocks-just-deleted?)
      (if (and (or (> blocks-count 500) whiteboard?)
               (not (worker-state/tx-idle? repo {:diff 3000})))
        (async/put! file-writes-chan [repo page-db-id outliner-op (tc/to-long (t/now)) request-id])
        (let [pull-keys (if whiteboard? whiteboard-blocks-pull-keys-with-persisted-ids '[*])
              blocks (ldb/get-page-blocks @conn (:db/id page-block) {:pull-keys pull-keys})
              blocks (if whiteboard? (map cleanup-whiteboard-block blocks) blocks)]
          (if (and (= 1 (count blocks))
                   (string/blank? (:block/title (first blocks)))
                   (nil? (:block/file page-block))
                   (not whiteboard?))
            (dissoc-request! request-id)
            (let [tree-or-blocks (if whiteboard? blocks
                                     (otree/blocks->vec-tree repo @conn blocks (:db/id page-block)))]
              (if page-block
                (common-file/save-tree! repo conn page-block tree-or-blocks blocks-just-deleted? context request-id)
                (do
                  (js/console.error (str "can't find page id: " page-db-id))
                  (dissoc-request! request-id)))))))
      (dissoc-request! request-id))))

(defn write-files!
  [conn pages context]
  (when (seq pages)
    (let [all-request-ids (set (map last pages))
          distincted-pages (common-util/distinct-by #(take 3 %) pages)
          repeated-ids (set/difference all-request-ids (set (map last distincted-pages)))]
      (doseq [id repeated-ids]
        (dissoc-request! id))

      (doseq [[repo page-id outliner-op _time request-id] distincted-pages]
        (try (do-write-file! repo conn page-id outliner-op context request-id)
             (catch :default e
               (worker-util/post-message :notification
                                         [[:div
                                           [:p "Write file failed, please copy the changes to other editors in case of losing data."]
                                           "Error: " (str (gobj/get e "stack"))]
                                          :error])
               (log/error :file/write-file-error {:error e})
               (dissoc-request! request-id)))))))

(defn sync-to-file
  [repo page-id tx-meta]
  (when (and page-id
             (not (:created-from-journal-template? tx-meta))
             (not (:delete-files? tx-meta)))
    (let [request-id (conj-page-write! page-id)]
      (async/put! file-writes-chan [repo page-id (:outliner-op tx-meta) (tc/to-long (t/now)) request-id]))))

(defn <ratelimit-file-writes!
  []
  (async-util/<ratelimit file-writes-chan batch-write-interval
                          :filter-fn (fn [_] true)
                          :flush-fn
                          (fn [col]
                            (when (seq col)
                              (let [repo (ffirst col)
                                    conn (worker-state/get-datascript-conn repo)]
                                (if conn
                                  (when-not (ldb/db-based-graph? @conn)
                                    (write-files! conn col (worker-state/get-context)))
                                  (js/console.error (str "DB is not found for ") repo)))))))
