(ns frontend.extensions.graph.pixi.logic
  (:require [clojure.string :as string]))

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
