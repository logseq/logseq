(ns frontend.extensions.graph.pixi
  (:require [rum.core :as rum]
            [frontend.rum :as r]
            [frontend.ui :as ui]
            [shadow.lazy :as lazy]
            [frontend.handler.route :as route-handler]
            [frontend.util :as util :refer [profile]]
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
            ["d3-force" :refer [forceSimulation forceManyBody forceCenter forceLink forceCollide forceRadial forceX forceY SimulationLinkDatum SimulationNodeDatum] :as force]))

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

(defn default-style
  [dark?]
  {:node {:size (fn [node]
                  (or (.-size node) 8))
          :border {:width 0}
          :color (fn [node]
                   (if-let [parent (gobj/get node "parent")]
                     (let [v (js/Math.abs (hash parent))]
                       (nth colors (mod v (count colors))))
                     (.-color node)))
          :label {:content (fn [node] (.-id node))
                  :type (.-TEXT (.-TextType Pixi-Graph))
                  :fontSize 12
                  :color "#333333"
                  :backgroundColor "rgba(255, 255, 255, 0.5)"
                  :padding 4}}
   :edge {:width 1
          :color (if dark? "#094b5a" "#cccccc")}})

(defn default-hover-style
  [dark?]
  {:node {:color "#6366F1"
          :border {:width 2
                   :color "#6366F1"}
          :label {:backgroundColor "rgba(238, 238, 238, 1)"}}
   :edge {:color "#A5B4FC"}})

;; TODO: animation
;; (defn ticked [^js link ^js node]
;;   (-> link
;;       (.attr "x1" (fn [d] (.. d -source -x)))
;;       (.attr "y1" (fn [d] (.. d -source -y)))
;;       (.attr "x2" (fn [d] (.. d -target -x)))
;;       (.attr "y2" (fn [d] (.. d -target -y))))

;;   (-> node
;;       (.attr "cx" (fn [d] (.-x d)))
;;       (.attr "cy" (fn [d] (.-y d)))))

(defn layout!
  [nodes links]
  (let [simulation (forceSimulation nodes)]
    (-> simulation
        (.force "link" (-> (forceLink)
                           (.id (fn [d] (.-id d)))
                           (.distance 180)
                           (.links links)))
        (.force "charge" (-> (forceManyBody)
                             (.distanceMax 4000)
                             (.theta 0.5)
                             (.strength -600)))
        (.force "collision" (-> (forceCollide)
                                (.radius (+ 8 18))))
        (.force "x" (-> (forceX 0) (.strength 0.02)))
        (.force "y" (-> (forceX 0) (.strength 0.02)))
        (.force "center" (forceCenter))
        (.tick 30)
        (.stop))))

(defn render!
  [state]
  (when-let [graph (:graph state)]
    (.destroy graph))
  (let [{:keys [nodes links style hover-style height register-handlers-fn dark?]} (first (:rum/args state))
        style (or style (default-style dark?))
        hover-style (or hover-style (default-hover-style dark?))
        graph (graph.)
        nodes-set (set (map :id nodes))
        links (->> (filter (fn [link]
                             (and (nodes-set (:source link)) (nodes-set (:target link)))) links)
                   (distinct))
        nodes-js (bean/->js nodes)
        links-js (bean/->js links)]
    (layout! nodes-js links-js)
    (doseq [node nodes-js]
      (.addNode graph (.-id node) node))
    (doseq [link links-js]
      (.addEdge graph (.-id (.-source link)) (.-id (.-target link)) link))

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
        (assoc state :graph graph))
      state)))
