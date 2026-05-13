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

(def graph-target-fps 144)

(defn apply-graph-ticker-frame-rate!
  [^js ticker]
  (set! (.-maxFPS ticker) graph-target-fps)
  ticker)

(defn fps-overlay-position
  ([width height text-width text-height]
   (fps-overlay-position width height text-width text-height nil))
  ([width height text-width text-height {:keys [margin padding-x padding-y]
                                         :or {margin 12
                                              padding-x 8
                                              padding-y 4}}]
   {:x (max margin (- (or width 0) margin padding-x (or text-width 0)))
    :y (max margin (- (or height 0) margin padding-y (or text-height 0)))}))

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
  [{:keys [selected-ids connected-ids preview-ids hovered-id select-mode?
           task-focus-mode? task-focus-ids]} node-id]
  (cond
    (contains? selected-ids node-id) :selected
    (= hovered-id node-id) :hovered
    (contains? connected-ids node-id) :connected
    (contains? preview-ids node-id) :preview
    (and task-focus-mode? (contains? task-focus-ids node-id)) :preview
    task-focus-mode? :background
    select-mode? :dimmed
    :else :normal))

(def double-click-ms 320)

(def min-zoom-scale 0.05)

(def max-zoom-scale 3.6)

(def linked-label-visible-scale 2.1)

(declare normalize-view-mode)

(def task-status-detail-min-task-count 4)
(def task-status-detail-min-group-radius 58)
(def task-status-detail-node-spacing 24)
(def task-status-detail-group-spacing 260)
(def task-status-detail-group-gap 72)
(def task-status-detail-center-clearance 112)
(def task-status-detail-count-offset 22)
(def task-status-detail-visible-limit 12)
(def task-status-detail-label-gap 12)
(def task-status-detail-blob-gap 44)

(def ^:private task-status-none-key :task/status.none)

(defn normalize-task-status
  [status-ident status-title]
  (cond
    (keyword? status-ident)
    (str (namespace status-ident) "/" (name status-ident))

    (some? status-ident)
    (str status-ident)

    (seq status-title)
    (str status-title)

    :else
    "task/status.none"))

(defn task-node?
  [node]
  (true? (:task? node)))

(defn task-status-key
  [node]
  (or (:task/status-ident node) task-status-none-key))

(defn task-status-title
  [node]
  (:task/status-title node))

(defn task-sort-key
  [node]
  [(- (or (:block/updated-at node) -1))
   (- (or (:block/created-at node) -1))
   (string/lower-case (str (:label node)))
   (str (:id node))])

(defn- task-status-id
  [status-ident status-title]
  (normalize-task-status status-ident status-title))

