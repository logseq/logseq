(ns frontend.extensions.graph.pixi.logic
  (:require ["d3-force" :as d3-force]
            [clojure.string :as string]))

(defn next-visibility-state
  [{:keys [detail-expanded? label-visible?]} scale
   {:keys [show-detail-scale hide-detail-scale show-label-scale hide-label-scale]}]
  (let [detail-expanded? (cond
                           (and (not detail-expanded?)
                                (>= scale show-detail-scale)) true
                           (and detail-expanded?
                                (<= scale hide-detail-scale)) false
                           :else detail-expanded?)
        label-visible? (cond
                         (and (not label-visible?)
                              (>= scale show-label-scale)) true
                         (and label-visible?
                              (<= scale hide-label-scale)) false
                         :else label-visible?)]
    {:detail-expanded? detail-expanded?
     :label-visible? label-visible?}))

(defn- node-priority
  [node]
  [(if (= "tag" (:kind node)) 0 1)
   (- (or (:degree node) 0))
   (str (or (:id node) ""))])

(defn- visible-node?
  [node {:keys [min-x min-y max-x max-y]}]
  (and (string? (:label node))
       (not (string/blank? (:label node)))
       (<= min-x (:x node) max-x)
       (<= min-y (:y node) max-y)))

(defn- occupancy-key
  [node {:keys [scale x y]} screen-cell-width screen-cell-height]
  (let [screen-x (+ (* (:x node) scale) x)
        screen-y (+ (* (:y node) scale) y)
        cx (js/Math.floor (/ screen-x screen-cell-width))
        cy (js/Math.floor (/ screen-y screen-cell-height))]
    (str cx ":" cy)))

(defn select-label-node-ids
  [nodes {:keys [viewport transform screen-cell-width screen-cell-height max-labels]
          :or {screen-cell-width 132
               screen-cell-height 24
               max-labels 180}}]
  (loop [remaining (sort-by node-priority (filter #(visible-node? % viewport) nodes))
         occupied #{}
         selected []]
    (if (or (empty? remaining)
            (>= (count selected) max-labels))
      selected
      (let [node (first remaining)
            k (occupancy-key node transform screen-cell-width screen-cell-height)]
        (if (contains? occupied k)
          (recur (rest remaining) occupied selected)
          (recur (rest remaining)
                 (conj occupied k)
                 (conj selected (:id node))))))))

(defn label-display-text
  [label hovered?]
  (let [label (or label "")
        max-prefix-length (if hovered? 96 19)]
    (if (> (count label) max-prefix-length)
      (str (subs label 0 max-prefix-length) "...")
      label)))

(defn connected-drag-weights
  [neighbor-map start-id {:keys [max-depth max-nodes decay min-weight]
                          :or {max-depth 6
                               max-nodes 1200
                               decay 0.72
                               min-weight 0.18}}]
  (loop [queue (conj cljs.core/PersistentQueue.EMPTY [start-id 0])
         depths {start-id 0}]
    (if (or (empty? queue)
            (>= (count depths) max-nodes))
      (reduce-kv
       (fn [m node-id depth]
         (assoc m node-id (max min-weight (js/Math.pow decay depth))))
       {}
       depths)
      (let [[node-id depth] (peek queue)
            queue (pop queue)]
        (if (>= depth max-depth)
          (recur queue depths)
          (let [[queue depths]
                (reduce
                 (fn [[queue* depths*] neighbor-id]
                   (if (contains? depths* neighbor-id)
                     [queue* depths*]
                     [(conj queue* [neighbor-id (inc depth)])
                      (assoc depths* neighbor-id (inc depth))]))
                 [queue depths]
                 (get neighbor-map node-id []))]
            (recur queue depths)))))))

(defn- normalize-view-mode
  [view-mode]
  (if (= view-mode :all-pages)
    :all-pages
    :tags-and-objects))

(defn- color->int
  [hex-color]
  (js/parseInt (subs hex-color 1) 16))

(defn- node-color
  [kind dark?]
  (case kind
    "tag" (if dark? "#34D399" "#047857")
    "object" (if dark? "#60A5FA" "#2563EB")
    "journal" (if dark? "#FBBF24" "#B45309")
    "property" (if dark? "#F59E0B" "#C2410C")
    (if dark? "#94A3B8" "#475569")))

(defn- build-degree-map
  [links]
  (reduce
   (fn [m {:keys [source target]}]
     (-> m
         (update source (fnil inc 0))
         (update target (fnil inc 0))))
   {}
   links))

(defn- node-radius
  [kind degree]
  (let [base (case kind
               "tag" 5.6
               "object" 4.4
               "journal" 4.4
               3.8)]
    (+ base (min 4.2 (js/Math.sqrt (double degree))))))

(defn- decorate-node
  [node degree dark? x y]
  (let [kind (:kind node)
        d (get degree (:id node) 0)
        color (node-color kind dark?)]
    (assoc node
           :x x
           :y y
           :radius (node-radius kind d)
           :degree d
           :color color
           :color-int (color->int color))))

(defn- simulation-node
  [node degree idx]
  (let [d (get degree (:id node) 0)]
    #js {:id (:id node)
         :idx idx
         :kind (:kind node)
         :degree d
         :radius (node-radius (:kind node) d)}))

(defn- simulation-link
  [{:keys [source target]}]
  #js {:source source
       :target target})

(defn- link-distance
  [view-mode]
  (if (= view-mode :tags-and-objects) 58 72))

(defn- charge-strength
  [view-mode]
  (if (= view-mode :tags-and-objects) -95 -125))

(defn- y-strength
  [view-mode]
  (if (= view-mode :tags-and-objects) 0.018 0.025))

(defn layout-nodes
  [nodes links view-mode dark?]
  (let [view-mode (normalize-view-mode view-mode)
        degree (build-degree-map links)
        simulation-nodes (->> nodes
                              (map-indexed #(simulation-node %2 degree %1))
                              (into-array))
        simulation-links (->> links
                              (keep (fn [{:keys [source target] :as link}]
                                      (when (and source target)
                                        (simulation-link link))))
                              (into-array))
        link-force (-> (d3-force/forceLink simulation-links)
                       (.id (fn [^js node] (.-id node)))
                       (.distance (link-distance view-mode))
                       (.strength 0.82))
        collide-force (-> (d3-force/forceCollide)
                          (.radius (fn [^js node]
                                     (+ 10 (.-radius node))))
                          (.strength 0.86)
                          (.iterations 2))
        y-force (d3-force/forceY 0)
        _ (.strength y-force (y-strength view-mode))
        simulation (-> (d3-force/forceSimulation simulation-nodes)
                       (.force "link" link-force)
                       (.force "charge" (-> (d3-force/forceManyBody)
                                             (.strength (charge-strength view-mode))
                                             (.distanceMax 420)))
                       (.force "center" (d3-force/forceCenter 0 0))
                       (.force "collision" collide-force)
                       (.force "y" y-force)
                       (.stop))
        ticks (if (> (count nodes) 1200) 120 220)]
    (dotimes [_ ticks]
      (.tick simulation))
    (->> simulation-nodes
         (map (fn [^js simulation-node]
                (let [node (nth nodes (.-idx simulation-node))]
                  (decorate-node node degree dark? (.-x simulation-node) (.-y simulation-node)))))
         vec)))
