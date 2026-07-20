(ns frontend.worker.handler.query
  "Query operations for the db worker."
  (:require [cljs.reader]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.query-dsl :as query-dsl]
            [frontend.worker.state :as worker-state]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.frontend.datalog :as datalog-util]
            [logseq.db.frontend.inputs :as db-inputs]
            [logseq.db.frontend.rules :as rules]))

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

(defn task-spent-time
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

(defn- fail!
  [message data]
  (throw (ex-info message data)))

(defn- resolve-page-ref-equality
  [query]
  (let [page-ref? #(and (string? %) (page-ref/page-ref? %))]
    (walk/postwalk
     (fn [form]
       (if (and (list? form)
                (= (first form) '=)
                (= 3 (count form))
                (some page-ref? (rest form)))
         (let [[left right] (rest form)
               [page-reference symbol] (if (page-ref? left)
                                         [left right]
                                         [right left])]
           (list 'contains?
                 symbol
                 (page-ref/get-page-name
                  (string/lower-case page-reference))))
         form))
     query)))

(defn- query-current-page-title
  [db {:keys [current-page current-page-title current-block-uuid]}]
  (or current-page-title
      (some-> (and current-block-uuid
                   (d/entity db [:block/uuid current-block-uuid]))
              :block/page
              :block/title)
      (some-> (and current-page (ldb/get-page db current-page))
              :block/title)))

(defn- resolve-custom-query-input
  [db input {:keys [current-block-uuid today-day require-today-day?]
             :as context}]
  (let [resolved-input (query-input-value input)
        current-page-title (query-current-page-title db context)]
    (case resolved-input
      :today
      (when (and require-today-day? (nil? today-day))
        (fail! "Query today input requires :today-day" {}))

      :current-page
      (when-not current-page-title
        (fail! "Query current-page input requires a current page" {}))

      (:query-page :current-block :parent-block)
      (when-not current-block-uuid
        (fail! "Query block input requires :current-block-uuid"
               {:input resolved-input}))

      nil)
    (if (and (= :today resolved-input) (some? today-day))
      today-day
      (db-inputs/resolve-input
       db resolved-input
       {:current-block-uuid current-block-uuid
        :current-page-fn (constantly current-page-title)}))))

(defn- add-query-rules
  [{:keys [query] user-rules :rules :as query-m}]
  (let [{:keys [where in]} (datalog-util/query-vec->map query)
        rules-found (datalog-util/find-rules-in-where
                     where (set (keys rules/db-query-dsl-rules)))
        built-in-rules (rules/extract-rules
                        rules/db-query-dsl-rules
                        rules-found
                        {:deps rules/rules-dependencies})
        rules-input (vec (distinct (concat (or user-rules []) built-in-rules)))
        rules-required? (or (seq rules-input) (some #{'%} in))
        query-with-rules (if (and rules-required? (not (some #{'%} in)))
                           (if (contains? (set query) :in)
                             (datalog-util/add-to-end-of-query-section query :in ['%])
                             (into query [:in '$ '%]))
                           query)]
    (assoc query-m
           :query query-with-rules
           :rules-input (when rules-required? rules-input)
           :rules-required? (boolean rules-required?))))

(defn execute-custom-query
  [db query-m context]
  (when-not (and (map? query-m)
                 (vector? (:query query-m))
                 (= :find (first (:query query-m)))
                 (or (not (contains? query-m :inputs))
                     (vector? (:inputs query-m)))
                 (or (not (contains? query-m :rules))
                     (vector? (:rules query-m))))
    (fail! "Invalid custom query" {:query query-m}))
  (let [{query-form :query
         inputs :inputs
         rules-input :rules-input
         rules-required? :rules-required?} (add-query-rules query-m)
        resolved-query (resolve-page-ref-equality query-form)
        resolved-inputs (mapv #(resolve-custom-query-input db % context) inputs)
        query-args (cond-> resolved-inputs
                     rules-required? (conj rules-input))]
    (apply d/q resolved-query db query-args)))

(defn- require-query-context!
  [context]
  (when-not (and (map? context)
                 (every? #{:current-page :current-page-title} (keys context))
                 (or (not (contains? context :current-page))
                     (uuid? (:current-page context))
                     (and (string? (:current-page context))
                          (not (string/blank? (:current-page context)))))
                 (or (not (contains? context :current-page-title))
                     (and (string? (:current-page-title context))
                          (not (string/blank? (:current-page-title context))))))
    (fail! "Invalid custom query context" {:context context}))
  context)

(def-thread-api :thread-api/query-custom
  [repo query-m context]
  (require-query-context! context)
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (execute-custom-query @conn query-m context)
    (fail! "Missing custom query database" {:repo repo})))

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
