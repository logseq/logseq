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
            [frontend.extensions.graph.g6 :as g6]
            [promesa.core :as p]
            [clojure.set :as set]
            [cljs-bean.core :as bean]))

(def util g6/util)
(def arrow g6/arrow)

;; (defn- render!
;;   [state]
;;   (let [opts (first (:rum/args state))
;;         data (:data opts)]
;;     (if-let [graph (:graph state)]
;;       (let [old-nodes (set (:nodes (:data state)))
;;             new-nodes (set (:nodes data))
;;             added (set/difference new-nodes old-nodes)
;;             removed (set/difference old-nodes new-nodes)]
;;         (doseq [node removed]
;;           (when-let [item (.findById graph (:id node))]
;;             (.removeItem graph item)))
;;         (doseq [node added]
;;           (.addItem graph "node" (bean/->js node)))
;;         (.layout graph)
;;         (assoc state :graph graph :data data))
;;       (let [graph (new g6/graph (-> (assoc opts :container "graph-2d") bean/->js))]
;;         (.render graph)
;;         (assoc state :graph graph :data data)))))

(defn click-handle [node event focus-nodes]
  (let [page-name (string/lower-case node)
        focus-nodes (map string/lower-case focus-nodes)
        event (gobj/get event "originalEvent")]
    (if (gobj/get event "shiftKey")
      (let [repo (state/get-current-repo)
            page (db/entity repo [:block/name page-name])]
        (state/sidebar-add-block!
         repo
         (:db/id page)
         :page
         {:page page}))
      (when (contains? (set focus-nodes) page-name) ; already selected
       (route-handler/redirect! {:to :page
                                 :path-params {:name page-name}})))))

(defn- render!
  [state]
  (let [[opts handler] (:rum/args state)
        data (:data opts)]
    (when-let [graph (:graph state)]
      (.destroy graph))
    (let [graph (new g6/graph (-> (assoc opts :container "graph-2d") bean/->js))]
      (.render graph)
      ;; TODO: dblclick
      (.on graph "node:click"
           (fn [e]
             (when-let [id (.get (.-item e) "id")]
               (when-let [f (:on-click-node handler)]
                 (click-handle id e @(:focus-nodes handler))
                 (f id)))))
      (assoc state :graph graph :data data))))

(rum/defc graph-2d <
  {:did-mount render!
   :did-update (fn [state]
                 (render! state))
   :should-update (fn [old-state new-state]
                    (not= (first (:rum/args old-state))
                          (first (:rum/args new-state))))}
  [opts handler]
  [:div#graph-2d])

(defn build-graph-data
  [{:keys [edges nodes]}]
  (let [nodes (mapv
               (fn [node]
                 (let [edges (filter (fn [{:keys [source target]}]
                                       (let [node (:id node)]
                                         (or (= source node) (= target node)))) edges)]
                   (assoc node
                          :neighbors (vec
                                      (distinct
                                       (->>
                                        (concat
                                         (mapv :source edges)
                                         (mapv :target edges))
                                        (remove #(= (:id node) %)))))
                          :edges (vec edges))))
               nodes)]
    {:edges edges
     :nodes nodes}))

;; (defn build-graph-opts
;;   [graph dark? option]
;;   nil)

;; (defn build-graph-opts
;;   [graph dark? option]
;;   (let [nodes-count (count (:nodes graph))
;;         graph-data (build-graph-data graph)]
;;     (-> (merge
;;          {:graphData (bean/->js graph-data)
;;           ;; :nodeRelSize node-r
;;           :linkWidth (fn [link]
;;                        (let [link {:source (gobj/get link "source")
;;                                    :target (gobj/get link "target")}]
;;                          (if (contains? @highlight-links link) 5 1)))
;;           :linkDirectionalParticles 2
;;           :linkDirectionalParticleWidth (fn [link]
;;                                           (let [link {:source (-> (gobj/get link "source")
;;                                                                   (gobj/get "id"))
;;                                                       :target (-> (gobj/get link "target")
;;                                                                   (gobj/get "id"))}]
;;                                             (if (contains? @highlight-links link) 2 0)))
;;           :onNodeHover on-node-hover
;;           :onLinkHover on-link-hover
;;           :nodeLabel "id"
;;           :linkColor (fn [] (if dark? "rgba(255,255,255,0.2)" "rgba(0,0,0,0.1)"))
;;           :onZoom (fn [z]
;;                     (let [k (:k (bean/->clj z))]
;;                       (reset! graph-mode
;;                               (cond
;;                                 (< k 0.4)
;;                                 :dot

;;                                 :else
;;                                 :dot-text))))
;;           :onNodeClick (fn [node event]
;;                          (let [page-name (string/lower-case (gobj/get node "id"))]
;;                            (if (gobj/get event "shiftKey")
;;                              (let [repo (state/get-current-repo)
;;                                    page (db/entity repo [:block/name page-name])]
;;                                (state/sidebar-add-block!
;;                                 repo
;;                                 (:db/id page)
;;                                 :page
;;                                 {:page page}))
;;                              (route-handler/redirect! {:to :page
;;                                                        :path-params {:name page-name}}))))
;;           ;; :cooldownTicks 100
;;           ;; :onEngineStop (fn []
;;           ;;                 (when-let [ref (:ref-atom option)]
;;           ;;                   (.zoomToFit @ref 400)))
;;           :nodeCanvasObject
;;           (fn [node ^CanvasRenderingContext2D ctx global-scale]
;;             (dot-text-mode node ctx global-scale dark?))}
;;          option)
;;         bean/->js)))
