(ns mobile.components.graphs
  "Mobile graphs"
  (:require [frontend.components.repo :as repo]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc page
  []
  [:div.app-index-graphs
   (repo/repos-cp)])
