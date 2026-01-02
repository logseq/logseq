(ns frontend.platform
  "Platform-specific performance optimizations"
  (:require [frontend.mobile.util :as mobile-util]
            [frontend.performance :as perf]
            [frontend.util :as util]))

;; Platform detection and capabilities
(def platform-capabilities
  {:web {:supports-web-workers true
         :supports-web-assembly true
         :memory-efficient true
         :concurrent-rendering true}
   :electron {:supports-node-apis true
              :supports-file-system true
              :memory-efficient true
              :concurrent-rendering true}
   :mobile {:limited-memory true
            :battery-conscious true
            :touch-optimized true
            :reduced-concurrency true}})

(defn get-platform-capabilities
  "Get capabilities for current platform"
  []
  (cond
    (mobile-util/native-platform?) (:mobile platform-capabilities)
    (util/electron?) (:electron platform-capabilities)
    :else (:web platform-capabilities)))

;; Adaptive rendering strategies
(def rendering-strategies
  {:web {:batch-updates true
         :virtual-scroll true
         :lazy-loading true
         :concurrent-features true}
   :electron {:batch-updates true
              :virtual-scroll true
              :lazy-loading true
              :concurrent-features true}
   :mobile {:batch-updates false
            :virtual-scroll true
            :lazy-loading true
            :concurrent-features false
            :reduced-animations true}})

(defn get-rendering-strategy
  "Get optimal rendering strategy for current platform"
  []
  (cond
    (mobile-util/native-platform?) (:mobile rendering-strategies)
    (util/electron?) (:electron rendering-strategies)
    :else (:web rendering-strategies)))

;; Memory management strategies
(defn setup-platform-memory-management!
  "Setup platform-specific memory management"
  []
  (let [platform (get-platform-capabilities)]
    (cond
      (:limited-memory platform)
      ;; Aggressive memory management for mobile
      (do
        (perf/update-memory-stats!)
        (js/setInterval
         (fn []
           (let [stats @perf/memory-stats
                 platform-config (perf/get-platform-config)
                 memory-limit (:memory-limit platform-config)]
             (when (> (:current-usage stats) (* memory-limit 0.8))
               (js/console.log "Mobile: High memory usage, triggering cleanup")
               ;; Force cleanup
               (js/collectGarbage)
               ;; Clear non-essential caches
               (reset! perf/component-pool {}))))
         15000)) ; More frequent checks on mobile

      (:memory-efficient platform)
      ;; Standard memory management for desktop/web
      (js/setInterval
       (fn []
         (perf/update-memory-stats!))
       30000))))

;; Adaptive component rendering
(defn adaptive-component
  "Create a component that adapts to platform capabilities"
  [component-config]
  (let [platform (get-platform-capabilities)
        strategy (get-rendering-strategy)]

    (fn [props]
      (cond-> component-config
        ;; Disable animations on mobile
        (and (:limited-memory platform) (:reduced-animations strategy))
        (assoc :animations false)

        ;; Enable concurrent features on capable platforms
        (:concurrent-features strategy)
        (assoc :concurrent true)

        ;; Use virtual scroll when beneficial
        (:virtual-scroll strategy)
        (assoc :virtual-scroll true)))))

;; Network-aware optimizations
(def network-conditions (atom {:online true :fast-connection true}))

(defn update-network-conditions!
  "Update network condition awareness"
  []
  (let [connection (.-connection js/navigator)]
    (when connection
      (let [effective-type (.-effectiveType connection)
            fast-connection (contains? #{"4g" "5g"} effective-type)]
        (swap! network-conditions assoc
               :fast-connection fast-connection)))))

;; Battery-aware optimizations
(defn get-battery-status
  "Get current battery status"
  []
  (when-let [battery (.-battery js/navigator)]
    {:charging (.-charging battery)
     :level (.-level battery)
     :discharging-time (.-dischargingTime battery)}))

(defn battery-aware-operation
  "Execute operation considering battery status"
  [expensive-fn cheap-fn]
  (if-let [battery-status (get-battery-status)]
    (if (and (not (:charging battery-status))
             (< (:level battery-status) 0.2))
      ;; Low battery, use cheap operation
      (cheap-fn)
      ;; Sufficient battery, use expensive operation
      (expensive-fn))
    ;; No battery info, default to expensive operation
    (expensive-fn)))

;; Platform-specific data loading
(defn adaptive-data-loading
  "Load data with platform-specific optimizations"
  [data-source options]
  (let [platform (get-platform-capabilities)
        {:keys [batch-size concurrent-loads]} options
        platform-config (perf/get-platform-config)
        max-concurrent (:concurrent-loads platform-config)]

    (cond
      (:reduced-concurrency platform)
      ;; Sequential loading for mobile
      (async/go
        (loop [remaining data-source
               results []]
          (if (empty? remaining)
            results
            (let [batch (take batch-size remaining)
                  batch-results (async/<! (async/timeout 100))] ; Simulate loading
              (recur (drop batch-size remaining)
                     (concat results batch-results))))))

      :else
      ;; Concurrent loading for desktop/web
      (async/go
        (let [chunks (partition-all batch-size data-source)
              results-chan (async/chan max-concurrent)]
          (doseq [chunk chunks]
            (async/put! results-chan
                       (async/go
                         (async/<! (async/timeout 50)) ; Simulate loading
                         chunk)))
          (loop [results []]
            (if (= (count results) (count chunks))
              (flatten results)
              (recur (conj results (async/<! results-chan))))))))))

;; Initialize platform optimizations
(defn init-platform-optimizations!
  "Initialize all platform-specific optimizations"
  []
  (setup-platform-memory-management!)
  (update-network-conditions!)

  ;; Setup network change listener
  (when (.-connection js/navigator)
    (set! (.-onchange (.-connection js/navigator))
          update-network-conditions!))

  ;; Log platform capabilities
  (js/console.log "Platform capabilities:" (get-platform-capabilities))
  (js/console.log "Rendering strategy:" (get-rendering-strategy)))