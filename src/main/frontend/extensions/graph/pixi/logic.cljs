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
  [links _highlight-state]
  links)

(defn node-emphasis
  [{:keys [selected-ids connected-ids select-mode?]} node-id]
  (cond
    (contains? selected-ids node-id) :selected
    (contains? connected-ids node-id) :connected
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

(defn- keep-links-with-nodes
  [links node-id-set]
  (keep (fn [{:keys [source target] :as link}]
          (when (and source
                     target
                     (contains? node-id-set source)
                     (contains? node-id-set target))
            link))
        links))

(defn- node-radius
  [kind degree]
  (let [base (case kind
               "tag" 5.6
               "object" 4.4
               "journal" 4.4
               3.8)]
    (+ base (min 12.0 (* 3.4 (js/Math.sqrt (double degree)))))))

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
  (let [d (get degree (:id node) 0)
        result #js {:id (:id node)
                    :idx idx
                    :kind (:kind node)
                    :degree d
                    :radius (node-radius (:kind node) d)}]
    (when (number? (:x node))
      (set! (.-x ^js result) (:x node)))
    (when (number? (:y node))
      (set! (.-y ^js result) (:y node)))
    result))

(defn- simulation-link
  [{:keys [source target]}]
  #js {:source source
       :target target})

(def large-graph-fast-layout-threshold 10000)

(def all-pages-fast-layout-threshold 2500)

(def large-graph-draw-edge-limit 8000)

(def large-graph-render-node-limit 12000)

(def regular-graph-draw-edge-limit 28000)

(defn layout-mode
  [node-count view-mode]
  (let [view-mode (normalize-view-mode view-mode)
        threshold (if (= view-mode :all-pages)
                    all-pages-fast-layout-threshold
                    large-graph-fast-layout-threshold)]
    (if (>= node-count threshold)
      :fast
      :force)))

(defn draw-edge-limit
  [node-count link-count _view-mode]
  (min link-count
       (if (>= node-count large-graph-fast-layout-threshold)
         large-graph-draw-edge-limit
         regular-graph-draw-edge-limit)))

(defn render-node-limit
  [node-count _view-mode]
  (min node-count
       (if (>= node-count large-graph-fast-layout-threshold)
         large-graph-render-node-limit
         node-count)))

(defn- link-distance
  [view-mode value]
  (if (number? value)
    value
    (if (= view-mode :tags-and-objects) 58 72)))

(defn- charge-strength
  [view-mode]
  (if (= view-mode :tags-and-objects) -95 -125))

(defn- y-strength
  [view-mode]
  (if (= view-mode :tags-and-objects) 0.018 0.025))

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

(defn- links-by-object-id
  [links]
  (reduce
   (fn [m {:keys [source target]}]
     (update m source (fnil conj []) target))
   {}
   links))

(defn- clustered-tags-layout-nodes
  [nodes links degree dark?]
  (let [tag-ids (->> nodes
                     (filter #(= "tag" (:kind %)))
                     (map :id)
                     set)
        tags (filter #(contains? tag-ids (:id %)) nodes)
        objects (remove #(contains? tag-ids (:id %)) nodes)
        object-links (links-by-object-id links)
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
               (decorate-node tag degree dark? x y)))
           tags)
      (map-indexed
       (fn [idx object]
         (let [linked-tag-id (some tag-ids (get object-links (:id object)))
               linked-tag-id (or linked-tag-id (first tag-ids))
               cluster-idx (get @counters* linked-tag-id 0)
               _ (swap! counters* update linked-tag-id (fnil inc 0))
               [cx cy] (get tag-position-by-id linked-tag-id [0 0])
               angle (+ (* idx 0.11) (* cluster-idx golden-angle))
               radius (+ 58 (* 10 (js/Math.sqrt (inc cluster-idx))))
               x (+ cx (* radius (js/Math.cos angle)))
               y (+ cy (* radius (js/Math.sin angle)))]
           (decorate-node object degree dark? x y)))
       objects)))))

(defn- fast-layout-nodes
  [nodes links view-mode degree dark?]
  (if (and (= view-mode :tags-and-objects)
           (some #(= "tag" (:kind %)) nodes))
    (clustered-tags-layout-nodes nodes links degree dark?)
    (phyllotaxis-layout-nodes nodes degree dark?)))

(defn- force-seed-nodes
  [nodes links view-mode degree dark?]
  (if (and (or (= view-mode :tags-and-objects)
               (= view-mode :all-pages))
           (> (count nodes) 900)
           (= :force (layout-mode (count nodes) view-mode)))
    (fast-layout-nodes nodes links view-mode degree dark?)
    nodes))

(defn layout-nodes
  ([nodes links view-mode dark?]
   (layout-nodes nodes links view-mode dark? {}))
  ([nodes links view-mode dark? opts]
  (let [view-mode (normalize-view-mode view-mode)
        node-id-set (set (map :id nodes))
        links (keep-links-with-nodes links node-id-set)
        degree (build-degree-map links)]
    (if (= :fast (layout-mode (count nodes) view-mode))
      (fast-layout-nodes nodes links view-mode degree dark?)
      (let [nodes (force-seed-nodes nodes links view-mode degree dark?)
            simulation-nodes (->> nodes
                                  (map-indexed #(simulation-node %2 degree %1))
                                  (into-array))
            simulation-links (->> links
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
            simulation (-> (d3-force/forceSimulation simulation-nodes)
                           (.force "link" link-force)
                           (.force "charge" (-> (d3-force/forceManyBody)
                                                 (.strength (charge-strength view-mode))
                                                 (.distanceMax 420)))
                           (.force "center" (d3-force/forceCenter 0 0))
                           (.force "collision" collide-force)
                           (.force "y" y-force)
                           (.stop))
            ticks (layout-tick-count (count nodes) view-mode)]
        (dotimes [_ ticks]
          (.tick simulation))
        (->> simulation-nodes
             (map (fn [^js sim-node]
                    (let [node (nth nodes (.-idx sim-node))]
                      (decorate-node node degree dark? (.-x sim-node) (.-y sim-node)))))
             vec))))))
