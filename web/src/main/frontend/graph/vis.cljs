(ns frontend.graph.vis
  (:require [cljs-bean.core :as bean]
            [goog.dom :as gdom]))

;; Borrowed idea from https://github.com/org-roam/org-roam-server
(def default-options
  (bean/->js
   {
    :nodes {:shape "dot"}
    ;; groups
    :autoResize true
    :interaction {:hover true}
    :layout {:randomSeed 111} ;;Make deterministic
    }))

(defn on-node-select
  [node]
  (prn "select-node"))

(defn on-node-hover
  [node]
  (prn "hover-node"))

(defn on-node-blur
  [node]
  (prn "blur-node"))

(defn bind-events!
  [network events]
  (doseq [[event-name event-handler] events]
    (.on ^js/window.vis.Network network (name event-name) event-handler)))

(defn default-bind-events!
  [network]
  (bind-events!
   network
   {:selectNode on-node-select
    :hoverNode on-node-hover
    :blurNode on-node-blur}))

;; data should be type of {nodes: [], edges: []}
(defn new-network
  ([container-id data]
   (new-network container-id data default-options))
  ([container-id {:keys [nodes edges] :as data} options]
   (prn {:data data
         :options options})
   (if-let [container (gdom/getElement container-id)]
     (let [nodes (js/window.vis.DataSet. (bean/->js nodes))
           edges (js/window.vis.DataSet. (bean/->js edges))
           _ (js/console.dir nodes)
           _ (js/console.dir edges)
           network (js/window.vis.Network. container
                                           (bean/->js {:nodes nodes
                                                       :edges edges})
                                           options)]
       ;; (default-bind-events! network)
       )
     (println "[Graph] No container was found with the id " container-id))))

(comment
  (new-network "page-graph"
               {:nodes [{:id "1"
                         :label "1"}
                        {:id "2"
                         :label "2"}]
                :edges [{:from "1"
                         :to "2"}]})
  )
