(ns logseq.common.missionary-util
  "Utils based on missionary."
  (:require [missionary.core :as m]))



(def ^:private retry-sentinel (js-obj))

(def delays (reductions * 1000 (repeat 2)))

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
