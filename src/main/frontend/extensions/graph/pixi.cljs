(ns frontend.extensions.graph.pixi
  (:require [cljs-bean.core :as bean]
            ["d3-force"
             :refer [forceCenter forceCollide forceLink forceManyBody forceSimulation forceX forceY]
             :as    force]
            [goog.object :as gobj]
            ["graphology" :as graphology]
            ["pixi-graph-fork" :as Pixi-Graph]))

(defonce *graph-instance (atom nil))
(defonce *simulation (atom nil))

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
                   :padding  4}}
   :edge {:width 1
          :color (if dark? "#094b5a" "#cccccc")}})

(defn default-hover-style
  [_dark?]
  {:node {:color  "#6366F1"
          :label  {:backgroundColor "rgba(238, 238, 238, 1)"
                   :color           "#333333"}}
   :edge {:color "#A5B4FC"}})

(defn layout!
  [nodes links]
  (let [nodes-count (count nodes)
        simulation (forceSimulation nodes)]
    (-> simulation
        (.force "link"
                (-> (forceLink)
                    (.id (fn [d] (.-id d)))
                    (.distance 180)
                    (.links links)))
        (.force "charge"
                (-> (forceManyBody)
                    (.distanceMax (if (> nodes-count 500) 4000 600))
                    (.theta 0.5)
                    (.strength -600)))
        (.force "collision"
                (-> (forceCollide)
                    (.radius (+ 8 18))
                    (.iterations 2)))
        (.force "x" (-> (forceX 0) (.strength 0.02)))
        (.force "y" (-> (forceY 0) (.strength 0.02)))
        (.force "center" (forceCenter))
        (.velocityDecay 0.8))
    (reset! *simulation simulation)
    simulation))

(defn- clear-nodes!
  [graph]
  (.forEachNode graph
                (fn [node]
                  (.dropNode graph node))))

;; (defn- clear-edges!
;;   [graph]
;;   (.forEachEdge graph
;;                 (fn [edge]
;;                   (.dropEdge graph edge))))

(defn destroy-instance!
  []
  (when-let [instance (:pixi @*graph-instance)]
    (.destroy instance)
    (reset! *graph-instance nil)
    (reset! *simulation nil)))

(defn- update-position!
  [node obj]
  (when node
    (try
      (.updatePosition node #js {:x (.-x obj)
                                 :y (.-y obj)})
      (catch :default e
        (js/console.error e)))))

(defn- tick!
  [pixi _graph nodes-js links-js]
  (fn []
    (try
      (let [nodes-objects (.getNodesObjects pixi)
            edges-objects (.getEdgesObjects pixi)]
        (doseq [node nodes-js]
          (when-let [node-object (.get nodes-objects (.-id node))]
            (update-position! node-object node)))
        (doseq [edge links-js]
          (when-let [edge-object (.get edges-objects (str (.-index edge)))]
            (.updatePosition edge-object
                             #js {:x (.-x (.-source edge))
                                  :y (.-y (.-source edge))}
                             #js {:x (.-x (.-target edge))
                                  :y (.-y (.-target edge))}))))
      (catch :default e
        (js/console.error e)
        nil))))

(defn- set-up-listeners!
  [pixi-graph]
  (when pixi-graph
    ;; drag start
    (let [*dragging? (atom false)
          nodes (.getNodesObjects pixi-graph)
          on-drag-end (fn [_node event]
                        (.stopPropagation event)
                        (when-let [s @*simulation]
                          (when-not (.-active event)
                            (.alphaTarget s 0)))
                        (reset! *dragging? false))]
      (.on pixi-graph "nodeMousedown"
           (fn [event node-key]
             #_:clj-kondo/ignore
             (when-let [node (.get nodes node-key)]
               (when-let [s @*simulation]
                 (when-not (.-active event)
                   (-> (.alphaTarget s 0.3)
                       (.restart))
                   (js/setTimeout #(.alphaTarget s 0) 2000))
                 (reset! *dragging? true)))))

      (.on pixi-graph "nodeMouseup"
           (fn [event node-key]
             (when-let [node (.get nodes node-key)]
               (on-drag-end node event))))

      (.on pixi-graph "nodeMousemove"
           (fn [event node-key]
             (when-let [node (.get nodes node-key)]
               (when @*dragging?
                 (update-position! node event))))))))

(defn render!
  [state]
  (try
    (when @*graph-instance
      (clear-nodes! (:graph @*graph-instance))
      (destroy-instance!))
    (let [{:keys [nodes links style hover-style height register-handlers-fn dark?]} (first (:rum/args state))
          style                                                                     (or style (default-style dark?))
          hover-style                                                               (or hover-style (default-hover-style dark?))
          graph                                                                     (Graph.)
          nodes-set                                                                 (set (map :id nodes))
          links                                                                     (->>
                                                                                     (filter
                                                                                      (fn [link]
                                                                                        (and (nodes-set (:source link)) (nodes-set (:target link))))
                                                                                      links)
                                                                                     (distinct)) ;; #3331 (@zhaohui0923) seems caused by duplicated links. Why distinct doesn't work?
          nodes                                                                     (remove nil? nodes)
          links                                                                     (remove (fn [{:keys [source target]}] (or (nil? source) (nil? target))) links)
          nodes-js                                                                  (bean/->js nodes)
          links-js                                                                  (bean/->js links)
          simulation                                                                (layout! nodes-js links-js)]
      (doseq [node nodes-js]
        (try (.addNode graph (.-id node) node)
          (catch :default e
            (js/console.error e))))
      (doseq [link links-js]
        (let [source (.-id (.-source link))
              target (.-id (.-target link))]
          (try (.addEdge graph source target link)
            (catch :default e
              (js/console.error e)))))
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
            (register-handlers-fn pixi-graph))
          (set-up-listeners! pixi-graph)
          (.on simulation "tick" (tick! pixi-graph graph nodes-js links-js)))))
    (catch :default e
      (js/console.error e)))
  state)
