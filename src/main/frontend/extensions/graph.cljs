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
            [frontend.util :as util]))

(defonce clicked-page-timestamps (atom nil))

(defn on-click-handler [graph node event *focus-nodes]
  (let [page-name (string/lower-case node)]
    ;; shift+click to select the page
    (if (gobj/get event "shiftKey")
      (do
        (swap! *focus-nodes
              (fn [v]
                (vec (distinct (conj v node)))))

        ;; highlight current node
        (let [node-attributes (-> (.getNodeAttributes (.-graph graph) node)
                                  (bean/->clj))]
          (.setNodeAttribute (.-graph graph) node "parent" "ls-selected-nodes")))

      ;; double click to go to the page
      (let [last-time (get @clicked-page-timestamps page-name)
            new-time (util/time-ms)]
        (swap! clicked-page-timestamps assoc page-name new-time)
        (when (and last-time
                   (< (- new-time last-time) 300))
          (route-handler/redirect! {:to :page
                                    :path-params {:name page-name}}))))))

(rum/defcs graph-2d <
  (rum/local nil :ref)
  {:did-mount pixi/render!
   :did-update pixi/render!
   :should-update (fn [old new]
                    (not=
                     (dissoc (first (:rum/args old)) :register-handlers-fn)
                     (dissoc (first (:rum/args new)) :register-handlers-fn)))
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

(defn build-graph-data
  [{:keys [links nodes]}]
  (let [nodes (mapv
               (fn [node]
                 (let [links (filter (fn [{:keys [source target]}]
                                       (let [node (:id node)]
                                         (or (= source node) (= target node)))) links)]
                   (assoc node
                          :neighbors (vec
                                      (distinct
                                       (->>
                                        (concat
                                         (mapv :source links)
                                         (mapv :target links))
                                        (remove #(= (:id node) %)))))
                          :links (vec links))))
               nodes)]
    {:links links
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
