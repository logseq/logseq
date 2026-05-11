(ns frontend.extensions.graph.pixi.logic
  (:require ["@emoji-mart/data" :as emoji-data]
            ["d3-force" :as d3-force]
            [clojure.set :as set]
            [clojure.string :as string]
            [goog.object :as gobj]))

(defn next-visibility-state
  [{:keys [label-visible?]} scale
   {:keys [show-label-scale hide-label-scale]}]
  (let [detail-expanded? true
        label-visible? (cond
                         (and (not label-visible?)
                              (>= scale show-label-scale)) true
                         (and label-visible?
                              (<= scale hide-label-scale)) false
                         :else label-visible?)]
    {:detail-expanded? detail-expanded?
     :label-visible? label-visible?}))

(defn node-source-id
  [node]
  (or (:source-id node) (:id node)))

(defn visual-node-id
  [tag-id node-id]
  (str "tag-group:" tag-id ":node:" node-id))

(defn- node-priority
  [node]
  [(if (= "tag" (:kind node)) 0 1)
   (- (or (:degree node) 0))
   (str (or (node-source-id node) ""))])

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

(defn label-surface-fill-alpha
  [_label-kind _active?]
  1.0)

(defn renderer-init-options
  [device-pixel-ratio]
  {:backgroundAlpha 0
   :antialias true
   :autoDensity true
   :resolution (min 2 (or device-pixel-ratio 1))
   :powerPreference "high-performance"})

(def graph-target-fps 120)

(defn apply-graph-ticker-frame-rate!
  [^js ticker]
  (set! (.-maxFPS ticker) graph-target-fps)
  ticker)

(defn readable-edge-label-angle
  [from-x from-y to-x to-y]
  (let [angle (js/Math.atan2 (- to-y from-y) (- to-x from-x))]
    (cond
      (> angle (/ js/Math.PI 2))
      (- angle js/Math.PI)

      (< angle (/ js/Math.PI -2))
      (+ angle js/Math.PI)

      :else
      angle)))

