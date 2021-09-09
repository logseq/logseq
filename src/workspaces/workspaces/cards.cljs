(ns workspaces.cards
  (:require [frontend.extensions.graph :as graph]
            [frontend.ui :as ui]
            [nubank.workspaces.card-types.react :as ct.react]
            [nubank.workspaces.core :as ws]
            [rum.core :as rum]))

;; simple function to create react elemnents
(defn element [name props & children]
  (apply js/React.createElement name (clj->js props) children))

(ws/defcard hello-card
  (ct.react/react-card
   (element "div" {} "Hello World")))

(rum/defc ui-button
  []
  (ui/button "Text"
    :background "green"
    :on-click (fn [] (js/alert "button clicked"))))

(ws/defcard button-card
  (ct.react/react-card
   (ui-button)))

(rum/defc graph
  []
  (graph/graph-2d
   {:data {:nodes [{:id "a" :label "a"} {:id "b" :label "b"}]
           :edges [{:source "a" :target "b"}]}
    :width 150
    :height 150
    :fitView true}))

(ws/defcard graph-card
  (ct.react/react-card
   (graph)))

(defn- random-graph
  [n]
  (let [nodes (for [i (range 0 n)]
                {:id (str i)
                 :label (str i)})
        edges (->
               (for [i (range 0 (/ n 2))]
                 (let [source i
                       target (inc i)]
                   {:id (str source target)
                    :source (str source)
                    :target (str target)}))
               (distinct))]
    {:nodes nodes
     :links edges}))

;; (rum/defc pixi-graph
;;   []
;;   (let [{:keys [nodes links]} (random-graph 4000)]
;;     (pixi/graph (fn []
;;                   {:nodes nodes
;;                   :links links
;;                   :style {:node {:size 15
;;                                  :color "#666666"
;;                                  :border {:width 2
;;                                           :color "#ffffff"}
;;                                  :label {:content (fn [node] (.-id node))
;;                                          :type js/window.PixiGraph.TextType.TEXT
;;                                          :fontSize 12
;;                                          :color "#333333"
;;                                          :backgroundColor "rgba(255, 255, 255, 0.5)"
;;                                          :padding 4}}
;;                           :edge {:width 1
;;                                  :color "#cccccc"}}
;;                   :hover-style {:node {:border {:color "#000000"}
;;                                        :label {:backgroundColor "rgba(238, 238, 238, 1)"}}
;;                                 :edge {:color "#999999"}}}))))

;; (ws/defcard pixi-graph-card
;;   (ct.react/react-card
;;    (pixi-graph)))
