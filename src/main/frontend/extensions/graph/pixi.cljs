(ns frontend.extensions.graph.pixi
  (:require [cljs-bean.core :as bean]
            ["d3-force"
             :refer [forceCenter forceCollide forceLink forceManyBody forceSimulation forceX forceY]
             :as    force]
            [goog.object :as gobj]
            ["graphology" :as graphology]
            ["pixi-graph-fork" :as Pixi-Graph]))

(def Graph (gobj/get graphology "Graph"))

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
  {:node {:size   (fn [node]
                    (or (.-size node) 8))
          :border {:width 0}
          :color  (fn [node]
                    (if-let [parent (gobj/get node "parent")]
                      (when-let [parent (if (= parent "ls-selected-nodes")
                                          parent
                                          (.-id node))]
                        (let [v (js/Math.abs (hash parent))]
                          (nth colors (mod v (count colors)))))
                      (.-color node)))
          :label  {:content  (fn [node] (.-id node))
                   :type     (.-TEXT (.-TextType Pixi-Graph))
                   :fontSize 12
                   :color (if dark? "rgba(255, 255, 255, 0.8)" "rgba(0, 0, 0, 0.8)")
                   ;                  :backgroundColor "rgba(255, 255, 255, 0.5)"
                   :padding  4}}
   :edge {:width 1
          :color (if dark? "#094b5a" "#cccccc")}})

(defn default-hover-style
  [dark?]
  {:node {:color  "#6366F1"
          :border {:width 2
                   :color "#6366F1"}
          :label  {:backgroundColor "rgba(238, 238, 238, 1)"
                   :color           "#333333"}}
   :edge {:color "#A5B4FC"}})

(defn layout!
  [nodes links]
  (let [simulation (forceSimulation nodes)]
    (-> simulation
        (.force "link"
                (-> (forceLink)
                    (.id (fn [d] (.-id d)))
                    (.distance 180)
                    (.links links)))
        (.force "charge"
                (-> (forceManyBody)
                    (.distanceMax 4000)
                    (.theta 0.5)
                    (.strength -600)))
        (.force "collision"
                (-> (forceCollide)
                    (.radius (+ 8 18))))
        (.force "x" (-> (forceX 0) (.strength 0.02)))
        (.force "y" (-> (forceY 0) (.strength 0.02)))
        (.force "center" (forceCenter))
        (.tick 3)
        (.stop))))

(defonce *graph-instance (atom nil))

(defn- clear-nodes!
  [graph]
  (.forEachNode graph
                (fn [node]
                  (.dropNode graph node))))

(defn destroy-instance!
  []
  (when-let [instance (:pixi @*graph-instance)]
    (.destroy instance)
    (reset! *graph-instance nil)))

(defonce *dark? (atom nil))

(defn render!
  [state]
  (let [dark? (:dark? (first (:rum/args state)))]
    (when (and (some? @*dark?) (not= @*dark? dark?))
      (destroy-instance!))
    (reset! *dark? dark?))

  (try
    (let [old-instance         @*graph-instance
          {:keys [graph pixi]} old-instance]
      (when (and graph pixi)
            (clear-nodes! graph))
      (let [{:keys [nodes links style hover-style height register-handlers-fn dark?]} (first (:rum/args state))
            style                                                                     (or style (default-style dark?))
            hover-style                                                               (or hover-style (default-hover-style dark?))
            graph                                                                     (or graph (Graph.))
            nodes-set                                                                 (set (map :id nodes))
            links                                                                     (->>
                                                                                        (filter
                                                                                          (fn [link]
                                                                                            (and (nodes-set (:source link)) (nodes-set (:target link))))
                                                                                          links)
                                                                                        (distinct))
            nodes                                                                     (remove nil? nodes)
            links                                                                     (remove (fn [{:keys [source target]}] (or (nil? source) (nil? target))) links)
            nodes-js                                                                  (bean/->js nodes)
            links-js                                                                  (bean/->js links)]
        (layout! nodes-js links-js)
        (doseq [node nodes-js]
          (.addNode graph (.-id node) node))
        (doseq [link links-js]
          (let [source (.-id (.-source link))
                target (.-id (.-target link))]
            (.addEdge graph source target link)))
        (if pixi
          (.resetView pixi)
          (when-let [container-ref (:ref state)]
            (let [pixi-graph (new (.-PixiGraph Pixi-Graph)
                                  (bean/->js
                                   {:container  @container-ref
                                    :graph      graph
                                    :style      style
                                    :hoverStyle hover-style
                                    :height     height}))]
              (reset! *graph-instance
                      {:graph graph
                       :pixi  pixi-graph})
              (when register-handlers-fn
                (register-handlers-fn pixi-graph)))))))
    (catch js/Error e
      (js/console.error e)))
  state)
