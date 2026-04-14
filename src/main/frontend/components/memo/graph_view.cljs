;; src/main/frontend/components/memo/graph_view.cljs
(ns frontend.components.memo.graph-view
  (:require [rum.core :as rum]
            [frontend.modules.memo.graph :as graph]))

(def type->color
  {:character "red"
   :world "green"
   :timeline "blue"
   :location "yellow"
   :custom "purple"})

(defn setting-color [type]
  (get type->color type "gray"))

(rum/defc memo-graph-view < rum/reactive
  []
  (let [graph-data (graph/build-setting-graph)]
    [:div.memo-graph-view
     [:div.graph-header "SimpleMem 设定图谱"]
     [:div.graph-controls
      [:button "全部"]
      (for [type [:character :world :timeline :location :custom]]
        [:button {:key type} (name type)])]
     [:div.graph-canvas
      ;; D3.js rendering would go here
      ]]))