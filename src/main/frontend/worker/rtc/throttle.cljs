(ns frontend.worker.rtc.throttle
  "Adjust the synchronization frequency dynamically based on the client's RTC-related API call volume."
  (:require [cljs.cache :as cache]
            [frontend.common.missionary :as c.m]
            [frontend.worker.rtc.client-op :as client-op]
            [lambdaisland.glogi :as log]
            [missionary.core :as m])
  (:import [missionary Cancelled]))

(def ^:private api-calls-count-threshold 5)
(def ^:private *rtc-api-calls (atom (cache/ttl-cache-factory {} :ttl 30000)))

(defn- through
  [cache item]
  (let [k (random-uuid)]
    (cache/through (constantly item) cache k)))

(def ^:private sentinel (js-obj))
(defn- get-items
  [cache]
  (let [cache*
        ;; clean expired items
        (-> cache
            (cache/miss sentinel sentinel)
            (cache/evict sentinel))]
    (vals cache*)))

(defn- compute-stats
  "TODO: add more stat-data. e.g. total ws-message-size"
  [api-calls]
  {:count (count api-calls)})

(defn create-local-updates-check-flow
  "Return a flow: emit if need to push local-updates"
  [repo *auto-push? min-interval-ms]
  (let [auto-push-flow (m/watch *auto-push?)
        clock-flow (c.m/clock min-interval-ms :clock)
        check-flow (m/latest vector auto-push-flow clock-flow)]
    (m/ap
      (m/?< check-flow)
      (try
        (let [recent-rtc-api-calls-count (:count (compute-stats (get-items @*rtc-api-calls)))]
          (when (and goog.DEBUG
                     (> recent-rtc-api-calls-count api-calls-count-threshold))
            (log/info :rtc-throttle {:recent-rtc-api-calls-count recent-rtc-api-calls-count}))
          (if (and (<= recent-rtc-api-calls-count api-calls-count-threshold)
                   (pos? (client-op/get-unpushed-ops-count repo)))
            true
            (m/amb)))
        (catch Cancelled _ (m/amb))))))

(defn add-rtc-api-call-record!
  [api-call-record]
  (swap! *rtc-api-calls through api-call-record))
