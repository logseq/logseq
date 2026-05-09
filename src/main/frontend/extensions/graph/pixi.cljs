(ns frontend.extensions.graph.pixi
  (:require ["pixi.js" :as PIXI]
            [clojure.set :as set]
            [clojure.string :as string]
            [frontend.extensions.graph.pixi.logic :as logic]
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
     :update! (fn [^js world width height hovered-node-id {:keys [node-visible?
                                                                  hovered-only?
                                                                  selected-node-ids
                                                                  active-node-ids
                                                                  selected-only?
                                                                  active-only?]
                                                           :or {hovered-only? false
                                                                selected-node-ids #{}
                                                                active-node-ids #{}
                                                                selected-only? false
                                                                active-only? false}}]
                (let [node-visible? (or node-visible? (constantly true))
                      scale (.. world -scale -x)
                      viewport (world-viewport-rect world width height)
                      transform {:scale scale
                                 :x (.-x world)
                                 :y (.-y world)}
                      base-candidates (->> candidate-node-ids
                                           (keep get-node-by-id)
                                           (filter node-visible?))
                      active-nodes (->> active-node-ids
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
                                  (cond-> (vec (concat base-candidates active-nodes))
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
                                        (remove #(= hovered-node-id %) base-label-ids))
                                  :else
                                  base-label-ids)
                      label-id-set (set label-ids)]
                  (doseq [id label-ids]
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
                                              :alpha (logic/label-surface-fill-alpha :node hovered?)})
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
                    (when-not (contains? label-id-set id)
                      (when-let [entry (get @entry-by-id* id)]
                        (set! (.-visible (:container entry)) false))))
                  (reset! visible-ids* label-id-set)))
     :destroy! (fn []
                 (doseq [[_ {:keys [^js container]}] @entry-by-id*]
                   (.destroy container))
                 (reset! entry-by-id* {})
                 (reset! visible-ids* #{}))}))

(defn- edge-alpha
  [{:keys [selected-ids active-ids select-mode?]} source target]
  (cond
    (not select-mode?) 0.54
    (or (and (contains? selected-ids source)
             (contains? active-ids target))
        (and (contains? selected-ids target)
             (contains? active-ids source))) 0.82
    (and (contains? active-ids source)
         (contains? active-ids target)) 0.46
    :else 0.18))

(defn- draw-edges!
  ([^js graphics layout-by-id links dark? view-mode]
   (draw-edges! graphics layout-by-id links dark? view-mode (logic/highlight-state #{} {}) {}))
  ([^js graphics layout-by-id links dark? view-mode highlight-state]
   (draw-edges! graphics layout-by-id links dark? view-mode highlight-state {}))
  ([^js graphics layout-by-id links dark? view-mode highlight-state {:keys [arrow-mode]}]
   (let [max-edges (logic/draw-edge-limit (count layout-by-id)
                                           (count links)
                                           view-mode)
         links* (if (> (count links) max-edges)
                  (take max-edges links)
                  links)
         stroke-color (color->int (edge-color dark?))
         arrow-mode (case arrow-mode
                      :forward :forward
                      :both :both
                      :none)]
     (.clear graphics)
     (doseq [{:keys [source target]} links*]
       (when-let [from-node (get layout-by-id source)]
         (when-let [to-node (get layout-by-id target)]
           (let [dx (- (:x to-node) (:x from-node))
                 dy (- (:y to-node) (:y from-node))
                 distance (max 1 (js/Math.sqrt (+ (* dx dx) (* dy dy))))
                 ux (/ dx distance)
                 uy (/ dy distance)
                 start-x (+ (:x from-node) (* ux (+ (:radius from-node 0) 3)))
                 start-y (+ (:y from-node) (* uy (+ (:radius from-node 0) 3)))
                 end-x (- (:x to-node) (* ux (+ (:radius to-node 0) 5)))
                 end-y (- (:y to-node) (* uy (+ (:radius to-node 0) 5)))
                 alpha (edge-alpha highlight-state source target)
                 arrow! (fn [tip-x tip-y dir-x dir-y]
                          (let [length 6.8
                                width 3.3
                                base-x (- tip-x (* dir-x length))
                                base-y (- tip-y (* dir-y length))
                                normal-x (- dir-y)
                                normal-y dir-x]
                            (.moveTo graphics tip-x tip-y)
                            (.lineTo graphics
                                     (+ base-x (* normal-x width))
                                     (+ base-y (* normal-y width)))
                            (.lineTo graphics
                                     (- base-x (* normal-x width))
                                     (- base-y (* normal-y width)))
                            (.lineTo graphics tip-x tip-y)
                            (.fill graphics #js {:color stroke-color
                                                 :alpha alpha})))]
             (.setStrokeStyle graphics
                              #js {:width (if (:select-mode? highlight-state) 1.25 1)
                                   :color stroke-color
                                   :alpha alpha})
             (.moveTo graphics start-x start-y)
             (.lineTo graphics end-x end-y)
             (.stroke graphics)
             (when (contains? #{:forward :both} arrow-mode)
               (arrow! end-x end-y ux uy))
             (when (= :both arrow-mode)
               (arrow! start-x start-y (- ux) (- uy)))))))
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

(def ^:private edge-label-limit 420)

(defn- sync-edge-labels!
  [^js label-layer ^js world width height layout-by-id links dark? view-mode show-edge-labels?]
  (destroy-children! label-layer)
  (when show-edge-labels?
    (let [max-edges (logic/draw-edge-limit (count layout-by-id)
                                            (count links)
                                            view-mode)
          style (new (.-TextStyle PIXI)
                     #js {:fontFamily "Avenir Next, Inter, system-ui, sans-serif"
                          :fontSize 10
                          :fontStyle "italic"
                          :fill (edge-label-color dark?)
                          :alpha 0.9})
          accent-color (color->int (edge-label-color dark?))
          bg-color (color->int (if dark? "#0B1220" "#F8FAFC"))
          border-color accent-color
          labeled-links (->> links
                             (take max-edges)
                             (filter #(seq (:label %)))
                             (take edge-label-limit))]
      (doseq [{:keys [source target label]} labeled-links]
        (when-let [from-node (get layout-by-id source)]
          (when-let [to-node (get layout-by-id target)]
            (let [{from-x :x from-y :y} (screen-point world (:x from-node) (:y from-node))
                  {to-x :x to-y :y} (screen-point world (:x to-node) (:y to-node))
                  dx (- to-x from-x)
                  dy (- to-y from-y)
                  distance (js/Math.sqrt (+ (* dx dx) (* dy dy)))
                  mid-x (/ (+ from-x to-x) 2)
                  mid-y (/ (+ from-y to-y) 2)]
              (when (and (> distance 68)
                         (<= -80 mid-x (+ width 80))
                         (<= -40 mid-y (+ height 40)))
                (let [^js entry (new (.-Container PIXI))
                      ^js bg (new (.-Graphics PIXI))
                      ^js text (new (.-Text PIXI)
                                    #js {:text (logic/label-display-text label false)
                                         :style style})
                      padding-x 5
                      padding-y 2]
                  (when-let [^js anchor (.-anchor text)]
                    (set! (.-x anchor) 0.5)
                    (set! (.-y anchor) 0.5))
                  (set! (.-x text) 0)
                  (set! (.-y text) 0)
                  (.roundRect bg
                              (- (+ (/ (.-width text) 2) padding-x))
                              (- (+ (/ (.-height text) 2) padding-y))
                              (+ (.-width text) (* 2 padding-x))
                              (+ (.-height text) (* 2 padding-y))
                              3)
                  (.fill bg #js {:color bg-color
                                  :alpha (logic/label-surface-fill-alpha :edge false)})
                  (.setStrokeStyle bg #js {:width 1
                                           :color border-color
                                           :alpha 0.52})
                  (.stroke bg)
                  (.addChild entry bg)
                  (.addChild entry text)
                  (set! (.-x entry) mid-x)
                  (set! (.-y entry) mid-y)
                  (set! (.-rotation entry)
                        (logic/readable-edge-label-angle from-x from-y to-x to-y))
                  (set! (.-alpha entry) 0.92)
                  (.addChild label-layer entry)))))))))
  nil)

(defn- render-edge-labels!
  [^js container ^js world width height layout-by-id links dark? view-mode show-edge-labels?]
  (let [^js label-layer (new (.-Container PIXI))]
    (.addChild container label-layer)
    (sync-edge-labels! label-layer world width height layout-by-id links dark? view-mode show-edge-labels?)
    {:container label-layer
     :sync! (fn [world width height layout-by-id visible-links]
              (sync-edge-labels! label-layer world width height layout-by-id visible-links dark? view-mode show-edge-labels?))
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

(defn- create-node-display!
  [^js circle-texture icon-styles node]
  (if-let [{:keys [kind style text]} (icon-display-spec node)]
    (let [^js text (new (.-Text PIXI)
                        #js {:text text
                             :style (get icon-styles style)})]
      (gobj/set text "logseqGraphNodeDisplay" kind)
      text)
    (let [^js sprite (new (.-Sprite PIXI) circle-texture)]
      (gobj/set sprite "logseqGraphNodeDisplay" "circle")
      sprite)))

(defn- display-kind
  [^js display]
  (gobj/get display "logseqGraphNodeDisplay"))

(defn- node-display-kind
  [node]
  (if-let [{:keys [kind]} (icon-display-spec node)]
    kind
    "circle"))

(defn- configure-node-display!
  [^js display node emphasis]
  (let [kind (display-kind display)
        icon? (contains? #{"emoji" "icon"} kind)
        emoji? (= "emoji" kind)
        scale (/ (* 2 (:radius node)) (if icon? icon-texture-font-size 96))
        emphasis-scale (case emphasis
                         :selected 1.55
                         :connected 1.22
                         1.0)
        alpha (case emphasis
                :selected 1.0
                :connected 0.95
                :dimmed 0.16
                1.0)]
    (when-let [^js anchor (.-anchor display)]
      (set! (.-x anchor) 0.5)
      (set! (.-y anchor) 0.5))
    (set! (.-x display) (:x node))
    (set! (.-y display) (:y node))
    (set! (.-tint display) (if emoji? 0xFFFFFF (:color-int node)))
    (set! (.-alpha display) alpha)
    (set! (.. display -scale -x) (* scale emphasis-scale))
    (set! (.. display -scale -y) (* scale emphasis-scale))
    (set! (.-visible display) true)))

(defn- remove-display-from-parent!
  [^js display]
  (when-let [^js parent (.-parent display)]
    (.removeChild parent display)))

(defn- visible-node-id-set
  [nodes visible-node-ids]
  (if (some? visible-node-ids)
    (set visible-node-ids)
    (set (map :id nodes))))

(defn- visible-node?
  [visible-node-ids* node]
  (contains? @visible-node-ids* (:id node)))

(defn- visible-links
  [links visible-node-ids]
  (filter (fn [{:keys [source target]}]
            (and (contains? visible-node-ids source)
                 (contains? visible-node-ids target)))
          links))

(defn- ^:large-vars/cleanup-todo render-nodes!
  [^js tag-container ^js detail-container layouted-nodes* view-mode highlight-state* visible-node-ids*]
  (let [^js container (new (.-Container PIXI))
        texture (create-circle-texture)
        icon-styles (create-icon-text-styles)
        node-count (count @layouted-nodes*)
        max-nodes (logic/render-node-limit node-count view-mode)
        virtual? (< max-nodes node-count)]
    (.addChild detail-container container)
    (if-not virtual?
      (let [node-index-by-id (into {} (map-indexed (fn [idx node] [(:id node) idx]) @layouted-nodes*))
            displays (reduce
                     (fn [acc node]
                       (let [^js display (create-node-display! texture icon-styles node)
                             ^js display-container (if (= "tag" (:kind node))
                                                     tag-container
                                                     container)]
                         (if (visible-node? visible-node-ids* node)
                           (configure-node-display! display
                                                    node
                                                    (logic/node-emphasis @highlight-state* (:id node)))
                           (set! (.-visible display) false))
                         (.addChild display-container display)
                         (assoc acc (:id node) display)))
                     {}
                     @layouted-nodes*)]
        {:container container
         :texture texture
         :displays displays
         :drawn-node-count (count displays)
         :sync! (fn [_world _width _height _hovered-node-id] nil)
         :sync-styles! (fn []
                         (doseq [[id ^js display] displays]
                           (when-let [idx (get node-index-by-id id)]
                             (when-let [node (get @layouted-nodes* idx)]
                               (if (visible-node? visible-node-ids* node)
                                 (configure-node-display! display
                                                          node
                                                          (logic/node-emphasis @highlight-state* id))
                                 (set! (.-visible display) false))))))})
      (let [displays* (atom {})
            pool* (atom [])
            drawn-node-count* (atom 0)
            acquire-sprite! (fn []
                              (if-let [^js display (peek @pool*)]
                                (do
                                  (swap! pool* pop)
                                  display)
                                (new (.-Sprite PIXI) texture)))
            acquire-display! (fn [node]
                               (if (contains? #{"emoji" "icon"} (node-display-kind node))
                                 (create-node-display! texture icon-styles node)
                                 (let [^js display (acquire-sprite!)]
                                   (gobj/set display "logseqGraphNodeDisplay" "circle")
                                   display)))
            release-display! (fn [id]
                               (when-let [^js display (get @displays* id)]
                                 (remove-display-from-parent! display)
                                 (set! (.-visible display) false)
                                 (swap! displays* dissoc id)
                                 (if (= "circle" (display-kind display))
                                   (swap! pool* conj display)
                                   (.destroy display))))
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
                                                       (logic/node-emphasis @highlight-state* id))
                              (when-not (identical? (.-parent display) display-container)
                                (remove-display-from-parent! display)
                                (.addChild display-container display))))]
        {:container container
         :texture texture
         :displays* displays*
         :drawn-node-count drawn-node-count*
         :sync-styles! (fn []
                         (doseq [[id ^js display] @displays*]
                           (when-let [node (some #(when (= id (:id %)) %) @layouted-nodes*)]
                             (if (visible-node? visible-node-ids* node)
                               (configure-node-display! display
                                                        node
                                                        (logic/node-emphasis @highlight-state* id))
                               (release-display! id)))))
         :sync! (fn [^js world width height hovered-node-id]
                  (let [scale (.. world -scale -x)
                        viewport (expand-viewport
                                  (world-viewport-rect world width height)
                                  (/ 220 (max scale 0.5)))
                        visible-nodes (->> @layouted-nodes*
                                           (filter #(visible-node? visible-node-ids* %))
                                           (filter #(node-in-viewport? viewport %))
                                           (take max-nodes)
                                           vec)
                        visible-nodes (if hovered-node-id
                                        (if-let [hovered-node (some (fn [node]
                                                                      (when (= hovered-node-id (:id node))
                                                                        node))
                                                                    @layouted-nodes*)]
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
                        (release-display! id)))
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
  (if-let [displays* (:displays* node-render-info)]
    (get @displays* node-id)
    (get (:displays node-render-info) node-id)))

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

(defn- ^:large-vars/cleanup-todo setup-pan-and-zoom!
  [^js canvas ^js world {:keys [get-node-index
                                on-node-activate
                                on-node-select
                                on-selection-clear
                                node-selected?
                                on-scale-change
                                on-transform
                                on-hover-node-change
                                on-node-drag
                                on-node-drag-end]}]
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
            (handle-node-click! [node ^js e]
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

                  nil)))
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
                    (handle-node-click! node e)))

                @dragging-world?
                (do
                  (reset! dragging-world? false)
                  (when-not @moved?
                    (let [[sx sy] (canvas-point e)
                          [world-x world-y] (screen->world sx sy)
                          scale (.. world -scale -x)
                          hit (hit-test-node (get-node-index) world-x world-y scale)]
                      (when-let [node (:node hit)]
                        (handle-node-click! node e))
                      (when (and (nil? (:node hit))
                                 (fn? on-selection-clear))
                        (reset! last-click* nil)
                        (on-selection-clear)))))))
            (on-wheel [^js e]
              (.preventDefault e)
              (let [[sx sy] (canvas-point e)
                    [before-x before-y] (screen->world sx sy)
                    current-scale (.. world -scale -x)
                    factor (if (pos? (.-deltaY e)) 0.9 1.1)
                    next-scale (logic/clamp-zoom-scale (* current-scale factor))]
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

(defn- ^:large-vars/cleanup-todo setup-scene!
  [^js app ^js container {:keys [nodes links dark? on-node-activate on-selection-change on-rendered view-mode visible-node-ids depth arrow-mode link-distance show-edge-labels?]} render-start]
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
        depth* (atom (-> (or depth 1) (max 1) (min 5)))
        render-opts {:arrow-mode arrow-mode}
        layouted-nodes* (atom (layout-nodes nodes links view-mode dark? {:link-distance link-distance}))
        all-node-id-set (set (map :id @layouted-nodes*))
        visible-node-ids* (atom (visible-node-id-set @layouted-nodes* visible-node-ids))
        base-visible-link-list (fn []
                                 (visible-links links @visible-node-ids*))
        node-index-by-id (into {} (map-indexed (fn [idx node] [(:id node) idx]) @layouted-nodes*))
        layout-by-id* (atom (into {} (map (fn [node] [(:id node) node]) @layouted-nodes*)))
        preview-layout-by-id* (atom nil)
        initial-transform (logic/fit-transform @layouted-nodes* width height {:padding 72})
        _ (set! (.-x world) (:x initial-transform))
        _ (set! (.-y world) (:y initial-transform))
        _ (set! (.. world -scale -x) (:scale initial-transform))
        _ (set! (.. world -scale -y) (:scale initial-transform))
        neighbor-map (build-neighbor-map links)
        highlighted-node-ids* (atom #{})
        highlight-state* (atom (logic/highlight-state @highlighted-node-ids* neighbor-map @depth*))
        visible-link-list (fn []
                            (logic/highlight-visible-links
                             (base-visible-link-list)
                             @highlight-state*))
        edge-render-info (render-edges! detail-layer @layout-by-id* (visible-link-list) dark? normalized-view-mode render-opts)
        edge-label-render-info (render-edge-labels! label-layer-wrapper world width height @layout-by-id* (visible-link-list) dark? normalized-view-mode show-edge-labels?)
        _ (.addChild detail-layer drag-edge-layer)
        node-render-info (render-nodes! tag-layer detail-layer layouted-nodes* normalized-view-mode highlight-state* visible-node-ids*)
        _ ((:sync! node-render-info) world width height nil)
        all-node-index* (atom (index-layouted-nodes (filter #(visible-node? visible-node-ids* %) @layouted-nodes*)))
        tag-node-index* (atom (index-layouted-nodes (filter #(and (visible-node? visible-node-ids* %)
                                                                  (= "tag" (:kind %)))
                                                            @layouted-nodes*)))
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
        sync-highlight! (fn []
                          (reset! highlight-state*
                                  (logic/highlight-state @highlighted-node-ids* neighbor-map @depth*))
                          (draw-edges! (:graphics edge-render-info)
                                       (logic/current-layout-by-id
                                        @layout-by-id*
                                        @preview-layout-by-id*)
                                       (visible-link-list)
                                       dark?
                                       normalized-view-mode
                                       @highlight-state*
                                       render-opts)
                          (let [{:keys [width height]} @size*]
                            ((:sync! edge-label-render-info)
                             world
                             width
                             height
                             (logic/current-layout-by-id
                              @layout-by-id*
                              @preview-layout-by-id*)
                             (visible-link-list)))
                          (if-let [sync-styles! (:sync-styles! node-render-info)]
                            (sync-styles!)
                            (let [{:keys [width height]} @size*]
                              ((:sync! node-render-info) world width height @hovered-node-id*)))
                          (mark-transform!))
        update-highlight! (fn [node remove?]
                            (swap! highlighted-node-ids*
                                   logic/update-highlighted-node-ids
                                   (:id node)
                                   remove?)
                            (emit-selection!)
                            (sync-highlight!))
        clear-highlight! (fn []
                           (when (seq @highlighted-node-ids*)
                             (reset! highlighted-node-ids* #{})
                             (emit-selection!)
                             (sync-highlight!)))
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
                                            (visible-link-list)
                                            dark?
                                            normalized-view-mode
                                            @highlight-state*
                                            render-opts)
                               (let [{:keys [width height]} @size*]
                                 ((:sync! edge-label-render-info)
                                  world
                                  width
                                  height
                                  preview-layout-by-id
                                  (visible-link-list)))
                               (draw-drag-neighbor-edges! drag-edge-layer
                                                          preview-layout-by-id
                                                          (filter #(contains? @visible-node-ids* %)
                                                                  (get neighbor-map root-id))
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
                                           (visible-link-list)
                                           dark?
                                           normalized-view-mode
                                           @highlight-state*
                                           render-opts)
                              (let [{:keys [width height]} @size*]
                                ((:sync! edge-label-render-info)
                                 world
                                 width
                                 height
                                 @layout-by-id*
                                 (visible-link-list)))
                              (reset! preview-layout-by-id* nil)
                              (.clear drag-edge-layer)
                              (reset! drag-session* nil)
                              (reset! all-node-index* (index-layouted-nodes
                                                       (filter #(visible-node? visible-node-ids* %)
                                                               @layouted-nodes*)))
                              (reset! tag-node-index* (index-layouted-nodes
                                                       (filter #(and (visible-node? visible-node-ids* %)
                                                                     (= "tag" (:kind %)))
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
                              ((:sync! node-render-info) world width height @hovered-node-id*)
                              ((:sync! edge-label-render-info)
                               world
                               width
                               height
                               (logic/current-layout-by-id
                                @layout-by-id*
                                @preview-layout-by-id*)
                               (visible-link-list))))
                          (when-let [label-layer (:container label-manager)]
                            (let [scale (.. world -scale -x)
                                  {:keys [target-alpha update? hovered-only? selected-only? active-only?]}
                                  (logic/label-render-state
                                   @hovered-node-id*
                                   @highlighted-node-ids*
                                   (:active-ids @highlight-state*)
                                   (assoc @visibility-state*
                                          :linked-label-visible? (>= scale logic/linked-label-visible-scale))
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
                                                     #(visible-node? visible-node-ids* %)
                                                     #(and (visible-node? visible-node-ids* %)
                                                           (= "tag" (:kind %))))
                                    :hovered-only? hovered-only?
                                    :selected-node-ids @highlighted-node-ids*
                                    :active-node-ids (:active-ids @highlight-state*)
                                    :selected-only? selected-only?
                                    :active-only? active-only?})))))
                          (when dirty?
                            (reset! transform-dirty? false))))
        update-visibility! (fn [next-visible-node-ids]
                             (let [next-visible-node-ids (if (some? next-visible-node-ids)
                                                           (set next-visible-node-ids)
                                                           all-node-id-set)]
                               (when (not= next-visible-node-ids @visible-node-ids*)
                                 (reset! visible-node-ids* next-visible-node-ids)
                                 (let [next-highlighted-node-ids (set/intersection
                                                                  @highlighted-node-ids*
                                                                  next-visible-node-ids)]
                                   (when (not= next-highlighted-node-ids @highlighted-node-ids*)
                                     (reset! highlighted-node-ids* next-highlighted-node-ids)
                                     (emit-selection!)))
                                 (when-not (contains? next-visible-node-ids @hovered-node-id*)
                                   (reset! hovered-node-id* nil))
                                 (reset! preview-layout-by-id* nil)
                                 (.clear drag-edge-layer)
                                 (reset! drag-session* nil)
                                 (reset! all-node-index*
                                         (index-layouted-nodes
                                          (filter #(visible-node? visible-node-ids* %)
                                                  @layouted-nodes*)))
                                 (reset! tag-node-index*
                                         (index-layouted-nodes
                                          (filter #(and (visible-node? visible-node-ids* %)
                                                        (= "tag" (:kind %)))
                                                  @layouted-nodes*)))
                                 (sync-highlight!))))
        update-depth! (fn [next-depth]
                        (let [next-depth (-> (or next-depth 1) (max 1) (min 5))]
                          (when (not= next-depth @depth*)
                            (reset! depth* next-depth)
                            (when (seq @highlighted-node-ids*)
                              (reset! preview-layout-by-id* nil)
                              (.clear drag-edge-layer)
                              (reset! drag-session* nil)
                              (sync-highlight!)))))
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
                        :on-node-select update-highlight!
                        :on-selection-clear clear-highlight!
                        :node-selected? #(contains? @highlighted-node-ids* %)
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
     :cleanup (fn []
                (event-cleanup)
                (when-let [^js observer resize-observer]
                  (.disconnect observer))
                (.remove (.-ticker app) animate-layer)
                ((:destroy! label-manager))
                ((:destroy! edge-label-render-info))
                (when-let [^js texture (:texture node-render-info)]
                  (.destroy texture true)))
     :canvas canvas}))

(defn update-visibility!
  [^js container visible-node-ids]
  (when-let [update-visibility! (some-> (get @*graph-instances container)
                                        :update-visibility!)]
    (update-visibility! visible-node-ids))
  nil)

(defn update-depth!
  [^js container depth]
  (when-let [update-depth! (some-> (get @*graph-instances container)
                                   :update-depth!)]
    (update-depth! depth))
  nil)

(defn render-container!
  [^js container {:keys [nodes links dark? on-node-activate on-selection-change on-rendered view-mode visible-node-ids depth arrow-mode link-distance show-edge-labels?]}]
  (when container
    (destroy-instance! container)
    (let [token (get (swap! *render-tokens update container (fnil inc 0)) container)
          render-start (.now js/performance)
          app (new (.-Application PIXI))]
      (-> (.init app #js {:backgroundAlpha 0
                          :antialias false
                          :autoDensity true
                          :resolution (min 2 (or (.-devicePixelRatio js/window) 1))
                          :resizeTo container
                          :powerPreference "high-performance"})
          (.then
           (fn []
             (if (= token (get @*render-tokens container))
               (swap! *graph-instances
                      assoc
                      container
                      (setup-scene! app container {:nodes nodes
                                                   :links links
                                                   :dark? dark?
                                                   :on-node-activate on-node-activate
                                                   :on-selection-change on-selection-change
                                                   :on-rendered on-rendered
                                                   :view-mode view-mode
                                                   :visible-node-ids visible-node-ids
                                                   :depth depth
                                                   :arrow-mode arrow-mode
                                                   :link-distance link-distance
                                                   :show-edge-labels? show-edge-labels?}
                                    render-start))
               (.destroy ^js app))))
          (.catch
           (fn [error]
             (log/error :graph/render-failed {:error error}))))))
  nil)
