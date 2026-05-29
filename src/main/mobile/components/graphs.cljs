(ns mobile.components.graphs
  "Mobile graphs"
  (:require [frontend.components.repo :as repo]
            [rum.core :as rum]))

(rum/defc page
  []
  [:div.app-index-graphs
   (repo/repos-cp)])
