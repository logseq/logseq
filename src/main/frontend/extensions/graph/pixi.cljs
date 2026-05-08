(ns frontend.extensions.graph.pixi
  (:require ["pixi.js" :as PIXI]
            [frontend.extensions.graph.pixi.logic :as logic]))

(defonce *graph-instance (atom nil))
(defonce *simulation-paused? (atom false))
(defonce ^:private *render-token (atom 0))

(defn stop-simulation!
  []
  (reset! *simulation-paused? true))

(defn resume-simulation!
  []
  (reset! *simulation-paused? false))

(defn destroy-instance!
  []
  (when-let [{:keys [cleanup app]} @*graph-instance]
    (when (fn? cleanup)
      (cleanup))
    (when-let [^js app app]
      (try
        (.destroy app)
        (catch :default _e
          nil))))
  (reset! *graph-instance nil)
  (reset! *simulation-paused? false))

(defn- normalize-view-mode
  [view-mode]
  (if (= view-mode :all-pages)
    :all-pages
    :tags-and-objects))

(defn- color->int
  [hex-color]
  (js/parseInt (subs hex-color 1) 16))

(defn- edge-color
  [dark?]
  (if dark? "#334155" "#CBD5E1"))

(defn- label-color
  [dark?]
  (if dark? "#E2E8F0" "#0F172A"))

