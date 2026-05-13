(ns frontend.extensions.graph.pixi
  (:require ["pixi.js" :as PIXI]
            [clojure.set :as set]
            [clojure.string :as string]
            [frontend.extensions.graph.pixi.logic :as logic]
            [frontend.util :as util]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]))

(defonce ^:private *graph-instances (atom {}))
(defonce ^:private *render-tokens (atom {}))
(defonce ^:private *tabler-icon-codepoint-cache (atom {}))
(def ^:private icon-texture-font-size 96)

(defn- destroy-instance-data!
  [{:keys [cleanup app]}]
  (when (fn? cleanup)
    (cleanup))
  (when-let [^js app app]
    (try
      (.destroy app)
      (catch :default _e
        nil))))

(defn destroy-instance!
  ([]
   (doseq [instance (vals @*graph-instances)]
     (destroy-instance-data! instance))
   (reset! *graph-instances {})
   (reset! *render-tokens {}))
  ([container]
   (when container
     (swap! *render-tokens update container (fnil inc 0))
     (when-let [instance (get @*graph-instances container)]
       (destroy-instance-data! instance))
     (swap! *graph-instances dissoc container))))

(defn- normalize-view-mode
  [view-mode]
  (case view-mode
    :all-pages :all-pages
    :page :page
    :tags-and-objects))

(defn- color->int
  [hex-color]
  (js/parseInt (subs hex-color 1) 16))

(defn- edge-color
  [dark?]
  (if dark? "#64748B" "#94A3B8"))

(defn- label-color
  [dark?]
  (if dark? "#E2E8F0" "#0F172A"))

(defn- edge-label-color
  [dark?]
  (if dark? "#CBD5E1" "#334155"))

(defn- layout-nodes
  [nodes links view-mode dark? opts]
  (logic/layout-nodes nodes links view-mode dark? opts))

(defn- index-layouted-nodes
  [layouted-nodes]
  (let [cell-size 42]
    {:cell-size cell-size
     :grid
     (reduce
      (fn [grid node]
        (let [cx (js/Math.floor (/ (:x node) cell-size))
              cy (js/Math.floor (/ (:y node) cell-size))
              k (str cx ":" cy)]
          (update grid k (fnil conj []) node)))
      {}
      layouted-nodes)}))

