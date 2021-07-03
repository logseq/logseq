(ns workspaces.cards
  (:require [nubank.workspaces.core :as ws]
            [nubank.workspaces.model :as wsm]
            [nubank.workspaces.card-types.react :as ct.react]
            [nubank.workspaces.card-types.test :as ct.test]
            [cljs.test :refer [is async]]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.extensions.graph :as graph]
            [frontend.extensions.graph.trellis :as trellis]
            [frontend.extensions.graph.netv :refer [netv]]
            [cljs-bean.core :as bean]))

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
  ([n]
   (random-graph n true))
  ([n edge?]
   (let [nodes (for [i (range 0 n)]
                 {:id (str i)
                  :label (str i)
                  :radius 18
                  })
         edges (->
                (for [i (range 0 (/ n 2))]
                  (let [source i
                        target (inc i)]
                    {:id (str source target)
                     :source (str source)
                     :target (str target)}))
                (distinct))]
     {:nodes nodes
      (if edge? :edges :links) edges})))

(rum/defc trellis-graph
  []
  (trellis/graph
   (merge
    {:width 1000
     :styleNode (fn [node hover?]
                  (let [style {:labelSize 10
                               :labelWordWrap 260}]
                    )
                  node)
     :styleEdge (fn [edge hover?]
                  ;; (bean/->js
                  ;;  )
                  edge)
     :onNodeClick (fn [target]
                    (prn "clicked")
                    (js/console.dir target))
     :onNodeDoubleDlick (fn [target]
                          (prn "double clicked")
                          (js/console.dir target))}
    (random-graph 500))))

;; (ws/defcard trellis-graph-card
;;   (ct.react/react-card
;;    (trellis-graph)))

(rum/defc netv-graph <
  {:did-mount (fn [state]
                (let [n 10
                      g (new netv (bean/->js {:container (js/document.getElementById "netv")}))
                      _ (prn {:data (random-graph n)})
                      data (bean/->js (random-graph n))]
                  (.data g data)
                  (.draw g))
                state)}
  []
  [:div#netv])

(ws/defcard netv-graph-card
  (ct.react/react-card
   (netv-graph)))
