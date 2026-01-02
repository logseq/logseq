(ns frontend.db.performance
  "Database performance optimizations"
  (:require [datascript.core :as d]
            [frontend.performance :as perf]
            [frontend.state :as state]
            [logseq.db :as ldb]))

;; Custom serializer for DataScript entities
(extend-protocol perf/MemorySerializable
  datascript.db/DB
  (serialize [db]
    {:type :datascript-db
     :schema (:schema db)
     :datoms (vec (d/datoms db :eavt))})

  (deserialize [data]
    (when (= (:type data) :datascript-db)
      (d/init-db (:datoms data) (:schema data))))

  cljs.core/PersistentArrayMap
  (serialize [m]
    {:type :persistent-map
     :data (into {} m)})

  (deserialize [data]
    (when (= (:type data) :persistent-map)
      (:data data)))

  cljs.core/PersistentVector
  (serialize [v]
    {:type :persistent-vector
     :data (vec v)})

  (deserialize [data]
    (when (= (:type data) :persistent-vector)
      (:data data))))

;; Optimized transaction batching
(defn batch-transact!
  "Batch multiple transactions for better performance"
  [conn tx-data-batch & {:keys [batch-size] :or {batch-size 100}}]
  (let [batches (partition-all batch-size tx-data-batch)]
    (doseq [batch batches]
      (d/transact! conn batch))))

;; Query result caching with memory limits
(defonce query-cache (atom {}))
(def max-cache-entries 1000)

(defn cached-query
  "Execute query with caching, respecting memory limits"
  [db query & args]
  (let [cache-key [query args]
        platform-config (perf/get-platform-config)
        memory-limit (:memory-limit platform-config)]

    (when (> (count @query-cache) max-cache-entries)
      ;; Clear oldest entries when cache is full
      (swap! query-cache #(into {} (take max-cache-entries %))))

    (if-let [cached-result (get @query-cache cache-key)]
      cached-result
      (let [result (apply d/q query db args)]
        (swap! query-cache assoc cache-key result)
        result))))

;; Lazy loading for large datasets
(defn lazy-pull
  "Pull entities with lazy evaluation for large result sets"
  [db pattern eids & {:keys [chunk-size] :or {chunk-size 50}}]
  (let [eid-chunks (partition-all chunk-size eids)]
    (mapcat
     (fn [chunk]
       (map #(d/pull db pattern %) chunk))
     eid-chunks)))

;; Memory-efficient entity streaming
(defn stream-entities
  "Stream entities to avoid loading all into memory at once"
  [db query-pattern]
  (let [results (d/q query-pattern db)]
    (map #(d/entity db (first %)) results)))

;; Optimized index usage
(defn query-with-hints
  "Execute query with performance hints"
  [db query & {:keys [use-avet? use-eavt?] :or {use-avet? false use-eavt? true}}]
  (binding [d/*query-cache-enabled* true]
    (cond-> query
      use-avet? (conj :index/avet)
      use-eavt? (conj :index/eavt))
    (d/q query db)))

;; Connection pooling for multiple databases
(defonce conn-pool (atom {}))

(defn get-pooled-connection
  "Get or create a pooled database connection"
  [repo-path schema]
  (if-let [conn (get @conn-pool repo-path)]
    conn
    (let [conn (d/create-conn schema)]
      (swap! conn-pool assoc repo-path conn)
      conn)))

(defn cleanup-connections!
  "Clean up unused connections to free memory"
  []
  (let [active-repos (set (keys (state/get-repos)))
        pooled-repos (set (keys @conn-pool))]
    (doseq [unused-repo (clojure.set/difference pooled-repos active-repos)]
      (swap! conn-pool dissoc unused-repo))))

;; Automatic memory management
(defn setup-memory-management!
  "Setup automatic memory management routines"
  []
  ;; Periodic cleanup
  (js/setInterval
   (fn []
     (perf/update-memory-stats!)
     (cleanup-connections!)
     ;; Force GC hint on low memory platforms
     (when (mobile-util/native-platform?)
       (when-let [mem-info (.-memory js/performance)]
         (let [used-ratio (/ (.-usedJSHeapSize mem-info)
                            (.-totalJSHeapSize mem-info))]
           (when (> used-ratio 0.8)
             (js/console.log "High memory usage detected, triggering cleanup")
             ;; Clear caches
             (reset! query-cache {}))))))
   30000)) ; Every 30 seconds