(ns frontend.worker.flows
  "common flows in worker thread"
  (:require [frontend.worker.state :as worker-state]
            [missionary.core :as m]))

(def online-event-flow
  (->> (m/watch (get @worker-state/*state :thread-atom/online-event))
       (m/eduction (filter true?))))

(comment
  ((m/reduce (fn [_ x] (prn :xxx x)) online-event-flow) prn prn))
