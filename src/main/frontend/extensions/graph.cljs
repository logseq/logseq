(ns frontend.extensions.graph
  (:require [cljs-bean.core :as bean]
            [frontend.db.model :as model]
            [frontend.extensions.graph.pixi :as pixi]
            [frontend.handler.route :as route-handler]
            [goog.object :as gobj]
            [rum.core :as rum]))

(defn- highlight-neighbours!
  [^js graph node focus-nodes _dark?]
  (.forEachNeighbor
   (.-graph graph) node
   (fn [node attributes]
     (when-not (contains? focus-nodes node)
       (let [attributes (bean/->clj attributes)
             attributes (assoc attributes
                               :color "#6366F1"
                               :border {:width 2
                                        :color "#6366F1"})]
         (.resetNodeStyle graph node (bean/->js attributes)))))))

(defn- highlight-edges!
  [^js graph node dark?]
  (.forEachEdge
   (.-graph graph) node
   (fn [edge _attributes]
     (.resetEdgeStyle graph edge (bean/->js {:width 1
                                             :color (if dark? "#999" "#A5B4FC")})))))

(defn on-click-handler [graph node event *focus-nodes *n-hops drag? dark?]
  ;; shift+click to select the page
  (if (or (gobj/get event "shiftKey") drag?)
    (do
      (when-not @*n-hops
        (swap! *focus-nodes ;; Don't trigger re-render
               (fn [v]
                 (vec (distinct (conj v node))))))
      ;; highlight current node
      (.setNodeAttribute (.-graph graph) node "parent" "ls-selected-nodes")
      (highlight-neighbours! graph node (set @*focus-nodes) dark?)
      (highlight-edges! graph node dark?))
    (when-not drag?
      (let [page-name (model/get-redirect-page-name node)]
        (.unhoverNode ^js graph node)
        (route-handler/redirect-to-page! page-name)))))

(rum/defcs graph-2d <
  (rum/local nil :ref)
  {:did-update pixi/render!
   :should-update (fn [old-state new-state]
                    (not= (select-keys (first (:rum/args old-state))
                                       [:nodes :links :dark?])
                          (select-keys (first (:rum/args new-state))
                                       [:nodes :links :dark?])))
   :will-unmount (fn [state]
                   (reset! pixi/*graph-instance nil)
                   state)}
  [state _opts]
  [:div.graph {:ref (fn [value]
                      (let [ref (get state :ref)]
                        (when (and ref value)
                          (reset! ref value))))}])
