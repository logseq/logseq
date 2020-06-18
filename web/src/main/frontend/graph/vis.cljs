(ns frontend.graph.vis
  (:require [cljs-bean.core :as bean]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.handler :as handler]
            [frontend.util :as util]))

;; Borrowed idea from https://github.com/org-roam/org-roam-server
(def default-options
  {
   :nodes {:shape "dot"}
   ;; :autoResize true
   :interaction {:hover true}
   ;; :layout {:randomSeed 111} ;;Make deterministic
   })

(defn on-node-select
  [container-id node]
  (let [label (first (bean/->clj (gobj/get node "nodes")))
        route (if (= container-id "page-graph")
                :page
                :tag)]
    (handler/redirect! {:to route
                        :path-params {:name (util/url-encode label)}})))

(defn on-node-hover
  [node]
  ;; (prn "hover-node")
  )

(defn on-node-blur
  [node]
  ;; (prn "blur-node")
  )

(defn bind-events!
  [network events]
  (doseq [[event-name event-handler] events]
    (.on ^js/window.vis.Network network (name event-name) event-handler)))

(defn default-bind-events!
  [network container-id]
  (bind-events!
   network
   {:selectNode #(on-node-select container-id %)
    :hoverNode on-node-hover
    :blurNode on-node-blur}))

;; data should be type of {nodes: [], edges: []}
(defn new-network
  ([container-id data]
   (new-network container-id data default-options))
  ([container-id {:keys [nodes edges] :as data} options]
   (when (gobj/get js/window "vis")
     (let [options (if (= container-id "tags-graph")
                     (assoc-in options [:nodes :shape] "text")
                     options)
           options (bean/->js options)]
       (if-let [container (gdom/getElement container-id)]
        (let [nodes (js/window.vis.DataSet. (bean/->js nodes))
              edges (js/window.vis.DataSet. (bean/->js edges))
              network (js/window.vis.Network. container
                                              (bean/->js {:nodes nodes
                                                          :edges edges})
                                              options)]
          (default-bind-events! network container-id))
        (println "[Graph] No container was found with the id " container-id))))))
