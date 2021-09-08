(ns frontend.extensions.graph
  (:require [cljs-bean.core :as bean]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.extensions.graph.pixi :as pixi]
            [frontend.handler.route :as route-handler]
            [goog.object :as gobj]
            [rum.core :as rum]))

(defn- highlight-node!
  [^js graph node]
  (.resetNodeStyle graph node
                   (bean/->js {:color "#6366F1"
                               :border {:width 2
                                        :color "#6366F1"}})))

(defn- highlight-neighbours!
  [^js graph node focus-nodes dark?]
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
   (fn [edge attributes]
     (.resetEdgeStyle graph edge (bean/->js {:width 1
                                             :color (if dark? "#999" "#A5B4FC")})))))

(defn on-click-handler [graph node event *focus-nodes *n-hops drag? dark?]
  ;; shift+click to select the page
  (if (or (gobj/get event "shiftKey") drag?)
    (let [page-name (string/lower-case node)]
      (when-not @*n-hops
        ;; Don't trigger re-render
        (swap! *focus-nodes
               (fn [v]
                 (vec (distinct (conj v node))))))
      ;; highlight current node
      (let [node-attributes (-> (.getNodeAttributes (.-graph graph) node)
                                (bean/->clj))]
        (.setNodeAttribute (.-graph graph) node "parent" "ls-selected-nodes"))
      (highlight-neighbours! graph node (set @*focus-nodes) dark?)
      (highlight-edges! graph node dark?))
    (when-not drag?
      (let [page-name (string/lower-case node)]
        (.unhoverNode ^js graph node)
        (route-handler/redirect! {:to :page
                                  :path-params {:name page-name}})))))

(defn reset-graph!
  [^js graph]
  (.resetView graph))

(rum/defcs graph-2d <
  (rum/local nil :ref)
  {:did-update pixi/render!
   :will-unmount (fn [state]
                   (when-let [graph (:graph state)]
                     (.destroy graph))
                   (reset! pixi/*graph-instance nil)
                   state)}
  [state opts]
  [:div.graph {:style {:height "100vh"}
               :ref (fn [value]
                      (let [ref (get state :ref)]
                        (when (and ref value)
                          (reset! ref value))))}])
