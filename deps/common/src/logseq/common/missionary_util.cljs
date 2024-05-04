(ns logseq.common.missionary-util
  "Utils based on missionary."
  (:import [missionary Cancelled])
  (:require [missionary.core :as m]))

(def delays (reductions * 1000 (repeat 2)))

(def ^:private retry-sentinel (js-obj))
(defn backoff
  "Retry task when it throw exception `(get ex-data :missionary/retry)`"
  [delays task]
  (m/sp
    (loop [[delay & delays] (seq delays)]
      (let [r (try
                (m/? task)
                (catch :default e
                  (if (and (some-> e ex-data :missionary/retry)
                           (pos-int? delay))
                    (do (m/? (m/sleep delay))
                        (println :missionary/retry "after" delay "ms (" (ex-message e) ")")
                        retry-sentinel)
                    (throw e))))]
        (if (identical? r retry-sentinel)
          (recur delays)
          r)))))

(defn mix
  "Return a flow which is mixed by `flows`"
  [& flows]
  (m/ap (m/?> (m/?> (count flows) (m/seed flows)))))

(defn clock
  "Return a flow that emits `value` every `interval-ms`."
  ([interval-ms]
   (clock interval-ms nil))
  ([interval-ms value]
   (->>
    (m/ap
      (loop []
        (m/amb
         (m/? (m/sleep interval-ms value))
         (recur))))
    (m/reductions {} value)
    (m/latest identity))))

(defn debounce
  [duration-ms flow]
  (m/ap
    (let [x (m/?< flow)]
      (try (m/? (m/sleep duration-ms x))
           (catch Cancelled _
             (m/amb))))))

(defn run-task
  "Return the canceler"
  [task key & {:keys [succ fail]}]
  (task (or succ #(prn key :succ %)) (or fail #(js/console.log key (or (some-> % .-stack) %)))))
