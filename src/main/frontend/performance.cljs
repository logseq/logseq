(ns frontend.performance
  "Performance optimization utilities for Logseq"
  (:require [cljs.core.async :as async]
            [frontend.util :as util]
            [frontend.mobile.util :as mobile-util]
            [frontend.config :as config]))

;; Memory optimizations - Custom serializers
(defprotocol MemorySerializable
  "Protocol for custom serialization to reduce memory usage"
  (serialize [this] "Convert to memory-efficient representation")
  (deserialize [data] "Convert back from serialized form"))

;; Object pooling for React components
(defonce component-pool (atom {}))

(defn get-pooled-component
  "Get a component from the pool or create new one"
  [component-key factory-fn]
  (if-let [component (get @component-pool component-key)]
    (do
      (swap! component-pool dissoc component-key)
      component)
    (factory-fn)))

(defn return-to-pool
  "Return a component to the pool for reuse"
  [component-key component]
  (when (< (count @component-pool) 50) ; Limit pool size
    (swap! component-pool assoc component-key component)))

;; Lazy loading utilities
(defn lazy-load-data
  "Load data in chunks with pagination"
  [data-source page-size current-page]
  (let [start-idx (* (dec current-page) page-size)
        end-idx (+ start-idx page-size)]
    (subvec data-source start-idx (min end-idx (count data-source)))))

;; Platform-specific optimizations
(def platform-configs
  {:web {:memory-limit (* 1024 1024 512) ; 512MB
         :concurrent-loads 10
         :virtual-scroll-threshold 100}
   :electron {:memory-limit (* 1024 1024 1024) ; 1GB
              :concurrent-loads 20
              :virtual-scroll-threshold 500}
   :mobile {:memory-limit (* 1024 1024 128) ; 128MB
            :concurrent-loads 3
            :virtual-scroll-threshold 50}})

(defn get-platform-config
  "Get platform-specific performance configuration"
  []
  (cond
    (mobile-util/native-platform?) (:mobile platform-configs)
    (util/electron?) (:electron platform-configs)
    :else (:web platform-configs)))

;; Collection type optimizations
(defn optimize-collection-for-reads
  "Choose optimal collection type based on access patterns"
  [data frequent-accesses?]
  (cond
    (and frequent-accesses? (> (count data) 1000))
    (into {} (map (juxt :id identity) data)) ; Hash map for O(1) lookups

    (> (count data) 10000)
    (into (sorted-map) data) ; Sorted map for ordered access

    :else
    (vec data))) ; Vector for sequential access

;; Memory monitoring
(defonce memory-stats (atom {:peak-usage 0
                            :current-usage 0
                            :gc-cycles 0}))

(defn update-memory-stats!
  "Update memory usage statistics"
  []
  (when-let [mem-info (.-memory js/performance)]
    (let [used-heap-size (.-usedJSHeapSize mem-info)]
      (swap! memory-stats
             (fn [stats]
               (assoc stats
                      :current-usage used-heap-size
                      :peak-usage (max (:peak-usage stats) used-heap-size)))))))

;; Debounced operations for performance
(defn debounce
  "Debounce a function call"
  [f delay-ms]
  (let [timeout-id (atom nil)]
    (fn [& args]
      (when @timeout-id
        (js/clearTimeout @timeout-id))
      (reset! timeout-id
              (js/setTimeout #(apply f args) delay-ms)))))

;; Virtual scrolling utilities
(defn calculate-visible-range
  "Calculate which items should be rendered in virtual scroll"
  [scroll-top item-height container-height total-items]
  (let [start-idx (max 0 (Math/floor (/ scroll-top item-height)))
        visible-count (Math/ceil (/ container-height item-height))
        end-idx (min total-items (+ start-idx visible-count 5))] ; Add buffer
    [start-idx end-idx]))

;; DataScript query optimization
(defn optimize-query
  "Optimize DataScript query for better performance"
  [query data-patterns]
  (cond-> query
    ;; Add hints based on data patterns
    (contains? data-patterns :frequent-joins)
    (conj :query-hint/join-order)

    (contains? data-patterns :large-result-sets)
    (conj :query-hint/limit-results)))