(defn- titleize-status-name
  [s]
  (->> (string/split (str s) #"\s+")
       (remove string/blank?)
       (map string/capitalize)
       (string/join " ")))

(defn- status-title-from-ident
  [status-ident]
  (when (keyword? status-ident)
    (-> (name status-ident)
        (string/replace #"[_-]+" " ")
        titleize-status-name)))

(defn- task-status-display-title
  [status-ident status-title]
  (or (some-> status-title str string/trim not-empty)
      (status-title-from-ident status-ident)
      "No status"))

(defn- status-ident-value
  [status-key]
  (when (keyword? status-key)
    status-key))

(defn- status-title-value
  [status-key]
  (when (and status-key
             (not (keyword? status-key)))
    status-key))

(defn- group-status-ident
  [{:keys [status-ident status-key]}]
  (or status-ident
      (status-ident-value status-key)))

(defn- group-status-title-value
  [{:keys [status-title status-key]}]
  (or status-title
      (status-title-value status-key)))

(defn- task-status-label-key
  [status-ident status-title]
  (-> (task-status-display-title status-ident status-title)
      string/upper-case
      (string/replace #"[_-]+" " ")
      string/trim))

(defn- group-status-id
  [{:keys [status-id] :as group}]
  (or status-id
      (task-status-id (group-status-ident group)
                      (group-status-title-value group))))

(defn- group-status-title
  [group]
  (task-status-display-title (group-status-ident group)
                             (group-status-title-value group)))

(defn- group-status-label-key
  [group]
  (task-status-label-key (group-status-ident group)
                         (group-status-title-value group)))

(defn task-status-group-title-text
  [group]
  (let [title (group-status-label-key group)
        title (if (string/blank? title) (str (:status-key group)) title)
        count (:count group)]
    (str title
         (when (number? count)
           (str " " count))
         (when (pos? (or (:hidden-count group) 0))
           " ..."))))

(defn- group-status-area
  [{:keys [status-area] :as group}]
  (or status-area
      (normalize-task-status (group-status-ident group)
                             (group-status-title-value group))))

(defn- node-by-id
  [nodes]
  (into {} (map (juxt :id identity) nodes)))

(defn- task-label?
  [node]
  (= "TASK"
     (some-> (or (:label node)
                 (:name node)
                 (:title node))
             str
             string/trim
             string/upper-case)))

(defn- task-tag-node?
  [selected-group-id {:keys [id db-ident] :as node}]
  (and (= selected-group-id id)
       (or (= :logseq.class/Task db-ident)
           (task-label? node))))

(defn- task-group-node?
  [selected-group-id selected-group-node task-nodes]
  (or (task-tag-node? selected-group-id selected-group-node)
      (some (fn [node]
              (some #(task-tag-node? selected-group-id %) (:tags node)))
            task-nodes)))

(defn- selected-group-task-nodes
  [layout-nodes selected-group-id neighbor-map visible-node-ids]
  (let [by-id (node-by-id layout-nodes)
        selected-group-node (get by-id selected-group-id)
        selected-task-tag? (task-tag-node? selected-group-id selected-group-node)
        visible-node-ids (set visible-node-ids)]
    (->> (get neighbor-map selected-group-id)
         (filter #(contains? visible-node-ids %))
         (keep by-id)
         (keep (fn [node]
                 (cond
                   (task-node? node)
                   node

                   (and selected-task-tag?
                        (not= "tag" (:kind node)))
                   (assoc node :task? true)

                   :else
                   nil)))
         vec)))

(defn task-status-detail-eligible?
  [layout-nodes selected-group-id neighbor-map visible-node-ids
   {:keys [view-mode min-task-count]
    :or {min-task-count task-status-detail-min-task-count}}]
  (let [by-id (node-by-id layout-nodes)
        selected-group-node (get by-id selected-group-id)
        tasks (selected-group-task-nodes layout-nodes selected-group-id neighbor-map visible-node-ids)]
    (boolean
     (and (= :tags-and-objects (normalize-view-mode view-mode))
          selected-group-id
          (>= (count tasks) min-task-count)
          (task-group-node? selected-group-id selected-group-node tasks)))))

(defn task-status-preview-sync-action
  [{:keys [eligible? dragging? preview-active?]}]
  (cond
    (and eligible? (not dragging?)) :sync
    (and eligible? dragging? preview-active?) :keep
    :else :clear))

(defn- status-group-sort-key
  [{:keys [status-area status-title status-key status-id]}]
  [(string/lower-case (str status-title))
   (str status-key)
   (str status-area)
   (str status-id)])

(defn task-status-groups
  [layout-nodes selected-group-id neighbor-map visible-node-ids _viewport-size]
  (let [tasks (selected-group-task-nodes layout-nodes selected-group-id neighbor-map visible-node-ids)]
    (->> tasks
         (group-by #(task-status-id (task-status-key %)
                                    (task-status-title %)))
         (map (fn [[status-id tasks]]
                (let [tasks (sort-by task-sort-key tasks)
                      first-task (first tasks)
                      first-status-key (task-status-key first-task)
                      status-ident (when-not (= task-status-none-key first-status-key)
                                     first-status-key)
                      status-title (task-status-display-title status-ident
                                                              (task-status-title first-task))
                      status-key (task-status-label-key status-ident status-title)
                      raw-status-keys (->> tasks (map task-status-key) set)
                      status-area (when status-ident
                                    (normalize-task-status status-ident status-title))]
                  {:status-id status-id
                   :status-ident status-ident
                   :status-key status-key
                   :normalized-status status-id
                   :status-area status-area
                   :status-title status-title
                   :raw-status-keys raw-status-keys
                   :count (count tasks)
                   :tasks (vec tasks)})))
         (sort-by status-group-sort-key)
         vec)))

(defn- task-status-node-spacing
  [task-count]
  (cond
    (>= task-count 360) 12
    (>= task-count 180) 20
    :else task-status-detail-node-spacing))

(defn- task-status-node-positions
  [task-count]
  (let [spacing (task-status-node-spacing task-count)
        golden-angle (* js/Math.PI (- 3 (js/Math.sqrt 5)))]
    (mapv
     (fn [idx]
       (let [ring (js/Math.sqrt (inc idx))
             radius (* spacing ring 1.08)
             angle (+ (* idx golden-angle) (* 0.18 js/Math.PI))]
         {:x (* radius (js/Math.cos angle))
          :y (* radius (js/Math.sin angle))}))
     (range task-count))))

(defn- task-status-group-radius
  [task-count]
  (let [spacing (task-status-node-spacing task-count)
        positions (task-status-node-positions task-count)
        max-distance (if (seq positions)
                       (apply max (map #(js/Math.sqrt (+ (* (:x %) (:x %))
                                                          (* (:y %) (:y %))))
                                       positions))
                       0)]
    (max task-status-detail-min-group-radius
         (+ max-distance spacing))))

(defn- anchor-position-hint
  [[ax ay]]
  (cond
    (and (neg? ax) (neg? ay)) :top-left
    (and (pos? ax) (neg? ay)) :top-right
    (and (neg? ax) (pos? ay)) :bottom-left
    (and (pos? ax) (pos? ay)) :bottom-right
    :else nil))

(defn- radial-status-anchor
  [idx group-count]
  (let [angle (+ (* -0.76 js/Math.PI)
                 (* idx (/ (* 2 js/Math.PI) (max 1 group-count))))
        ring (+ 1.16 (* 0.18 (quot idx 8)))]
    [(* ring (js/Math.cos angle))
     (* ring (js/Math.sin angle))]))

(defn- status-layout-anchor
  [_group idx group-count _area-idx]
  (or (get (case group-count
             1 [[0 0]]
             2 [[-1.05 -0.20]
                [1.05 0.20]]
             3 [[-1.05 -0.78]
                [1.05 -0.78]
                [0 1.02]]
             4 [[-1.05 -0.92]
                [1.05 -0.92]
                [-1.05 0.92]
                [1.05 0.92]]
             5 [[-1.10 -0.86]
                [1.10 -0.86]
                [1.16 0.26]
                [0 1.04]
                [-1.16 0.26]]
             6 [[-1.08 -0.92]
                [0 -1.08]
                [1.08 -0.92]
                [1.08 0.82]
                [0 1.08]
                [-1.08 0.82]]
             7 [[-1.10 -0.90]
                [0 -1.08]
                [1.10 -0.90]
                [1.16 0.06]
                [0.72 1.00]
                [-0.72 1.00]
                [-1.16 0.06]]
             8 [[-1.12 -0.94]
                [-0.36 -1.12]
                [0.36 -1.12]
                [1.12 -0.94]
                [1.12 0.72]
                [0.36 1.12]
                [-0.36 1.12]
                [-1.12 0.72]]
             nil)
           idx)
      (radial-status-anchor idx group-count)))

(defn- centered-status-position
  [group idx group-count area-idx spacing center-x center-y radius]
  (let [[ax ay] (status-layout-anchor group idx group-count area-idx)
        distance (max spacing (+ radius task-status-detail-center-clearance))]
    {:x (+ center-x (* ax distance))
     :y (+ center-y (* ay distance))
     :position-hint (anchor-position-hint [ax ay])}))

(defn- status-group-distance
  [a b]
  (let [dx (- (:x b) (:x a))
        dy (- (:y b) (:y a))]
    (js/Math.sqrt (+ (* dx dx) (* dy dy)))))

(defn- push-status-groups-apart
  [groups]
  (let [pairs (for [a-idx (range (count groups))
                    b-idx (range (inc a-idx) (count groups))]
                [a-idx b-idx])]
    (loop [remaining-iterations 12
           groups groups]
      (if (zero? remaining-iterations)
        groups
        (let [[groups moved?]
              (reduce
               (fn [[groups moved?] [a-idx b-idx]]
                 (let [a (nth groups a-idx)
                       b (nth groups b-idx)
                       min-distance (+ (:radius a) (:radius b) task-status-detail-group-gap)
                       dx (- (:x b) (:x a))
                       dy (- (:y b) (:y a))
                       distance (max 1 (status-group-distance a b))]
                   (if (>= distance min-distance)
                     [groups moved?]
                     (let [shift (/ (- min-distance distance) 2)
                           ux (/ dx distance)
                           uy (/ dy distance)]
                       [(-> groups
                            (update-in [a-idx :x] - (* ux shift))
                            (update-in [a-idx :y] - (* uy shift))
                            (update-in [b-idx :x] + (* ux shift))
                            (update-in [b-idx :y] + (* uy shift)))
                        true]))))
               [groups false]
               pairs)]
          (if moved?
            (recur (dec remaining-iterations) groups)
            groups))))))

(defn task-status-group-id
  [normalized-status]
  (str "task-status-group:" normalized-status))

(defn task-status-collapsed-node-id
  [normalized-status]
  (str "task-status-collapsed:" normalized-status))

(defn- collapsed-node
  [{:keys [normalized-status status-key hidden-count visible-task-count]} center-x center-y radius]
  (when (pos? hidden-count)
    {:id (task-status-collapsed-node-id (or normalized-status status-key))
     :type "collapsed"
     :label "..."
     :hidden-count hidden-count
     :visible-task-count visible-task-count
     :status-key status-key
     :normalized-status normalized-status
     :x center-x
     :y (+ center-y (max 0 (- radius 16)))
     :radius 24}))

(defn- task-display-tag
  [task]
  (some (fn [{:keys [label db-ident]}]
          (when (and (seq label)
                     (not= :logseq.class/Task db-ident)
                     (not= "Task" label))
            (str "#" (string/replace label #"^#" ""))))
        (:tags task)))

(defn- label-card-width
  [label tag]
  (let [title-width (+ 28 (* 6.8 (count (str label))))
        tag-width (if tag (+ 26 (* 5.8 (count tag))) 0)]
    (-> (max title-width tag-width 92)
        (min 238)
        (max 180))))

(defn- estimated-label-line-count
  [label width]
  (let [display-label (label-display-text label true)
        content-width (max 80 (- width 20))
        chars-per-line (max 16 (js/Math.floor (/ content-width 6.6)))]
    (-> (js/Math.ceil (/ (count display-label) chars-per-line))
        (max 1)
        (min 4))))

(defn- label-card-size
  [task]
  (let [tag (task-display-tag task)
        width (label-card-width (:label task) tag)
        line-count (estimated-label-line-count (:label task) width)
        text-height (* line-count 15)
        tag-height (if tag 20 0)]
    {:title (:label task)
     :tag tag
     :width width
     :height (max (if tag 54 38)
                  (+ 12 text-height tag-height))}))

(defn- status-badge-card
  [group label-position]
  (let [title (task-status-group-title-text group)
        width (-> (+ 20 (* 8.4 (count title)))
                  (max 74)
                  (min 230))
        height 28]
    (cond-> {:title title
             :width width
             :height height
             :position {:x (+ (:x label-position) (/ width 2))
                        :y (+ (:y label-position) (/ height 2))}}
      (pos? (or (:hidden-count group) 0))
      (assoc :more-position {:x (+ (:x label-position) width 24)
                             :y (+ (:y label-position) (/ height 2))}))))

(defn- label-card-overlap?
  [a b]
  (let [{ax :x ay :y} (:position a)
        {bx :x by :y} (:position b)
        aw (:width a)
        ah (:height a)
        bw (:width b)
        bh (:height b)]
    (and (< (js/Math.abs (- ax bx))
            (+ (/ (+ aw bw) 2) task-status-detail-label-gap))
         (< (js/Math.abs (- ay by))
            (+ (/ (+ ah bh) 2) task-status-detail-label-gap)))))

(defn- label-card-overlaps-point?
  [card {:keys [x y]} padding]
  (let [{card-x :x card-y :y} (:position card)]
    (and (< (js/Math.abs (- card-x x))
            (+ (/ (:width card) 2) padding))
         (< (js/Math.abs (- card-y y))
            (+ (/ (:height card) 2) padding)))))

(defn- label-card-clear?
  [card placed blocked-points]
  (and (not-any? #(label-card-overlap? card %) placed)
       (not-any? #(label-card-overlaps-point? card % 10) blocked-points)))

(defn- shift-card-away
  [card placed blocked-points _idx]
  (let [side (or (:placement-side card) 1)
        vertical-step (+ (:height card) task-status-detail-label-gap)]
    (loop [attempt 0]
      (let [direction (if (odd? attempt) 1 -1)
            vertical-shift (if (zero? attempt)
                             0
                             (* direction vertical-step (inc (quot (dec attempt) 2))))
            horizontal-shift (* side 26 (quot attempt 6))
            candidate (-> card
                          (update-in [:position :y] + vertical-shift)
                          (update-in [:position :x] + horizontal-shift))]
        (if (or (>= attempt 22)
                (label-card-clear? candidate placed blocked-points))
          candidate
          (recur (inc attempt)))))))

(defn- label-card-side
  [position-hint relative-x]
  (cond
    (< relative-x -2) -1
    (> relative-x 2) 1
    (contains? #{:top-left :bottom-left} position-hint) -1
    (contains? #{:top-right :bottom-right} position-hint) 1
    :else 1))

(defn- label-card-position
  [center-x task-position position-hint idx width]
  (let [side (label-card-side position-hint (- (:x task-position) center-x))
        dot-to-card-gap 18
        vertical-nudge (* 3 (- (mod idx 3) 1))]
    {:x (+ (:x task-position) (* side (+ (/ width 2) dot-to-card-gap)))
     :y (+ (:y task-position) vertical-nudge)
     :placement-side side}))

(defn- group-visible-task-count
  [{:keys [tasks normalized-status status-key]} visible-limit revealed-task-count-by-status expanded-status-keys]
  (let [status (or normalized-status status-key)
        total-count (count tasks)
        requested-count (or (get revealed-task-count-by-status status)
                            (when (contains? (set expanded-status-keys) status)
                              total-count)
                            visible-limit)]
    (-> requested-count
        (max visible-limit)
        (min total-count))))

(defn- group-visible-tasks
  [group visible-limit revealed-task-count-by-status expanded-status-keys]
  (take (group-visible-task-count group
                                  visible-limit
                                  revealed-task-count-by-status
                                  expanded-status-keys)
        (:tasks group)))

(defn- tight-viewport-visible-limit
  [visible-limit group-count width height]
  (if (and (number? width) (number? height) (pos? width) (pos? height))
    (let [min-side (min width height)
          area-per-group (/ (* width height) (max 1 group-count))]
      (cond
        (or (< min-side 240)
            (< area-per-group 65000))
        (min visible-limit 1)

        (or (< min-side 420)
            (< area-per-group 115000))
        (min visible-limit 2)

        (or (< min-side 560)
            (< area-per-group 155000))
        (min visible-limit 3)

        :else
        visible-limit))
    visible-limit))

(defn- density-visible-limit
  [visible-limit group-count]
  (cond
    (>= group-count 9) (min visible-limit 4)
    (>= group-count 7) (min visible-limit 5)
    (>= group-count 5) (min visible-limit 8)
    :else visible-limit))

(defn- density-label-limit
  [label-limit visible-limit group-count]
  (min label-limit
       visible-limit
       (cond
         (>= group-count 9) 2
         (>= group-count 7) 3
         (>= group-count 5) 4
         :else label-limit)))

(defn- group-position-count
  [task-count hidden-count]
  (+ task-count (if (pos? hidden-count) 1 0)))

(defn- task-status-hidden-radius-bonus
  [hidden-count]
  (cond
    (>= hidden-count 500) 28
    (>= hidden-count 160) 24
    (>= hidden-count 64) 18
    (>= hidden-count 24) 12
    (pos? hidden-count) 8
    :else 0))

(defn- layout-task-nodes-in-status-cluster
  ([tasks center-x center-y position-hint label-limit]
   (layout-task-nodes-in-status-cluster tasks center-x center-y position-hint label-limit []))
  ([tasks center-x center-y position-hint label-limit initial-placed]
   (let [label-card-sizes (mapv (fn [idx task]
                                   (when (< idx label-limit)
                                     (label-card-size task)))
                                 (range)
                                 tasks)
         positions (task-status-node-positions (count tasks))
         world-positions (mapv (fn [{:keys [x y]}]
                                 {:x (+ center-x x)
                                  :y (+ center-y y)})
                               positions)]
     (:entries
      (reduce
       (fn [{:keys [placed] :as result} [idx task position card-size]]
         (let [labelled? (some? card-size)
               card (when labelled?
                      (-> (assoc card-size
                                 :position (label-card-position
                                            center-x
                                            position
                                            position-hint
                                            idx
                                            (:width card-size)))
                          (shift-card-away placed world-positions idx)))
               task (cond-> task
                      labelled?
                      (assoc :task-status-label? true
                             :label-card card
                             :label-position (:position card)))]
           (-> result
               (update :entries conj {:task task
                                      :position position})
               (cond-> card (update :placed conj card)))))
       {:entries []
        :placed (vec initial-placed)}
       (map vector (range) tasks world-positions label-card-sizes))))))

(defn- task-status-blob-points
  [{:keys [x y radius tasks badge-card status-key]
    overflow-node :collapsed-node}]
  (let [cards (cond-> (vec (keep :label-card tasks))
                badge-card (conj badge-card))
        card-xs (mapcat (fn [{:keys [position width]}]
                          [(- (:x position) (/ width 2))
                           (+ (:x position) (/ width 2))])
                        cards)
        card-ys (mapcat (fn [{:keys [position height]}]
                          [(- (:y position) (/ height 2))
                           (+ (:y position) (/ height 2))])
                        cards)
        more-radius (or (:radius overflow-node) 0)
        xs (concat [(- x radius) (+ x radius)]
                   (map :x tasks)
                   card-xs
                   (when overflow-node [(- (:x overflow-node) more-radius)
                                        (+ (:x overflow-node) more-radius)]))
        ys (concat [(- y radius) (+ y radius)]
                   (map :y tasks)
                   card-ys
                   (when overflow-node [(- (:y overflow-node) more-radius)
                                        (+ (:y overflow-node) more-radius)]))
        min-x (apply min xs)
        max-x (apply max xs)
        min-y (apply min ys)
        max-y (apply max ys)
        rx (max 112 (+ (/ (- max-x min-x) 2) 36))
        ry (max 84 (+ (/ (- max-y min-y) 2) 20))
        status-phase (/ (mod (abs (hash (str status-key))) 1000) 1000)
        point-count 18]
    (mapv
     (fn [idx]
       (let [angle (* 2 js/Math.PI (/ idx point-count))
             wobble (+ 1
                       (* 0.080 (js/Math.sin (+ (* 3 angle) status-phase)))
                       (* 0.055 (js/Math.cos (+ (* 5 angle) (* 2 status-phase)))))]
         {:x (+ x (* rx wobble (js/Math.cos angle)))
          :y (+ y (* ry wobble (js/Math.sin angle)))}))
     (range point-count))))

(defn- task-status-label-position
  [{:keys [x y radius]} _blob-points]
  {:x (- x radius 24)
   :y (- y radius 18)})

(defn- more-position-clear?
  [candidate cards task-points]
  (and (not-any? #(label-card-overlaps-point? % candidate 16) cards)
       (not-any? #(< (status-group-distance candidate %) 30) task-points)))

(defn- task-status-more-position
  [{:keys [x y radius tasks badge-card]} label-position]
  (let [cards (cond-> (vec (keep :label-card tasks))
                badge-card (conj badge-card))
        task-points (map #(select-keys % [:x :y]) tasks)
        max-distance (max 24 (- radius 26))
        clamp-candidate (fn [{candidate-x :x candidate-y :y :as candidate}]
                          (let [dx (- candidate-x x)
                                dy (- candidate-y y)
                                distance (max 1 (js/Math.sqrt (+ (* dx dx) (* dy dy))))]
                            (if (<= distance max-distance)
                              candidate
                              {:x (+ x (* (/ dx distance) max-distance))
                               :y (+ y (* (/ dy distance) max-distance))})))
        candidates (cond-> []
                     (:more-position badge-card)
                     (conj (:more-position badge-card))
                     true
                     (into (mapv clamp-candidate
                                 [{:x x :y (+ y radius -28)}
                                  {:x (- x 42) :y (+ y radius -36)}
                                  {:x (+ x 42) :y (+ y radius -36)}
                                  {:x (+ (:x label-position) 44)
                                   :y (+ (:y label-position) 44)}
                                  {:x (- x 54) :y y}
                                  {:x (+ x 54) :y y}])))]
    (or (some #(when (more-position-clear? % cards task-points) %) candidates)
        (first candidates))))

(defn- prepare-task-status-layout-group
  [visible-limit revealed-task-count-by-status expanded-status-keys
   {:keys [tasks] group-count :count :as group}]
  (let [status-id (group-status-id group)
        status-title (group-status-title group)
        status-key (group-status-label-key group)
        tasks (vec (sort-by task-sort-key tasks))
        group (assoc group
                     :status-id status-id
                     :status-key status-key
                     :normalized-status status-id
                     :status-area (group-status-area group)
                     :status-title status-title
                     :tasks tasks)
        visible-tasks (vec (group-visible-tasks
                            group
                            visible-limit
                            revealed-task-count-by-status
                            expanded-status-keys))]
    (assoc group
           :all-task-ids (mapv :id tasks)
           :hidden-count (max 0 (- (count tasks) (count visible-tasks)))
           :visible-task-count (count visible-tasks)
           :tasks visible-tasks
           :count (or group-count (count tasks)))))

(defn- prepare-task-status-layout-groups
  [groups visible-limit revealed-task-count-by-status expanded-status-keys]
  (->> groups
       (mapv #(prepare-task-status-layout-group
               visible-limit
               revealed-task-count-by-status
               expanded-status-keys
               %))
       (sort-by status-group-sort-key)
       vec))

(defn- positioned-task-status-groups
  [groups group-spacing center-x center-y]
  (let [group-count (count groups)
        radii (mapv (fn [{:keys [visible-task-count hidden-count]}]
                      (+ (task-status-group-radius
                          (group-position-count visible-task-count hidden-count))
                         (task-status-hidden-radius-bonus hidden-count)))
                    groups)
        max-radius (if (seq radii) (apply max radii) task-status-detail-min-group-radius)
        spacing (max (or group-spacing task-status-detail-group-spacing)
                     (+ max-radius 160))
        positioned-groups
        (nth
         (reduce
          (fn [[idx area-counts result] [group radius]]
            (let [area-key (:status-area group)
                  area-idx (get area-counts area-key 0)
                  next-area-counts (update area-counts area-key (fnil inc 0))
                  {:keys [x y position-hint]} (if (= group-count 1)
                                                {:x center-x
                                                 :y center-y
                                                 :position-hint :center}
                                                (centered-status-position
                                                 group
                                                 idx
                                                 group-count
                                                 area-idx
                                                 spacing
                                                 center-x
                                                 center-y
                                                 radius))]
              [(inc idx)
               next-area-counts
               (conj result (assoc group
                                   :x x
                                   :y y
                                   :radius radius
                                   :position-hint position-hint))]))
          [0 {} []]
          (map vector groups radii))
         2)]
    (if (= group-count 1)
      positioned-groups
      (push-status-groups-apart positioned-groups))))

(defn- add-positioned-task-status-group
  [label-limit layout {:keys [x y radius] :as group}]
  (let [count-position {:x x
                        :y (+ y radius task-status-detail-count-offset)}
        label-position (task-status-label-position group nil)
        badge-card (status-badge-card group label-position)
        task-entries (layout-task-nodes-in-status-cluster
                      (:tasks group) x y (:position-hint group) label-limit [badge-card])
        collapsed (collapsed-node group x y radius)
        tasks (mapv (fn [{:keys [task position]}]
                      (assoc task :x (:x position) :y (:y position)))
                    task-entries)
        group* (assoc group
                      :id (task-status-group-id (or (:normalized-status group)
                                                    (:status-key group)))
                      :count-position count-position
                      :label-position label-position
                      :badge-card badge-card
                      :collapsed-node collapsed
                      :tasks tasks)
        collapsed (when collapsed
                    (merge collapsed (task-status-more-position group* label-position)))
        positions-by-id (into {}
                              (map (fn [{:keys [task position]}]
                                     [(:id task) position]))
                              task-entries)
        group* (assoc group*
                      :collapsed-node collapsed
                      :blob-points (task-status-blob-points
                                    (assoc group*
                                           :label-position label-position
                                           :collapsed-node collapsed)))]
    (-> layout
        (update :groups conj group*)
        (update :positions-by-id merge positions-by-id))))

(defn- center-label-card
  [center-x center-y center-label]
  (when (seq (str center-label))
    (let [title (str center-label)
          width (-> (+ 42 (* 7.2 (count title)))
                    (max 132)
                    (min 260))
          height 40]
      {:title title
       :width width
       :height height
       :position {:x center-x
                  :y (+ center-y 64)}})))

(defn- task-status-group-bounds
  [group]
  (let [points (:blob-points group)
        xs (map :x points)
        ys (map :y points)]
    {:min-x (apply min xs)
     :max-x (apply max xs)
     :min-y (apply min ys)
     :max-y (apply max ys)}))

(defn- bounds-overlap-axis
  [a b gap]
  (when (and (< (:min-x a) (+ (:max-x b) gap))
             (< (:min-x b) (+ (:max-x a) gap))
             (< (:min-y a) (+ (:max-y b) gap))
             (< (:min-y b) (+ (:max-y a) gap)))
    (let [a-center-x (/ (+ (:min-x a) (:max-x a)) 2)
          b-center-x (/ (+ (:min-x b) (:max-x b)) 2)
          a-center-y (/ (+ (:min-y a) (:max-y a)) 2)
          b-center-y (/ (+ (:min-y b) (:max-y b)) 2)
          overlap-x (min (- (+ (:max-x a) gap) (:min-x b))
                         (- (+ (:max-x b) gap) (:min-x a)))
          overlap-y (min (- (+ (:max-y a) gap) (:min-y b))
                         (- (+ (:max-y b) gap) (:min-y a)))
          dx (- b-center-x a-center-x)
          dy (- b-center-y a-center-y)
          distance (js/Math.sqrt (+ (* dx dx) (* dy dy)))]
      (if (< distance 1)
        (if (< overlap-x overlap-y)
          {:axis :x
           :amount (/ overlap-x 2)
           :direction 1}
          {:axis :y
           :amount (/ overlap-y 2)
           :direction 1})
        (if (< overlap-x overlap-y)
          {:axis :x
           :amount (/ overlap-x 2)
           :direction (if (neg? dx) -1 1)}
          {:axis :y
           :amount (/ overlap-y 2)
           :direction (if (neg? dy) -1 1)})))))

(defn- axis-separation-shifts
  [axis amount direction]
  (let [a-shift (* -1 direction amount)
        b-shift (* direction amount)]
    (case axis
      :x [a-shift 0 b-shift 0]
      :y [0 a-shift 0 b-shift])))

(defn- shift-point
  [point dx dy]
  (cond-> point
    (contains? point :x) (update :x + dx)
    (contains? point :y) (update :y + dy)))

(defn- shift-label-card
  [card dx dy]
  (-> card
      (update-in [:position :x] + dx)
      (update-in [:position :y] + dy)))

(defn- shift-task-status-group
  [group dx dy]
  (-> group
      (update :x + dx)
      (update :y + dy)
      (update :count-position shift-point dx dy)
      (update :label-position shift-point dx dy)
      (update :badge-card #(some-> % (shift-label-card dx dy)))
      (update :collapsed-node #(some-> % (shift-point dx dy)))
      (update :blob-points #(mapv (fn [point] (shift-point point dx dy)) %))
      (update :tasks
              (fn [tasks]
                (mapv (fn [task]
                        (cond-> (shift-point task dx dy)
                          (:label-position task)
                          (update :label-position shift-point dx dy)

                          (:label-card task)
                          (update :label-card shift-label-card dx dy)))
                      tasks)))))

(defn- push-task-status-blobs-apart
  [groups]
  (let [pairs (for [a-idx (range (count groups))
                    b-idx (range (inc a-idx) (count groups))]
                [a-idx b-idx])]
    (loop [remaining-iterations 28
           groups groups]
      (if (zero? remaining-iterations)
        groups
        (let [[groups moved?]
             (reduce
               (fn [[groups moved?] [a-idx b-idx]]
                 (let [a (nth groups a-idx)
                       b (nth groups b-idx)]
                   (if-let [{:keys [axis amount direction]}
                            (bounds-overlap-axis
                             (task-status-group-bounds a)
                             (task-status-group-bounds b)
                             task-status-detail-blob-gap)]
                     (let [[a-dx a-dy b-dx b-dy]
                           (axis-separation-shifts axis amount direction)]
                       [(-> groups
                            (update a-idx shift-task-status-group a-dx a-dy)
                            (update b-idx shift-task-status-group b-dx b-dy))
                        true])
                     [groups moved?])))
               [groups false]
               pairs)]
          (if moved?
            (recur (dec remaining-iterations) groups)
            groups))))))

(defn- task-status-positions-by-id
  [groups]
  (into {}
        (mapcat (fn [{:keys [tasks]}]
                  (map (fn [{:keys [id x y]}]
                         [id {:x x :y y}])
                       tasks)))
        groups))

(defn- separate-task-status-layout
  [layout]
  (if (<= (count (:groups layout)) 1)
    layout
    (let [groups (push-task-status-blobs-apart (:groups layout))]
      (assoc layout
             :groups groups
             :positions-by-id (task-status-positions-by-id groups)))))

(defn task-status-group-layout
  [groups {:keys [center-x center-y center-label group-spacing visible-limit
                  visible-recent-task-count visible-recent-node-count-per-group label-limit
                  revealed-task-count-by-status expanded-status-keys width height]}]
  (let [requested-visible-limit (or visible-recent-task-count
                                    visible-recent-node-count-per-group
                                    visible-limit
                                    task-status-detail-visible-limit)
        visible-limit (tight-viewport-visible-limit
                       requested-visible-limit
                       (count groups)
                       width
                       height)
        visible-limit (density-visible-limit visible-limit (count groups))
        label-limit (density-label-limit
                     (or label-limit visible-limit)
                     visible-limit
                     (count groups))
        revealed-task-count-by-status (or revealed-task-count-by-status {})
        expanded-status-keys (or expanded-status-keys #{})
        center-x (or center-x 0)
        center-y (or center-y 0)
        positioned-groups (-> groups
                              (prepare-task-status-layout-groups
                               visible-limit
                               revealed-task-count-by-status
                               expanded-status-keys)
                              (positioned-task-status-groups
                               group-spacing
                               center-x
                               center-y))]
    (-> (reduce
         (partial add-positioned-task-status-group label-limit)
         {:center {:x center-x
                   :y center-y
                   :label center-label
                   :label-card (center-label-card center-x center-y center-label)}
          :groups []
          :positions-by-id {}}
         positioned-groups)
        separate-task-status-layout)))

(defn task-status-layout-by-id
  [selected-group-node groups-layout]
  (let [root-node (assoc selected-group-node
                         :type "taskCenter"
                         :task-center? true
                         :radius 22
                         :x (or (:x selected-group-node) 0)
                         :y (or (:y selected-group-node) 0))]
    (reduce
     (fn [layout-by-id {:keys [id x y radius] overflow-node :collapsed-node}]
       (cond-> (assoc layout-by-id id {:id id
                                       :kind "statusGroup"
                                       :type "statusGroup"
                                       :x x
                                       :y y
                                       :radius (or radius task-status-detail-min-group-radius)})
         overflow-node
         (assoc (:id overflow-node) overflow-node)))
     {(:id root-node) root-node}
     (:groups groups-layout))))

(defn task-status-visible-node-ids
  [root-id groups]
  (into #{root-id}
        (mapcat (fn [{:keys [tasks] collapsed-task-node :collapsed-node}]
                  (cond-> (mapv :id tasks)
                    collapsed-task-node (conj (:id collapsed-task-node)))))
        groups))

(defn task-status-display-links
  [root-id groups]
  (vec
   (mapcat
    (fn [{:keys [id tasks]}]
      (concat
       [{:source root-id
         :target id
         :edge/type "root-to-group"}]
       (keep-indexed
        (fn [idx {:keys [id]}]
          (when (pos? idx)
            (let [source-idx (if (< idx 4)
                               (dec idx)
                               (js/Math.floor (/ (dec idx) 2)))]
              {:source (:id (nth tasks source-idx))
               :target id
               :edge/type "task-relation"
               :weight 0.6})))
        tasks)))
    groups)))

(defn- task-status-fit-visible-limit
  [groups {:keys [width height visible-recent-task-count visible-recent-node-count-per-group visible-limit]}]
  (-> (or visible-recent-task-count
          visible-recent-node-count-per-group
          visible-limit
          task-status-detail-visible-limit)
      (tight-viewport-visible-limit (count groups) width height)
      (density-visible-limit (count groups))))

(defn- task-status-fit-task-signature
  [visible-limit revealed-task-count-by-status group]
  (let [visible-count (group-visible-task-count
                       group
                       visible-limit
                       revealed-task-count-by-status
                       #{})]
    (mapv (fn [task]
            [(:id task) (:block/updated-at task) (:block/created-at task)])
          (take visible-count (sort-by task-sort-key (:tasks group))))))

(defn task-status-fit-key
  [selected-group-id revealed-task-count-by-status groups {:keys [width height] :as viewport}]
  (let [revealed-task-count-by-status (or revealed-task-count-by-status {})
        visible-limit (task-status-fit-visible-limit groups viewport)]
    [selected-group-id
     revealed-task-count-by-status
     width
     height
     visible-limit
     (mapv (fn [group]
             [(:normalized-status group)
              (:count group)
              (task-status-fit-task-signature
               visible-limit
               revealed-task-count-by-status
               group)])
           groups)]))

(defn clamp-zoom-scale
  [scale]
  (-> scale
      (max min-zoom-scale)
      (min max-zoom-scale)))

(defn wheel-zoom-transform
  [{:keys [world-x world-y scale]} {:keys [screen-x screen-y delta-y locked?]}]
  (when-not locked?
    (let [current-scale (or scale 1)
          factor (if (pos? delta-y) 0.9 1.1)
          next-scale (clamp-zoom-scale (* current-scale factor))]
      {:x (- screen-x (* world-x next-scale))
       :y (- screen-y (* world-y next-scale))
       :scale next-scale})))

(defn graph-key-action
  [{:keys [key task-status-preview-active?]}]
  (when (and task-status-preview-active?
             (= "Escape" key))
    :exit-task-status-preview))

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

(defn- label-state
  [target-alpha update? hovered-only? include-select-scope? selected-only? active-only?]
  (cond-> {:target-alpha target-alpha
           :update? update?
           :hovered-only? hovered-only?}
    include-select-scope?
    (assoc :selected-only? selected-only?
           :active-only? active-only?)))

(defn label-render-state
  ([hovered-node-id visibility-state label-alpha]
   (label-render-state hovered-node-id #{} #{} visibility-state label-alpha false))
  ([hovered-node-id active-node-ids {:keys [label-visible?]} label-alpha]
   (label-render-state hovered-node-id active-node-ids active-node-ids {:label-visible? label-visible?} label-alpha true))
  ([hovered-node-id selected-node-ids active-node-ids visibility-state label-alpha]
   (label-render-state hovered-node-id selected-node-ids active-node-ids visibility-state label-alpha true))
  ([hovered-node-id selected-node-ids active-node-ids
    {:keys [label-visible? linked-label-visible? task-status-preview-active?]} _ include-select-scope?]
   (if task-status-preview-active?
     (label-state 0.0 true true include-select-scope? false false)
     (let [linked-label-visible? (if (some? linked-label-visible?)
                                   linked-label-visible?
                                   label-visible?)
           select-mode? (seq selected-node-ids)
           active-mode? (seq active-node-ids)
           selected-labels-only? (and select-mode? (not linked-label-visible?))]
       (cond
         hovered-node-id
         (label-state 1.0
                      true
                      (not (or label-visible? active-mode?))
                      include-select-scope?
                      selected-labels-only?
                      (and active-mode? linked-label-visible?))

         label-visible?
         (label-state 1.0
                      true
                      false
                      include-select-scope?
                      selected-labels-only?
                      (and active-mode? linked-label-visible?))

         select-mode?
         (label-state 1.0 true false include-select-scope? selected-labels-only? false)

         :else
         (label-state 0.0 false true include-select-scope? false false))))))

(defn task-status-preview-click-activation-target
  [preview-active? node]
  (when (and preview-active?
             (task-node? node))
    (assoc node :graph/open-in-sidebar? true)))

(defn task-status-preview-entry-group-id
  ([{node-id :id :as node}]
   (cond
     (task-tag-node? node-id node)
     node-id

     :else
     (some (fn [{tag-id :id :as tag}]
             (when (task-tag-node? tag-id tag)
               tag-id))
           (:tags node))))
  ([{node-id :id :as node} layout-by-id neighbor-map]
   (or (task-status-preview-entry-group-id node)
       (some (fn [neighbor-id]
               (let [neighbor (get layout-by-id neighbor-id)]
                 (when (task-tag-node? neighbor-id neighbor)
                   neighbor-id)))
             (get neighbor-map node-id)))))

(defn task-status-preview-entry-selected-ids
  [node-id {:keys [eligible? preview-active?]}]
  (when (and node-id
             eligible?
             (not preview-active?))
    #{node-id}))

(defn tag-focus-display-node-ids
  [visible-tag-ids focus-level focused-tag-id visible-object-ids crossed-tag-ids]
  (let [visible-tag-ids (set visible-tag-ids)]
    (case focus-level
      :objects
      (if focused-tag-id
        (set/union visible-tag-ids
                   (set visible-object-ids)
                   (set crossed-tag-ids))
        visible-tag-ids)

      visible-tag-ids)))

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
  (let [node-map (into {} (map (juxt :id identity) nodes))
        force-by-id (into {} (map (juxt :id identity) force-layouted-nodes))
        cluster-delta-by-id (reduce
                             (fn [m {:keys [id x y kind]}]
                               (if (and (= "tag" kind)
                                        (contains? node-map id))
                                 (let [original (get node-map id)]
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
