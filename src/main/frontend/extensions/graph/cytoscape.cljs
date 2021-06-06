(ns frontend.extensions.graph.cytoscape
  (:require [cljs-bean.core :as bean]
            ["react-cytoscapejs" :as cytoscapejs]
            ["cytoscape-dagre" :as dagre]
            ["cytoscape" :as cytoscape]
            [frontend.rum :as r]
            [rum.core :as rum]
            [goog.object :as gobj]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.db :as db]
            [clojure.string :as string]
            ["/frontend/utils" :as utils]))

(defonce *cy-instance (atom nil))

(defonce cytoscape-component (r/adapt-class cytoscapejs))

(.use cytoscape dagre)

(defonce *current-node (atom nil))

(rum/defc tooltip < rum/reactive
  []
  (when-let [node (rum/react *current-node)]
    [:div.absolute.top-0.right-0.py-2.px-4.font-medium
     node]))

(defn- edge-length
  [edge]
  (let [weight (gobj/get (.data edge) "weight")
        weight (if (zero? weight) 100 weight)]
    (* weight 4)))

(rum/defc graph <
  {:did-mount (fn [state]
                (when-let [cy @*cy-instance]
                  (.on cy "tap" "node"
                       (fn [e]
                         (let [node (gobj/get e "target")]
                           (when-let [id (.id node)]
                             (let [page-name (string/lower-case id)]
                               (cond
                                 (.selected node)
                                 ;; double click
                                 (route-handler/redirect! {:to :page
                                                           :path-params {:name page-name}})

                                 ;; shift click
                                 (gobj/get (gobj/get e "originalEvent") "shiftKey")
                                 (let [repo (state/get-current-repo)
                                       page (db/entity repo [:block/name page-name])]
                                   (state/sidebar-add-block!
                                    repo
                                    (:db/id page)
                                    :page
                                    {:page page}))

                                 ;; single click
                                 :else
                                 (utils/cyHighlight @*cy-instance e)))))))
                  (.on cy "mouseover" "node" (fn [e]
                                               (js/console.dir e)
                                               (when-let [target (gobj/get e "target")]
                                                 (when-let [id (.id target)]
                                                   (reset! *current-node id)))))
                  (.on cy "mouseout" "node" (fn [_e]
                                              (reset! *current-node nil)))

                  (.on cy "click" (fn [_]
                                    (.removeClass (.elements cy) "semitransp")
                                    (.removeClass (.elements cy) "highlight"))))
                state)}
  [{:keys [nodes links] :as graph} {:keys [width height dark? layout-name]
                                    :or {layout-name "grid"}}]
  (let [elements (->> (concat nodes links)
                      (map (fn [m] {:data m})))]
    [:div.relative
     (cytoscape-component
      {:elements (bean/->js elements)
       :layout (cond->
                 {:name layout-name
                  :fit true
                  :avoidOverlap true
                  :nodeDimensionsIncludeLabels true}
                 (= layout-name "cose")
                 (merge {:idealEdgeLength edge-length
                         :edgeElasticity edge-length}))
       :zoom 1
       :minZoom 0.05
       :maxZoom 2
       :style {:width width
               :height height}
       :stylesheet (bean/->js
                    (cond->
                      [{:selector "node"
                        :style {:label "data(id)"
                                :width "mapData(weight, 0.0, 100.0, 20.0, 160.0)"
                                :height "mapData(weight, 0.0, 100.0, 20.0, 160.0)"
                                :color (if dark? "white" "dark")
                                :text-wrap "wrap"
                                :text-max-width 120
                                :text-justification "center"
                                :min-zoomed-font-size 14
                                :padding 30}}
                       {:selector "edge"
                        :style {:target-arrow-shape "triangle"
                                :curve-style "bezier"
                                :opacity "0.3"}}
                       {:selector "node.semitransp"
                        :style {:opacity 0.1}}
                       {:selector "edge.highlight"
                        :style {:mid-target-arrow-color "#FFF"}}
                       {:selector "edge.semitransp"
                        :style {:opacity 0.1}}]
                      dark?
                      (conj
                       {:selector ":parent"
                        :style {:background-color "#023643"}})))
       :cy (fn [cy] (reset! *cy-instance cy))})
     (tooltip)]))