(defn edge-render-runs
  [links show-arrows?]
  (let [links (second
               (reduce (fn [[seen result] {:keys [source target] :as link}]
                         (let [endpoint [source target]]
                           (if (contains? seen endpoint)
                             [seen result]
                             [(conj seen endpoint) (conj result link)])))
                       [#{} []]
                       links))
        directed-endpoints (set (map (juxt :source :target) links))]
    (mapv (fn [{:keys [source target] :as link}]
            (let [reciprocal? (contains? directed-endpoints [target source])
                  parallel-offset (if reciprocal? 1 0)]
              (assoc link
                     :show-arrow? (boolean show-arrows?)
                     :parallel-offset parallel-offset)))
          links)))

(defn- emoji-native
  [id]
  (when (string? id)
    (when-let [emoji (some-> (gobj/get emoji-data "emojis")
                             (gobj/get id))]
      (when-let [skins (gobj/get emoji "skins")]
        (some-> (aget skins 0)
                (gobj/get "native"))))))

(defn icon-display-text
  [icon]
  (cond
    (and (string? icon) (not (string/blank? icon)))
    icon

    (map? icon)
    (let [type (or (:type icon) (get icon "type"))
          id (or (:id icon) (get icon "id"))]
      (when (contains? #{:emoji "emoji"} type)
        (emoji-native id)))

    :else
    nil))

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

(defn merge-node-positions
  [layout-by-id positions-by-id]
  (reduce-kv
   (fn [m node-id position]
     (if-let [node (get m node-id)]
       (assoc m node-id (merge node position))
       m))
   layout-by-id
   positions-by-id))

(defn current-layout-by-id
  [layout-by-id preview-layout-by-id]
  (or preview-layout-by-id layout-by-id))

(defn update-highlighted-node-ids
  [selected-ids node-id remove?]
  (if remove?
    (disj (set selected-ids) node-id)
    (conj (set selected-ids) node-id)))

(defn- connected-node-ids
  [selected-ids neighbor-map depth]
  (let [depth (-> (or depth 1) (max 1) (min 5))]
    (loop [queue (into cljs.core/PersistentQueue.EMPTY (map #(vector % 0) selected-ids))
           seen selected-ids]
      (if (empty? queue)
        seen
        (let [[node-id current-depth] (peek queue)
              queue (pop queue)]
          (if (>= current-depth depth)
            (recur queue seen)
            (let [[queue seen]
                  (reduce
                   (fn [[queue* seen*] neighbor-id]
                     (if (contains? seen* neighbor-id)
                       [queue* seen*]
                       [(conj queue* [neighbor-id (inc current-depth)])
                        (conj seen* neighbor-id)]))
                   [queue seen]
                   (get neighbor-map node-id []))]
              (recur queue seen))))))))

(defn highlight-state
  ([selected-ids neighbor-map]
   (highlight-state selected-ids neighbor-map 1))
  ([selected-ids neighbor-map depth]
   (let [selected-ids (set selected-ids)
         active-ids (connected-node-ids selected-ids neighbor-map depth)
         connected-ids (set/difference active-ids selected-ids)]
     {:selected-ids selected-ids
      :connected-ids connected-ids
      :active-ids active-ids
      :select-mode? (seq selected-ids)})))

(defn highlight-visible-links
  [links {:keys [active-ids select-mode?]}]
  (if select-mode?
    (let [active-ids (set active-ids)]
      (filter (fn [{:keys [source target]}]
                (and (contains? active-ids source)
                     (contains? active-ids target)))
              links))
    []))

(defn node-emphasis
  [{:keys [selected-ids connected-ids preview-ids hovered-id select-mode?]} node-id]
  (cond
    (contains? selected-ids node-id) :selected
    (= hovered-id node-id) :hovered
    (contains? connected-ids node-id) :connected
    (contains? preview-ids node-id) :preview
    select-mode? :dimmed
    :else :normal))

(def double-click-ms 320)

(def min-zoom-scale 0.05)

(def max-zoom-scale 3.6)

(def linked-label-visible-scale 2.1)

(defn clamp-zoom-scale
  [scale]
  (-> scale
      (max min-zoom-scale)
      (min max-zoom-scale)))

(defn node-click-action
  [previous-click node-id {:keys [selected? open?]} now]
  (cond
    open?
    {:action :open
     :next-click nil}

    (and (= node-id (:node-id previous-click))
         (<= (- now (:time previous-click)) double-click-ms))
    {:action :open
     :next-click nil}

    selected?
    {:action :unhighlight
     :next-click {:node-id node-id
                  :time now}}

    :else
    {:action :highlight
     :next-click {:node-id node-id
                  :time now}}))

(defn label-render-state
  ([hovered-node-id visibility-state label-alpha]
   (label-render-state hovered-node-id #{} #{} visibility-state label-alpha false))
  ([hovered-node-id active-node-ids {:keys [label-visible?]} label-alpha]
   (label-render-state hovered-node-id active-node-ids active-node-ids {:label-visible? label-visible?} label-alpha true))
  ([hovered-node-id selected-node-ids active-node-ids visibility-state label-alpha]
   (label-render-state hovered-node-id selected-node-ids active-node-ids visibility-state label-alpha true))
  ([hovered-node-id selected-node-ids active-node-ids {:keys [label-visible? linked-label-visible?]} _ include-select-scope?]
   (let [linked-label-visible? (if (some? linked-label-visible?)
                                 linked-label-visible?
                                 label-visible?)
         select-mode? (seq selected-node-ids)
         active-mode? (seq active-node-ids)
         selected-labels-only? (and select-mode? (not linked-label-visible?))]
     (cond
       hovered-node-id
       (cond-> {:target-alpha 1.0
                :update? true
                :hovered-only? (not (or label-visible? active-mode?))}
         include-select-scope?
         (assoc :selected-only? selected-labels-only?
                :active-only? (and active-mode? linked-label-visible?)))

       label-visible?
       (cond-> {:target-alpha 1.0
                :update? true
                :hovered-only? false}
         include-select-scope?
         (assoc :selected-only? selected-labels-only?
                :active-only? (and active-mode? linked-label-visible?)))

       select-mode?
       (cond-> {:target-alpha 1.0
                :update? true
                :hovered-only? false}
         include-select-scope?
         (assoc :selected-only? selected-labels-only?
                :active-only? false))

       :else
       (cond-> {:target-alpha 0.0
                :update? false
                :hovered-only? true}
         include-select-scope?
         (assoc :selected-only? false
                :active-only? false))))))

(defn layout-bounds
  [nodes]
  (when (seq nodes)
    (reduce
     (fn [bounds {:keys [x y radius]}]
       (let [radius (or radius 0)]
         {:min-x (min (:min-x bounds) (- x radius))
          :min-y (min (:min-y bounds) (- y radius))
          :max-x (max (:max-x bounds) (+ x radius))
          :max-y (max (:max-y bounds) (+ y radius))}))
     (let [{:keys [x y radius]} (first nodes)
           radius (or radius 0)]
       {:min-x (- x radius)
        :min-y (- y radius)
        :max-x (+ x radius)
        :max-y (+ y radius)})
     (rest nodes))))

(defn fit-transform
  [nodes width height {:keys [padding max-scale]
                       :or {padding 80
                            max-scale 1.0}}]
  (if-let [{:keys [min-x min-y max-x max-y]} (layout-bounds nodes)]
    (let [graph-width (max 1 (- max-x min-x))
          graph-height (max 1 (- max-y min-y))
          available-width (max 1 (- width (* 2 padding)))
          available-height (max 1 (- height (* 2 padding)))
          scale (clamp-zoom-scale (min max-scale
                                       (/ available-width graph-width)
                                       (/ available-height graph-height)))
          center-x (/ (+ min-x max-x) 2)
          center-y (/ (+ min-y max-y) 2)]
      {:scale scale
       :x (- (/ width 2) (* center-x scale))
       :y (- (/ height 2) (* center-y scale))})
    {:scale 1.0
     :x (/ width 2)
     :y (/ height 2)}))

(defn- normalize-view-mode
  [view-mode]
  (case view-mode
    :all-pages :all-pages
    :page :page
    :tags-and-objects))

(defn- color->int
  [hex-color]
  (js/parseInt (subs hex-color 1) 16))

(defn- tag-node-color
  [dark?]
  (if dark? "#8F78B8" "#B9A5E6"))

(defn- node-color
  [kind dark?]
  (case kind
    "tag" (tag-node-color dark?)
    "property" (if dark? "#A08D85" "#817068")
    (if dark? "#858D98" "#E6E6E6")))

(defn- build-degree-map
  [links]
  (persistent!
   (reduce
    (fn [m {:keys [source target]}]
      (let [source-degree (inc (or (get m source) 0))
            target-degree (inc (or (get m target) 0))]
        (-> m
            (assoc! source source-degree)
            (assoc! target target-degree))))
    (transient {})
    links)))

(defn- keep-links-with-nodes
  [links node-id-set]
  (persistent!
   (reduce
    (fn [result {:keys [source target] :as link}]
      (if (and source
               target
               (contains? node-id-set source)
               (contains? node-id-set target))
        (conj! result link)
        result))
    (transient [])
    links)))

(defn- build-fast-degree-map
  [nodes links]
  (let [node-id-set (js/Set.)
        degree (js/Map.)]
    (doseq [{:keys [id]} nodes]
      (.add node-id-set id))
    (doseq [{:keys [source target]} links]
      (when (and source
                 target
                 (.has node-id-set source)
                 (.has node-id-set target))
        (.set degree source (inc (or (.get degree source) 0)))
        (.set degree target (inc (or (.get degree target) 0)))))
    degree))

(defn display-links
  [links layouted-nodes]
  (let [node-id-set (set (map :id layouted-nodes))
        tag-id-set (->> layouted-nodes
                        (filter #(= "tag" (:kind %)))
                        (map node-source-id)
                        set)
        display-id-by-source-and-cluster
        (reduce
         (fn [m node]
           (if-let [cluster-id (:cluster-id node)]
             (assoc m [(node-source-id node) cluster-id] (:id node))
             m))
         {}
         layouted-nodes)]
    (into
     []
     (keep
      (fn [{:keys [source target] :as link}]
        (cond
          (contains? tag-id-set target)
          (when-let [source-id (or (get display-id-by-source-and-cluster [source target])
                                   (when (contains? node-id-set source) source))]
            (assoc link :source source-id :target target))

          (contains? tag-id-set source)
          (when-let [target-id (or (get display-id-by-source-and-cluster [target source])
                                   (when (contains? node-id-set target) target))]
            (assoc link :source source :target target-id))

          (and (contains? node-id-set source)
               (contains? node-id-set target))
          link)))
     links)))

(defn- node-radius
  ([kind degree]
   (node-radius kind degree false))
  ([kind degree grid-object?]
   (let [base (case kind
                "tag" 7.4
                "object" 4.4
                "journal" 4.4
                3.8)
         radius (+ base (min (if (= kind "tag") 15.0 12.0)
                             (* (if (= kind "tag") 4.1 3.4)
                                (js/Math.sqrt (double degree)))))]
     (if grid-object?
       (-> radius
           (min 5.8)
           (max 3.2))
       radius))))

(defn- decorate-node
  [node degree dark? x y]
  (let [kind (:kind node)
        d (get degree (node-source-id node) 0)
        color (or (:color node)
                  (node-color kind dark?))]
    (assoc node
           :x x
           :y y
           :radius (node-radius kind d (:grid-object? node))
           :degree d
           :color color
           :color-int (color->int color))))

(defn- decorate-large-page-node
  [node x y d radius color-int]
  (assoc node
         :x x
         :y y
         :radius radius
         :degree d
         :color-int color-int))

(defn- simulation-node
  [node degree idx]
  (let [d (get degree (node-source-id node) 0)
        result #js {:id (:id node)
                    :idx idx
                    :kind (:kind node)
                    :degree d
                    :radius (node-radius (:kind node) d)}]
    (when (number? (:x node))
      (set! (.-x ^js result) (:x node)))
    (when (number? (:y node))
      (set! (.-y ^js result) (:y node)))
    (when (:root? node)
      (set! (.-fx ^js result) 0)
      (set! (.-fy ^js result) 0))
    result))

(defn- simulation-link
  [{:keys [source target]}]
  #js {:source source
       :target target})

(def large-graph-fast-layout-threshold 10000)

(def all-pages-fast-layout-threshold 2500)

(def large-graph-draw-edge-limit 8000)

(def large-graph-render-node-limit 12000)

(def all-pages-large-graph-draw-edge-limit 3600)

(def all-pages-large-graph-render-node-limit 2200)

(def regular-graph-draw-edge-limit 28000)

(def ^:private tag-force-node-limit 900)

(defn layout-mode
  [node-count view-mode]
  (let [view-mode (normalize-view-mode view-mode)
        threshold (if (= view-mode :all-pages)
                    all-pages-fast-layout-threshold
                    large-graph-fast-layout-threshold)]
    (if (>= node-count threshold)
      :fast
      :force)))

(defn- large-graph-threshold
  [view-mode]
  (if (= (normalize-view-mode view-mode) :all-pages)
    all-pages-fast-layout-threshold
    large-graph-fast-layout-threshold))

(defn draw-edge-limit
  [node-count link-count view-mode]
  (min link-count
       (cond
         (and (= (normalize-view-mode view-mode) :all-pages)
              (>= node-count (large-graph-threshold view-mode)))
         all-pages-large-graph-draw-edge-limit

         (>= node-count (large-graph-threshold view-mode))
         large-graph-draw-edge-limit

         :else
         regular-graph-draw-edge-limit)))

(defn render-node-limit
  [node-count view-mode]
  (min node-count
       (cond
         (and (= (normalize-view-mode view-mode) :all-pages)
              (>= node-count (large-graph-threshold view-mode)))
         all-pages-large-graph-render-node-limit

         (>= node-count (large-graph-threshold view-mode))
         large-graph-render-node-limit

         :else
         node-count)))

(defn- point-cross
  [o a b]
  (- (* (- (:x a) (:x o))
        (- (:y b) (:y o)))
     (* (- (:y a) (:y o))
        (- (:x b) (:x o)))))

(defn- hull-half
  [points]
  (reduce
   (fn [h point]
     (let [h (loop [h h]
               (if (and (>= (count h) 2)
                        (not (pos? (point-cross (nth h (- (count h) 2))
                                                (peek h)
                                                point))))
                 (recur (pop h))
                 h))]
       (conj h point)))
   []
   points))

(defn- convex-hull
  [points]
  (let [points (->> points
                    (distinct)
                    (sort-by (juxt :x :y))
                    vec)]
    (if (< (count points) 3)
      points
      (let [lower (hull-half points)
            upper (hull-half (rseq points))]
        (vec (concat (butlast lower)
                     (butlast upper)))))))

(defn- cluster-boundary-points
  [nodes center-x center-y]
  (let [points (mapcat
                (fn [{:keys [x y radius]}]
                  (let [padding (+ (or radius 0) 34)
                        diagonal (* padding 0.72)]
                    [{:x (+ x padding) :y y}
                     {:x (+ x diagonal) :y (+ y diagonal)}
                     {:x x :y (+ y padding)}
                     {:x (- x diagonal) :y (+ y diagonal)}
                     {:x (- x padding) :y y}
                     {:x (- x diagonal) :y (- y diagonal)}
                     {:x x :y (- y padding)}
                     {:x (+ x diagonal) :y (- y diagonal)}]))
                nodes)
        hull (convex-hull points)]
    (when (>= (count hull) 3)
      (->> hull
           (map (fn [{:keys [x y]}]
                  (let [dx (- x center-x)
                        dy (- y center-y)
                        distance (max 1 (js/Math.sqrt (+ (* dx dx) (* dy dy))))
                        soften 16]
                    {:x (+ x (* (/ dx distance) soften))
                     :y (+ y (* (/ dy distance) soften))})))
           vec))))

(def ^:private tag-cluster-color-palette
  ["#3B82F6" "#10B981" "#F59E0B" "#F43F5E"
   "#8B5CF6" "#06B6D4" "#84CC16" "#F97316"
   "#14B8A6" "#A855F7" "#64748B" "#EC4899"])

(def ^:private grid-group-object-limit 36)

(defn- tag-title-color-int
  [title]
  (let [title (str (or title ""))
        hash (reduce
              (fn [result idx]
                (mod (+ (* result 31)
                        (.charCodeAt title idx))
                     2147483647))
              0
              (range (count title)))]
    (color->int (nth tag-cluster-color-palette
                     (mod hash (count tag-cluster-color-palette))))))

(defn- grid-layout-enabled?
  [opts]
  (true? (:grid-layout? opts)))

(defn tag-cluster-backgrounds
  ([nodes view-mode]
   (tag-cluster-backgrounds nodes view-mode {}))
  ([nodes view-mode {:keys [grid-layout?]}]
   (if (= :tags-and-objects (normalize-view-mode view-mode))
     (->> nodes
          (filter :cluster-id)
          (group-by :cluster-id)
          (map (fn [[cluster-id nodes]]
                 (let [bounds (reduce
                               (fn [bounds {:keys [x y radius]}]
                                 (let [radius (or radius 0)]
                                   {:min-x (min (:min-x bounds) (- x radius))
                                    :min-y (min (:min-y bounds) (- y radius))
                                    :max-x (max (:max-x bounds) (+ x radius))
                                    :max-y (max (:max-y bounds) (+ y radius))}))
                               {:min-x js/Infinity
                                :min-y js/Infinity
                                :max-x js/-Infinity
                                :max-y js/-Infinity}
                               nodes)
                       tag-node (some #(when (and (= "tag" (:kind %))
                                                  (= cluster-id (:id %)))
                                         %)
                                      nodes)
                       center-x (if (and grid-layout? tag-node)
                                  (:x tag-node)
                                  (/ (+ (:min-x bounds) (:max-x bounds)) 2))
                       center-y (if (and grid-layout? tag-node)
                                  (:y tag-node)
                                  (/ (+ (:min-y bounds) (:max-y bounds)) 2))
                       radius (->> nodes
                                   (map (fn [{:keys [x y radius]}]
                                          (let [dx (- x center-x)
                                                dy (- y center-y)]
                                            (+ (js/Math.sqrt (+ (* dx dx) (* dy dy)))
                                               (or radius 0)
                                               44))))
                                   (apply max 84))]
                   {:id cluster-id
                    :x center-x
                    :y center-y
                    :radius radius
                    :points (cluster-boundary-points nodes center-x center-y)
                    :color-int (tag-title-color-int (:label tag-node cluster-id))})))
          (sort-by :id)
          vec)
     [])))

(defn- link-distance
  [view-mode value]
  (if (number? value)
    value
    (case view-mode
      :tags-and-objects 58
      :page 118
      82)))

(defn- charge-strength
  [view-mode]
  (case view-mode
    :tags-and-objects -95
    :page -180
    -140))

(defn- y-strength
  [view-mode]
  (if (= view-mode :tags-and-objects) 0.018 0.0))

(defn layout-tick-count
  [node-count view-mode]
  (let [view-mode (normalize-view-mode view-mode)]
    (cond
      (<= node-count 120)
      160

      (<= node-count 400)
      (if (= view-mode :tags-and-objects) 130 110)

      (<= node-count 900)
      (if (= view-mode :tags-and-objects) 110 90)

      (and (= view-mode :tags-and-objects)
           (< node-count large-graph-fast-layout-threshold))
      3

      :else
      (if (= view-mode :tags-and-objects) 90 70))))

(defn- phyllotaxis-layout-nodes
  [nodes degree dark?]
  (let [golden-angle (* js/Math.PI (- 3 (js/Math.sqrt 5)))
        spacing 18
        [linked unlinked] (reduce
                           (fn [[linked unlinked] node]
                             (if (pos? (get degree (:id node) 0))
                               [(conj linked node) unlinked]
                               [linked (conj unlinked node)]))
                           [[] []]
                           nodes)]
    (->> (into linked unlinked)
         (map-indexed
          (fn [idx node]
            (let [rank (inc idx)
                  angle (* idx golden-angle)
                  radius (* spacing (js/Math.sqrt rank))
                  x (* radius (js/Math.cos angle))
                  y (* radius (js/Math.sin angle))]
              (decorate-node node degree dark? x y))))
         vec)))

(defn- linked-node?
  [degree node]
  (pos? (get degree (node-source-id node) 0)))

(defn- split-linked-nodes
  [nodes degree]
  (reduce
   (fn [[linked isolated] node]
     (if (linked-node? degree node)
       [(conj linked node) isolated]
       [linked (conj isolated node)]))
   [[] []]
   nodes))

(defn- all-pages-node-priority
  [degree node]
  [(if (= "tag" (:kind node)) 0 1)
   (- (get degree (node-source-id node) 0))
   (str (or (:id node) ""))])

(defn- graph-center
  [nodes]
  (if-let [{:keys [min-x min-y max-x max-y]} (layout-bounds nodes)]
    {:x (/ (+ min-x max-x) 2)
     :y (/ (+ min-y max-y) 2)
     :radius (/ (max (- max-x min-x)
                     (- max-y min-y))
                2)}
    {:x 0
     :y 0
     :radius 0}))

(defn- place-isolated-ring-nodes
  [nodes degree dark? start-radius]
  (let [node-gap 42
        ring-gap 58
        sorted-nodes (sort-by #(str (:id %)) nodes)]
    (loop [remaining sorted-nodes
           ring 0
           result []]
      (if (empty? remaining)
        (vec result)
        (let [radius (+ start-radius (* ring ring-gap))
              capacity (max 14 (js/Math.floor (/ (* 2 js/Math.PI radius) node-gap)))
              ring-nodes (take capacity remaining)
              angle-offset (* ring 0.41)]
          (recur
           (drop capacity remaining)
           (inc ring)
           (into result
                 (map-indexed
                  (fn [idx node]
                    (let [angle (+ angle-offset
                                   (* idx (/ (* 2 js/Math.PI)
                                             (max 1 (count ring-nodes)))))
                          x (* radius (js/Math.cos angle))
                          y (* radius (js/Math.sin angle))]
                      (decorate-node node degree dark? x y)))
                  ring-nodes))))))))

(defn- all-pages-layout-nodes
  [nodes degree dark?]
  (let [[linked isolated] (split-linked-nodes nodes degree)
        golden-angle (* js/Math.PI (- 3 (js/Math.sqrt 5)))
        linked (if (>= (count nodes) all-pages-fast-layout-threshold)
                 linked
                 (sort-by #(all-pages-node-priority degree %) linked))
        linked-nodes (mapv
                      (fn [idx node]
                        (let [rank (inc idx)
                              angle (* idx golden-angle)
                              radius (* 15 (js/Math.sqrt rank))
                              x (* radius (js/Math.cos angle))
                              y (* radius (js/Math.sin angle))]
                          (decorate-node node degree dark? x y)))
                      (range)
                      linked)
        {:keys [radius]} (graph-center linked-nodes)
        isolated-start-radius (+ (max 180 radius) 96)]
    (vec (concat linked-nodes
                 (place-isolated-ring-nodes isolated degree dark? isolated-start-radius)))))

(defn- all-pages-fast-layout-nodes
  [nodes degree dark?]
  (let [node-count (count nodes)
        columns (max 1 (js/Math.ceil (js/Math.sqrt node-count)))
        spacing 24
        origin-x (/ (* (dec columns) spacing) 2)
        color-int (color->int (node-color "page" dark?))
        radius-by-degree (js/Map.)]
    (mapv
     (fn [idx node]
       (let [col (mod idx columns)
             row (js/Math.floor (/ idx columns))
             x (- (* col spacing) origin-x)
             y (* row spacing)]
         (if degree
           (let [d (or (.get ^js degree (node-source-id node)) 0)
                 cached-radius (.get radius-by-degree d)
                 radius (if (some? cached-radius)
                          cached-radius
                          (let [radius (node-radius (:kind node) d)]
                            (.set radius-by-degree d radius)
                            radius))]
             (decorate-large-page-node node x y d radius color-int))
           (decorate-large-page-node node x y 0 3.8 color-int))))
     (range)
     nodes)))

(defn- stabilize-all-pages-layout
  [nodes degree dark?]
  (let [[linked isolated] (split-linked-nodes nodes degree)]
    (if-not (seq linked)
      (all-pages-layout-nodes nodes degree dark?)
      (let [{center-x :x center-y :y radius :radius} (graph-center linked)
            linked-nodes (mapv (fn [node]
                                 (assoc node
                                        :x (- (:x node) center-x)
                                        :y (- (:y node) center-y)))
                               linked)
            isolated-start-radius (+ (max 180 radius) 96)]
        (vec (concat linked-nodes
                     (place-isolated-ring-nodes isolated degree dark? isolated-start-radius)))))))

(defn- root-node-id
  [nodes]
  (some (fn [node]
          (when (:root? node)
            (:id node)))
        nodes))

(defn- graph-depths
  [links root-id]
  (let [neighbor-map (reduce (fn [m {:keys [source target]}]
                               (-> m
                                   (update source (fnil conj #{}) target)
                                   (update target (fnil conj #{}) source)))
                             {}
                             links)]
    (loop [queue (conj cljs.core/PersistentQueue.EMPTY [root-id 0])
           depths {root-id 0}]
      (if (empty? queue)
        depths
        (let [[node-id depth] (peek queue)
              queue (pop queue)
              [queue depths]
              (reduce (fn [[queue* depths*] neighbor-id]
                        (if (contains? depths* neighbor-id)
                          [queue* depths*]
                          [(conj queue* [neighbor-id (inc depth)])
                           (assoc depths* neighbor-id (inc depth))]))
                      [queue depths]
                      (get neighbor-map node-id #{}))]
          (recur queue depths))))))

(defn- page-layout-nodes
  [nodes links degree dark?]
  (if-let [root-id (root-node-id nodes)]
    (let [depths (graph-depths links root-id)
          golden-angle (* js/Math.PI (- 3 (js/Math.sqrt 5)))
          nodes-by-depth (->> nodes
                              (remove #(= root-id (:id %)))
                              (group-by #(min 3 (get depths (:id %) 3))))]
      (vec
       (cons
        (decorate-node (some #(when (= root-id (:id %)) %) nodes) degree dark? 0 0)
        (mapcat
         (fn [depth]
           (let [ring-nodes (sort-by (juxt #(- (get degree (node-source-id %) 0))
                                           #(str (:id %)))
                                     (get nodes-by-depth depth))
                 count* (max 1 (count ring-nodes))
                 radius (+ 150 (* 128 (dec depth)) (* 10 (js/Math.sqrt count*)))]
             (map-indexed
              (fn [idx node]
                (let [angle (+ (* idx (/ (* 2 js/Math.PI) count*))
                               (* depth 0.37)
                               (* idx golden-angle 0.08))
                      x (* radius (js/Math.cos angle))
                      y (* radius (js/Math.sin angle))]
                  (decorate-node node degree dark? x y)))
              ring-nodes)))
         (sort (keys nodes-by-depth))))))
    (phyllotaxis-layout-nodes nodes degree dark?)))

(defn- tag-links-by-node-id
  [links tag-ids]
  (reduce
   (fn [m {:keys [source target]}]
     (cond
       (contains? tag-ids target)
       (update m source (fnil conj []) target)

       (contains? tag-ids source)
       (update m target (fnil conj []) source)

       :else
       m))
   {}
   links))

(defn- linked-tag-ids
  [object-links tag-ids object-id]
  (filterv tag-ids (get object-links object-id)))

(defn- group-spacing
  [_tag-count max-object-count]
  (let [object-count (min grid-group-object-limit (max 1 max-object-count))
        group-radius (+ 54 (* 10 (js/Math.sqrt object-count)) 48)
        center-distance (+ (* 2 group-radius) 28)]
    (max 210 center-distance)))

(defn- tag-grid-position
  [idx tag-count spacing]
  (let [columns (max 1 (js/Math.ceil (js/Math.sqrt tag-count)))
        rows (js/Math.ceil (/ tag-count columns))
        col (mod idx columns)
        row (js/Math.floor (/ idx columns))
        x (- (* col spacing) (/ (* (dec columns) spacing) 2))
        y (- (* row spacing) (/ (* (dec rows) spacing) 2))]
    [x y]))

(defn- clustered-tags-force-layout-nodes
  [nodes links degree dark?]
  (let [tag-ids (->> nodes
                     (filter #(= "tag" (:kind %)))
                     (map :id)
                     set)
        tags (filter #(contains? tag-ids (:id %)) nodes)
        objects (remove #(contains? tag-ids (:id %)) nodes)
        object-links (tag-links-by-node-id links tag-ids)
        tag-count (max 1 (count tags))
        cluster-radius (max 360 (* 72 (js/Math.sqrt tag-count)))
        golden-angle (* js/Math.PI (- 3 (js/Math.sqrt 5)))
        tag-position-by-id (into {}
                                 (map-indexed
                                  (fn [idx tag]
                                    (let [angle (/ (* idx 2 js/Math.PI) tag-count)
                                          x (* cluster-radius (js/Math.cos angle))
                                          y (* cluster-radius (js/Math.sin angle))]
                                      [(:id tag) [x y]])))
                                 tags)
        counters* (atom {})]
    (vec
     (concat
      (map (fn [tag]
             (let [[x y] (get tag-position-by-id (:id tag) [0 0])]
               (decorate-node (assoc tag
                                     :cluster-id (:id tag)
                                     :cluster-root? true
                                     :cluster-x x
                                     :cluster-y y)
                              degree
                              dark?
                              x
                              y)))
           tags)
      (map-indexed
       (fn [idx object]
         (let [linked-tag-id (some tag-ids (get object-links (:id object)))
               cluster-idx (get @counters* linked-tag-id 0)
               _ (when linked-tag-id
                   (swap! counters* update linked-tag-id (fnil inc 0)))
               [cx cy] (get tag-position-by-id linked-tag-id [0 0])
               angle (+ (* idx 0.11) (* cluster-idx golden-angle))
               radius (if linked-tag-id
                        (+ 58 (* 10 (js/Math.sqrt (inc cluster-idx))))
                        (+ 160 (* 20 (js/Math.sqrt (inc idx)))))
               x (+ cx (* radius (js/Math.cos angle)))
               y (+ cy (* radius (js/Math.sin angle)))]
           (decorate-node (cond-> object
                            linked-tag-id
                            (assoc :cluster-id linked-tag-id
                                   :cluster-x cx
                                   :cluster-y cy))
                          degree
                          dark?
                          x
                          y)))
       objects)))))

(defn- clustered-tags-grid-layout-nodes
  [nodes links degree dark?]
  (let [tag-ids (->> nodes
                     (filter #(= "tag" (:kind %)))
                     (map :id)
                     set)
        tags (filter #(contains? tag-ids (:id %)) nodes)
        objects (remove #(contains? tag-ids (:id %)) nodes)
        object-links (tag-links-by-node-id links tag-ids)
        tag-count (max 1 (count tags))
        object-count-by-tag (reduce
                             (fn [counts object]
                               (reduce (fn [counts tag-id]
                                         (update counts tag-id (fnil inc 0)))
                                       counts
                                       (linked-tag-ids object-links tag-ids (:id object))))
                             {}
                             objects)
        max-object-count (if (seq object-count-by-tag)
                           (apply max (vals object-count-by-tag))
                           0)
        spacing (group-spacing tag-count max-object-count)
        golden-angle (* js/Math.PI (- 3 (js/Math.sqrt 5)))
        tag-position-by-id (into {}
                                 (map-indexed
                                  (fn [idx tag]
                                    [(:id tag) (tag-grid-position idx tag-count spacing)]))
                                 tags)
        counters* (atom {})]
    (vec
     (concat
      (map (fn [tag]
             (let [[x y] (get tag-position-by-id (:id tag) [0 0])]
               (decorate-node (assoc tag
                                     :cluster-id (:id tag)
                                     :cluster-root? true
                                     :cluster-x x
                                     :cluster-y y)
                              degree
                              dark?
                              x
                              y)))
           tags)
      (mapcat
       (fn [idx object]
         (let [object-tag-ids (linked-tag-ids object-links tag-ids (:id object))
               group-ids (if (seq object-tag-ids) object-tag-ids [nil])]
           (map
            (fn [linked-tag-id]
              (let [cluster-idx (get @counters* linked-tag-id 0)
                    _ (when linked-tag-id
                        (swap! counters* update linked-tag-id (fnil inc 0)))
                    [cx cy] (get tag-position-by-id linked-tag-id [0 0])
                    angle (+ (* idx 0.11) (* cluster-idx golden-angle))
                    radius (if linked-tag-id
                             (+ 48 (* 10 (js/Math.sqrt (inc cluster-idx))))
                             (+ 160 (* 20 (js/Math.sqrt (inc idx)))))
                    x (+ cx (* radius (js/Math.cos angle)))
                    y (+ cy (* radius (js/Math.sin angle)))]
                (decorate-node (cond-> object
                                 linked-tag-id
                                 (assoc :id (visual-node-id linked-tag-id (:id object))
                                        :source-id (:id object)
                                        :grid-object? true
                                        :cluster-id linked-tag-id
                                        :cluster-x cx
                                        :cluster-y cy))
                               degree
                               dark?
                               x
                               y)))
            group-ids)))
       (range)
       objects)))))

(defn- clustered-tags-layout-nodes
  [nodes links degree dark? opts]
  (if (grid-layout-enabled? opts)
    (clustered-tags-grid-layout-nodes nodes links degree dark?)
    (clustered-tags-force-layout-nodes nodes links degree dark?)))

(defn- bounded-tag-force-nodes
  [nodes]
  (if (<= (count nodes) tag-force-node-limit)
    nodes
    (let [tags (filter #(= "tag" (:kind %)) nodes)
          object-limit (max 0 (- tag-force-node-limit (count tags)))]
      (vec (concat tags
                   (take object-limit (remove #(= "tag" (:kind %)) nodes)))))))

(defn- links-between-node-ids
  [links node-ids]
  (keep (fn [{:keys [source target] :as link}]
          (when (and (contains? node-ids source)
                     (contains? node-ids target))
            link))
        links))

(defn- merge-bounded-tag-force-layout
  [nodes force-layouted-nodes]
  (let [node-by-id (into {} (map (juxt :id identity) nodes))
        force-by-id (into {} (map (juxt :id identity) force-layouted-nodes))
        cluster-delta-by-id (reduce
                             (fn [m {:keys [id x y kind]}]
                               (if (and (= "tag" kind)
                                        (contains? node-by-id id))
                                 (let [original (get node-by-id id)]
                                   (assoc m id {:dx (- x (:x original))
                                                :dy (- y (:y original))
                                                :x x
                                                :y y}))
                                 m))
                             {}
                             force-layouted-nodes)]
    (mapv
     (fn [{:keys [id cluster-id] :as node}]
       (let [node (or (get force-by-id id) node)]
         (if-let [{:keys [dx dy x y]} (get cluster-delta-by-id cluster-id)]
           (cond-> (assoc node
                          :cluster-x x
                          :cluster-y y)
             (not (contains? force-by-id id))
             (assoc :x (+ (:x node) dx)
                    :y (+ (:y node) dy)))
           node)))
     nodes)))

(defn- fast-layout-nodes
  [nodes links view-mode degree dark? opts]
  (cond
    (= view-mode :page)
    (page-layout-nodes nodes links degree dark?)

    (and (= view-mode :tags-and-objects)
         (some #(= "tag" (:kind %)) nodes))
    (clustered-tags-layout-nodes nodes links degree dark? opts)

    (= view-mode :all-pages)
    (all-pages-layout-nodes nodes degree dark?)

    :else
    (phyllotaxis-layout-nodes nodes degree dark?)))

(defn- force-seed-nodes
  [nodes links view-mode degree dark? opts]
  (cond
    (= view-mode :page)
    (page-layout-nodes nodes links degree dark?)

    (and (or (= view-mode :tags-and-objects)
             (= view-mode :all-pages))
         (> (count nodes) 900)
         (= :force (layout-mode (count nodes) view-mode)))
    (fast-layout-nodes nodes links view-mode degree dark? opts)

    :else
    nodes))

(defn layout-nodes
  ([nodes links view-mode dark?]
   (layout-nodes nodes links view-mode dark? {}))
  ([nodes links view-mode dark? opts]
   (let [view-mode (normalize-view-mode view-mode)
         mode (layout-mode (count nodes) view-mode)
         fast-all-pages? (and (= :fast mode)
                              (= view-mode :all-pages))]
     (if fast-all-pages?
       (all-pages-fast-layout-nodes nodes (build-fast-degree-map nodes links) dark?)
       (let [node-id-set (set (map :id nodes))
             filtered-links (keep-links-with-nodes links node-id-set)
             degree (build-degree-map filtered-links)
             grid-layout? (grid-layout-enabled? opts)]
         (cond
           (= :fast mode)
           (fast-layout-nodes nodes filtered-links view-mode degree dark? opts)

           :else
           (let [tags-mode? (and (= view-mode :tags-and-objects)
                                 (some #(= "tag" (:kind %)) nodes))
                 nodes (if tags-mode?
                         (clustered-tags-layout-nodes nodes filtered-links degree dark? opts)
                         (force-seed-nodes nodes filtered-links view-mode degree dark? opts))]
             (if (and tags-mode? grid-layout?)
               nodes
               (let [bounded-tag-force? (and tags-mode?
                                             (> (count nodes) tag-force-node-limit))
                     force-nodes (if bounded-tag-force?
                                   (bounded-tag-force-nodes nodes)
                                   nodes)
                     force-node-ids (when bounded-tag-force?
                                      (set (map :id force-nodes)))
                     force-links (if bounded-tag-force?
                                   (links-between-node-ids filtered-links force-node-ids)
                                   filtered-links)
                     simulation-nodes (->> force-nodes
                                           (map-indexed #(simulation-node %2 degree %1))
                                           (into-array))
                     simulation-links (->> force-links
                                           (map simulation-link)
                                           (into-array))
                     link-force (-> (d3-force/forceLink simulation-links)
                                    (.id (fn [^js node] (.-id node)))
                                    (.distance (link-distance view-mode (:link-distance opts)))
                                    (.strength 0.82))
                     collide-force (-> (d3-force/forceCollide)
                                       (.radius (fn [^js node]
                                                  (+ 10 (.-radius node))))
                                       (.strength 0.86)
                                       (.iterations 2))
                     y-force (d3-force/forceY 0)
                     _ (.strength y-force (y-strength view-mode))
                     simulation (cond-> (-> (d3-force/forceSimulation simulation-nodes)
                                            (.force "link" link-force)
                                            (.force "charge" (-> (d3-force/forceManyBody)
                                                                 (.strength (charge-strength view-mode))
                                                                 (.distanceMax 420)))
                                            (.force "collision" collide-force)
                                            (.force "y" y-force))
                                  (or (not= view-mode :tags-and-objects)
                                      (not grid-layout?))
                                  (.force "center" (d3-force/forceCenter 0 0)))
                     _ (when (= view-mode :tags-and-objects)
                         (.force simulation
                                 "cluster-x"
                                 (-> (d3-force/forceX
                                      (fn [^js node]
                                        (or (:cluster-x (nth force-nodes (.-idx node))) 0)))
                                     (.strength 0.16)))
                         (.force simulation
                                 "cluster-y"
                                 (-> (d3-force/forceY
                                      (fn [^js node]
                                        (or (:cluster-y (nth force-nodes (.-idx node))) 0)))
                                     (.strength 0.16))))
                     _ (.stop simulation)
                     ticks (layout-tick-count (count nodes) view-mode)]
                 (dotimes [_ ticks]
                   (.tick simulation))
                 (let [layouted-nodes (->> simulation-nodes
                                           (map (fn [^js sim-node]
                                                  (let [node (nth force-nodes (.-idx sim-node))]
                                                    (decorate-node node degree dark? (.-x sim-node) (.-y sim-node)))))
                                           vec)
                       layouted-nodes (if bounded-tag-force?
                                        (merge-bounded-tag-force-layout nodes layouted-nodes)
                                        layouted-nodes)]
                   (if (= view-mode :all-pages)
                     (stabilize-all-pages-layout layouted-nodes degree dark?)
                     layouted-nodes)))))))))))
