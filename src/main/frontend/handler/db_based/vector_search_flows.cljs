(ns frontend.handler.db-based.vector-search-flows
  "Flows for vector-search state"
  (:require [frontend.state :as state]
            [missionary.core :as m]))

;; input atoms
(def *infer-worker-ready (atom nil))

(def infer-worker-ready-flow
  (m/eduction
   (filter some?)
   (take 1)
   (m/watch *infer-worker-ready)))

(def vector-search-state-flow
  (m/watch (:vector-search/state @state/state)))

(def load-model-progress-flow
  (m/watch (:vector-search/load-model-progress @state/state)))

(comment
  ((m/reduce (fn [_ x] (prn :xx x)) vector-search-state-flow) prn js/console.log))
