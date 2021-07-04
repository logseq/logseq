(ns frontend.extensions.graph.pixi
  (:require [rum.core :as rum]
            [frontend.rum :as r]
            [frontend.ui :as ui]
            [shadow.lazy :as lazy]
            [frontend.handler.route :as route-handler]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [goog.object :as gobj]
            [frontend.state :as state]
            [frontend.db :as db]
            [promesa.core :as p]
            [clojure.set :as set]
            [cljs-bean.core :as bean]
            ["pixi-graph-fork" :as Pixi-Graph]
            ["graphology" :as graphology]
            ["graphology-layout-forceatlas2" :as forceAtlas2]))

(def graph (gobj/get graphology "Graph"))

(defonce colors
  ["#1f77b4"
   "#ff7f0e"
   "#2ca02c"
   "#d62728"
   "#9467bd"
   "#8c564b"
   "#e377c2"
   "#7f7f7f"
   "#bcbd22"
   "#17becf"])

(def default-style
  {:node {:size 8
          :border {:width 0}
          :color (fn [node]
                   (if-let [parent (gobj/get node "parent")]
                     (let [v (js/Math.abs (hash parent))]
                       (nth colors (mod v (count colors))))
                     "#333333"))
          :label {:content (fn [node] (.-id node))
                  :type js/window.PixiGraph.TextType.TEXT
                  :fontSize 12
                  :color "#333333"
                  :backgroundColor "rgba(255, 255, 255, 0.5)"
                  :padding 4}}
   :edge {:width 1
          :color "#cccccc"}})

(def default-hover-style
  {:node {:border {:width 2}
          :label {:backgroundColor "rgba(238, 238, 238, 1)"}}
   :edge {:color "#999999"}})

(defn render!
  [state]
  (when-let [graph (:graph state)]
    (.destroy graph))
  (let [{:keys [nodes links style hover-style height register-handlers-fn]
         :or {style default-style
              hover-style default-hover-style}} (first (:rum/args state))
        graph (graph.)
        nodes-set (set (map :id nodes))]
    (doseq [node nodes]
      (.addNode graph (:id node) (bean/->js node)))
    (doseq [link links]
      (when (and (nodes-set (:source link)) (nodes-set (:target link)))
        (.addEdge graph (:source link) (:target link) (bean/->js link))))

    (.forEachNode graph (fn [node]
                          (.setNodeAttribute graph node "x" (js/Math.random))
                          (.setNodeAttribute graph node "y" (js/Math.random))))

    (let [settings (assoc (bean/->clj (.inferSettings forceAtlas2 graph))
                          :scalingRatio 80)]
      (.assign forceAtlas2 graph (bean/->js {:iterations 30
                                             :settings settings})))

    (if-let [container-ref (:ref state)]
      (let [graph (new (.-PixiGraph Pixi-Graph)
                  (bean/->js
                   {:container @container-ref
                    :graph graph
                    :style style
                    :hoverStyle hover-style
                    :height height}))]
        (when register-handlers-fn
          (register-handlers-fn graph))
        (def debug-graph graph)
        (assoc state :graph graph))
      state)))
