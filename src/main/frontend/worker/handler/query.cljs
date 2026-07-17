(ns frontend.worker.handler.query
  "Query operations for the db worker."
  (:require [cljs.reader]
            [datascript.core :as d]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.query-dsl :as query-dsl]
            [frontend.worker.state :as worker-state]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.frontend.inputs :as db-inputs]))

(def-thread-api :thread-api/q
  [repo inputs]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (apply d/q (first inputs) @conn (rest inputs))))

(def-thread-api :thread-api/query-dsl-query
  [repo query-string opts]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (query-dsl/execute-query query-string @conn opts)))

(def-thread-api :thread-api/query-dsl-custom-query
  [repo query-m opts]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (query-dsl/execute-custom-query query-m @conn opts)))

(def-thread-api :thread-api/datoms
  [repo & args]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [result (apply d/datoms @conn args)]
      (map (fn [datom] [(:e datom) (:a datom) (:v datom) (:tx datom) (:added datom)]) result))))

(def-thread-api :thread-api/pull
  [repo selector id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [eid (if (and (vector? id) (= :block/name (first id)))
                (:db/id (ldb/get-page @conn (second id)))
                id)]
      (some->> eid
               (d/pull @conn selector)
               (common-initial-data/with-parent @conn)))))

(defn- block-status-history
  [db block-id]
  (->> (d/q '[:find ?history ?created-at ?status
              :in $ ?block-id
              :where
              [?history :logseq.property.history/block ?block-id]
              [?history :logseq.property.history/property :logseq.property/status]
              [?history :logseq.property.history/ref-value ?status]
              [?history :block/created-at ?created-at]]
            db
            block-id)
       (map (fn [[history-id created-at status-id]]
              (let [status (d/entity db status-id)]
                {:db/id history-id
                 :block/created-at created-at
                 :logseq.property.history/property-ident :logseq.property/status
                 :logseq.property.history/ref-value-ident (:db/ident status)
                 :logseq.property.history/ref-value-title (:block/title status)})))
       (sort-by :block/created-at)))

(defn- task-spent-time
  [db block-id now-ms]
  (let [status-history (block-status-history db block-id)]
    (when (seq status-history)
      (let [time (loop [[last-item item & others] status-history
                        time 0]
                   (if item
                     (let [last-status (:logseq.property.history/ref-value-ident last-item)
                           this-status (:logseq.property.history/ref-value-ident item)]
                       (if (and (= this-status :logseq.property/status.doing)
                                (empty? others))
                         (-> (+ time (- now-ms (:block/created-at item)))
                             (quot 1000))
                         (let [time' (if (or
                                          (= last-status :logseq.property/status.doing)
                                          (and
                                           (not (contains? #{:logseq.property/status.canceled
                                                             :logseq.property/status.backlog
                                                             :logseq.property/status.done} last-status))
                                           (= this-status :logseq.property/status.done)))
                                       (+ time (- (:block/created-at item) (:block/created-at last-item)))
                                       time)]
                           (recur (cons item others) time'))))
                     (quot time 1000)))]
        [(vec status-history) time]))))

(def-thread-api :thread-api/task-spent-time
  [repo block-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (task-spent-time @conn block-id (common-util/time-ms))))

(defn- query-input-value
  [input]
  (if (and (string? input)
           (not (page-ref/page-ref? input)))
    (try
      (let [value (cljs.reader/read-string input)]
        (if (symbol? value)
          input
          value))
      (catch :default _
        input))
    input))

(def-thread-api :thread-api/resolve-query-inputs
  [repo inputs {:keys [current-page current-page-title today-title]}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [current-page-title (or current-page-title
                                 (some-> (when current-page
                                           (ldb/get-page @conn current-page))
                                         :block/title))]
      (mapv (fn [input]
              (db-inputs/resolve-input @conn
                                       (query-input-value input)
                                       {:current-page-fn (fn []
                                                           (or current-page-title
                                                               today-title))}))
            inputs))))
