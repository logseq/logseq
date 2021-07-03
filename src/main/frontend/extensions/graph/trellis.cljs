(ns frontend.extensions.graph.trellis
  (:require ["trellis-simple-graph" :as Graph]
            ["@sayari/trellis" :as trellis :refer [getSelectionBounds boundsToViewport]]
            ["@sayari/trellis/layout/force" :refer [Layout]]
            ["@sayari/trellis/bindings/react/renderer" :refer [Renderer]]
            [frontend.rum :as r]
            [goog.object :as gobj]
            [rum.core :as rum]
            [cljs-bean.core :as bean]))

;; (def graph (r/adapt-class (gobj/get Graph "default")))

(defonce graph-force (Layout))

(defn- force-layout!
  [nodes edges width height set-state!]
  (rum/use-effect!
   (fn []
     (-> (graph-force (bean/->js {:nodes nodes
                                  :edges edges}))
         (.then (fn [m]
                  (let [result (-> (getSelectionBounds (.-nodes m) 60)
                                   (boundsToViewport #js {:width width
                                                          :height height}))]
                    (set-state! (fn [graph]
                                  (assoc graph
                                         :nodes (bean/->clj (.-nodes m))
                                         :edges (bean/->clj (.-edges m))
                                         :x (.-x result)
                                         :y (.-y result)
                                         :zoom (.-zoom result)))))))))
   []))

(rum/defc graph
  [{:keys [width height nodes edges target-ref-fn style-node style-edge on-node-click
           on-node-double-click]}]
  (let [[graph set-state!]
        (rum/use-state {:nodes nodes
                        :edges edges
                        :x 0
                        :y 0
                        :zoom 1
                        :hover-node nil
                        :hover-edge nil})]
    (force-layout! nodes edges width height set-state!)
    (prn {:graph graph})
    [:div {:ref target-ref-fn
           :style {:position "relative"
                   :overflow "hidden"
                   :height "100vh"}}
     (Renderer
      (bean/->js
       {:x (:x graph)
        :y (:y graph)
        :zoom (:zoom graph)
        :width width
        :height height
        :nodes nodes
        :edges edges
        :onNodeClick on-node-click
        :onNodeDoubleClick on-node-double-click}))]))
