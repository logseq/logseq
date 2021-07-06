(ns frontend.extensions.graph
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
            [frontend.extensions.graph.pixi :as pixi]
            [frontend.util :as util :refer [profile]]
            [cljs-bean.core :as bean]))

(defonce clicked-page-timestamps (atom nil))

(defn- highlight-node!
  [^js graph node]
  (.resetNodeStyle graph node
                   (bean/->js {:color "#6366F1"
                               :border {:width 2
                                        :color "#6366F1"}})))

(defn- highlight-neighbours!
  [^js graph node]
  (.forEachNeighbor
   (.-graph graph) node
   (fn [node attributes]
     (let [attributes (bean/->clj attributes)
           attributes (assoc attributes
                             :color "#6366F1"
                             :border {:width 2
                                      :color "#6366F1"})]
       (.resetNodeStyle graph node (bean/->js attributes))))))

(defn- highlight-edges!
  [^js graph node]
  (.forEachEdge
   (.-graph graph) node
   (fn [edge attributes]
     (.resetEdgeStyle graph edge (bean/->js {:width 1
                                             :color "#A5B4FC"})))))

(defn on-click-handler [graph node event *focus-nodes *n-hops]
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
    (highlight-neighbours! graph node)
    (highlight-edges! graph node)

    ;; shift+click to select the page
    (when-not (gobj/get event "shiftKey")
      ;; double click to go to the page
      (let [last-time (get @clicked-page-timestamps page-name)
            new-time (util/time-ms)]
        (swap! clicked-page-timestamps assoc page-name new-time)
        (when (and last-time
                   (< (- new-time last-time) 300))
          (route-handler/redirect! {:to :page
                                    :path-params {:name page-name}}))))))

(defn reset-graph!
  [^js graph]
  (.resetView graph))

(rum/defcs graph-2d <
  (rum/local nil :ref)
  {:did-update pixi/render!
   :will-unmount (fn [state]
                   (when-let [graph (:graph state)]
                     (.destroy graph))
                   (reset! clicked-page-timestamps nil)
                   state)}
  [state opts]
  [:div.graph {:style {:height "100vh"}
               :ref (fn [value]
                      (let [ref (get state :ref)]
                        (when (and ref value)
                          (reset! ref value))))}])
