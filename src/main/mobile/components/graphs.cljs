(ns mobile.components.graphs
  "Mobile graphs"
  (:require [frontend.components.repo :as repo]
            [rum.core :as rum]))

(rum/defc page < rum/reactive
  []
  [:div.app-index-graphs
   [:div.mt-8
    (repo/repos-cp)]])