(defn- hit-test-node
  [{:keys [grid cell-size]} world-x world-y scale]
  (let [cx (js/Math.floor (/ world-x cell-size))
        cy (js/Math.floor (/ world-y cell-size))
        cells (for [dx [-1 0 1]
                    dy [-1 0 1]]
                (str (+ cx dx) ":" (+ cy dy)))
        candidates (mapcat #(get grid % []) cells)
        max-dist (/ 24 (max scale 0.5))]
    (reduce
     (fn [best node]
       (let [dx (- world-x (:x node))
             dy (- world-y (:y node))
             dist (js/Math.sqrt (+ (* dx dx) (* dy dy)))
             threshold (+ (:radius node) max-dist)
             rank (case (:type node)
                    "taskLabel" -1
                    "collapsed" 0
                    1)
             best-rank (or (:rank best) js/Number.POSITIVE_INFINITY)
             best-dist (or (:dist best) js/Number.POSITIVE_INFINITY)]
         (if (and (<= dist threshold)
                  (or (< rank best-rank)
                      (and (= rank best-rank)
                           (< dist best-dist))))
           {:node node :dist dist :rank rank}
           best)))
     nil
     candidates)))

(defn- create-circle-texture
  []
  (let [size 96
        radius 47
        canvas (.createElement js/document "canvas")
        ctx (.getContext canvas "2d")]
    (set! (.-width canvas) size)
    (set! (.-height canvas) size)
    (set! (.-fillStyle ctx) "#ffffff")
    (.beginPath ctx)
    (.arc ctx (/ size 2) (/ size 2) radius 0 (* 2 js/Math.PI))
    (.fill ctx)
    (.from (.-Texture PIXI) canvas)))

(defn- build-label-candidates
  [layouted-nodes view-mode large-graph?]
  (let [view-mode (normalize-view-mode view-mode)
        ranked (sort-by (fn [node]
                          [(if (= "tag" (:kind node)) 0 1)
                           (- (:degree node 0))])
                        layouted-nodes)
        ranked (if (and large-graph?
                        (= view-mode :tags-and-objects))
                 (filter #(= "tag" (:kind %)) ranked)
                 ranked)
        max-labels (if (= view-mode :tags-and-objects) 1400 900)]
    (take max-labels ranked)))

(defn- world-viewport-rect
  [^js world width height]
  (let [scale (.. world -scale -x)
        x (.-x world)
        y (.-y world)
        padding (/ 24 (max scale 0.5))]
    {:min-x (- (/ (- 0 x) scale) padding)
     :min-y (- (/ (- 0 y) scale) padding)
     :max-x (+ (/ (- width x) scale) padding)
     :max-y (+ (/ (- height y) scale) padding)}))

(defn- expand-viewport
  [{:keys [min-x min-y max-x max-y]} amount]
  {:min-x (- min-x amount)
   :min-y (- min-y amount)
   :max-x (+ max-x amount)
   :max-y (+ max-y amount)})

(defn- node-in-viewport?
  [{:keys [min-x min-y max-x max-y]} {:keys [x y radius]}]
  (let [radius (or radius 0)]
    (and (<= min-x (+ x radius))
         (<= (- x radius) max-x)
         (<= min-y (+ y radius))
         (<= (- y radius) max-y))))

(defn- screen-point
  [^js world x y]
  (let [scale (.. world -scale -x)]
    {:x (+ (* x scale) (.-x world))
     :y (+ (* y scale) (.-y world))
     :scale scale}))

(def ^:private tag-focus-name-scale 0.56)
(def ^:private tag-focus-isolate-scale 0.92)
(def ^:private tag-focus-objects-scale 1.28)
(def ^:private tag-focus-max-screen-distance 180)
(def ^:private tag-object-min-display-count 28)
(def ^:private tag-object-max-display-count 220)
(def ^:private tag-object-screen-area-per-node 1500)
(def ^:private tag-object-grid-columns 9)
(def ^:private tag-object-grid-rows 7)
(def ^:private grid-tag-object-max-per-group 36)
(def ^:private grid-tag-object-max-total 900)
(def ^:private page-node-scale 0.72)
(def ^:private edge-label-visible-scale 0.82)
(def ^:private navigation-idle-ms 90)
(def ^:private node-transition-speed 0.22)
(def ^:private task-status-background-context-limit 900)

(defn- tag-focus-level
  [scale]
  (cond
    (>= scale tag-focus-objects-scale) :objects
    (>= scale tag-focus-isolate-scale) :isolate
    (>= scale tag-focus-name-scale) :name
    :else nil))

(defn- edge-detail-view-mode?
  [view-mode]
  (contains? #{:all-pages :page} view-mode))

(defn- distance-squared
  [ax ay bx by]
  (let [dx (- ax bx)
        dy (- ay by)]
    (+ (* dx dx) (* dy dy))))

(defn- tag-context-radius
  [layout-by-id tag-id node-ids]
  (let [tag-node (get layout-by-id tag-id)
        center-x (or (:cluster-x tag-node) (:x tag-node) 0)
        center-y (or (:cluster-y tag-node) (:y tag-node) 0)]
    (->> node-ids
         (keep #(get layout-by-id %))
         (map (fn [{:keys [x y radius]}]
                (+ (js/Math.sqrt (distance-squared (or x center-x)
                                                   (or y center-y)
                                                   center-x
                                                   center-y))
                   (or radius 0)
                   44)))
         (reduce max 84))))

(defn- tag-object-display-budget
  [layout-by-id tag-id context-node-ids object-count scale width height]
  (let [screen-radius (* scale (tag-context-radius layout-by-id tag-id context-node-ids))
        viewport-radius (* 0.48 (max 1 (min width height)))
        effective-radius (-> screen-radius
                             (min viewport-radius)
                             (max 128))
        area (* js/Math.PI effective-radius effective-radius)
        budget (js/Math.floor (/ area tag-object-screen-area-per-node))
        budget (* 12 (js/Math.ceil (/ budget 12)))]
    (-> budget
        (max tag-object-min-display-count)
        (min tag-object-max-display-count)
        (min object-count))))

(defn- tag-object-grid-cell
  [{:keys [min-x min-y width height]} node]
  (let [x-ratio (/ (- (or (:x node) min-x) min-x) width)
        y-ratio (/ (- (or (:y node) min-y) min-y) height)
        col (-> (js/Math.floor (* x-ratio tag-object-grid-columns))
                (max 0)
                (min (dec tag-object-grid-columns)))
        row (-> (js/Math.floor (* y-ratio tag-object-grid-rows))
                (max 0)
                (min (dec tag-object-grid-rows)))]
    [row col]))

(defn- balanced-object-node-ids
  [layout-by-id tag-id object-ids limit]
  (let [tag-node (get layout-by-id tag-id)
        center-x (or (:cluster-x tag-node) (:x tag-node) 0)
        center-y (or (:cluster-y tag-node) (:y tag-node) 0)
        objects (->> object-ids
                     (keep (fn [id]
                             (when-let [node (get layout-by-id id)]
                               (assoc node :id id)))))
        bounds (reduce (fn [bounds {:keys [x y]}]
                         {:min-x (min (:min-x bounds) (or x center-x))
                          :min-y (min (:min-y bounds) (or y center-y))
                          :max-x (max (:max-x bounds) (or x center-x))
                          :max-y (max (:max-y bounds) (or y center-y))})
                       {:min-x js/Infinity
                        :min-y js/Infinity
                        :max-x js/-Infinity
                        :max-y js/-Infinity}
                       objects)
        bounds (assoc bounds
                      :width (max 1 (- (:max-x bounds) (:min-x bounds)))
                      :height (max 1 (- (:max-y bounds) (:min-y bounds))))
        buckets (->> objects
                     (map (fn [node]
                            {:id (:id node)
                             :cell (tag-object-grid-cell bounds node)
                             :rank [(distance-squared (or (:x node) center-x)
                                                      (or (:y node) center-y)
                                                      center-x
                                                      center-y)
                                    (- (or (:degree node) 0))
                                    (str (:id node))]}))
                     (group-by :cell)
                     (sort-by first)
                     (mapv (fn [[_ entries]]
                             (sort-by :rank entries))))]
    (loop [buckets buckets
           selected []]
      (if (or (>= (count selected) limit)
              (every? empty? buckets))
        (set (take limit selected))
        (let [[next-buckets next-selected]
              (reduce (fn [[next-buckets selected] bucket]
                        (if (or (empty? bucket)
                                (>= (count selected) limit))
                          [(conj next-buckets bucket) selected]
                          [(conj next-buckets (rest bucket))
                           (conj selected (:id (first bucket)))]))
                      [[] selected]
                      buckets)]
          (recur next-buckets next-selected))))))

(declare visible-node?)
(defn- grid-layout-display-node-ids
  [nodes visible-node-ids*]
  (let [visible-nodes' (filter #(visible-node? visible-node-ids* %) nodes)
        tag-ids (->> visible-nodes'
                     (filter #(= "tag" (:kind %)))
                     (map :id)
                     set)
        object-groups (->> visible-nodes'
                           (filter #(and (:grid-object? %)
                                         (contains? tag-ids (:cluster-id %))))
                           (group-by :cluster-id))
        tag-count (max 1 (count tag-ids))
        per-group-limit (-> (js/Math.floor (/ grid-tag-object-max-total tag-count))
                            (max 8)
                            (min grid-tag-object-max-per-group))
        object-ids (->> object-groups
                        (sort-by first)
                        (mapcat (fn [[_ nodes]]
                                  (->> nodes
                                       (sort-by (juxt #(- (or (:degree %) 0))
                                                      #(str (:id %))))
                                       (take per-group-limit)
                                       (map :id))))
                        (take grid-tag-object-max-total))]
    (set/union tag-ids (set object-ids))))

(defn- nearest-indexed-node-id
  [{:keys [grid cell-size]} world-x world-y scale max-screen-distance]
  (when (and grid cell-size (pos? scale))
    (let [world-radius (/ max-screen-distance scale)
          cell-radius (-> (/ world-radius cell-size)
                          js/Math.ceil
                          (max 1)
                          (min 18))
          cx (js/Math.floor (/ world-x cell-size))
          cy (js/Math.floor (/ world-y cell-size))
          max-dist-sq (* max-screen-distance max-screen-distance)]
      (:id
       (reduce
        (fn [best node]
          (let [dx (* (- (:x node) world-x) scale)
                dy (* (- (:y node) world-y) scale)
                dist-sq (+ (* dx dx) (* dy dy))
                best-dist-sq (or (:dist-sq best) js/Number.POSITIVE_INFINITY)]
            (if (and (<= dist-sq max-dist-sq)
                     (< dist-sq best-dist-sq))
              (assoc node :dist-sq dist-sq)
              best)))
        nil
        (for [dx (range (- cell-radius) (inc cell-radius))
              dy (range (- cell-radius) (inc cell-radius))
              node (get grid (str (+ cx dx) ":" (+ cy dy)))]
          node))))))

(defn- distinct-nodes-by-id
  [nodes]
  (second
   (reduce
    (fn [[seen result] node]
      (let [id (:id node)]
        (if (contains? seen id)
          [seen result]
          [(conj seen id) (conj result node)])))
    [#{} []]
    nodes)))

(defn- ^:large-vars/cleanup-todo create-label-manager!
  [^js label-parent dark? candidate-node-ids get-node-by-id]
  (let [^js label-layer (new (.-Container PIXI))
        style (new (.-TextStyle PIXI)
                   #js {:fontFamily "Inter, Avenir Next, system-ui, sans-serif"
                        :fontSize 11
                        :fill (label-color dark?)
                        :alpha 0.98})
        bg-color (color->int (if dark? "#123F49" "#FFFFFF"))
        border-color (color->int (if dark? "#5E7D88" "#CBD5E1"))
        entry-by-id* (atom {})
        visible-ids* (atom #{})
        position-entry! (fn [^js world id hovered-node-id focused-node-id]
                          (when-let [{:keys [x y radius kind]} (get-node-by-id id)]
                            (when-let [entry (get @entry-by-id* id)]
                              (let [^js text-node (:text entry)
                                    ^js container-node (:container entry)
                                    scale (.. world -scale -x)
                                    tag-label? (= "tag" kind)
                                    inverse-scale (/ 1 (max scale 0.0001))
                                    hovered? (= id hovered-node-id)
                                    focused? (= id focused-node-id)
                                    title-scale (cond
                                                  hovered? 1.22
                                                  focused? 1.16
                                                  tag-label? 1.08
                                                  :else 1.0)
                                    label-scale (* title-scale inverse-scale)
                                    label-width (+ (.-width text-node) 8)
                                    label-height (+ (.-height text-node) 4)
                                    label-world-width (* label-width label-scale)
                                    label-world-height (* label-height label-scale)]
                                (set! (.-x text-node) 1)
                                (set! (.-y text-node) 0)
                                (set! (.. container-node -scale -x) label-scale)
                                (set! (.. container-node -scale -y) label-scale)
                                (if tag-label?
                                  (do
                                    (set! (.-x container-node) (- x (/ label-world-width 2)))
                                    (set! (.-y container-node) (- y (/ label-world-height 2))))
                                  (do
                                    (set! (.-x container-node) (+ x radius 8))
                                    (set! (.-y container-node) (- y (/ label-world-height 2)))))))))]
    (set! (.-alpha label-layer) 0)
    (set! (.-visible label-layer) false)
    (.addChild label-parent label-layer)
    {:container label-layer
     :update! (fn [^js world width height hovered-node-id {:keys [node-visible?
                                                                  hovered-only?
                                                                  selected-node-ids
                                                                  active-node-ids
                                                                  focused-node-id
                                                                  focused-node-ids
                                                                  focused-only?
                                                                  selected-only?
                                                                  active-only?]
                                                           :or {hovered-only? false
                                                                selected-node-ids #{}
                                                                active-node-ids #{}
                                                                focused-node-ids #{}
                                                                focused-only? false
                                                                selected-only? false
                                                                active-only? false}}]
                (let [node-visible? (or node-visible? (constantly true))
                      scale (.. world -scale -x)
                      viewport (world-viewport-rect world width height)
                      transform {:scale scale
                                 :x (.-x world)
                                 :y (.-y world)}
                      base-candidates (if focused-only?
                                        []
                                        (->> candidate-node-ids
                                             (keep get-node-by-id)
                                             (filter node-visible?)))
                      active-nodes (->> active-node-ids
                                        (keep get-node-by-id)
                                        (filter node-visible?))
                      focused-nodes (->> focused-node-ids
                                         (keep get-node-by-id)
                                         (filter node-visible?))
                      selected-nodes (->> selected-node-ids
                                          (keep get-node-by-id)
                                          (filter node-visible?))
                      hovered-node (when hovered-node-id
                                     (get-node-by-id hovered-node-id))
                      hovered-node (when (and hovered-node
                                              (node-visible? hovered-node))
                                     hovered-node)
                      candidates (distinct-nodes-by-id
                                  (cond-> (vec (concat base-candidates
                                                       active-nodes
                                                       focused-nodes))
                                    hovered-node
                                    (conj hovered-node)))
                      candidate-id-set (set (map :id candidates))
                      active-visible-ids (->> active-nodes
                                              (map :id)
                                              (filter #(contains? candidate-id-set %)))
                      selected-visible-ids (->> selected-nodes
                                                (map :id)
                                                (filter #(contains? candidate-id-set %)))
                      base-label-ids (logic/select-label-node-ids
                                      candidates
                                      {:viewport viewport
                                       :transform transform
                                       :screen-cell-width 140
                                       :screen-cell-height 26
                                       :max-labels (if (> scale 2.1) 240 170)})
                      focused-label-ids (when (and focused-node-id
                                                   (contains? candidate-id-set focused-node-id))
                                          (distinct
                                           (concat [focused-node-id]
                                                   base-label-ids)))
                      label-ids (cond
                                  selected-only?
                                  (cond-> (vec selected-visible-ids)
                                    (and hovered-node-id
                                         (contains? candidate-id-set hovered-node-id)
                                         (not (some #(= hovered-node-id %) selected-visible-ids)))
                                    (conj hovered-node-id))

                                  active-only?
                                  (cond-> (vec active-visible-ids)
                                    (and hovered-node-id
                                         (contains? candidate-id-set hovered-node-id)
                                         (not (some #(= hovered-node-id %) active-visible-ids)))
                                    (conj hovered-node-id))

                                  (and hovered-only?
                                       hovered-node-id
                                       (contains? candidate-id-set hovered-node-id))
                                  [hovered-node-id]

                                  (and hovered-node-id
                                       (contains? candidate-id-set hovered-node-id))
                                  (cons hovered-node-id
                                        (remove #(= hovered-node-id %)
                                                (or focused-label-ids base-label-ids)))

                                  focused-label-ids
                                  focused-label-ids

                                  :else
                                  base-label-ids)
                      label-id-set (set label-ids)]
                  (doseq [id label-ids]
                    (when-let [{:keys [label]} (get-node-by-id id)]
                      (let [entry (or (get @entry-by-id* id)
                                      (let [^js entry-container (new (.-Container PIXI))
                                            ^js bg (new (.-Graphics PIXI))
                                            ^js text (new (.-Text PIXI)
                                                          #js {:text ""
                                                               :style style})]
                                        (.addChild entry-container bg)
                                        (.addChild entry-container text)
                                        (.addChild label-layer entry-container)
                                        (let [entry* {:container entry-container
                                                      :background bg
                                                      :text text
                                                      :hovered? false}]
                                          (swap! entry-by-id* assoc id entry*)
                                          entry*)))
                            hovered? (= id hovered-node-id)
                            ^js text-node (:text entry)
                            ^js bg-node (:background entry)
                            ^js container-node (:container entry)
                            focused? (= id focused-node-id)
                            full-label? (or hovered? focused?)
                            display-text (logic/label-display-text label full-label?)]
                        (when (or (not= display-text (.-text text-node))
                                  (not= full-label? (:hovered? entry)))
                          (set! (.-text text-node) display-text)
                          (.clear bg-node)
                          (.roundRect bg-node
                                      -3
                                      -2
                                      (+ (.-width text-node) 8)
                                      (+ (.-height text-node) 4)
                                      4)
                          (.fill bg-node #js {:color bg-color
                                              :alpha (if full-label? 0.88 0.68)})
                          (.setStrokeStyle bg-node
                                           #js {:width 1
                                                :color border-color
                                                :alpha (if full-label? 0.36 0.18)})
                          (.stroke bg-node)
                          (swap! entry-by-id* assoc id (assoc entry :hovered? full-label?)))
                        (position-entry! world id hovered-node-id focused-node-id)
                        (when hovered?
                          (.setChildIndex label-layer
                                          container-node
                                          (dec (.-length (.-children label-layer))))
                          (set! (.-alpha container-node) 1))
                        (set! (.-visible container-node) true))))
                  (doseq [id @visible-ids*]
                    (when-not (contains? label-id-set id)
                      (when-let [entry (get @entry-by-id* id)]
                        (set! (.-visible (:container entry)) false))))
                  (reset! visible-ids* label-id-set)))
     :sync-transform! (fn [^js world hovered-node-id focused-node-id]
                        (doseq [id @visible-ids*]
                          (position-entry! world id hovered-node-id focused-node-id)))
     :has-visible-labels? #(seq @visible-ids*)
     :destroy! (fn []
                 (doseq [[_ {:keys [^js container]}] @entry-by-id*]
                   (.destroy container))
                 (reset! entry-by-id* {})
                 (reset! visible-ids* #{}))}))

(def ^:private task-edge-alpha-by-type
  {"root-to-task" 0.28
   "task-relation" 0.34
   "root-to-group" 0.42
   "group-to-task" 0.14})

(def ^:private task-edge-width-by-type
  {"root-to-task" 0.95
   "task-relation" 1.05
   "root-to-group" 1.10
   "group-to-task" 0.75})

(def ^:private task-edge-curve-offset-by-type
  {"root-to-task" 10
   "task-relation" 18})

(defn- edge-alpha
  [{:keys [selected-ids active-ids select-mode?]} {:keys [source target edge/type]}]
  (or (get task-edge-alpha-by-type type)
      (cond
        (not select-mode?) 0.54
        (or (and (contains? selected-ids source)
                 (contains? active-ids target))
            (and (contains? selected-ids target)
                 (contains? active-ids source))) 0.82
        (and (contains? active-ids source)
             (contains? active-ids target)) 0.46
        :else 0.18)))

(defn- edge-stroke-width
  [type select-mode?]
  (or (get task-edge-width-by-type type)
      (if select-mode? 1.25 1)))

(defn- edge-curve-offset
  [type]
  (get task-edge-curve-offset-by-type type 0))

(defn- edge-label-display-scale
  [world-scale]
  (-> (+ 1 (* 0.16 (- (max 1 world-scale) 1)))
      (max 1)
      (min 1.42)))

(defn- edge-label-gap-width
  [label]
  (let [label (logic/label-display-text label false)
        ;; Keep the gap in world units so it zooms with the edge instead of
        ;; recalculating margins while the camera is moving.
        width (+ 8 (* 3.2 (count label)))]
    (-> width
        (max 20)
        (min 72))))

(defn- edge-segment
  [from-node to-node parallel-offset]
  (let [dx (- (:x to-node) (:x from-node))
        dy (- (:y to-node) (:y from-node))
        distance (max 1 (js/Math.sqrt (+ (* dx dx) (* dy dy))))
        ux (/ dx distance)
        uy (/ dy distance)
        normal-x (- uy)
        normal-y ux
        line-offset (* (or parallel-offset 0) 5)
        start-x (+ (:x from-node)
                   (* ux (+ (:radius from-node 0) 3))
                   (* normal-x line-offset))
        start-y (+ (:y from-node)
                   (* uy (+ (:radius from-node 0) 3))
                   (* normal-y line-offset))
        end-x (+ (- (:x to-node)
                    (* ux (+ (:radius to-node 0) 5)))
                 (* normal-x line-offset))
        end-y (+ (- (:y to-node)
                    (* uy (+ (:radius to-node 0) 5)))
                 (* normal-y line-offset))
        segment-dx (- end-x start-x)
        segment-dy (- end-y start-y)
        segment-distance (max 1 (js/Math.sqrt (+ (* segment-dx segment-dx)
                                                  (* segment-dy segment-dy))))]
    {:ux ux
     :uy uy
     :start-x start-x
     :start-y start-y
     :end-x end-x
     :end-y end-y
     :mid-x (/ (+ start-x end-x) 2)
     :mid-y (/ (+ start-y end-y) 2)
     :segment-distance segment-distance}))

(defn- point-segment-distance-squared
  [px py ax ay bx by]
  (let [dx (- bx ax)
        dy (- by ay)
        length-squared (+ (* dx dx) (* dy dy))
        t (if (pos? length-squared)
            (-> (/ (+ (* (- px ax) dx)
                      (* (- py ay) dy))
                   length-squared)
                (max 0)
                (min 1))
            0)
        closest-x (+ ax (* t dx))
        closest-y (+ ay (* t dy))]
    (distance-squared px py closest-x closest-y)))

(defn- hit-test-edge
  [layout-by-id links world-x world-y scale]
  (let [threshold (/ 10 (max scale 0.1))
        threshold-squared (* threshold threshold)]
    (->> (logic/edge-render-runs links false)
         (keep (fn [{:keys [source target parallel-offset] :as link}]
                 (when-let [from-node (get layout-by-id source)]
                   (when-let [to-node (get layout-by-id target)]
                     (let [{:keys [start-x start-y end-x end-y]}
                           (edge-segment from-node to-node parallel-offset)
                           edge-distance-squared (point-segment-distance-squared
                                                  world-x
                                                  world-y
                                                  start-x
                                                  start-y
                                                  end-x
                                                  end-y)]
                       (when (<= edge-distance-squared threshold-squared)
                         (assoc link :hit-distance-squared edge-distance-squared)))))))
         (sort-by :hit-distance-squared)
         first)))

(defn- draw-edges!
  ([^js graphics layout-by-id links dark? view-mode]
   (draw-edges! graphics layout-by-id links dark? view-mode (logic/highlight-state #{} {}) {}))
  ([^js graphics layout-by-id links dark? view-mode highlight-state]
   (draw-edges! graphics layout-by-id links dark? view-mode highlight-state {}))
  ([^js graphics layout-by-id links dark? view-mode highlight-state {:keys [show-arrows? show-edge-labels?]}]
   (let [max-edges (logic/draw-edge-limit (count layout-by-id)
                                          (count links)
                                          view-mode)
         links* (if (> (count links) max-edges)
                  (take max-edges links)
                  links)
         stroke-color (color->int (edge-color dark?))
         runs (logic/edge-render-runs links* show-arrows?)]
     (.clear graphics)
     (doseq [{:keys [source target label show-arrow? parallel-offset edge/type] :as run} runs]
       (when-let [from-node (get layout-by-id source)]
         (when-let [to-node (get layout-by-id target)]
           (let [{:keys [ux uy start-x start-y end-x end-y mid-x mid-y segment-distance]}
                 (edge-segment from-node to-node parallel-offset)
                 label-gap? (and show-edge-labels? (seq label))
                 half-gap (when label-gap?
                            (-> (/ (edge-label-gap-width label) 2)
                                (min (/ segment-distance 3))))
                 gap-start-x (when half-gap
                               (- mid-x (* ux half-gap)))
                 gap-start-y (when half-gap
                               (- mid-y (* uy half-gap)))
                 gap-end-x (when half-gap
                             (+ mid-x (* ux half-gap)))
                 gap-end-y (when half-gap
                             (+ mid-y (* uy half-gap)))
                 stroke-width (edge-stroke-width type (:select-mode? highlight-state))
                 curve-offset (edge-curve-offset type)
                 curved? (pos? curve-offset)
                 curve-sign (if (neg? (js/Math.sin (+ (* start-x 0.017) (* end-y 0.013)))) -1 1)
                 control-x (+ mid-x (* (- uy) curve-offset curve-sign))
                 control-y (+ mid-y (* ux curve-offset curve-sign))
                 alpha (edge-alpha highlight-state run)
                 arrow! (fn [tip-x tip-y dir-x dir-y]
                          (let [length 6.8
                                width 3.3
                                base-x (- tip-x (* dir-x length))
                                base-y (- tip-y (* dir-y length))
                                normal-x (- dir-y)
                                normal-y dir-x]
                            (.setStrokeStyle graphics
                                             #js {:width stroke-width
                                                  :color stroke-color
                                                  :alpha alpha
                                                  :cap "round"
                                                  :join "round"})
                            (.moveTo graphics tip-x tip-y)
                            (.lineTo graphics
                                     (+ base-x (* normal-x width))
                                     (+ base-y (* normal-y width)))
                            (.moveTo graphics tip-x tip-y)
                            (.lineTo graphics
                                     (- base-x (* normal-x width))
                                     (- base-y (* normal-y width)))
                            (.stroke graphics)))]
             (.setStrokeStyle graphics
                              #js {:width stroke-width
                                   :color stroke-color
                                   :alpha alpha
                                   :cap "round"
                                   :join "round"})
             (if half-gap
               (do
                 (.moveTo graphics start-x start-y)
                 (.lineTo graphics gap-start-x gap-start-y)
                 (.moveTo graphics gap-end-x gap-end-y)
                 (.lineTo graphics end-x end-y))
               (if curved?
                 (do
                   (.moveTo graphics start-x start-y)
                   (.quadraticCurveTo graphics control-x control-y end-x end-y))
                 (do
                   (.moveTo graphics start-x start-y)
                   (.lineTo graphics end-x end-y))))
             (.stroke graphics)
             (when show-arrow?
               (arrow! end-x end-y ux uy))))))
     (count links*))))

(defn- render-edges!
  [^js container layout-by-id links dark? view-mode render-opts]
  (let [^js graphics (new (.-Graphics PIXI))
        drawn-links (draw-edges! graphics layout-by-id links dark? view-mode (logic/highlight-state #{} {}) render-opts)]
    (.addChild container graphics)
    {:graphics graphics
     :drawn-links drawn-links}))

(defn- destroy-children!
  [^js container]
  (doseq [^js child (array-seq (.removeChildren container))]
    (.destroy child #js {:children true})))

(defn- task-status-accent-color
  [status-key dark?]
  (let [palette (if dark?
                  ["#2DD4BF" "#60A5FA" "#A78BFA" "#86EFAC" "#FBBF24" "#F472B6" "#22D3EE" "#FB7185"]
                  ["#0F766E" "#2563EB" "#7C3AED" "#16A34A" "#B45309" "#BE185D" "#0891B2" "#E11D48"])
        idx (mod (abs (hash (str status-key))) (count palette))]
    (color->int (nth palette idx))))

(defn- task-status-label-target
  [node]
  (assoc node :graph/open-in-sidebar? true))

(defn- set-display-position!
  [^js display {:keys [x y]}]
  (set! (.-x display) x)
  (set! (.-y display) y)
  display)

(defn- draw-rounded-rect!
  [^js graphics x y width height radius fill-style stroke-style]
  (.roundRect graphics x y width height radius)
  (.fill graphics fill-style)
  (when stroke-style
    (.setStrokeStyle graphics stroke-style)
    (.stroke graphics)))

(def ^:private edge-label-limit 420)

(defn- position-edge-label-entry!
  [^js entry ^js world width height layout-by-id]
  (let [source (gobj/get entry "logseqGraphEdgeSource")
        target (gobj/get entry "logseqGraphEdgeTarget")
        parallel-offset (gobj/get entry "logseqGraphEdgeParallelOffset")]
    (if-let [from-node (get layout-by-id source)]
      (if-let [to-node (get layout-by-id target)]
        (let [{:keys [start-x start-y end-x end-y mid-x mid-y]}
              (edge-segment from-node to-node parallel-offset)
              {from-x :x from-y :y} (screen-point world start-x start-y)
              {to-x :x to-y :y} (screen-point world end-x end-y)
              {label-x :x label-y :y} (screen-point world mid-x mid-y)
              dx (- to-x from-x)
              dy (- to-y from-y)
              distance (js/Math.sqrt (+ (* dx dx) (* dy dy)))
              visible? (and (> distance 68)
                            (<= -80 label-x (+ width 80))
                            (<= -40 label-y (+ height 40)))]
          (set! (.-x entry) label-x)
          (set! (.-y entry) label-y)
          (let [label-scale (edge-label-display-scale (.. world -scale -x))]
            (set! (.. entry -scale -x) label-scale)
            (set! (.. entry -scale -y) label-scale))
          (set! (.-rotation entry)
                (logic/readable-edge-label-angle from-x from-y to-x to-y))
          (set! (.-visible entry) visible?))
        (set! (.-visible entry) false))
      (set! (.-visible entry) false))))

(defn- sync-edge-label-transform!
  [^js label-layer ^js world width height layout-by-id]
  (doseq [^js entry (array-seq (.-children label-layer))]
    (position-edge-label-entry! entry world width height layout-by-id)))

(defn- sync-edge-labels!
  [^js label-layer ^js world width height layout-by-id links dark? view-mode show-edge-labels?]
  (destroy-children! label-layer)
  (when show-edge-labels?
    (let [max-edges (logic/draw-edge-limit (count layout-by-id)
                                           (count links)
                                           view-mode)
          style (new (.-TextStyle PIXI)
                     #js {:fontFamily "Inter, Avenir Next, system-ui, sans-serif"
                          :fontSize 10
                          :fontStyle "italic"
                          :fill (edge-label-color dark?)
                          :alpha 0.76})
          labeled-links (->> links
                             (take max-edges)
                             (filter #(seq (:label %)))
                             (take edge-label-limit))
          labeled-runs (logic/edge-render-runs labeled-links false)]
      (doseq [{:keys [source target label parallel-offset]} labeled-runs]
        (when (and (contains? layout-by-id source)
                   (contains? layout-by-id target))
          (let [^js entry (new (.-Container PIXI))
                ^js text (new (.-Text PIXI)
                              #js {:text (logic/label-display-text label false)
                                   :style style})]
            (gobj/set entry "logseqGraphEdgeSource" source)
            (gobj/set entry "logseqGraphEdgeTarget" target)
            (gobj/set entry "logseqGraphEdgeParallelOffset" parallel-offset)
            (when-let [^js anchor (.-anchor text)]
              (set! (.-x anchor) 0.5)
              (set! (.-y anchor) 0.5))
            (set! (.-x text) 0)
            (set! (.-y text) 0)
            (.addChild entry text)
            (set! (.-alpha entry) 0.78)
            (position-edge-label-entry! entry world width height layout-by-id)
            (.addChild label-layer entry))))))
  nil)

(defn- render-edge-labels!
  [^js container ^js world width height layout-by-id links dark? view-mode show-edge-labels?]
  (let [^js label-layer (new (.-Container PIXI))]
    (.addChild container label-layer)
    (sync-edge-labels! label-layer world width height layout-by-id links dark? view-mode show-edge-labels?)
    {:container label-layer
     :sync! (fn
              ([world width height layout-by-id visible-links]
               (sync-edge-labels! label-layer world width height layout-by-id visible-links dark? view-mode show-edge-labels?))
              ([world width height layout-by-id visible-links next-show-edge-labels?]
               (sync-edge-labels! label-layer world width height layout-by-id visible-links dark? view-mode next-show-edge-labels?)))
     :sync-transform! (fn [world width height layout-by-id]
                        (sync-edge-label-transform! label-layer world width height layout-by-id))
     :destroy! #(destroy-children! label-layer)}))

(defn- create-icon-text-style
  [font-family]
  (new (.-TextStyle PIXI)
       #js {:fontFamily font-family
            :fontSize icon-texture-font-size
            :align "center"}))

(defn- icon-value
  [icon k]
  (or (get icon k)
      (get icon (name k))))

(defn- tabler-icon-spec
  [icon]
  (cond
    (and (string? icon) (not (string/blank? icon)))
    {:id icon
     :class-prefix "ti"
     :font-family "tabler-icons, system-ui, sans-serif"}

    (map? icon)
    (let [type (icon-value icon :type)
          id (icon-value icon :id)]
      (when (and (contains? #{:tabler-icon "tabler-icon"
                              :tabler-ext-icon "tabler-ext-icon"} type)
                 (string? id)
                 (not (string/blank? id)))
        (if (contains? #{:tabler-ext-icon "tabler-ext-icon"} type)
          {:id id
           :class-prefix "tie"
           :font-family "tabler-icons-extension, system-ui, sans-serif"}
          {:id id
           :class-prefix "ti"
           :font-family "tabler-icons, system-ui, sans-serif"})))

    :else
    nil))

(defn- css-content->text
  [content]
  (when (and (string? content)
             (not= content "none")
             (not= content "normal"))
    (let [content (string/trim content)
          content (if (and (>= (count content) 2)
                           (contains? #{\" \'} (first content))
                           (= (first content) (last content)))
                    (subs content 1 (dec (count content)))
                    content)]
      (string/replace content
                      #"\\([0-9a-fA-F]{4,6}) ?"
                      (fn [[_ hex]]
                        (js/String.fromCodePoint (js/parseInt hex 16)))))))

(defn- stylesheet-rules
  [^js stylesheet]
  (try
    (some-> (.-cssRules stylesheet) array-seq)
    (catch :default _e
      nil)))

(defn- tabler-icon-codepoint
  [{:keys [id class-prefix]}]
  (when (and (exists? js/document) id class-prefix)
    (let [cache-key (str class-prefix ":" id)
          cache @*tabler-icon-codepoint-cache]
      (if (contains? cache cache-key)
        (get cache cache-key)
        (let [selector (str "." class-prefix "-" id ":before")
              codepoint (some
                         (fn [^js stylesheet]
                           (some
                            (fn [^js rule]
                              (when (= selector (.-selectorText rule))
                                (css-content->text (.. rule -style -content))))
                            (stylesheet-rules stylesheet)))
                         (array-seq (.-styleSheets js/document)))]
          (swap! *tabler-icon-codepoint-cache assoc cache-key codepoint)
          codepoint)))))

(defn- icon-display-spec
  [node]
  (if-let [text (logic/icon-display-text (:icon node))]
    {:kind "emoji"
     :style :emoji
     :text text}
    (when-let [icon-spec (tabler-icon-spec (:icon node))]
      (when-let [text (tabler-icon-codepoint icon-spec)]
        {:kind "icon"
         :style (:font-family icon-spec)
         :text text}))))

(defn- create-icon-text-styles
  []
  {:emoji (create-icon-text-style
           "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, system-ui, sans-serif")
   "tabler-icons, system-ui, sans-serif" (create-icon-text-style
                                          "tabler-icons, system-ui, sans-serif")
   "tabler-icons-extension, system-ui, sans-serif" (create-icon-text-style
                                                    "tabler-icons-extension, system-ui, sans-serif")})

(defn- node-sprite-kind
  [_node]
  "circle")

(defn- create-node-display!
  [{:keys [circle]} icon-styles node]
  (if-let [{:keys [kind style text]} (icon-display-spec node)]
    (let [^js text (new (.-Text PIXI)
                        #js {:text text
                             :style (get icon-styles style)})]
      (gobj/set text "logseqGraphNodeDisplay" kind)
      text)
    (let [kind (node-sprite-kind node)
          ^js sprite (new (.-Sprite PIXI) circle)]
      (gobj/set sprite "logseqGraphNodeDisplay" kind)
      sprite)))

(defn- display-kind
  [^js display]
  (gobj/get display "logseqGraphNodeDisplay"))

(defn- node-display-kind
  [node]
  (if-let [{:keys [kind]} (icon-display-spec node)]
    kind
    (node-sprite-kind node)))

(defn- node-density-alpha
  [node emphasis scale]
  (cond
    (= "tag" (:kind node)) 1.0
    (contains? #{:selected :hovered :connected :preview} emphasis) 1.0
    (:grid-object? node) 0.82
    (>= scale 0.72) 1.0
    (>= (:degree node 0) 8) 0.88
    :else
    (max 0.32 (min 1.0 (+ 0.30 (* scale 0.76))))))

(defn- configure-node-display!
  ([^js display node emphasis]
   (configure-node-display! display node emphasis 1.0 :tags-and-objects))
  ([^js display node emphasis world-scale]
   (configure-node-display! display node emphasis world-scale :tags-and-objects))
  ([^js display node emphasis world-scale view-mode]
   (let [kind (display-kind display)
         icon? (contains? #{"emoji" "icon"} kind)
         emoji? (= "emoji" kind)
         tag? (= "tag" (:kind node))
         tag-circle? (and tag? (= "circle" kind))
         task-center? (:task-center? node)
         display-radius (cond
                          task-center? (:radius node)
                          tag-circle? 8.5
                          :else (:radius node))
         scale (/ (* 2 display-radius) (if icon? icon-texture-font-size 96))
         base-scale (* (if (= view-mode :page) page-node-scale 1.0)
                       (cond
                         task-center? 1.0
                         (and tag? (not tag-circle?)) 1.18
                         :else 1.0))
         emphasis-scale (case emphasis
                          :selected 1.55
                          :hovered 1.42
                          :connected 1.22
                          :preview 1.16
                          :background 0.88
                          1.0)
         alpha (case emphasis
                 :selected 1.0
                 :hovered 1.0
                 :connected 0.95
                 :preview 0.92
                 :background 0.16
                 :dimmed 0.16
                 1.0)
         alpha (* alpha (node-density-alpha node emphasis world-scale))]
     (when-let [^js anchor (.-anchor display)]
       (set! (.-x anchor) 0.5)
       (set! (.-y anchor) 0.5))
     (set! (.-x display) (:x node))
     (set! (.-y display) (:y node))
     (set! (.-tint display) (cond
                              emoji? 0xFFFFFF
                              task-center? (if (= "circle" kind) 0x0B2230 (:color-int node))
                              (= emphasis :background) 0x64748B
                              :else (:color-int node)))
     (set! (.-filters display) nil)
     (gobj/set display "logseqGraphBaseAlpha" alpha)
     (set! (.. display -scale -x) (* scale base-scale emphasis-scale))
     (set! (.. display -scale -y) (* scale base-scale emphasis-scale))
     (set! (.-visible display) true))))

(defn- display-base-alpha
  [^js display]
  (let [alpha (gobj/get display "logseqGraphBaseAlpha")]
    (if (number? alpha) alpha 1.0)))

(defn- set-display-transition-target!
  [^js display target]
  (gobj/set display "logseqGraphTransitionTarget" target)
  (when (pos? target)
    (set! (.-visible display) true)))

(defn- display-transition-target
  [^js display]
  (let [target (gobj/get display "logseqGraphTransitionTarget")]
    (if (number? target) target 1.0)))

(defn- tick-display-transition!
  [^js display]
  (let [target (display-transition-target display)
        base-alpha (display-base-alpha display)
        current-transition (if (pos? base-alpha)
                             (/ (.-alpha display) base-alpha)
                             target)
        next-transition (+ current-transition
                           (* (- target current-transition) node-transition-speed))]
    (set! (.-alpha display) (* base-alpha next-transition))
    (when (and (zero? target)
               (< next-transition 0.02))
      (set! (.-alpha display) 0)
      (set! (.-visible display) false))
    (> (js/Math.abs (- target next-transition)) 0.02)))

(defn- remove-display-from-parent!
  [^js display]
  (when-let [^js parent (.-parent display)]
    (.removeChild parent display)))

(defn- visible-node-id-set
  ([nodes visible-node-ids]
   (visible-node-id-set nodes (set (map :id nodes)) visible-node-ids))
  ([nodes all-node-id-set visible-node-ids]
   (if (some? visible-node-ids)
     (let [source-id-set (set visible-node-ids)]
       (->> nodes
            (filter #(contains? source-id-set (logic/node-source-id %)))
            (map :id)
            set))
     all-node-id-set)))

(defn- visible-node?
  [visible-node-ids* node]
  (contains? @visible-node-ids* (:id node)))

(defn- visible-links
  [links visible-node-ids]
  (filter (fn [{:keys [source target]}]
            (and (contains? visible-node-ids source)
                 (contains? visible-node-ids target)))
          links))

(defn- draw-closed-points!
  [^js graphics points]
  (when-let [{:keys [x y]} (first points)]
    (.moveTo graphics x y)
    (doseq [{:keys [x y]} (rest points)]
      (.lineTo graphics x y))
    (.closePath graphics)))

(defn- cluster-alpha
  [dark? radius emphasis]
  (let [base (case emphasis
               :selected (if dark? 0.185 0.120)
               :preview (if dark? 0.150 0.095)
               :dimmed (if dark? 0.036 0.024)
               (if dark? 0.125 0.115))
        falloff (max 0.38
                     (- 1.0 (/ (max 0 (- radius 260)) 1400)))]
    (* base falloff)))

(defn- cluster-emphasis
  [cluster-id active-cluster-ids selected-cluster-ids preview-cluster-ids interaction?]
  (cond
    (contains? selected-cluster-ids cluster-id) :selected
    (contains? preview-cluster-ids cluster-id) :preview
    (contains? active-cluster-ids cluster-id) :preview
    interaction? :dimmed
    :else :normal))

(defn- draw-cluster-backgrounds!
  ([^js graphics nodes view-mode dark? visible-node-ids* grid-layout?]
   (draw-cluster-backgrounds! graphics nodes view-mode dark? visible-node-ids* grid-layout? {}))
  ([^js graphics nodes view-mode dark? visible-node-ids* grid-layout?
    {:keys [active-ids selected-ids preview-ids hovered-id]}]
   (.clear graphics)
   (let [active-ids (set active-ids)
         selected-ids (set selected-ids)
         preview-ids (cond-> (set preview-ids)
                       hovered-id (conj hovered-id))
         visible-nodes (filter #(visible-node? visible-node-ids* %) nodes)
         active-cluster-ids (->> visible-nodes
                                 (filter #(contains? active-ids (:id %)))
                                 (keep :cluster-id)
                                 set)
         selected-cluster-ids (->> visible-nodes
                                   (filter #(contains? selected-ids (:id %)))
                                   (keep :cluster-id)
                                   (into selected-ids))
         preview-cluster-ids (->> visible-nodes
                                  (filter #(contains? preview-ids (:id %)))
                                  (keep :cluster-id)
                                  (into preview-ids))
         interaction? (seq selected-ids)]
     (doseq [{:keys [id x y radius color-int points]}
             (logic/tag-cluster-backgrounds
              visible-nodes
              view-mode
              {:grid-layout? grid-layout?})]
       (let [color (or color-int (color->int (if dark? "#34D399" "#047857")))
             emphasis (cluster-emphasis id
                                        active-cluster-ids
                                        selected-cluster-ids
                                        preview-cluster-ids
                                        interaction?)
             fill-alpha (cluster-alpha dark? radius emphasis)
             stroke-alpha (case emphasis
                            :selected (if dark? 0.420 0.270)
                            :preview (if dark? 0.340 0.210)
                            :dimmed (if dark? 0.078 0.055)
                            (if dark? 0.260 0.240))]
         (if (seq points)
           (draw-closed-points! graphics points)
           (.circle graphics x y radius))
         (.fill graphics #js {:color color
                              :alpha fill-alpha})
         (.setStrokeStyle graphics #js {:width (case emphasis
                                                 :selected 1.7
                                                 :preview 1.35
                                                 1.0)
                                        :color color
                                        :alpha stroke-alpha
                                        :join "round"})
         (.stroke graphics))))))

(defn- set-interactive!
  [^js display on-tap]
  (when (fn? on-tap)
    (set! (.-eventMode display) "static")
    (set! (.-cursor display) "pointer")
    (set! (.-accessible display) true)
    (.on display "pointertap"
         (fn [^js e]
           (.stopPropagation e)
           (on-tap))))
  display)

(defn- activate-node-tap
  [on-node-activate node]
  (when (and (fn? on-node-activate) node)
    #(on-node-activate node nil)))

(defn- label-card-hit-radius
  [{:keys [width height]}]
  (/ (js/Math.sqrt (+ (* width width) (* height height))) 2))

(defn- task-status-label-hit-node*
  [id target-node label-card]
  (when-let [{:keys [position] :as label-card} label-card]
    {:id id
     :type "taskLabel"
     :kind "taskLabel"
     :x (:x position)
     :y (:y position)
     :radius (label-card-hit-radius label-card)
     :target-node target-node}))

(defn- task-status-label-hit-node
  [{:keys [id label-card] :as task}]
  (task-status-label-hit-node*
   (str "task-status-label:" id)
   (task-status-label-target task)
   label-card))

(defn- task-status-center-label-hit-node
  [selected-group-node {:keys [label-card]}]
  (task-status-label-hit-node*
   (str "task-status-center-label:" (:id selected-group-node))
   (task-status-label-target selected-group-node)
   label-card))

(defn- task-status-label-hit-nodes
  [selected-group-node groups-layout]
  (let [center (:center groups-layout)
        center-node (when (and selected-group-node center)
                      (task-status-center-label-hit-node selected-group-node center))]
    (cond-> (vec (keep task-status-label-hit-node
                       (mapcat :tasks (:groups groups-layout))))
      center-node
      (conj center-node))))

(defn- task-status-interactive-layout-nodes
  [visible-task-ids candidate-nodes label-hit-nodes]
  (into (vec (filter #(contains? visible-task-ids (:id %)) candidate-nodes))
        label-hit-nodes))

(defn- draw-task-center-rings!
  [^js graphics {:keys [x y]} dark?]
  (let [core-color (color->int (if dark? "#0B2230" "#E0F2FE"))
        ring-color (color->int (if dark? "#2DD4BF" "#0F766E"))
        halo-color (color->int (if dark? "#38BDF8" "#0284C7"))]
    (.circle graphics x y 30)
    (.fill graphics #js {:color halo-color
                         :alpha (if dark? 0.022 0.020)})
    (.circle graphics x y 22)
    (.setStrokeStyle graphics #js {:width 2.2
                                   :color ring-color
                                   :alpha (if dark? 0.24 0.18)})
    (.stroke graphics)
    (.circle graphics x y 14)
    (.fill graphics #js {:color core-color
                         :alpha (if dark? 0.44 0.38)})
    (.setStrokeStyle graphics #js {:width 1.5
                                   :color halo-color
                                   :alpha (if dark? 0.24 0.18)})
    (.stroke graphics)
    (doseq [idx (range 24)]
      (let [angle (* 2 js/Math.PI (/ idx 24))
            dot-radius (if (zero? (mod idx 5)) 1.55 1.05)]
        (.circle graphics
                 (+ x (* 26 (js/Math.cos angle)))
                 (+ y (* 26 (js/Math.sin angle)))
                 dot-radius)
        (.fill graphics #js {:color ring-color
                             :alpha (if dark? 0.20 0.13)})))))

(defn- draw-task-status-group-shape!
  [^js graphics {:keys [x y radius blob-points]}]
  (if (seq blob-points)
    (draw-closed-points! graphics blob-points)
    (.circle graphics x y radius)))

(defn- task-status-text-styles
  [dark?]
  {:title (new (.-TextStyle PIXI)
               #js {:fontFamily "Inter, Avenir Next, system-ui, sans-serif"
                    :fontSize 15
                    :fontWeight "700"
                    :letterSpacing 0
                    :fill (label-color dark?)})
   :count (new (.-TextStyle PIXI)
               #js {:fontFamily "Inter, Avenir Next, system-ui, sans-serif"
                    :fontSize 12
                    :fontWeight "600"
                    :fill (edge-label-color dark?)})
   :task-tag (new (.-TextStyle PIXI)
                  #js {:fontFamily "Inter, Avenir Next, system-ui, sans-serif"
                       :fontSize 11
                       :fontWeight "650"
                       :fill (edge-label-color dark?)})
   :center (new (.-TextStyle PIXI)
                #js {:fontFamily "Inter, Avenir Next, system-ui, sans-serif"
                     :fontSize 14
                     :fontWeight "650"
                     :lineHeight 18
                     :fill (label-color dark?)})
   :task-label-bg-color (color->int (if dark? "#0F172A" "#FFFFFF"))})

(defn- add-task-status-center-label!
  [^js graphics ^js label-layer center center-node dark? center-style on-node-activate]
  (draw-task-center-rings! graphics center dark?)
  (when-let [{:keys [position width height title]} (:label-card center)]
    (let [center-label (or title (:label center) "")
          ^js center-container (new (.-Container PIXI))
          ^js bg (new (.-Graphics PIXI))
          ^js center-text (new (.-Text PIXI)
                               #js {:text center-label
                                    :style center-style})
          card-x (- (/ width 2))
          card-y (- (/ height 2))]
      (draw-rounded-rect! bg
                          card-x
                          card-y
                          width
                          height
                          7
                          #js {:color (color->int (if dark? "#0F172A" "#FFFFFF"))
                               :alpha (if dark? 0.84 0.92)}
                          #js {:width 1.1
                               :color (color->int (if dark? "#38BDF8" "#0F766E"))
                               :alpha (if dark? 0.36 0.26)})
      (set-display-position! center-container position)
      (set! (.-x center-text) (+ card-x 12))
      (set! (.-y center-text) (+ card-y 10))
      (.addChild center-container bg)
      (.addChild center-container center-text)
      (gobj/set center-container "accessibleTitle" center-label)
      (set! (.-hitArea center-container) (new (.-Rectangle PIXI) card-x card-y width height))
      (set-interactive! center-container (activate-node-tap on-node-activate (task-status-label-target center-node)))
      (.addChild label-layer center-container))))

(defn- draw-task-status-group-blob!
  [^js graphics dark? group color]
  (draw-task-status-group-shape! graphics group)
  (.fill graphics #js {:color color
                       :alpha (if dark? 0.105 0.078)})
  (when (seq (:blob-points group))
    (draw-task-status-group-shape! graphics group)
    (.setStrokeStyle graphics #js {:width 9
                                   :color color
                                   :alpha (if dark? 0.032 0.026)
                                   :join "round"})
    (.stroke graphics))
  (draw-task-status-group-shape! graphics group)
  (.setStrokeStyle graphics #js {:width 1.45
                                 :color color
                                 :alpha (if dark? 0.48 0.34)
                                 :join "round"})
  (.stroke graphics))

(defn- add-task-status-badge!
  [^js label-layer dark? group color title-style on-group-toggle]
  (let [{:keys [normalized-status label-position badge-card]} group
        title (or (:title badge-card) (logic/task-status-group-title-text group))
        ^js badge (new (.-Container PIXI))
        ^js badge-bg (new (.-Graphics PIXI))
        ^js label-text (new (.-Text PIXI)
                            #js {:text title
                                 :style title-style})
        badge-width (or (:width badge-card) (+ (.-width label-text) 20))
        badge-height (or (:height badge-card) (+ (.-height label-text) 8))
        badge-position (or (:position badge-card)
                           {:x (+ (:x label-position) (/ badge-width 2))
                            :y (+ (:y label-position) (/ badge-height 2))})
        card-x (- (/ badge-width 2))
        card-y (- (/ badge-height 2))]
    (draw-rounded-rect! badge-bg
                        card-x
                        card-y
                        badge-width
                        badge-height
                        10
                        #js {:color color
                             :alpha (if dark? 0.26 0.16)}
                        #js {:width 1.2
                             :color color
                             :alpha (if dark? 0.62 0.42)})
    (.addChild badge badge-bg)
    (.addChild badge label-text)
    (set! (.-x label-text) (+ card-x 10))
    (set! (.-y label-text) (+ card-y (/ (- badge-height (.-height label-text)) 2)))
    (set-display-position! badge badge-position)
    (gobj/set badge "accessibleTitle" title)
    (set! (.-hitArea badge) (new (.-Rectangle PIXI) card-x card-y badge-width badge-height))
    (set-interactive! badge #(on-group-toggle normalized-status))
    (.addChild label-layer badge)))

(defn- add-task-status-task-label!
  [^js label-layer dark? color task-label-bg-color task-tag-style
   on-node-activate {:keys [label-card label] :as task}]
  (let [{:keys [position width height title tag]} label-card
        ^js label-container (new (.-Container PIXI))
        ^js bg (new (.-Graphics PIXI))
        ^js task-text (new (.-Text PIXI)
                           #js {:text (logic/label-display-text (or title label) true)
                                :style (new (.-TextStyle PIXI)
                                            #js {:fontFamily "Inter, Avenir Next, system-ui, sans-serif"
                                                 :fontSize 13
                                                 :fontWeight "600"
                                                 :lineHeight 17
                                                 :fill (label-color dark?)
                                                 :wordWrap true
                                                 :wordWrapWidth (- width 20)
                                                 :breakWords true})})
        ^js tag-text (when tag
                       (new (.-Text PIXI)
                            #js {:text tag
                                 :style task-tag-style}))
        card-x (- (/ width 2))
        card-y (- (/ height 2))]
    (.addChild label-container bg)
    (.addChild label-container task-text)
    (when tag-text
      (.addChild label-container tag-text))
    (draw-rounded-rect! bg
                        card-x
                        card-y
                        width
                        height
                        6
                        #js {:color task-label-bg-color
                             :alpha (if dark? 0.88 0.94)}
                        #js {:width 1
                             :color color
                             :alpha (if dark? 0.32 0.22)})
    (set! (.-x task-text) (+ card-x 10))
    (set! (.-y task-text) (+ card-y 7))
    (when tag-text
      (let [tag-width (+ (.-width tag-text) 12)
            tag-y (+ (.-y task-text) (.-height task-text) 5)]
        (draw-rounded-rect! bg
                            (+ card-x 8)
                            tag-y
                            tag-width
                            14
                            5
                            #js {:color color
                                 :alpha (if dark? 0.18 0.12)}
                            #js {:width 0.8
                                 :color color
                                 :alpha (if dark? 0.42 0.30)})
        (set! (.-x tag-text) (+ card-x 14))
        (set! (.-y tag-text) (inc tag-y))))
    (set-display-position! label-container position)
    (gobj/set label-container "accessibleTitle"
              (str (:label task) (when tag (str " " tag))))
    (set! (.-hitArea label-container) (new (.-Rectangle PIXI) card-x card-y width height))
    (set-interactive! label-container (activate-node-tap on-node-activate (task-status-label-target task)))
    (.addChild label-layer label-container)))

(defn- draw-task-status-label-leader!
  [^js graphics dark? color {:keys [x y label-card]}]
  (when-let [{:keys [position width height]} label-card]
    (let [card-x (:x position)
          card-y (:y position)
          half-width (/ width 2)
          half-height (/ height 2)
          target-x (if (< x card-x)
                     (- card-x half-width)
                     (+ card-x half-width))
          target-y (-> y
                       (max (+ (- card-y half-height) 8))
                       (min (- (+ card-y half-height) 8)))]
      (.moveTo graphics x y)
      (.lineTo graphics target-x target-y)
      (.setStrokeStyle graphics #js {:width 0.9
                                     :color color
                                     :alpha (if dark? 0.26 0.20)
                                     :cap "round"})
      (.stroke graphics))))

(defn- add-task-status-more-control!
  [^js label-layer normalized-status collapsed-node color count-style on-collapsed-toggle dark?]
  (let [^js more-container (new (.-Container PIXI))
        ^js bg (new (.-Graphics PIXI))
        ^js more-text (new (.-Text PIXI)
                           #js {:text "..."
                                :style count-style})]
    (draw-rounded-rect! bg
                        -10
                        -5
                        32
                        22
                        9
                        #js {:color color
                             :alpha (if dark? 0.28 0.18)}
                        #js {:width 1
                             :color color
                             :alpha (if dark? 0.58 0.38)})
    (.addChild more-container bg)
    (.addChild more-container more-text)
    (set! (.-x more-text) 0)
    (set! (.-y more-text) 0)
    (set-display-position! more-container collapsed-node)
    (gobj/set more-container "accessibleTitle" (str normalized-status " ..."))
    (set-interactive! more-container #(on-collapsed-toggle normalized-status))
    (.addChild label-layer more-container)))

(defn- sync-task-status-group-background!
  [^js graphics ^js label-layer dark? styles on-group-toggle on-collapsed-toggle on-node-activate group]
  (let [{:keys [status-key normalized-status collapsed-node]} group
        color (task-status-accent-color status-key dark?)
        labelled-tasks (filter :task-status-label? (:tasks group))]
    (draw-task-status-group-blob! graphics dark? group color)
    (doseq [task labelled-tasks]
      (draw-task-status-label-leader! graphics dark? color task))
    (doseq [task labelled-tasks]
      (add-task-status-task-label!
       label-layer
       dark?
       color
       (:task-label-bg-color styles)
       (:task-tag styles)
       on-node-activate
       task))
    (when collapsed-node
      (add-task-status-more-control!
       label-layer
       normalized-status
       collapsed-node
       color
       (:count styles)
       on-collapsed-toggle
       dark?))
    (add-task-status-badge! label-layer dark? group color (:title styles) on-group-toggle)))

(defn- sync-task-status-backgrounds!
  ([^js graphics ^js label-layer groups-layout dark?]
   (sync-task-status-backgrounds! graphics label-layer groups-layout dark? {}))
  ([^js graphics ^js label-layer groups-layout dark?
    {:keys [center-node on-group-toggle on-collapsed-toggle on-node-activate]}]
   (.clear graphics)
   (destroy-children! label-layer)
   (let [styles (task-status-text-styles dark?)]
     (when-let [center (:center groups-layout)]
       (add-task-status-center-label!
        graphics label-layer center center-node dark? (:center styles) on-node-activate))
     (doseq [group (:groups groups-layout)]
       (sync-task-status-group-background!
        graphics
        label-layer
        dark?
        styles
        on-group-toggle
        on-collapsed-toggle
        on-node-activate
        group)))))

(defn- task-status-fit-nodes
  [selected-group-node groups-layout]
  (let [center-node (select-keys selected-group-node [:x :y])]
    (into
     (if (and (:x center-node) (:y center-node)) [center-node] [])
     (mapcat (fn [{:keys [x y radius blob-points]}]
               (if (seq blob-points)
                 blob-points
                 [{:x (- x radius) :y (- y radius)}
                  {:x (+ x radius) :y (- y radius)}
                  {:x (+ x radius) :y (+ y radius)}
                  {:x (- x radius) :y (+ y radius)}])))
     (:groups groups-layout))))

(defn- draw-fps-overlay-background!
  [^js background ^js text dark?]
  (.clear background)
  (.roundRect background
              -8
              -4
              (+ (.-width text) 16)
              (+ (.-height text) 8)
              7)
  (.fill background #js {:color (color->int (if dark? "#020617" "#F8FAFC"))
                         :alpha (if dark? 0.54 0.70)})
  (.setStrokeStyle background
                   #js {:width 1
                        :color (color->int (if dark? "#38BDF8" "#0F766E"))
                        :alpha (if dark? 0.26 0.22)})
  (.stroke background))

(defn- create-fps-overlay!
  [dark?]
  (let [^js container (new (.-Container PIXI))
        ^js background (new (.-Graphics PIXI))
        ^js text (new (.-Text PIXI)
                      #js {:text "FPS --"
                           :style (new (.-TextStyle PIXI)
                                       #js {:fontFamily "Inter, Avenir Next, system-ui, sans-serif"
                                            :fontSize 11
                                            :fontWeight "650"
                                            :letterSpacing 0
                                            :fill (edge-label-color dark?)})})]
    (set! (.-eventMode container) "none")
    (set! (.-alpha container) 0.82)
    (.addChild container background)
    (.addChild container text)
    (draw-fps-overlay-background! background text dark?)
    {:container container
     :sync-position! (fn [width height]
                       (let [{:keys [x y]} (logic/fps-overlay-position
                                            width
                                            height
                                            (.-width text)
                                            (.-height text))]
                         (set! (.-x container) x)
                         (set! (.-y container) y)))
     :update! (fn [fps]
                (let [next-text (str "FPS " (js/Math.round fps))]
                  (when-not (= next-text (.-text text))
                    (set! (.-text text) next-text)
                    (draw-fps-overlay-background! background text dark?))))}))

(defn- tick-fps-overlay!
  [fps-overlay last-ms* frame-count* width height]
  (let [now (.now js/performance)]
    (swap! frame-count* inc)
    ((:sync-position! fps-overlay) width height)
    (when (>= (- now @last-ms*) 250)
      (let [elapsed (max 1 (- now @last-ms*))
            fps (/ (* @frame-count* 1000) elapsed)]
        (reset! last-ms* now)
        (reset! frame-count* 0)
        ((:update! fps-overlay) fps)))))

(defn- ^:large-vars/cleanup-todo render-nodes!
  [^js tag-container ^js detail-container layouted-nodes* view-mode highlight-state* visible-node-ids* current-layout-nodes]
  (let [^js container (new (.-Container PIXI))
        textures {:circle (create-circle-texture)}
        icon-styles (create-icon-text-styles)
        node-count (count @layouted-nodes*)
        max-nodes (logic/render-node-limit node-count view-mode)
        virtual? (< max-nodes node-count)
        world-scale* (atom 1.0)]
    (.addChild detail-container container)
    (if-not virtual?
      (let [displays (reduce
                      (fn [acc node]
                        (let [^js display (create-node-display! textures icon-styles node)
                              ^js display-container (if (= "tag" (:kind node))
                                                      tag-container
                                                      container)]
                          (if (visible-node? visible-node-ids* node)
                            (do
                              (configure-node-display! display
                                                       node
                                                       (logic/node-emphasis @highlight-state* (:id node))
                                                       @world-scale*
                                                       view-mode)
                              (set-display-transition-target! display 1.0)
                              (set! (.-alpha display) (display-base-alpha display)))
                            (do
                              (set-display-transition-target! display 0.0)
                              (set! (.-alpha display) 0)
                              (set! (.-visible display) false)))
                          (.addChild display-container display)
                          (assoc acc (:id node) display)))
                      {}
                      @layouted-nodes*)]
        {:container container
         :textures textures
         :displays displays
         :drawn-node-count (count displays)
         :sync! (fn [^js world _width _height _hovered-node-id]
                  (reset! world-scale* (.. world -scale -x))
                  (let [node-by-id (into {} (map (fn [node] [(:id node) node]) (current-layout-nodes)))]
                    (doseq [[id ^js display] displays]
                      (if-let [node (get node-by-id id)]
                        (if (visible-node? visible-node-ids* node)
                          (do
                            (configure-node-display! display
                                                     node
                                                     (logic/node-emphasis @highlight-state* id)
                                                     @world-scale*
                                                     view-mode)
                            (set-display-transition-target! display 1.0))
                          (set-display-transition-target! display 0.0))
                        (set-display-transition-target! display 0.0)))))
         :sync-styles! (fn []
                         (let [node-by-id (into {} (map (fn [node] [(:id node) node]) (current-layout-nodes)))]
                           (doseq [[id ^js display] displays]
                             (when-let [node (get node-by-id id)]
                               (if (visible-node? visible-node-ids* node)
                                 (do
                                   (configure-node-display! display
                                                            node
                                                            (logic/node-emphasis @highlight-state* id)
                                                            @world-scale*
                                                            view-mode)
                                   (set-display-transition-target! display 1.0))
                                 (set-display-transition-target! display 0.0))))))
         :tick-transitions! (fn []
                              (boolean
                               (reduce
                                (fn [running? [_ ^js display]]
                                  (or (tick-display-transition! display) running?))
                                false
                                displays)))})
      (let [displays* (atom {})
            pool* (atom {"circle" []})
            drawn-node-count* (atom 0)
            acquire-sprite! (fn [kind]
                              (if-let [^js display (peek (get @pool* kind))]
                                (do
                                  (swap! pool* update kind pop)
                                  display)
                                (new (.-Sprite PIXI) (get textures (keyword kind)))))
            acquire-display! (fn [node]
                               (if (contains? #{"emoji" "icon"} (node-display-kind node))
                                 (create-node-display! textures icon-styles node)
                                 (let [kind (node-sprite-kind node)
                                       ^js display (acquire-sprite! kind)]
                                   (gobj/set display "logseqGraphNodeDisplay" kind)
                                   display)))
            release-display! (fn release-display!
                               ([id]
                                (release-display! id false))
                               ([id destroy?]
                                (when-let [^js display (get @displays* id)]
                                  (remove-display-from-parent! display)
                                  (set! (.-visible display) false)
                                  (swap! displays* dissoc id)
                                  (if (and (not destroy?)
                                           (= "circle" (display-kind display)))
                                    (swap! pool* update (display-kind display) conj display)
                                    (.destroy display)))))
            mount-display! (fn [node]
                             (let [id (:id node)
                                   kind (node-display-kind node)
                                   existing (get @displays* id)
                                   ^js display (if (and existing
                                                        (= kind (display-kind existing)))
                                                 existing
                                                 (do
                                                   (when existing
                                                     (release-display! id))
                                                   (let [display (acquire-display! node)]
                                                     (swap! displays* assoc id display)
                                                     display)))
                                   ^js display-container (if (= "tag" (:kind node))
                                                           tag-container
                                                           container)]
                               (configure-node-display! display
                                                        node
                                                        (logic/node-emphasis @highlight-state* id)
                                                        @world-scale*
                                                        view-mode)
                               (set-display-transition-target! display 1.0)
                               (when-not (identical? (.-parent display) display-container)
                                 (remove-display-from-parent! display)
                                 (.addChild display-container display))))]
        {:container container
         :textures textures
         :displays* displays*
         :drawn-node-count drawn-node-count*
         :sync-styles! (fn []
                         (doseq [[id ^js display] @displays*]
                           (when-let [node (some #(when (= id (:id %)) %) (current-layout-nodes))]
                             (if (visible-node? visible-node-ids* node)
                               (do
                                 (configure-node-display! display
                                                          node
                                                          (logic/node-emphasis @highlight-state* id)
                                                          @world-scale*
                                                          view-mode)
                                 (set-display-transition-target! display 1.0))
                               (set-display-transition-target! display 0.0)))))
         :sync! (fn [^js world width height hovered-node-id]
                  (let [scale (.. world -scale -x)
                        _ (reset! world-scale* scale)
                        viewport (expand-viewport
                                  (world-viewport-rect world width height)
                                  (/ 220 (max scale 0.5)))
                        layouted-nodes (current-layout-nodes)
                        visible-nodes (->> layouted-nodes
                                           (filter #(visible-node? visible-node-ids* %))
                                           (filter #(node-in-viewport? viewport %))
                                           (take max-nodes)
                                           vec)
                        visible-nodes (if hovered-node-id
                                        (if-let [hovered-node (some (fn [node]
                                                                      (when (= hovered-node-id (:id node))
                                                                        node))
                                                                    layouted-nodes)]
                                          (if (visible-node? visible-node-ids* hovered-node)
                                            (vec (cons hovered-node
                                                       (remove #(= hovered-node-id (:id %)) visible-nodes)))
                                            visible-nodes)
                                          visible-nodes)
                                        visible-nodes)
                        selected-id-set (set (map :id visible-nodes))]
                    (doseq [node visible-nodes]
                      (mount-display! node))
                    (doseq [id (keys @displays*)]
                      (when-not (contains? selected-id-set id)
                        (when-let [display (get @displays* id)]
                          (set-display-transition-target! display 0.0))))
                    (reset! drawn-node-count* (count selected-id-set))))
         :tick-transitions! (fn []
                              (let [running? (reduce
                                              (fn [running? [id ^js display]]
                                                (let [running? (or (tick-display-transition! display) running?)]
                                                  (when (and (zero? (display-transition-target display))
                                                             (not (.-visible display)))
                                                    (release-display! id true))
                                                  running?))
                                              false
                                              @displays*)]
                                (boolean running?)))}))))

(defn- build-neighbor-map
  [links]
  (reduce
   (fn [m {:keys [source target]}]
     (-> m
         (update source (fnil conj []) target)
         (update target (fnil conj []) source)))
   {}
   links))

(defn- rendered-sprite
  [node-render-info node-id]
  (if-let [displays* (:displays* node-render-info)]
    (get @displays* node-id)
    (get (:displays node-render-info) node-id)))

(defn- update-node-position
  [layouted-nodes node-index-by-id node-id x y]
  (if-let [idx (get node-index-by-id node-id)]
    (assoc layouted-nodes idx (assoc (nth layouted-nodes idx) :x x :y y))
    layouted-nodes))

(defn- update-node-positions
  [layouted-nodes node-index-by-id positions-by-id]
  (reduce-kv
   (fn [nodes node-id {:keys [x y]}]
     (update-node-position nodes node-index-by-id node-id x y))
   layouted-nodes
   positions-by-id))

(defn- ^:large-vars/cleanup-todo setup-pan-and-zoom!
  [^js canvas ^js world {:keys [get-node-index
                                get-edge-hit
                                on-node-activate
                                on-node-preview
                                on-node-select
                                on-edge-select
                                on-selection-clear
                                node-selected?
                                on-scale-change
                                on-transform
                                on-hover-node-change
                                on-gesture-point
                                on-node-drag
                                on-node-drag-end
                                gesture-locked?
                                task-status-preview-active?
                                on-preview-exit]}]
  (let [dragging-world? (atom false)
        drag-node* (atom nil)
        moved? (atom false)
        drag-start (atom [0 0 0 0])
        hover-node-id* (atom nil)
        last-click* (atom nil)]
    (letfn [(canvas-point [^js e]
              (let [rect (.getBoundingClientRect canvas)]
                [(- (.-clientX e) (.-left rect))
                 (- (.-clientY e) (.-top rect))]))
            (set-hover-node! [node-id]
              (when (not= node-id @hover-node-id*)
                (reset! hover-node-id* node-id)
                (when (fn? on-hover-node-change)
                  (on-hover-node-change node-id))))
            (screen->world [sx sy]
              (let [scale (.. world -scale -x)]
                [(/ (- sx (.-x world)) scale)
                 (/ (- sy (.-y world)) scale)]))
            (emit-gesture-point! [sx sy]
              (when (fn? on-gesture-point)
                (let [[world-x world-y] (screen->world sx sy)]
                  (on-gesture-point world-x world-y (.. world -scale -x)))))
            (gesture-locked-now? []
              (and (fn? gesture-locked?)
                   (gesture-locked?)))
            (handle-node-click! [node ^js e]
              (if (= "taskLabel" (:type node))
                (when (fn? on-node-activate)
                  (on-node-activate (or (:target-node node) node) e))
                (if (util/meta-key? e)
                  (do
                    (.preventDefault e)
                    (.stopPropagation e)
                    (reset! last-click* nil)
                    (when (fn? on-node-preview)
                      (on-node-preview node e)))
                  (let [{:keys [action next-click]}
                        (logic/node-click-action @last-click*
                                                 (:id node)
                                                 {:selected? (and (fn? node-selected?)
                                                                  (node-selected? (:id node)))
                                                  :open? (.-shiftKey e)}
                                                 (.now js/performance))]
                    (reset! last-click* next-click)
                    (case action
                      :open
                      (when (fn? on-node-activate)
                        (on-node-activate node e))

                      :unhighlight
                      (when (fn? on-node-select)
                        (on-node-select node true))

                      :highlight
                      (when (fn? on-node-select)
                        (on-node-select node false))

                      nil)))))
            (on-pointer-down [^js e]
              (let [[sx sy] (canvas-point e)
                    [world-x world-y] (screen->world sx sy)
                    scale (.. world -scale -x)
                    hit (hit-test-node (get-node-index) world-x world-y scale)]
                (if (gesture-locked-now?)
                  (do
                    (.preventDefault e)
                    (reset! drag-node* nil)
                    (reset! dragging-world? false)
                    (reset! moved? false))
                  (do
                    (emit-gesture-point! sx sy)
                    (set-hover-node! nil)
                    (reset! moved? false)
                    (if-let [node (:node hit)]
                      (reset! drag-node* {:node node
                                          :offset-x (- world-x (:x node))
                                          :offset-y (- world-y (:y node))
                                          :current-x (:x node)
                                          :current-y (:y node)})
                      (do
                        (reset! dragging-world? true)
                        (reset! drag-start [sx sy (.-x world) (.-y world)])))))))
            (on-pointer-move [^js e]
              (cond
                (gesture-locked-now?)
                nil

                @drag-node*
                (let [[sx sy] (canvas-point e)
                      [world-x world-y] (screen->world sx sy)
                      {:keys [offset-x offset-y current-x current-y node]} @drag-node*
                      next-x (- world-x offset-x)
                      next-y (- world-y offset-y)
                      dx (- next-x current-x)
                      dy (- next-y current-y)]
                  (when (or (> (js/Math.abs dx) 0.45)
                            (> (js/Math.abs dy) 0.45))
                    (reset! moved? true))
                  (reset! drag-node* {:node node
                                      :offset-x offset-x
                                      :offset-y offset-y
                                      :current-x next-x
                                      :current-y next-y})
                  (when (fn? on-node-drag)
                    (on-node-drag node next-x next-y))
                  (when (fn? on-transform)
                    (on-transform)))

                @dragging-world?
                (let [[sx sy] (canvas-point e)
                      [start-x start-y world-x world-y] @drag-start
                      dx (- sx start-x)
                      dy (- sy start-y)]
                  (when (or (> (js/Math.abs dx) 2)
                            (> (js/Math.abs dy) 2))
                    (reset! moved? true))
                  (set! (.-x world) (+ world-x dx))
                  (set! (.-y world) (+ world-y dy))
                  (when (fn? on-transform)
                    (on-transform)))

                :else
                (let [[sx sy] (canvas-point e)
                      [world-x world-y] (screen->world sx sy)
                      scale (.. world -scale -x)
                      hit (hit-test-node (get-node-index) world-x world-y scale)]
                  (emit-gesture-point! sx sy)
                  (set-hover-node! (some-> hit :node :id)))))
            (on-pointer-up [^js e]
              (cond
                (gesture-locked-now?)
                (do
                  (reset! drag-node* nil)
                  (reset! dragging-world? false)
                  (reset! moved? false))

                @drag-node*
                (let [{:keys [node current-x current-y]} @drag-node*]
                  (reset! drag-node* nil)
                  (if @moved?
                    (when (fn? on-node-drag-end)
                      (on-node-drag-end node current-x current-y))
                    (handle-node-click! node e)))

                @dragging-world?
                (do
                  (reset! dragging-world? false)
                  (when-not @moved?
                    (let [[sx sy] (canvas-point e)
                          [world-x world-y] (screen->world sx sy)
                          scale (.. world -scale -x)
                          hit (hit-test-node (get-node-index) world-x world-y scale)]
                      (if-let [node (:node hit)]
                        (handle-node-click! node e)
                        (if-let [edge (and (fn? get-edge-hit)
                                           (get-edge-hit world-x world-y scale))]
                          (do
                            (reset! last-click* nil)
                            (when (fn? on-edge-select)
                              (on-edge-select edge)))
                          (when (fn? on-selection-clear)
                            (reset! last-click* nil)
                            (on-selection-clear)))))))))
            (on-wheel [^js e]
              (.preventDefault e)
              (let [[sx sy] (canvas-point e)
                    [before-x before-y] (screen->world sx sy)
                    transform (logic/wheel-zoom-transform
                               {:world-x before-x
                                :world-y before-y
                                :scale (.. world -scale -x)}
                               {:screen-x sx
                                :screen-y sy
                                :delta-y (.-deltaY e)
                                :locked? (gesture-locked-now?)})]
                (when transform
                  (let [{:keys [x y scale]} transform]
                    (set! (.. world -scale -x) scale)
                    (set! (.. world -scale -y) scale)
                    (set! (.-x world) x)
                    (set! (.-y world) y)
                    (when (fn? on-gesture-point)
                      (on-gesture-point before-x before-y scale))
                    (when (fn? on-scale-change)
                      (on-scale-change scale))
                    (when (fn? on-transform)
                      (on-transform))))))
            (on-key-down [^js e]
              (case (logic/graph-key-action
                     {:key (.-key e)
                      :task-status-preview-active? (and (fn? task-status-preview-active?)
                                                        (task-status-preview-active?))})
                :exit-task-status-preview
                (do
                  (.preventDefault e)
                  (.stopPropagation e)
                  (reset! last-click* nil)
                  (when (fn? on-preview-exit)
                    (on-preview-exit)))

                nil))
            (on-pointer-leave [^js e]
              (on-pointer-up e)
              (set-hover-node! nil))]
      (.addEventListener canvas "pointerdown" on-pointer-down)
      (.addEventListener canvas "pointermove" on-pointer-move)
      (.addEventListener canvas "pointerup" on-pointer-up)
      (.addEventListener canvas "pointerleave" on-pointer-leave)
      (.addEventListener canvas "wheel" on-wheel #js {:passive false})
      (.addEventListener js/window "keydown" on-key-down)
      (fn []
        (.removeEventListener canvas "pointerdown" on-pointer-down)
        (.removeEventListener canvas "pointermove" on-pointer-move)
        (.removeEventListener canvas "pointerup" on-pointer-up)
        (.removeEventListener canvas "pointerleave" on-pointer-leave)
        (.removeEventListener canvas "wheel" on-wheel)
        (.removeEventListener js/window "keydown" on-key-down)))))

(defn- ^:large-vars/cleanup-todo setup-scene!
  [^js app ^js container {:keys [nodes links dark? on-node-activate on-node-preview on-selection-change on-rendered view-mode visible-node-ids background-visible-node-ids depth show-arrows? link-distance visible-recent-task-count show-edge-labels? grid-layout?]} render-start]
  (set! (.-innerHTML container) "")
  (let [^js canvas (or (.-canvas app) (.-view app))
        ^js stage (.-stage app)
        ^js world (new (.-Container PIXI))
        ^js detail-layer (new (.-Container PIXI))
        ^js tag-layer (new (.-Container PIXI))
        ^js edge-label-layer-wrapper (new (.-Container PIXI))
        ^js node-label-layer (new (.-Container PIXI))
        ^js cluster-background-layer (new (.-Graphics PIXI))
        ^js task-status-background-layer (new (.-Graphics PIXI))
        ^js task-status-label-layer (new (.-Container PIXI))
        fps-overlay (create-fps-overlay! dark?)
        _ (.appendChild container canvas)
        _ (.addChild stage world)
        _ (.addChild world detail-layer)
        _ (.addChild world tag-layer)
        _ (.addChild world node-label-layer)
        _ (.addChild world task-status-label-layer)
        _ (.addChild stage edge-label-layer-wrapper)
        _ (.addChild stage (:container fps-overlay))
        width (.-clientWidth container)
        height (.-clientHeight container)
        size* (atom {:width width :height height})
        fps-last-ms* (atom (.now js/performance))
        fps-frame-count* (atom 0)
        normalized-view-mode (normalize-view-mode view-mode)
        depth* (atom (-> (or depth 1) (max 1) (min 5)))
        grid-layout? (true? grid-layout?)
        link-distance* (atom link-distance)
        show-arrows?* (atom (true? show-arrows?))
        show-edge-labels?* (atom (true? show-edge-labels?))
        layouted-nodes* (atom (layout-nodes nodes
                                            links
                                            view-mode
                                            dark?
                                            {:link-distance link-distance
                                             :grid-layout? grid-layout?}))
        display-links* (atom (logic/display-links links @layouted-nodes*))
        all-node-id-set (set (map :id @layouted-nodes*))
        visible-node-ids* (atom (visible-node-id-set
                                 @layouted-nodes*
                                 all-node-id-set
                                 visible-node-ids))
        background-visible-node-ids* (atom (visible-node-id-set
                                            @layouted-nodes*
                                            all-node-id-set
                                            (or background-visible-node-ids
                                                visible-node-ids)))
        node-index-by-id (into {} (map-indexed (fn [idx node] [(:id node) idx]) @layouted-nodes*))
        layout-by-id* (atom (into {} (map (fn [node] [(:id node) node]) @layouted-nodes*)))
        preview-layout-by-id* (atom nil)
        initial-transform (logic/fit-transform @layouted-nodes* width height {:padding 72})
        _ (set! (.-x world) (:x initial-transform))
        _ (set! (.-y world) (:y initial-transform))
        _ (set! (.. world -scale -x) (:scale initial-transform))
        _ (set! (.. world -scale -y) (:scale initial-transform))
        effective-show-arrows? (fn []
                                 (if (edge-detail-view-mode? normalized-view-mode)
                                   true
                                   @show-arrows?*))
        effective-show-edge-labels? (fn []
                                      (and (>= (.. world -scale -x) edge-label-visible-scale)
                                           (if (edge-detail-view-mode? normalized-view-mode)
                                             true
                                             @show-edge-labels?*)))
        edge-render-opts (fn []
                           {:show-arrows? (effective-show-arrows?)
                            :show-edge-labels? (effective-show-edge-labels?)})
        neighbor-map (build-neighbor-map @display-links*)
        highlighted-node-ids* (atom #{})
        hovered-node-id* (atom nil)
        tag-focus-node-id* (atom nil)
        task-status-preview-active? (atom false)
        task-status-fit-key* (atom nil)
        task-status-visible-node-ids* (atom nil)
        task-status-display-node-ids* (atom nil)
        task-status-main-node-ids* (atom nil)
        task-status-links* (atom nil)
        task-status-label-hit-nodes* (atom [])
        task-status-revealed-count-by-status* (atom {})
        task-status-return-transform* (atom nil)
        task-status-sync-key* (atom nil)
        world-transform-target* (atom nil)
        node-kind (fn [node-id]
                    (:kind (get @layout-by-id* node-id)))
        overlapping-tag-ids (fn [node-ids]
                              (let [object-ids (->> node-ids
                                                    (mapcat #(get neighbor-map %))
                                                    (filter #(not= "tag" (node-kind %)))
                                                    set)]
                                (->> object-ids
                                     (mapcat #(get neighbor-map %))
                                     (filter #(= "tag" (node-kind %)))
                                     set)))
        highlight-state-value (fn []
                                (let [base (logic/highlight-state @highlighted-node-ids*
                                                                  neighbor-map
                                                                  @depth*)
                                      selected-tag-ids (set (filter #(= "tag" (node-kind %))
                                                                    @highlighted-node-ids*))
                                      overlapping-tags (overlapping-tag-ids selected-tag-ids)
                                      active-ids (set/union (:active-ids base) overlapping-tags)
                                      connected-ids (set/difference active-ids
                                                                    @highlighted-node-ids*)]
                                  (cond-> (assoc base
                                                 :active-ids active-ids
                                                 :connected-ids connected-ids
                                                 :hovered-id @hovered-node-id*)
                                    (seq @task-status-main-node-ids*)
                                    (assoc :task-focus-mode? true
                                           :task-focus-ids @task-status-main-node-ids*))))
        highlight-state* (atom (highlight-state-value))
        display-visible-node-ids* (atom (if (= normalized-view-mode :tags-and-objects)
                                          (if grid-layout?
                                            (grid-layout-display-node-ids @layouted-nodes* visible-node-ids*)
                                            (->> @layouted-nodes*
                                                 (filter #(and (visible-node? visible-node-ids* %)
                                                               (= "tag" (:kind %))))
                                                 (map :id)
                                                 set))
                                          @visible-node-ids*))
        context-visible-node-ids* (atom (if (= normalized-view-mode :tags-and-objects)
                                          (if grid-layout?
                                            @display-visible-node-ids*
                                            @background-visible-node-ids*)
                                          @visible-node-ids*))
        visible-link-list (fn []
                            (if-let [task-links @task-status-links*]
                              (let [scale (.. world -scale -x)]
                                (cond->> task-links
                                  (< scale 0.55)
                                  (filter #(= "root-to-group" (:edge/type %)))
                                  (< scale 1.0)
                                  (remove #(and (= "group-to-task" (:edge/type %))
                                                (not (:important? %))))))
                              (let [links (visible-links @display-links* @display-visible-node-ids*)]
                                (if (and (edge-detail-view-mode? normalized-view-mode)
                                         (not (:select-mode? @highlight-state*)))
                                  links
                                  (logic/highlight-visible-links links @highlight-state*)))))
        display-node-index* (atom (index-layouted-nodes
                                   (filter #(visible-node? display-visible-node-ids* %)
                                           @layouted-nodes*)))
        full-node-index* (atom (index-layouted-nodes
                                (filter #(visible-node? visible-node-ids* %)
                                        @layouted-nodes*)))
        _ (.addChild detail-layer cluster-background-layer)
        _ (.addChild detail-layer task-status-background-layer)
        _ (draw-cluster-backgrounds! cluster-background-layer @layouted-nodes* normalized-view-mode dark? context-visible-node-ids* grid-layout? @highlight-state*)
        current-layout-nodes (fn []
                               (vals (logic/current-layout-by-id
                                      @layout-by-id*
                                      @preview-layout-by-id*)))
        current-world-transform (fn []
                                  {:x (.-x world)
                                   :y (.-y world)
                                   :scale (.. world -scale -x)})
        set-world-transform! (fn [{:keys [x y scale]}]
                               (set! (.-x world) x)
                               (set! (.-y world) y)
                               (set! (.. world -scale -x) scale)
                               (set! (.. world -scale -y) scale))
        task-status-background-context-ids
        (fn [base-nodes selected-group-node selected-task-ids]
          (let [selected-task-ids (set selected-task-ids)
                selected-id (:id selected-group-node)
                center-x (or (:x selected-group-node) 0)
                center-y (or (:y selected-group-node) 0)]
            (->> base-nodes
                 (filter #(and (contains? @background-visible-node-ids* (:id %))
                               (not (contains? selected-task-ids (:id %)))
                               (not= selected-id (:id %))))
                 (sort-by #(distance-squared center-x center-y (or (:x %) center-x) (or (:y %) center-y)))
                 (take task-status-background-context-limit)
                 (map :id)
                 set)))
        sync-cluster-backgrounds! (fn [nodes]
                                    (draw-cluster-backgrounds! cluster-background-layer
                                                               nodes
                                                               normalized-view-mode
                                                               dark?
                                                               context-visible-node-ids*
                                                               grid-layout?
                                                               @highlight-state*))
        edge-render-info (render-edges! detail-layer @layout-by-id* (visible-link-list) dark? normalized-view-mode (edge-render-opts))
        edge-label-render-info (render-edge-labels! edge-label-layer-wrapper world width height @layout-by-id* (visible-link-list) dark? normalized-view-mode (effective-show-edge-labels?))
        node-render-info (render-nodes! tag-layer detail-layer layouted-nodes* normalized-view-mode highlight-state* display-visible-node-ids* current-layout-nodes)
        _ ((:sync! node-render-info) world width height nil)
        tag-node-index* (atom (index-layouted-nodes (filter #(and (visible-node? visible-node-ids* %)
                                                                  (= "tag" (:kind %)))
                                                            @layouted-nodes*)))
        large-graph? (>= (count @layouted-nodes*) logic/large-graph-fast-layout-threshold)
        label-candidate-ids (vec (map :id (build-label-candidates
                                           @layouted-nodes*
                                           normalized-view-mode
                                           large-graph?)))
        label-manager (create-label-manager! node-label-layer
                                             dark?
                                             label-candidate-ids
                                             (fn [id]
                                               (get (logic/current-layout-by-id
                                                     @layout-by-id*
                                                     @preview-layout-by-id*)
                                                    id)))
        drag-session* (atom nil)
        detail-target-alpha (atom 1.0)
        label-target-alpha (atom 0.0)
        visibility-state* (atom {:detail-expanded? true
                                 :label-visible? false})
        transform-dirty? (atom true)
        display-visible-key* (atom nil)
        navigation-active? (atom false)
        last-navigation-ms* (atom 0)
        show-detail-scale (if large-graph? 0.88 0.70)
        hide-detail-scale (if large-graph? 0.80 0.62)
        show-label-scale (if large-graph? 1.32 1.05)
        hide-label-scale (if large-graph? 1.18 0.92)
        thresholds {:show-detail-scale show-detail-scale
                    :hide-detail-scale hide-detail-scale
                    :show-label-scale show-label-scale
                    :hide-label-scale hide-label-scale}
        mark-transform! (fn []
                          (reset! transform-dirty? true))
        mark-scene! (fn []
                      (reset! transform-dirty? true))
        mark-navigation! (fn []
                           (reset! navigation-active? true)
                           (reset! last-navigation-ms* (.now js/performance))
                           (reset! transform-dirty? true))
        selected-task-group-id (fn []
                                 (let [ids @highlighted-node-ids*]
                                   (when (= 1 (count ids))
                                     (first ids))))
        emit-selection! (fn []
                          (when (fn? on-selection-change)
                            (on-selection-change
                             (->> @highlighted-node-ids*
                                  (keep #(get @layout-by-id* %))
                                  (filter #(visible-node? visible-node-ids* %))
                                  vec))))
        resize-to-container! (fn []
                               (let [width (.-clientWidth container)
                                     height (.-clientHeight container)
                                     size {:width width :height height}]
                                 (when (and (pos? width)
                                            (pos? height)
                                            (not= size @size*))
                                   (reset! size* size)
                                   (.resize (.-renderer app) width height)
                                   (mark-transform!))))
        sync-edges-and-labels! (fn [layout-by-id]
                                 (draw-edges! (:graphics edge-render-info)
                                              layout-by-id
                                              (visible-link-list)
                                              dark?
                                              normalized-view-mode
                                              @highlight-state*
                                              (edge-render-opts))
                                 (let [{:keys [width height]} @size*]
                                   ((:sync! edge-label-render-info)
                                    world
                                    width
                                    height
                                    layout-by-id
                                    (visible-link-list)
                                    (effective-show-edge-labels?))))
        update-edge-display! (fn [next-show-arrows? next-show-edge-labels?]
                               (let [next-show-arrows? (true? next-show-arrows?)
                                     next-show-edge-labels? (true? next-show-edge-labels?)]
                                 (when (or (not= next-show-arrows? @show-arrows?*)
                                           (not= next-show-edge-labels? @show-edge-labels?*))
                                   (reset! show-arrows?* next-show-arrows?)
                                   (reset! show-edge-labels?* next-show-edge-labels?)
                                   (sync-edges-and-labels!
                                    (logic/current-layout-by-id
                                     @layout-by-id*
                                     @preview-layout-by-id*))
                                   (mark-transform!))))
        clear-task-status-grouping! (fn []
                                      (.clear task-status-background-layer)
                                      (destroy-children! task-status-label-layer)
                                      (reset! task-status-fit-key* nil)
                                      (reset! task-status-visible-node-ids* nil)
                                      (reset! task-status-display-node-ids* nil)
                                      (reset! task-status-main-node-ids* nil)
                                      (reset! task-status-links* nil)
                                      (reset! task-status-label-hit-nodes* [])
                                      (reset! task-status-revealed-count-by-status* {})
                                      (reset! task-status-sync-key* nil)
                                      (when @task-status-preview-active?
                                        (when-let [return-transform @task-status-return-transform*]
                                          (reset! world-transform-target* return-transform))
                                        (reset! task-status-return-transform* nil)
                                        (reset! display-visible-node-ids* @visible-node-ids*)
                                        (reset! context-visible-node-ids* @background-visible-node-ids*)
                                        (reset! display-visible-key* nil)
                                        (reset! display-node-index*
                                                (index-layouted-nodes
                                                 (filter #(visible-node? display-visible-node-ids* %)
                                                         @layouted-nodes*)))
                                        (reset! full-node-index*
                                                (index-layouted-nodes
                                                 (filter #(visible-node? visible-node-ids* %)
                                                         @layouted-nodes*)))
                                        (reset! preview-layout-by-id* nil)
                                        (reset! task-status-preview-active? false)
                                        (reset! highlight-state* (highlight-state-value))
                                        (sync-cluster-backgrounds! @layouted-nodes*)))
        reveal-task-status-count! (fn [status current-count total-count]
                                    (let [batch-size (or visible-recent-task-count
                                                         logic/task-status-detail-visible-limit)]
                                      (swap! task-status-revealed-count-by-status*
                                             assoc
                                             status
                                             (min total-count (+ current-count batch-size)))
                                      (reset! task-status-fit-key* nil)
                                      (mark-transform!)))
        reveal-task-status! (fn [groups status]
                              (when-let [group (some #(when (= status (:normalized-status %)) %) groups)]
                                (let [batch-size (or visible-recent-task-count
                                                     logic/task-status-detail-visible-limit)
                                      current-count (get @task-status-revealed-count-by-status*
                                                         status
                                                         batch-size)]
                                  (reveal-task-status-count! status current-count (:count group)))))
        sync-task-status-grouping! (fn []
                                     (let [raw-selected-group-id (selected-task-group-id)
                                           selected-group-id (or (when-let [selected-node (get @layout-by-id* raw-selected-group-id)]
                                                                   (logic/task-status-preview-entry-group-id
                                                                    selected-node
                                                                    @layout-by-id*
                                                                    neighbor-map))
                                                                 raw-selected-group-id)
                                           {:keys [width height] :as size} @size*
                                           sync-key [selected-group-id
                                                     width
                                                     height
                                                     visible-recent-task-count
                                                     @task-status-revealed-count-by-status*
                                                     @visible-node-ids*
                                                     (boolean @drag-session*)]]
                                       (when (not= sync-key @task-status-sync-key*)
                                         (reset! task-status-sync-key* sync-key)
                                         (let [base-nodes @layouted-nodes*
                                               eligible? (logic/task-status-detail-eligible?
                                                          base-nodes
                                                          selected-group-id
                                                          neighbor-map
                                                          @visible-node-ids*
                                                          {:view-mode normalized-view-mode
                                                           :grid-layout? grid-layout?})]
                                           (case (logic/task-status-preview-sync-action
                                                  {:eligible? eligible?
                                                   :dragging? (some? @drag-session*)
                                                   :preview-active? @task-status-preview-active?})
                                             :sync
                                             (let [selected-group-node (get @layout-by-id* selected-group-id)
                                                   groups (logic/task-status-groups
                                                           base-nodes
                                                           selected-group-id
                                                           neighbor-map
                                                           @visible-node-ids*
                                                           nil)
                                                   groups-layout (logic/task-status-group-layout
                                                                  groups
                                                                  {:center-x (:x selected-group-node)
                                                                   :center-y (:y selected-group-node)
                                                                   :center-label (:label selected-group-node)
                                                                   :visible-recent-task-count visible-recent-task-count
                                                                   :revealed-task-count-by-status @task-status-revealed-count-by-status*
                                                                   :width width
                                                                   :height height})
                                                   fit-key (logic/task-status-fit-key
                                                            selected-group-id
                                                            @task-status-revealed-count-by-status*
                                                            groups
                                                            (assoc size
                                                                   :visible-recent-task-count visible-recent-task-count))
                                                   status-layout-by-id (logic/task-status-layout-by-id selected-group-node groups-layout)
                                                   next-preview (merge
                                                                 (logic/merge-node-positions
                                                                  @layout-by-id*
                                                                  (:positions-by-id groups-layout))
                                                                 status-layout-by-id)
                                                   visible-task-ids (logic/task-status-visible-node-ids
                                                                     selected-group-id
                                                                     (:groups groups-layout))
                                                   selected-task-ids (set (mapcat :all-task-ids
                                                                                  (:groups groups-layout)))
                                                   status-links (logic/task-status-display-links
                                                                 selected-group-id
                                                                 (:groups groups-layout))
                                                   label-hit-nodes (task-status-label-hit-nodes
                                                                    selected-group-node
                                                                    groups-layout)]
                                               (when (and selected-group-id
                                                          (not= selected-group-id raw-selected-group-id))
                                                 (reset! highlighted-node-ids* #{selected-group-id})
                                                 (emit-selection!))
                                               (when (not= fit-key @task-status-fit-key*)
                                                 (when-not @task-status-preview-active?
                                                   (reset! task-status-return-transform* (current-world-transform)))
                                                 (let [fit-transform (logic/fit-transform
                                                                     (task-status-fit-nodes selected-group-node groups-layout)
                                                                     width
                                                                     height
                                                                     {:padding 64
                                                                      :max-scale 1.16})]
                                                   (reset! world-transform-target* fit-transform)
                                                   (reset! task-status-fit-key* fit-key)))
                                               (when (not= next-preview @preview-layout-by-id*)
                                                 (reset! preview-layout-by-id* next-preview)
                                                 (.clear cluster-background-layer))
                                               (let [background-context-ids (task-status-background-context-ids
                                                                             base-nodes
                                                                             selected-group-node
                                                                             selected-task-ids)
                                                     display-node-ids (set/union visible-task-ids background-context-ids)]
                                                 (reset! task-status-visible-node-ids* visible-task-ids)
                                                 (reset! task-status-display-node-ids* display-node-ids)
                                                 (reset! task-status-main-node-ids* visible-task-ids)
                                                 (reset! task-status-label-hit-nodes* label-hit-nodes)
                                                 (reset! highlight-state* (highlight-state-value))
                                                 (let [display-changed? (not= display-node-ids
                                                                              @display-visible-node-ids*)]
                                                   (when display-changed?
                                                     (reset! display-visible-node-ids* display-node-ids)
                                                     (reset! context-visible-node-ids* background-context-ids)
                                                     (reset! full-node-index*
                                                             (index-layouted-nodes
                                                              (filter #(contains? visible-task-ids (:id %))
                                                                      @layouted-nodes*))))
                                                   (reset! display-node-index*
                                                           (index-layouted-nodes
                                                            (task-status-interactive-layout-nodes
                                                             visible-task-ids
                                                             (current-layout-nodes)
                                                             label-hit-nodes)))))
                                               (reset! task-status-links* status-links)
                                               (reset! task-status-preview-active? true)
                                               (sync-task-status-backgrounds!
                                                task-status-background-layer
                                                task-status-label-layer
                                                groups-layout
                                                dark?
                                                {:center-node selected-group-node
                                                 :on-node-activate on-node-activate
                                                 :on-group-toggle
                                                 (fn [status]
                                                   (reveal-task-status! groups status))
                                                 :on-collapsed-toggle
                                                 (fn [status]
                                                   (reveal-task-status! groups status))}))
                                             :keep
                                             nil

                                             :clear
                                             (clear-task-status-grouping!))))))
        sync-highlight! (fn []
                          (reset! highlight-state* (highlight-state-value))
                          (if @task-status-preview-active?
                            (.clear cluster-background-layer)
                            (sync-cluster-backgrounds! (current-layout-nodes)))
                          (sync-edges-and-labels!
                           (logic/current-layout-by-id
                            @layout-by-id*
                            @preview-layout-by-id*))
                          (if-let [sync-styles! (:sync-styles! node-render-info)]
                            (sync-styles!)
                            (let [{:keys [width height]} @size*]
                              ((:sync! node-render-info) world width height @hovered-node-id*)))
                          (mark-transform!))
        update-link-distance! (fn [next-link-distance]
                                (when (not= next-link-distance @link-distance*)
                                  (reset! link-distance* next-link-distance)
                                  (reset! preview-layout-by-id* nil)
                                  (reset! drag-session* nil)
                                  (let [next-layouted-nodes (layout-nodes nodes
                                                                          links
                                                                          view-mode
                                                                          dark?
                                                                          {:link-distance next-link-distance
                                                                           :grid-layout? grid-layout?})]
                                    (reset! layouted-nodes* next-layouted-nodes)
                                    (reset! display-visible-key* nil)
                                    (reset! layout-by-id*
                                            (into {} (map (fn [node] [(:id node) node]) next-layouted-nodes)))
                                    (reset! display-links* (logic/display-links links next-layouted-nodes))
                                    (reset! tag-node-index*
                                            (index-layouted-nodes
                                             (filter #(and (visible-node? visible-node-ids* %)
                                                           (= "tag" (:kind %)))
                                                     next-layouted-nodes)))
                                    (reset! display-node-index*
                                            (index-layouted-nodes
                                             (filter #(visible-node? display-visible-node-ids* %)
                                                     next-layouted-nodes)))
                                    (reset! full-node-index*
                                            (index-layouted-nodes
                                             (filter #(visible-node? visible-node-ids* %)
                                                     next-layouted-nodes)))
                                    (sync-highlight!))))
        tag-focus-enabled? (fn [scale]
                             (and (= normalized-view-mode :tags-and-objects)
                                  (empty? @highlighted-node-ids*)
                                  (some? (tag-focus-level scale))))
        clear-tag-focus! (fn []
                           (when @tag-focus-node-id*
                             (reset! tag-focus-node-id* nil)
                             (mark-transform!)))
        visible-tag-ids (fn []
                          (->> @layouted-nodes*
                               (filter #(and (visible-node? visible-node-ids* %)
                                             (= "tag" (:kind %))))
                               (map :id)
                               set))
        task-status-tag-id? (fn [node-id]
                              (when-let [node (get @layout-by-id* node-id)]
                                (= node-id
                                   (logic/task-status-preview-entry-group-id node))))
        focused-tag-id-for-scale (fn [scale]
                                   (let [focus-level (tag-focus-level scale)
                                         visible-tag-id-set (visible-tag-ids)]
                                     (when (and focus-level
                                                (contains? visible-tag-id-set @tag-focus-node-id*)
                                                (not (task-status-tag-id? @tag-focus-node-id*)))
                                       @tag-focus-node-id*)))
        tag-context-node-ids (fn [tag-id]
                               (->> (conj (set (get neighbor-map tag-id)) tag-id)
                                    (filter #(contains? @background-visible-node-ids* %))
                                    set))
        crossed-tag-node-ids (fn [object-ids]
                               (->> object-ids
                                    (mapcat #(get neighbor-map %))
                                    (filter #(and (contains? @visible-node-ids* %)
                                                  (= "tag" (node-kind %))))
                                    set))
        tag-drill-visible-node-ids (fn [scale]
                                     (if-let [task-display-node-ids @task-status-display-node-ids*]
                                       task-display-node-ids
                                       (if (or (not= normalized-view-mode :tags-and-objects)
                                               (seq @highlighted-node-ids*))
                                         @visible-node-ids*
                                         (if grid-layout?
                                           (grid-layout-display-node-ids @layouted-nodes* visible-node-ids*)
                                           (let [visible-tag-id-set (visible-tag-ids)
                                                 focus-level (tag-focus-level scale)
                                                 focused-tag-id (focused-tag-id-for-scale scale)]
                                             (case focus-level
                                               :isolate
                                               (logic/tag-focus-display-node-ids
                                                visible-tag-id-set
                                                focus-level
                                                focused-tag-id
                                                #{}
                                                #{})

                                               :objects
                                               (if focused-tag-id
                                                 (let [context-node-ids (tag-context-node-ids focused-tag-id)
                                                       object-ids (->> context-node-ids
                                                                       (filter #(not= "tag" (node-kind %)))
                                                                       set)
                                                       {:keys [width height]} @size*
                                                       object-budget (tag-object-display-budget
                                                                      @layout-by-id*
                                                                      focused-tag-id
                                                                      context-node-ids
                                                                      (count object-ids)
                                                                      scale
                                                                      width
                                                                      height)
                                                       visible-object-ids (balanced-object-node-ids
                                                                           @layout-by-id*
                                                                           focused-tag-id
                                                                           object-ids
                                                                           object-budget)]
                                                   (->> (logic/tag-focus-display-node-ids
                                                         visible-tag-id-set
                                                         focus-level
                                                         focused-tag-id
                                                         visible-object-ids
                                                         (crossed-tag-node-ids visible-object-ids))
                                                        (filter #(contains? @visible-node-ids* %))
                                                        set))
                                                 visible-tag-id-set)

                                               visible-tag-id-set))))))
        tag-drill-context-node-ids (fn [scale]
                                     (if (or (not= normalized-view-mode :tags-and-objects)
                                             (seq @highlighted-node-ids*))
                                       @background-visible-node-ids*
                                       (if grid-layout?
                                         (grid-layout-display-node-ids @layouted-nodes* visible-node-ids*)
                                         (if-let [tag-id (and (contains? #{:isolate :objects}
                                                                         (tag-focus-level scale))
                                                              (focused-tag-id-for-scale scale))]
                                           (set/union @background-visible-node-ids*
                                                      (tag-context-node-ids tag-id))
                                           @background-visible-node-ids*))))
        display-visible-key (fn [scale]
                              (let [focus-level (when (= normalized-view-mode :tags-and-objects)
                                                  (tag-focus-level scale))]
                                {:view-mode normalized-view-mode
                                 :focus-level focus-level
                                 :focused-tag-id @tag-focus-node-id*
                                 :highlighted-node-ids @highlighted-node-ids*
                                 :object-scale-bucket (when (= focus-level :objects)
                                                        (js/Math.floor (* scale 12)))}))
        update-display-visible! (fn [scale]
                                  (let [next-key (display-visible-key scale)]
                                    (if (= next-key @display-visible-key*)
                                      false
                                      (let [next-visible-node-ids (tag-drill-visible-node-ids scale)
                                            next-context-node-ids (tag-drill-context-node-ids scale)]
                                        (reset! display-visible-key* next-key)
                                        (if (or (not= next-visible-node-ids @display-visible-node-ids*)
                                                (not= next-context-node-ids @context-visible-node-ids*))
                                          (do
                                            (reset! display-visible-node-ids* next-visible-node-ids)
                                            (reset! context-visible-node-ids* next-context-node-ids)
                                            (reset! display-node-index*
                                                    (index-layouted-nodes
                                                     (if @task-status-preview-active?
                                                       (task-status-interactive-layout-nodes
                                                        (or @task-status-visible-node-ids* #{})
                                                        (current-layout-nodes)
                                                        @task-status-label-hit-nodes*)
                                                       (filter #(contains? next-visible-node-ids (:id %))
                                                               (current-layout-nodes)))))
                                            (reset! full-node-index*
                                                    (index-layouted-nodes
                                                     (filter #(visible-node? visible-node-ids* %)
                                                             @layouted-nodes*)))
                                            (if @task-status-preview-active?
                                              (.clear cluster-background-layer)
                                              (sync-cluster-backgrounds! @layouted-nodes*))
                                            (sync-edges-and-labels!
                                             (logic/current-layout-by-id
                                              @layout-by-id*
                                              @preview-layout-by-id*))
                                            true)
                                          false)))))
        sync-hover-preview! (fn [node-id]
                              (reset! hovered-node-id* node-id)
                              (mark-transform!))
        update-tag-focus! (fn [world-x world-y scale]
                            (let [focus-level (tag-focus-level scale)
                                  focused-tag-id (focused-tag-id-for-scale scale)]
                              (cond
                                (not (tag-focus-enabled? scale))
                                (clear-tag-focus!)

                                (and focused-tag-id
                                     (contains? #{:isolate :objects} focus-level))
                                nil

                                :else
                                (let [next-id (nearest-indexed-node-id
                                               @tag-node-index*
                                               world-x
                                               world-y
                                               scale
                                               tag-focus-max-screen-distance)
                                      next-id (or next-id focused-tag-id)]
                                  (if (and next-id (task-status-tag-id? next-id))
                                    (clear-tag-focus!)
                                    (when (not= next-id @tag-focus-node-id*)
                                      (reset! tag-focus-node-id* next-id)
                                      (mark-transform!)))))))
        update-highlight! (fn [node remove?]
                            (if-let [activation-target
                                     (logic/task-status-preview-click-activation-target
                                      @task-status-preview-active?
                                      node)]
                              (when (fn? on-node-activate)
                                (on-node-activate activation-target nil))
                              (cond
                                (= "collapsed" (:type node))
                                (do
                                  (let [status (:normalized-status node)
                                        visible-count (or (:visible-task-count node)
                                                          visible-recent-task-count
                                                          logic/task-status-detail-visible-limit)
                                        total-count (+ visible-count (or (:hidden-count node) 0))]
                                    (swap! task-status-revealed-count-by-status*
                                           assoc
                                           status
                                           (min total-count
                                                (+ visible-count
                                                   (or visible-recent-task-count
                                                       logic/task-status-detail-visible-limit)))))
                                  (reset! task-status-fit-key* nil)
                                  (mark-transform!))

                                :else
                                (do
                                  (clear-tag-focus!)
                                  (let [entry-group-id (logic/task-status-preview-entry-group-id
                                                        node
                                                        @layout-by-id*
                                                        neighbor-map)
                                        entry-selected-ids
                                        (logic/task-status-preview-entry-selected-ids
                                         entry-group-id
                                         {:eligible? (and entry-group-id
                                                          (logic/task-status-detail-eligible?
                                                           @layouted-nodes*
                                                           entry-group-id
                                                           neighbor-map
                                                           @visible-node-ids*
                                                           {:view-mode normalized-view-mode
                                                            :grid-layout? grid-layout?}))
                                          :preview-active? @task-status-preview-active?})]
                                    (if entry-selected-ids
                                      (do
                                        (reset! highlighted-node-ids* entry-selected-ids)
                                        (emit-selection!)
                                        (reset! task-status-sync-key* nil)
                                        (sync-task-status-grouping!)
                                        (sync-highlight!))
                                      (do
                                        (swap! highlighted-node-ids*
                                               logic/update-highlighted-node-ids
                                               (:id node)
                                               remove?)
                                        (emit-selection!)
                                        (sync-highlight!))))))))
        clear-highlight! (fn []
                           (when (seq @highlighted-node-ids*)
                             (reset! highlighted-node-ids* #{})
                             (emit-selection!)
                             (clear-tag-focus!)
                             (when @task-status-preview-active?
                               (clear-task-status-grouping!))
                             (sync-highlight!)))
        update-edge-highlight! (fn [{:keys [source target]}]
                                 (clear-tag-focus!)
                                 (reset! highlighted-node-ids* #{source target})
                                 (emit-selection!)
                                 (sync-highlight!))
        ensure-drag-session! (fn [root-node]
                               (let [root-id (:id root-node)]
                                 (if (and @drag-session*
                                          (= root-id (:root-id @drag-session*)))
                                   @drag-session*
                                   (let [weights (logic/connected-drag-weights
                                                  neighbor-map
                                                  root-id
                                                  {:max-depth @depth*
                                                   :max-nodes 1200
                                                   :decay 0.72
                                                   :min-weight 0.2})
                                         root-start (get @layout-by-id* root-id)
                                         base-by-id (reduce-kv
                                                     (fn [m node-id _weight]
                                                       (if-let [node (get @layout-by-id* node-id)]
                                                         (assoc m node-id {:x (:x node)
                                                                           :y (:y node)})
                                                         m))
                                                     {}
                                                     weights)
                                         session {:root-id root-id
                                                  :root-start root-start
                                                  :weights weights
                                                  :base-by-id base-by-id
                                                  :positions {}}]
                                     (reset! drag-session* session)
                                     session))))
        apply-node-drag! (fn [node next-x next-y]
                           (let [session (ensure-drag-session! node)
                                 root-start (:root-start session)
                                 dx (- next-x (:x root-start))
                                 dy (- next-y (:y root-start))
                                 positions (reduce-kv
                                            (fn [m node-id weight]
                                              (if-let [base (get (:base-by-id session) node-id)]
                                                (assoc m node-id
                                                       {:x (+ (:x base) (* dx weight))
                                                        :y (+ (:y base) (* dy weight))})
                                                m))
                                            {}
                                            (:weights session))]
                             (reset! drag-session* (assoc session :positions positions))
                             (doseq [[node-id {:keys [x y]}] positions]
                               (when-let [sprite (rendered-sprite node-render-info node-id)]
                                 (set! (.-x sprite) x)
                                 (set! (.-y sprite) y)))
                             (let [preview-layout-by-id (logic/merge-node-positions
                                                         @layout-by-id*
                                                         positions)]
                               (reset! preview-layout-by-id* preview-layout-by-id)
                               (sync-edges-and-labels! preview-layout-by-id))))
        commit-node-drag! (fn [node next-x next-y]
                            (let [node-id (:id node)
                                  positions (or (:positions @drag-session*)
                                                {node-id {:x next-x :y next-y}})
                                  next-layouted-nodes (swap! layouted-nodes*
                                                             update-node-positions
                                                             node-index-by-id
                                                             positions)]
                              (doseq [[moved-node-id _] positions]
                                (when-let [idx (get node-index-by-id moved-node-id)]
                                  (when-let [moved-node (get next-layouted-nodes idx)]
                                    (swap! layout-by-id* assoc moved-node-id moved-node))))
                              (sync-cluster-backgrounds! @layouted-nodes*)
                              (sync-edges-and-labels! @layout-by-id*)
                              (reset! preview-layout-by-id* nil)
                              (reset! drag-session* nil)
                              (reset! tag-node-index* (index-layouted-nodes
                                                       (filter #(and (visible-node? visible-node-ids* %)
                                                                     (= "tag" (:kind %)))
                                                               @layouted-nodes*)))
                              (reset! display-node-index*
                                      (index-layouted-nodes
                                       (filter #(visible-node? display-visible-node-ids* %)
                                               (current-layout-nodes))))
                              (reset! full-node-index*
                                      (index-layouted-nodes
                                       (filter #(visible-node? visible-node-ids* %)
                                               @layouted-nodes*)))
                              (mark-transform!)))
        ticker-step (fn [layer target-alpha]
                      (let [alpha (.-alpha layer)
                            target (if (number? target-alpha) target-alpha @target-alpha)
                            next (+ alpha (* (- target alpha) 0.2))]
                        (set! (.-alpha layer) next)
                        (set! (.-visible layer) (> next 0.01))))
        tick-world-transform! (fn []
                                (when-let [{target-x :x target-y :y target-scale :scale} @world-transform-target*]
                                  (let [current (current-world-transform)
                                        next {:x (+ (:x current) (* (- target-x (:x current)) 0.18))
                                              :y (+ (:y current) (* (- target-y (:y current)) 0.18))
                                              :scale (+ (:scale current) (* (- target-scale (:scale current)) 0.18))}
                                        done? (and (< (js/Math.abs (- target-x (:x next))) 0.6)
                                                   (< (js/Math.abs (- target-y (:y next))) 0.6)
                                                   (< (js/Math.abs (- target-scale (:scale next))) 0.006))]
                                    (set-world-transform! (if done?
                                                            {:x target-x :y target-y :scale target-scale}
                                                            next))
                                    (when done?
                                      (reset! world-transform-target* nil))
                                    true)))
        animate-layer (fn []
                        (let [now (.now js/performance)]
                          (let [{:keys [width height]} @size*]
                            (tick-fps-overlay! fps-overlay fps-last-ms* fps-frame-count* width height))
                          (when (and @navigation-active?
                                     (> (- now @last-navigation-ms*) navigation-idle-ms))
                            (reset! navigation-active? false)
                            (mark-scene!)))
                        (ticker-step detail-layer detail-target-alpha)
                        (when (tick-world-transform!)
                          (reset! transform-dirty? true))
                        (let [dirty? @transform-dirty?
                              navigation? @navigation-active?
                              scale (.. world -scale -x)
                              transition-running? (when-let [tick-transitions! (:tick-transitions! node-render-info)]
                                                    (tick-transitions!))
                              display-changed? (when dirty?
                                                 (update-display-visible! scale))
                              heavy-sync? (and dirty?
                                               (or display-changed?
                                                   (not navigation?)))]
                          (when dirty?
                            (sync-task-status-grouping!)
                            (when heavy-sync?
                              (let [{:keys [width height]} @size*]
                                ((:sync! node-render-info) world width height @hovered-node-id*)
                                (when-not navigation?
                                  (sync-edges-and-labels!
                                   (logic/current-layout-by-id
                                    @layout-by-id*
                                    @preview-layout-by-id*)))))
                            (when-let [sync-edge-label-transform-fn (:sync-transform! edge-label-render-info)]
                              (let [{:keys [width height]} @size*]
                                (sync-edge-label-transform-fn
                                 world
                                 width
                                 height
                                 (logic/current-layout-by-id
                                  @layout-by-id*
                                  @preview-layout-by-id*)))))
                          (when-let [label-layer (:container label-manager)]
                            (let [task-status-preview-active? @task-status-preview-active?
                                  focus-level (when (and (= normalized-view-mode :tags-and-objects)
                                                         (empty? @highlighted-node-ids*))
                                                (tag-focus-level scale))
                                  focused-tag-id (focused-tag-id-for-scale scale)
                                  focused-node-ids (if focused-tag-id
                                                     #{focused-tag-id}
                                                     #{})
                                  label-hovered-node-id (when-not (or task-status-preview-active?
                                                                      (and (= normalized-view-mode :tags-and-objects)
                                                                           (empty? @highlighted-node-ids*)
                                                                           (nil? focus-level)))
                                                          @hovered-node-id*)
                                  focus-labels-only? (and (seq focused-node-ids)
                                                          (not (:label-visible? @visibility-state*)))
                                  label-visibility-state (cond-> @visibility-state*
                                                           (seq focused-node-ids)
                                                           (assoc :label-visible? true)
                                                           true
                                                           (assoc :linked-label-visible?
                                                                  (>= scale logic/linked-label-visible-scale))
                                                           task-status-preview-active?
                                                           (assoc :task-status-preview-active? true
                                                                  :label-visible? false
                                                                  :linked-label-visible? false))
                                  {:keys [target-alpha update? hovered-only? selected-only? active-only?]}
                                  (logic/label-render-state
                                   label-hovered-node-id
                                   @highlighted-node-ids*
                                   (:active-ids @highlight-state*)
                                   label-visibility-state
                                   (.-alpha label-layer))
                                  force-label-update? (and (pos? target-alpha)
                                                           (not ((:has-visible-labels? label-manager))))]
                              (ticker-step label-layer target-alpha)
                              (when (and dirty? update?)
                                (if (or (not navigation?)
                                        focus-labels-only?
                                        display-changed?
                                        force-label-update?)
                                  (let [{:keys [width height]} @size*]
                                    ((:update! label-manager)
                                     world
                                     width
                                     height
                                     label-hovered-node-id
                                     {:node-visible? (cond
                                                       task-status-preview-active?
                                                       (constantly false)

                                                       focus-labels-only?
                                                       #(and (visible-node? visible-node-ids* %)
                                                             (or (= "tag" (:kind %))
                                                                 (contains? focused-node-ids (:id %))))

                                                       (:detail-expanded? @visibility-state*)
                                                       #(visible-node? display-visible-node-ids* %)

                                                       :else
                                                       #(and (visible-node? display-visible-node-ids* %)
                                                             (= "tag" (:kind %))))
                                      :hovered-only? hovered-only?
                                      :selected-node-ids @highlighted-node-ids*
                                      :active-node-ids (:active-ids @highlight-state*)
                                      :focused-node-id focused-tag-id
                                      :focused-node-ids focused-node-ids
                                      :focused-only? (boolean focus-labels-only?)
                                      :selected-only? selected-only?
                                      :active-only? active-only?}))
                                  (when-let [sync-transform! (:sync-transform! label-manager)]
                                    (sync-transform! world label-hovered-node-id focused-tag-id))))))
                          (when dirty?
                            (reset! transform-dirty? (boolean transition-running?)))))
        update-visibility! (fn [next-visible-node-ids next-background-visible-node-ids]
                             (let [next-visible-node-ids (if (some? next-visible-node-ids)
                                                           (visible-node-id-set
                                                            @layouted-nodes*
                                                            all-node-id-set
                                                            next-visible-node-ids)
                                                           all-node-id-set)
                                   next-background-visible-node-ids (if (some? next-background-visible-node-ids)
                                                                      (visible-node-id-set
                                                                       @layouted-nodes*
                                                                       all-node-id-set
                                                                       next-background-visible-node-ids)
                                                                      next-visible-node-ids)]
                               (when (or (not= next-visible-node-ids @visible-node-ids*)
                                         (not= next-background-visible-node-ids @background-visible-node-ids*))
                                 (reset! visible-node-ids* next-visible-node-ids)
                                 (reset! background-visible-node-ids* next-background-visible-node-ids)
                                 (let [next-highlighted-node-ids (set/intersection
                                                                  @highlighted-node-ids*
                                                                  next-visible-node-ids)]
                                   (when (not= next-highlighted-node-ids @highlighted-node-ids*)
                                     (reset! highlighted-node-ids* next-highlighted-node-ids)
                                     (emit-selection!)))
                                 (when-not (contains? next-visible-node-ids @hovered-node-id*)
                                   (reset! hovered-node-id* nil))
                                 (reset! preview-layout-by-id* nil)
                                 (reset! drag-session* nil)
                                 (reset! display-visible-key* nil)
                                 (reset! tag-node-index*
                                         (index-layouted-nodes
                                          (filter #(and (visible-node? visible-node-ids* %)
                                                        (= "tag" (:kind %)))
                                                  @layouted-nodes*)))
                                 (update-display-visible! (.. world -scale -x))
                                 (sync-cluster-backgrounds! @layouted-nodes*)
                                 (sync-highlight!))))
        update-depth! (fn [next-depth]
                        (let [next-depth (-> (or next-depth 1) (max 1) (min 5))]
                          (when (not= next-depth @depth*)
                            (reset! depth* next-depth)
                            (when (seq @highlighted-node-ids*)
                              (reset! preview-layout-by-id* nil)
                              (reset! drag-session* nil)
                              (sync-highlight!)))))
        update-detail-visibility! (fn [scale]
                                    (when-not (tag-focus-enabled? scale)
                                      (clear-tag-focus!))
                                    (let [prev @visibility-state*
                                          next (logic/next-visibility-state prev scale thresholds)]
                                      (when (not= prev next)
                                        (reset! visibility-state* next)
                                        (reset! detail-target-alpha
                                                (if (:detail-expanded? next) 1.0 0.0))
                                        (reset! label-target-alpha
                                                (if (:label-visible? next) 1.0 0.0))
                                        (mark-transform!))))
        get-node-index (fn []
                         (if @task-status-preview-active?
                           @display-node-index*
                           (if (seq @highlighted-node-ids*)
                             @full-node-index*
                             @display-node-index*)))
        get-edge-hit (fn [world-x world-y scale]
                       (hit-test-edge
                        (logic/current-layout-by-id
                         @layout-by-id*
                         @preview-layout-by-id*)
                        (visible-link-list)
                        world-x
                        world-y
                        scale))
        event-cleanup (setup-pan-and-zoom!
                       canvas
                       world
                       {:get-node-index get-node-index
                        :get-edge-hit get-edge-hit
                        :on-node-activate on-node-activate
                        :on-node-preview on-node-preview
                        :on-node-select update-highlight!
                        :on-edge-select update-edge-highlight!
                        :on-selection-clear (fn []
                                              (when-not @task-status-preview-active?
                                                (clear-highlight!)))
                        :node-selected? #(contains? @highlighted-node-ids* %)
                        :on-scale-change update-detail-visibility!
                        :on-transform mark-navigation!
                        :on-hover-node-change sync-hover-preview!
                        :on-gesture-point update-tag-focus!
                        :on-node-drag apply-node-drag!
                        :on-node-drag-end commit-node-drag!
                        :task-status-preview-active? #(boolean @task-status-preview-active?)
                        :on-preview-exit clear-highlight!
                        :gesture-locked? #(some? @world-transform-target*)})
        resize-observer (when (exists? js/ResizeObserver)
                          (let [observer (js/ResizeObserver. resize-to-container!)]
                            (.observe observer container)
                            observer))
        render-elapsed (- (.now js/performance) render-start)]
    (logic/apply-graph-ticker-frame-rate! (.-ticker app))
    (.add (.-ticker app) animate-layer)
    (mark-transform!)
    (update-detail-visibility! (:scale initial-transform))
    (when (fn? on-rendered)
      (on-rendered {:render-ms render-elapsed
                    :drawn-nodes (count @layouted-nodes*)
                    :visible-nodes (let [drawn-node-count (:drawn-node-count node-render-info)]
                                     (if (number? drawn-node-count)
                                       drawn-node-count
                                       @drawn-node-count))
                    :drawn-links (:drawn-links edge-render-info)
                    :auto-collapse? large-graph?}))
    {:app app
     :update-visibility! update-visibility!
     :update-depth! update-depth!
     :update-link-distance! update-link-distance!
     :update-edge-display! update-edge-display!
     :cleanup (fn []
                (event-cleanup)
                (when-let [^js observer resize-observer]
                  (.disconnect observer))
                (.remove (.-ticker app) animate-layer)
                ((:destroy! label-manager))
                ((:destroy! edge-label-render-info))
                (doseq [^js texture (vals (:textures node-render-info))]
                  (.destroy texture true)))
     :canvas canvas}))

(defn update-visibility!
  ([^js container visible-node-ids]
   (update-visibility! container visible-node-ids nil))
  ([^js container visible-node-ids background-visible-node-ids]
   (when-let [update-visibility-fn (some-> (get @*graph-instances container)
                                           :update-visibility!)]
     (update-visibility-fn visible-node-ids background-visible-node-ids))
   nil))

(defn update-depth!
  [^js container depth]
  (when-let [update-depth-fn (some-> (get @*graph-instances container)
                                     :update-depth!)]
    (update-depth-fn depth))
  nil)

(defn update-link-distance!
  [^js container link-distance]
  (when-let [update-link-distance-fn (some-> (get @*graph-instances container)
                                             :update-link-distance!)]
    (update-link-distance-fn link-distance))
  nil)

(defn update-edge-display!
  [^js container show-arrows? show-edge-labels?]
  (when-let [update-edge-display-fn (some-> (get @*graph-instances container)
                                            :update-edge-display!)]
    (update-edge-display-fn show-arrows? show-edge-labels?))
  nil)

(defn render-container!
  [^js container {:keys [nodes links dark? on-node-activate on-node-preview on-selection-change on-rendered view-mode visible-node-ids background-visible-node-ids depth show-arrows? link-distance visible-recent-task-count show-edge-labels? grid-layout?]}]
  (when container
    (let [token (get (swap! *render-tokens update container (fnil inc 0)) container)
          render-start (.now js/performance)
          app (new (.-Application PIXI))]
      (-> (.init app (clj->js
                      (assoc (logic/renderer-init-options (.-devicePixelRatio js/window))
                             :resizeTo container)))
          (.then
           (fn []
             (if (= token (get @*render-tokens container))
               (let [old-instance (get @*graph-instances container)]
                 (destroy-instance-data! old-instance)
                 (swap! *graph-instances
                        assoc
                        container
                        (setup-scene! app container {:nodes nodes
                                                     :links links
                                                     :dark? dark?
                                                     :on-node-activate on-node-activate
                                                     :on-node-preview on-node-preview
                                                     :on-selection-change on-selection-change
                                                     :on-rendered on-rendered
                                                     :view-mode view-mode
                                                     :visible-node-ids visible-node-ids
                                                     :background-visible-node-ids background-visible-node-ids
                                                     :depth depth
                                                     :show-arrows? show-arrows?
                                                     :link-distance link-distance
                                                     :visible-recent-task-count visible-recent-task-count
                                                     :show-edge-labels? show-edge-labels?
                                                     :grid-layout? grid-layout?}
                                      render-start)))
               (.destroy ^js app))))
          (.catch
           (fn [error]
             (log/error :graph/render-failed {:error error}))))))
  nil)
