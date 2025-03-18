(ns frontend.components.vector-search.sidebar
  (:require [fipp.edn :as fipp]
            [frontend.common.missionary :as c.m]
            [frontend.handler.db-based.vector-search-flows :as vector-search-flows]
            [frontend.hooks :as hooks]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [missionary.core :as m]
            [rum.core :as rum]))

(rum/defc vector-search-sidebar
  []
  (let [repo (state/get-current-repo)
        [vec-search-state set-vec-search-state] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (c.m/run-task ;; return canceler
        (m/reduce
         (fn [_ v] (set-vec-search-state v))
         vector-search-flows/vector-search-state-flow)
        ::update-vec-search-state :succ (constantly nil) :fail #(log/info :update-vec-search-state-stopped %)))
     [])
    (let [state-map (get-in vec-search-state [:repo->index-info repo])]
      [:div.pb-4
       [:pre.select-text
        (with-out-str
          (fipp/pprint state-map {:width 10}))]])))
