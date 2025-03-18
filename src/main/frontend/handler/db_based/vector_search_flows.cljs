(ns frontend.handler.db-based.vector-search-flows
  "Flows for vector-search state"
  (:require [frontend.state :as state]
            [missionary.core :as m]))

(def vector-search-state-flow
  (m/watch (:vector-search/state @state/state)))

(comment
  ((m/reduce (fn [_ x] (prn :xx x)) vector-search-state-flow) prn js/console.log))