(defn- layout-nodes
  [nodes links view-mode dark?]
  (logic/layout-nodes nodes links view-mode dark?))

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
             best-dist (or (:dist best) js/Number.POSITIVE_INFINITY)]
         (if (and (<= dist threshold)
                  (< dist best-dist))
           {:node node :dist dist}
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

(defn- create-label-manager!
  [^js overlay-container dark? candidate-node-ids get-node-by-id]
  (let [^js label-layer (new (.-Container PIXI))
        style (new (.-TextStyle PIXI)
                   #js {:fontFamily "Avenir Next, Inter, system-ui, sans-serif"
                        :fontSize 11
                        :fill (label-color dark?)
                        :alpha 0.98})
        bg-color (color->int (if dark? "#0B1220" "#F8FAFC"))
        border-color (color->int (if dark? "#334155" "#CBD5E1"))
        entry-by-id* (atom {})
        visible-ids* (atom #{})]
    (set! (.-alpha label-layer) 0)
    (set! (.-visible label-layer) false)
    (.addChild overlay-container label-layer)
    {:container label-layer
     :update! (fn [^js world width height hovered-node-id {:keys [node-visible? hovered-only?]
                                                           :or {hovered-only? false}}]
                (let [node-visible? (or node-visible? (constantly true))
                      scale (.. world -scale -x)
                      viewport (world-viewport-rect world width height)
                      transform {:scale scale
                                 :x (.-x world)
                                 :y (.-y world)}
                      base-candidates (->> candidate-node-ids
                                           (keep get-node-by-id)
                                           (filter node-visible?))
                      hovered-node (when hovered-node-id
                                     (get-node-by-id hovered-node-id))
                      hovered-node (when (and hovered-node
                                              (node-visible? hovered-node))
                                     hovered-node)
                      candidates (if (and hovered-node
                                          (not (some #(= (:id hovered-node) (:id %))
                                                     base-candidates)))
                                   (conj (vec base-candidates) hovered-node)
                                   base-candidates)
                      candidate-id-set (set (map :id candidates))
                      selected-base-ids (logic/select-label-node-ids
                                         candidates
                                         {:viewport viewport
                                          :transform transform
                                          :screen-cell-width 140
                                          :screen-cell-height 26
                                          :max-labels (if (> scale 2.1) 240 170)})
                      selected-ids (cond
                                     (and hovered-only?
                                          hovered-node-id
                                          (contains? candidate-id-set hovered-node-id))
                                     [hovered-node-id]

                                     (and hovered-node-id
                                          (contains? candidate-id-set hovered-node-id))
                                     (cons hovered-node-id
                                           (remove #(= hovered-node-id %) selected-base-ids))
                                     :else
                                     selected-base-ids)
                      selected-id-set (set selected-ids)]
                  (doseq [id selected-ids]
                    (when-let [{:keys [x y label radius]} (get-node-by-id id)]
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
                            display-text (logic/label-display-text label hovered?)
                            {sx :x sy :y scale :scale} (screen-point world x y)]
                        (when (or (not= display-text (.-text text-node))
                                  (not= hovered? (:hovered? entry)))
                          (set! (.-text text-node) display-text)
                          (.clear bg-node)
                          (.roundRect bg-node
                                      -3
                                      -2
                                      (+ (.-width text-node) 8)
                                      (+ (.-height text-node) 4)
                                      4)
                          (.fill bg-node #js {:color bg-color
                                              :alpha (if hovered? 0.94 0.82)})
                          (.setStrokeStyle bg-node
                                           #js {:width 1
                                                :color border-color
                                                :alpha (if hovered? 0.75 0.42)})
                          (.stroke bg-node)
                          (swap! entry-by-id* assoc id (assoc entry :hovered? hovered?)))
                        (let [offset (+ 6 (min 16 (* radius scale 0.42)))
                              title-scale (if hovered? 1.22 1.0)]
                          (set! (.-x text-node) 1)
                          (set! (.-y text-node) 0)
                          (set! (.. container-node -scale -x) title-scale)
                          (set! (.. container-node -scale -y) title-scale)
                          (set! (.-x container-node) (+ sx offset))
                          (set! (.-y container-node) (- sy (if hovered? 18 10)))
                          (when hovered?
                            (.setChildIndex label-layer
                                            container-node
                                            (dec (.-length (.-children label-layer))))
                            (set! (.-alpha container-node) 1))
                          (set! (.-visible container-node) true)))))
                  (doseq [id @visible-ids*]
                    (when-not (contains? selected-id-set id)
                      (when-let [entry (get @entry-by-id* id)]
                        (set! (.-visible (:container entry)) false))))
                  (reset! visible-ids* selected-id-set)))
     :destroy! (fn []
                 (doseq [[_ {:keys [^js container]}] @entry-by-id*]
                   (.destroy container))
                 (reset! entry-by-id* {})
                 (reset! visible-ids* #{}))}))

(defn- draw-edges!
  [^js graphics layout-by-id links dark? view-mode]
  (let [max-edges (logic/draw-edge-limit (count layout-by-id)
                                          (count links)
                                          view-mode)
        links* (if (> (count links) max-edges)
                 (take max-edges links)
                 links)
        stroke-color (color->int (edge-color dark?))]
    (.clear graphics)
    (.setStrokeStyle graphics
                     #js {:width 1
                          :color stroke-color
                          :alpha 0.38})
    (doseq [{:keys [source target]} links*]
      (when-let [from-node (get layout-by-id source)]
        (when-let [to-node (get layout-by-id target)]
          (.moveTo graphics (:x from-node) (:y from-node))
          (.lineTo graphics (:x to-node) (:y to-node)))))
    (.stroke graphics)
    (count links*)))

(defn- render-edges!
  [^js container layout-by-id links dark? view-mode]
  (let [^js graphics (new (.-Graphics PIXI))
        drawn-links (draw-edges! graphics layout-by-id links dark? view-mode)]
    (.addChild container graphics)
    {:graphics graphics
     :drawn-links drawn-links}))

(defn- configure-node-sprite!
  [^js sprite node]
  (let [scale (/ (* 2 (:radius node)) 96)]
    (set! (.. sprite -anchor -x) 0.5)
    (set! (.. sprite -anchor -y) 0.5)
    (set! (.-x sprite) (:x node))
    (set! (.-y sprite) (:y node))
    (set! (.-tint sprite) (:color-int node))
    (set! (.. sprite -scale -x) scale)
    (set! (.. sprite -scale -y) scale)
    (set! (.-visible sprite) true)))

(defn- remove-sprite-from-parent!
  [^js sprite]
  (when-let [^js parent (.-parent sprite)]
    (.removeChild parent sprite)))

(defn- render-nodes!
  [^js tag-container ^js detail-container layouted-nodes* view-mode]
  (let [^js container (new (.-Container PIXI))
        texture (create-circle-texture)
        node-count (count @layouted-nodes*)
        max-nodes (logic/render-node-limit node-count view-mode)
        virtual? (< max-nodes node-count)]
    (.addChild detail-container container)
    (if-not virtual?
      (let [sprites (reduce
                     (fn [acc node]
                       (let [^js sprite (new (.-Sprite PIXI) texture)
                             ^js sprite-container (if (= "tag" (:kind node))
                                                    tag-container
                                                    container)]
                         (configure-node-sprite! sprite node)
                         (.addChild sprite-container sprite)
                         (assoc acc (:id node) sprite)))
                     {}
                     @layouted-nodes*)]
        {:container container
         :texture texture
         :sprites sprites
         :drawn-node-count (count sprites)
         :sync! (fn [_world _width _height _hovered-node-id] nil)})
      (let [sprites* (atom {})
            pool* (atom [])
            drawn-node-count* (atom 0)
            acquire-sprite! (fn []
                              (if-let [^js sprite (peek @pool*)]
                                (do
                                  (swap! pool* pop)
                                  sprite)
                                (new (.-Sprite PIXI) texture)))
            release-sprite! (fn [id]
                              (when-let [^js sprite (get @sprites* id)]
                                (remove-sprite-from-parent! sprite)
                                (set! (.-visible sprite) false)
                                (swap! sprites* dissoc id)
                                (swap! pool* conj sprite)))
            mount-sprite! (fn [node]
                            (let [id (:id node)
                                  ^js sprite (or (get @sprites* id)
                                                 (let [sprite (acquire-sprite!)]
                                                   (swap! sprites* assoc id sprite)
                                                   sprite))
                                  ^js sprite-container (if (= "tag" (:kind node))
                                                         tag-container
                                                         container)]
                              (configure-node-sprite! sprite node)
                              (when-not (identical? (.-parent sprite) sprite-container)
                                (remove-sprite-from-parent! sprite)
                                (.addChild sprite-container sprite))))]
        {:container container
         :texture texture
         :sprites* sprites*
         :drawn-node-count drawn-node-count*
         :sync! (fn [^js world width height hovered-node-id]
                  (let [scale (.. world -scale -x)
                        viewport (expand-viewport
                                  (world-viewport-rect world width height)
                                  (/ 220 (max scale 0.5)))
                        visible-nodes (->> @layouted-nodes*
                                           (filter #(node-in-viewport? viewport %))
                                           (take max-nodes)
                                           vec)
                        visible-nodes (if hovered-node-id
                                        (if-let [hovered-node (some (fn [node]
                                                                      (when (= hovered-node-id (:id node))
                                                                        node))
                                                                    @layouted-nodes*)]
                                          (vec (cons hovered-node
                                                     (remove #(= hovered-node-id (:id %)) visible-nodes)))
                                          visible-nodes)
                                        visible-nodes)
                        selected-id-set (set (map :id visible-nodes))]
                    (doseq [node visible-nodes]
                      (mount-sprite! node))
                    (doseq [id (keys @sprites*)]
                      (when-not (contains? selected-id-set id)
                        (release-sprite! id)))
                    (reset! drawn-node-count* (count selected-id-set))))}))))

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
  (if-let [sprites* (:sprites* node-render-info)]
    (get @sprites* node-id)
    (get (:sprites node-render-info) node-id)))

(defn- draw-drag-neighbor-edges!
  [^js graphics layout-by-id neighbor-ids x y dark?]
  (.clear graphics)
  (when (seq neighbor-ids)
    (.setStrokeStyle graphics
                     #js {:width 1.4
                          :color (color->int (edge-color dark?))
                          :alpha 0.62})
    (doseq [neighbor-id (take 260 neighbor-ids)]
      (when-let [neighbor (get layout-by-id neighbor-id)]
        (.moveTo graphics x y)
        (.lineTo graphics (:x neighbor) (:y neighbor))))
    (.stroke graphics)))

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

(defn- setup-pan-and-zoom!
  [^js canvas ^js world {:keys [get-node-index
                                on-node-activate
                                on-scale-change
                                on-transform
                                on-hover-node-change
                                on-node-drag
                                on-node-drag-end]}]
  (let [dragging-world? (atom false)
        drag-node* (atom nil)
        moved? (atom false)
        drag-start (atom [0 0 0 0])
        hover-node-id* (atom nil)]
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
            (on-pointer-down [^js e]
              (let [[sx sy] (canvas-point e)
                    [world-x world-y] (screen->world sx sy)
                    scale (.. world -scale -x)
                    hit (hit-test-node (get-node-index) world-x world-y scale)]
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
                    (reset! drag-start [sx sy (.-x world) (.-y world)])))))
            (on-pointer-move [^js e]
              (cond
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
                  (set-hover-node! (some-> hit :node :id)))))
            (on-pointer-up [^js e]
              (cond
                @drag-node*
                (let [{:keys [node current-x current-y]} @drag-node*]
                  (reset! drag-node* nil)
                  (if @moved?
                    (when (fn? on-node-drag-end)
                      (on-node-drag-end node current-x current-y))
                    (when (fn? on-node-activate)
                      (on-node-activate node e))))

                @dragging-world?
                (do
                  (reset! dragging-world? false)
                  (when-not @moved?
                    (let [[sx sy] (canvas-point e)
                          [world-x world-y] (screen->world sx sy)
                          scale (.. world -scale -x)
                          hit (hit-test-node (get-node-index) world-x world-y scale)]
                      (when-let [node (:node hit)]
                        (when (fn? on-node-activate)
                          (on-node-activate node e))))))))
            (on-wheel [^js e]
              (.preventDefault e)
              (let [[sx sy] (canvas-point e)
                    [before-x before-y] (screen->world sx sy)
                    current-scale (.. world -scale -x)
                    factor (if (pos? (.-deltaY e)) 0.9 1.1)
                    next-scale (-> (* current-scale factor)
                                   (max 0.3)
                                   (min 3.6))]
                (set! (.. world -scale -x) next-scale)
                (set! (.. world -scale -y) next-scale)
                (set! (.-x world) (- sx (* before-x next-scale)))
                (set! (.-y world) (- sy (* before-y next-scale)))
                (when (fn? on-scale-change)
                  (on-scale-change next-scale))
                (when (fn? on-transform)
                  (on-transform))))
            (on-pointer-leave [^js e]
              (on-pointer-up e)
              (set-hover-node! nil))]
      (.addEventListener canvas "pointerdown" on-pointer-down)
      (.addEventListener canvas "pointermove" on-pointer-move)
      (.addEventListener canvas "pointerup" on-pointer-up)
      (.addEventListener canvas "pointerleave" on-pointer-leave)
      (.addEventListener canvas "wheel" on-wheel #js {:passive false})
      (fn []
        (.removeEventListener canvas "pointerdown" on-pointer-down)
        (.removeEventListener canvas "pointermove" on-pointer-move)
        (.removeEventListener canvas "pointerup" on-pointer-up)
        (.removeEventListener canvas "pointerleave" on-pointer-leave)
        (.removeEventListener canvas "wheel" on-wheel)))))

(defn- setup-scene!
  [^js app ^js container {:keys [nodes links dark? on-node-activate on-rendered view-mode]} render-start]
  (set! (.-innerHTML container) "")
  (let [^js canvas (or (.-canvas app) (.-view app))
        ^js stage (.-stage app)
        ^js world (new (.-Container PIXI))
        ^js detail-layer (new (.-Container PIXI))
        ^js tag-layer (new (.-Container PIXI))
        ^js label-layer-wrapper (new (.-Container PIXI))
        ^js drag-edge-layer (new (.-Graphics PIXI))
        _ (.appendChild container canvas)
        _ (.addChild stage world)
        _ (.addChild world detail-layer)
        _ (.addChild world tag-layer)
        _ (.addChild stage label-layer-wrapper)
        width (.-clientWidth container)
        height (.-clientHeight container)
        size* (atom {:width width :height height})
        normalized-view-mode (normalize-view-mode view-mode)
        layouted-nodes* (atom (layout-nodes nodes links view-mode dark?))
        node-index-by-id (into {} (map-indexed (fn [idx node] [(:id node) idx]) @layouted-nodes*))
        layout-by-id* (atom (into {} (map (fn [node] [(:id node) node]) @layouted-nodes*)))
        preview-layout-by-id* (atom nil)
        _ (set! (.-x world) (/ width 2))
        _ (set! (.-y world) (/ height 2))
        _ (set! (.. world -scale -x) 1)
        _ (set! (.. world -scale -y) 1)
        edge-render-info (render-edges! detail-layer @layout-by-id* links dark? normalized-view-mode)
        _ (.addChild detail-layer drag-edge-layer)
        node-render-info (render-nodes! tag-layer detail-layer layouted-nodes* normalized-view-mode)
        _ ((:sync! node-render-info) world width height nil)
        all-node-index* (atom (index-layouted-nodes @layouted-nodes*))
        tag-node-index* (atom (index-layouted-nodes (filter #(= "tag" (:kind %)) @layouted-nodes*)))
        neighbor-map (build-neighbor-map links)
        large-graph? (>= (count @layouted-nodes*) logic/large-graph-fast-layout-threshold)
        label-candidate-ids (vec (map :id (build-label-candidates
                                           @layouted-nodes*
                                           normalized-view-mode
                                           large-graph?)))
        label-manager (create-label-manager! label-layer-wrapper
                                             dark?
                                             label-candidate-ids
                                             (fn [id]
                                               (get (logic/current-layout-by-id
                                                     @layout-by-id*
                                                     @preview-layout-by-id*)
                                                    id)))
        hovered-node-id* (atom nil)
        drag-session* (atom nil)
        detail-target-alpha (atom 1.0)
        label-target-alpha (atom 0.0)
        visibility-state* (atom {:detail-expanded? true
                                 :label-visible? false})
        transform-dirty? (atom true)
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
        ensure-drag-session! (fn [root-node]
                               (let [root-id (:id root-node)]
                                 (if (and @drag-session*
                                          (= root-id (:root-id @drag-session*)))
                                   @drag-session*
                                   (let [weights (logic/connected-drag-weights
                                                  neighbor-map
                                                  root-id
                                                  {:max-depth 6
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
                                 root-id (:id node)
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
                               (draw-edges! (:graphics edge-render-info)
                                            preview-layout-by-id
                                            links
                                            dark?
                                            normalized-view-mode)
                               (draw-drag-neighbor-edges! drag-edge-layer
                                                          preview-layout-by-id
                                                          (get neighbor-map root-id)
                                                          next-x
                                                          next-y
                                                          dark?))
                             (mark-transform!)))
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
                              (draw-edges! (:graphics edge-render-info)
                                           @layout-by-id*
                                           links
                                           dark?
                                           normalized-view-mode)
                              (reset! preview-layout-by-id* nil)
                              (.clear drag-edge-layer)
                              (reset! drag-session* nil)
                              (reset! all-node-index* (index-layouted-nodes @layouted-nodes*))
                              (reset! tag-node-index* (index-layouted-nodes
                                                       (filter #(= "tag" (:kind %))
                                                               @layouted-nodes*)))
                              (mark-transform!)))
        ticker-step (fn [layer target-alpha]
                      (let [alpha (.-alpha layer)
                            target (if (number? target-alpha) target-alpha @target-alpha)
                            next (+ alpha (* (- target alpha) 0.2))]
                        (set! (.-alpha layer) next)
                        (set! (.-visible layer) (> next 0.01))))
        animate-layer (fn []
                        (ticker-step detail-layer detail-target-alpha)
                        (let [dirty? @transform-dirty?]
                          (when dirty?
                            (let [{:keys [width height]} @size*]
                              ((:sync! node-render-info) world width height @hovered-node-id*)))
                          (when-let [label-layer (:container label-manager)]
                            (let [{:keys [target-alpha update? hovered-only?]}
                                  (logic/label-render-state
                                   @hovered-node-id*
                                   @visibility-state*
                                   (.-alpha label-layer))]
                              (ticker-step label-layer target-alpha)
                              (when (and dirty? update?)
                                (let [{:keys [width height]} @size*]
                                  ((:update! label-manager)
                                   world
                                   width
                                   height
                                   @hovered-node-id*
                                   {:node-visible? (if (:detail-expanded? @visibility-state*)
                                                     (constantly true)
                                                     #(= "tag" (:kind %)))
                                    :hovered-only? hovered-only?})))))
                          (when dirty?
                            (reset! transform-dirty? false))))
        update-detail-visibility! (fn [scale]
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
                         (if (:detail-expanded? @visibility-state*)
                           @all-node-index*
                           @tag-node-index*))
        event-cleanup (setup-pan-and-zoom!
                       canvas
                       world
                       {:get-node-index get-node-index
                        :on-node-activate on-node-activate
                        :on-scale-change update-detail-visibility!
                        :on-transform mark-transform!
                        :on-hover-node-change (fn [node-id]
                                                (reset! hovered-node-id* node-id)
                                                (mark-transform!))
                        :on-node-drag apply-node-drag!
                        :on-node-drag-end commit-node-drag!})
        resize-observer (when (exists? js/ResizeObserver)
                          (let [observer (js/ResizeObserver. resize-to-container!)]
                            (.observe observer container)
                            observer))
        render-elapsed (- (.now js/performance) render-start)]
    (.add (.-ticker app) animate-layer)
    (mark-transform!)
    (update-detail-visibility! 1)
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
     :cleanup (fn []
                (event-cleanup)
                (when-let [^js observer resize-observer]
                  (.disconnect observer))
                (.remove (.-ticker app) animate-layer)
                ((:destroy! label-manager))
                (when-let [^js texture (:texture node-render-info)]
                  (.destroy texture true)))
     :canvas canvas}))

(defn render-container!
  [^js container {:keys [nodes links dark? on-node-activate on-rendered view-mode]}]
  (when container
    (let [token (swap! *render-token inc)
          render-start (.now js/performance)
          app (new (.-Application PIXI))]
      (destroy-instance!)
      (-> (.init app #js {:backgroundAlpha 0
                          :antialias false
                          :autoDensity true
                          :resolution (min 2 (or (.-devicePixelRatio js/window) 1))
                          :resizeTo container
                          :powerPreference "high-performance"})
          (.then
           (fn []
             (if (= token @*render-token)
               (reset! *graph-instance
                       (setup-scene! app container {:nodes nodes
                                                    :links links
                                                    :dark? dark?
                                                    :on-node-activate on-node-activate
                                                    :on-rendered on-rendered
                                                    :view-mode view-mode}
                                     render-start))
               (.destroy ^js app))))
          (.catch
           (fn [error]
             (js/console.error "Graph render failed" error))))))
  nil)

(defn render!
  [state]
  (let [container-ref (:ref state)
        container @container-ref
        opts (first (:rum/args state))]
    (render-container! container opts))
  state)
