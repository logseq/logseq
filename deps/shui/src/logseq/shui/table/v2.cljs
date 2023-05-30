(ns logseq.shui.table.v2
  (:require 
    [clojure.string :as str]
    [logseq.shui.util :refer [use-ref-bounding-client-rect use-dom-bounding-client-rect $main-content] :as util]
    [rum.core :as rum]))

(declare table-cell)

(def COLORS #{"tomato" "red" "crimson" "pink" "plum" "purple" "violet" "indigo" "blue" "sky" "cyan" "teal" "mint" "green" "grass" "lime" "yellow" "amber" "orange" "brown"})
(def MAX_WIDTH 30 #_rem) ;; Max width in rem for a single column
(def MIN_WIDTH 4 #_rem)  ;; Min width in rem for a single column

;; in order to make sure the tailwind classes are included,
;; the values are pulled from the classes via regex.
;; the return values are simply the numbers in the classes.
(def CELL_PADDING         (->> "px-[0.75rem]" (re-find #"\d+\.?\d*") js/parseFloat))
(def CELL_PADDING_COMPACT (->> "px-[0.25rem]" (re-find #"\d+\.?\d*") js/parseFloat))
(def BORDER_WIDTH         (->> "border-[1px]" (re-find #"\d+\.?\d*") js/parseFloat))

;; -- Helpers ------------------------------------------------------------------

(defn get-in-first 
  ([obj path] (get-in obj path))
  ([obj path & more] (get-in obj path (apply get-in-first obj more))))

(defn get-in-first-fallback
  ([obj path] (get-in obj path))
  ([obj path fallback] (get-in obj path fallback))
  ([obj path path-b & more] (get-in obj path (apply get-in-first-fallback obj path-b more))))

(defn read-prop [value]
  (case value 
    "false" false 
    "true" true 
    value))

(defn get-view-prop 
  "Get the config for a specified item. Can be overridden in blocks, specified in config, 
  fallback to default config, or fallback to the provided parameters"
  ([context kw] 
   (read-prop
     (get-in-first context [:block :properties kw] 
                           [:block :block/properties kw] 
                           [:config kw])))
  ([context kw fallback]
   (read-prop
     (get-in-first-fallback context [:block :properties kw] 
                                    [:block :block/properties kw] 
                                    [:config kw] 
                                    fallback))))

(defn color->gray [color]
  (case color 
    ("tomato" "red" "crimson" "pink" "plum" "purple" "violet") "mauve"
    ("indigo" "blue" "sky" "cyan") "slate" 
    ("teal" "mint" "green") "sage"
    ("grass" "lime") "olive"
    ("yellow" "amber" "orange" "brown") "sand"
    nil))

(defn rdx
  ([color step] (str "bg-" color "-" step))
  ([param color step] (str (name param) "-" color "-" step)))
  ; ([color step] (str "bg-" color "dark-" step))
  ; ([param color step] (str param "-" color "dark-" step))))

    ; --ls-primary-background-color: #fff;
    ; --ls-secondary-background-color: #f8f8f8;
    ; --ls-tertiary-background-color: #f2f2f3;
    ; --ls-quaternary-background-color: #ebeaea));

(defn lsx 
  "This is a temporary bridge between the radix color grading and the
  current logseq theming variables. Should set the prop to the given css variable"
  ([step] (lsx :bg step))
  ([param step]
   (case step 
     1 ({"bg" "bg-[color:var(--ls-primary-background-color)]"} (name param))
     2 ({"bg" "bg-[color:var(--ls-secondary-background-color)]"} (name param)) 
     3 ({"bg" "bg-[color:var(--ls-tertiary-background-color)]"} (name param))
     4 ({"bg" "bg-[color:var(--ls-quaternary-background-color)]"} (name param))
     5 ({"bg" "bg-[color:var(--ls-quinary-background-color)]"} (name param)) 
     6 ({"bg" "bg-[color:var(--ls-senary-background-color)]"} (name param))
     7 ({"bg" "bg-[color:var(--ls-border-color)]"
         "border" "border-[color:var(--ls-border-color)]"} (name param))
     11 ({"text" "text-[color:var(--ls-secondary-text-color)]"} (name param))
     12 ({"text" "text-[color:var(--ls-primary-text-color)]"} (name param)))))

(defn varc [color step]
  (str "var(--color-" color "-" step ")"))

(defn last-str 
  "Given an inline AST, return the last string element you can walk to" 
  [inline]
  (cond 
    (keyword? inline) (name inline)
    (string? inline) inline
    (coll? inline) (last-str (last inline))
    :else (pr-str inline)))

(comment
  (last-str "A")
  (last-str ["Plain" "A"])
  (last-str [["Plain" "A"]])
  (last-str [["Plain" "A"] 
             [["Emphasis" [["Italic"] [["Plain" "B"]]]]]]))

(defn render-cell-in-context 
  "Some instances of the table provide us with raw data, others provide us with 
  inline ASTs. This function renders the content appropriately, passing the AST along 
  to map-inline if necessary."
  [{:keys [map-inline-block int->local-time-2]} cell-data]
  (cond 
    (sequential? cell-data) (map-inline-block [:table :v2] cell-data)
    (string? cell-data) cell-data
    (keyword? cell-data) (name cell-data)
    (boolean? cell-data) (pr-str cell-data) 
    (number? cell-data) (if-let [date (int->local-time-2 cell-data)]
                          date cell-data)))

(defn map-with-all-indices [data]
  (let [!row-index (volatile! -1)]
    (for [[group-index group] (map-indexed vector data) 
          [group-row-index row] (map-indexed vector group) 
          :let [row-index (vswap! !row-index inc)]]
      [group-index group-row-index row-index group row])))

(defn get-columns [block data]
  (->> (or (some-> (get-in block [:block/properties :logseq.table.cols])
                   (str/split #", ?"))
           (map last-str (ffirst data)))
       (map (comp str/lower-case str/trim))))

(defn cell-bg-classes 
  "We track the cell the cursor last entered and update the cells according to the configured 
  hover preference: cell, row, col, both, or none.
  We also have to account for the header cells and stripes cells"
  [{:keys [row-index col-index hover header? gray color stripes? cursor]}]
  (let [;; check how the cursor position overlaps with the current cell
        row-highlighted?  (= row-index (second cursor))
        col-highlighted?  (= col-index (first cursor))
        cell-highlighted? (and row-highlighted? col-highlighted?)
        ;; check how the cell needs to be highlighted
        highlight-row?    (and row-highlighted? (#{"row" "both"} hover))
        highlight-col?    (and col-highlighted? (#{"col" "both"} hover))
        highlight-cell?   (and cell-highlighted? (#{"cell" "row" "col" "both"} hover))]
    (cond 
      highlight-cell? (if header? (lsx 6) (lsx 4))
      highlight-row?  (if header? (lsx 5) (lsx 3))
      highlight-col?  (if header? (lsx 5) (lsx 3))
      header? (lsx 4) 
      (and stripes? (even? row-index)) (lsx 2)
      :else (lsx 1))))

(defn cell-rounded-classes 
  "Depending on where the cell is, and whether there is a gradient accent, we need to round specific corners 
   The cond-> is used to account for single row or single column talbes that may have multiple rounded corners."
  [{:keys [color row-index col-index total-rows total-cols]}]
  (let [no-gradient-accent? (nil? color)]
    (cond-> ""
      (and no-gradient-accent? (= [row-index col-index] [0 0])) (str " rounded-tl")
      (and no-gradient-accent? (= [row-index col-index] [0 (dec total-cols)])) (str " rounded-tr")
      (= [row-index col-index] [(dec total-rows) 0]) (str " rounded-bl")
      (= [row-index col-index] [(dec total-rows) (dec total-cols)]) (str " rounded-br"))))

(defn cell-text-transform-classes [{:keys [headers header?]}]
  (when header?
    (cond-> (get #{"uppercase" "capitalize" "lowercase" "none" "capitalize-first"} headers "none")
      (= headers "capitalize-first") (str " lowercase"))))

(defn cell-padding-classes [{:keys [compact? header?]}]
  (cond 
    #_compact_th (and compact? header?) (str "px-[" CELL_PADDING_COMPACT "rem] py-0.5") 
    #_compact_td compact?               (str "px-[" CELL_PADDING_COMPACT "rem] py-0.5")
    #_padded_th  header?                (str "px-[" CELL_PADDING "rem] py-1.5")
    #_padded_td  :else                  (str "px-[" CELL_PADDING "rem] py-2")))

(defn cell-text-classes [{:keys [header?]}]
  (if header?
    (str (lsx :text 11) " text-sm tracking-wide font-bold")
    (str (lsx :text 12) " text-base")))

(defn cell-classes [table-opts]
  (str/join " "
    [(cell-bg-classes table-opts)
     (cell-rounded-classes table-opts)
     (cell-text-classes table-opts)
     (cell-text-transform-classes table-opts)
     (cell-padding-classes table-opts)]))

;; -- Handlers -----------------------------------------------------------------

(defn handle-cell-pointer-down [e {:keys [cell-focus col-index row-index]}] 
  (when (not= cell-focus [col-index row-index])
    (.stopPropagation e) 
    (.preventDefault e)))

(defn handle-cell-click 
  "When a cell is clicked, we need to update the cursor position and the selected cells"
  [e {:keys [cell-focus set-cell-focus header? col-index row-index]} cell-ref]
  ; (.stopPropagation e) 
  (.preventDefault e)
  (when-not (= cell-focus [col-index row-index]) 
    (set-cell-focus [col-index row-index])))
    

(defn handle-cell-keydown 
  "When a cell is focused, we need to update the cursor position and the selected cells"
  [e {:keys [cell-focus set-cell-focus header? col-index row-index total-rows total-cols]}]
  (when (= cell-focus [col-index row-index]) 
    (and (case (.-key e)
           "ArrowUp"    (if (= row-index 0)
                          (set-cell-focus [col-index row-index])
                          (set-cell-focus [col-index (dec row-index)]))
           "ArrowDown"  (if (= row-index (dec total-rows)) 
                          (set-cell-focus [col-index row-index])
                          (set-cell-focus [col-index (inc row-index)]))
           "ArrowLeft"  (cond 
                          ;; if we are in the top left, then do not move the focus
                          (and (= col-index 0) (= row-index 0))
                          (set-cell-focus [col-index row-index])
                          ;; if we are in the first column, then move to the last column of the previous row
                          (= col-index 0) 
                          (set-cell-focus [(dec total-cols) (dec row-index)])
                          ;; otherwise, move to the previous column
                          :else
                          (set-cell-focus [(dec col-index) row-index]))
           "ArrowRight" (cond 
                          ;; if we are in the bottom right, then do not move the focus
                          (and (= col-index (dec total-cols)) (= row-index (dec total-rows))) 
                          (set-cell-focus [col-index row-index])
                          ;; if we are in the last column, then move to the first column of the next row
                          (= col-index (dec total-cols)) 
                          (set-cell-focus [0 (inc row-index)])
                          ;; otherwise, move to the next column
                          :else
                          (set-cell-focus [(inc col-index) row-index]))
           nil)
         ;; Prevent default actions when the table handles it itself
         (.preventDefault e)
         (.stopPropagation e))))
        

;; -- Hooks --------------------------------------------------------------------

(defn use-atom 
  "A hook that wraps use-state to allow for interaction with 
  the state as if it were an atom"
  [initial-value]
  (let [atom-ref (rum/use-ref (atom initial-value))
        atom-current (.. atom-ref -current)
        [state set-state] (rum/use-state initial-value)]
    (rum/use-effect! (fn [] 
                       (set-state @atom-current) 
                       identity)
                     [atom-current])
    [state atom-current]))

(defn use-dynamic-widths [data]
  (let [[static atomic] (use-atom {})
        add-column-width (fn [col-index width]
                           (when (< (get @atomic col-index 0) (min MAX_WIDTH width))
                             (swap! atomic assoc col-index (min MAX_WIDTH width))
                             ;; rum is complaining that we can only return teardown functions
                             identity))]
    ;; Reset the minimum widths when the data changes
    (rum/use-effect! (fn [] (reset! atomic {}) identity)
                     [data])
    [static add-column-width]))

(defn use-table-flow-at-width [table-px max-cols-px]
  (let [[overflow set-overflow] (rum/use-state false)
        [underflow set-underflow] (rum/use-state false)
        handle-container-width (fn [container-px]
                                 (set-underflow (< max-cols-px container-px))
                                 (set-overflow (< container-px table-px)))]
    [overflow underflow handle-container-width]))

;; -- Components (V2) -----------------------------------------------------------

(rum/defc table-scrollable-overflow [handle-root-width-change child]
  (let [[set-root-ref root-rect root-ref] (use-ref-bounding-client-rect)
        main-content-rect (use-dom-bounding-client-rect ($main-content))
        
        left-adjustment (- (:left root-rect) (:left main-content-rect))
        right-adjustment (- (:width main-content-rect) 
                            (- (:right root-rect) (:left main-content-rect)))

        ;; Because in a scrollable container, we need to account for the scrollbar being clicked,
        ;; we add a handler to prevent the table from switching to the input on click. 
        ;; This also prevents the table from switching to eiditng mode when the left or right area 
        ;; of the table is clicked, but that feels natural to me.
        handle-pointer-down (fn [e]
                              (when (= root-ref (.. e -target -parentElement))
                                (.preventDefault e)))]
    (rum/use-effect! #(handle-root-width-change (:width root-rect)) [(:width root-rect)])
    [:div {:ref set-root-ref}
     [:div {:style {:width (:width main-content-rect)
                    :margin-left (- (:left main-content-rect) (:left root-rect))
                    :padding-left left-adjustment
                    :padding-right right-adjustment
                    :overflow-x "scroll"}
            :class "mt-2"
            :on-pointer-down handle-pointer-down}
      child]]))

(rum/defc table-gradient-accent [{:keys [color]}]
  [:div.rounded-t.h-2.-ml-px.-mt-px.-mr-px 
   {:style {:grid-column "1 / -1" :order -999} 
    :class (str "grad-bg-" color "-9")
    :data-testid "v2-table-gradient-accent"}])

(rum/defc table-header-row [handle-cell-width-change cells {:keys [cell-col-map] :as opts}]
  [:<>
   (for [[cell-index cell] (map-indexed vector cells)
         :let [col-index (get cell-col-map cell-index)]
         :when col-index]
     ^{:key cell-index}
     (table-cell handle-cell-width-change cell (assoc opts :cell-index cell-index :col-index col-index :header? true)))])
 
(rum/defc table-data-row [handle-cell-width-change cells {:keys [cell-col-map] :as opts}]
  [:<>
   (for [[cell-index cell] (map-indexed vector cells)
         :let [col-index (get cell-col-map cell-index)]
         :when col-index]
     ^{:key cell-index}
     (table-cell handle-cell-width-change cell (assoc opts :cell-index cell-index :col-index col-index)))])

(rum/defc table-cell [handle-cell-width-change cell {:keys [row-index col-index render-cell show-separator? total-cols set-cell-hover cell-focus table-underflow?] :as opts}]
  (let [cell-ref (rum/use-ref nil)
        cell-order (+ (* row-index total-cols) col-index)
        static-width (get-in opts [:static-widths col-index])
        dynamic-width (when-not static-width 
                        (get-in opts [:dynamic-widths col-index]))]
    ;; Whenever the cell changes, we need to calculate new bounds for the given content 
    ;; -innerText is used here to strip out formatting, this may turn out to not work for all given block types
    (rum/use-layout-effect! #(->> (.. cell-ref -current -innerText) 
                                  (count) 
                                  (handle-cell-width-change col-index))
                            [cell])

    ;; Whenever the cell becomes focused, we set it's tabIndex. When the tabIndex is set, call focus on the element 
    (rum/use-layout-effect! #(when (= cell-focus [col-index row-index])
                               ; (.. cell-ref -current -tabIndex 0)
                               (some-> cell-ref .-current .focus))
                               ; (.execCommand js/document "selectAll"))
                            [cell-focus])
    [:div {:ref cell-ref
           :class (cell-classes opts)
           :style (cond-> {:box-sizing :border-box}
                    (not table-underflow?) (assoc :max-width (str MAX_WIDTH "rem"))
                    static-width  (assoc :width (str static-width "rem"))
                    dynamic-width (assoc :min-width (str (max MIN_WIDTH dynamic-width) "rem"))
                    cell-order    (assoc :order cell-order)
                    show-separator? (assoc :margin-top 3))
           :tab-index (when (= cell-focus [col-index row-index]) "-1")
           :on-pointer-enter #(set-cell-hover [col-index row-index])
           :on-click #(handle-cell-click % opts cell-ref)
           :on-pointer-down #(handle-cell-pointer-down % opts)
           ; :on-pointer-up handle-cell-interrupt
           :on-key-down #(handle-cell-keydown % opts)}
     (render-cell cell)]))

(rum/defc table-container [{:keys [columns borders? table-overflow? total-table-width gray set-cell-hover] :as opts} & children]
  (let [grid-template-columns (str "repeat(" (count columns) ", minmax(max-content, 1fr))")]
    [:div.grid.border.rounded {:style {:grid-template-columns grid-template-columns
                                       :gap (when borders? BORDER_WIDTH) 
                                       :width (when table-overflow? total-table-width)}
                               :class (str (lsx 7) " " (lsx :border 7))
                               :data-testid "v2-table-container"
                               :on-pointer-leave #(set-cell-hover [])}
     children]))

(rum/defc root
  [{:keys [data] :as _props} {:keys [block] :as context}]
  (let [;; In order to highlight cells in the same row or column of the hovered cell, 
        ;; we need to know the row and column that the cursor is in
        [[_cell-hover-x _cell-hover-y :as cell-hover] set-cell-hover] (rum/use-state [])
        [[_cell-focus-x _cell-focus-y :as cell-focus] set-cell-focus] (rum/use-state [])

        ;; Depending on the content of the table, we roughly adjust the width of the column
        ;; to do this we need to keep track of the .innerText.length of each cell and update 
        ;; it whenever it changes
        [dynamic-widths handle-cell-width-change] (use-dynamic-widths data)

        ;; We need to call into the view config several times, so we can memoize it
        ;; TODO: insert global config here
        get-view-prop* (partial get-view-prop context)
                                     
        ;; Most of the config options will be repeated and reused throughout the table, so store 
        ;; all of it's state in a single map for consistency
        table-opts {; user configurable properties (sometimes with defaults)
                    :color    (get-view-prop* :logseq.color)
                    :headers  (get-view-prop* :logseq.table.headers "none")
                    :borders? (get-view-prop* :logseq.table.borders true)
                    :compact? (get-view-prop* :logseq.table.compact false)
                    :hover    (get-view-prop* :logseq.table.hover "cell")
                    :stripes? (get-view-prop* :logseq.table.stripes false)
                    :gray     (color->gray (get-in context [:config :logseq.color])) 
                    :columns  (get-columns block data)

                    ; non configurable properties
                    :cell-hover cell-hover
                    :cell-focus cell-focus
                    :cursor (or (not-empty cell-focus) (not-empty cell-hover))
                    :dynamic-widths dynamic-widths
                    :render-cell (partial render-cell-in-context context)
                    :set-cell-hover set-cell-hover
                    :set-cell-focus set-cell-focus
                    :total-rows (reduce + 0 (map count data))} 

        ;; The total table width has to account for the borders and the padding 
        ;; everything is tracked in rems, except for the border, since it's so small
        cell-padding-width (* 2 (if (:compact? table-opts) CELL_PADDING_COMPACT CELL_PADDING))
        total-border-width (* (count (:columns table-opts)) BORDER_WIDTH)
        total-table-width (->> (vals dynamic-widths) 
                               (map (partial + cell-padding-width)) 
                               (reduce + 0)  
                               (util/rem->px)
                               (+ total-border-width)) 
        total-max-col-width (-> (count (:columns table-opts))
                                (* MAX_WIDTH)
                                (util/rem->px)
                                (+ total-border-width))

        ;; The table is actually rendered differently when it needs to be scrollable. 
        ;; Keep track of whether the ideal table size overflows it's container size, 
        ;; and provide a handler to be called whenever the container width changes 
        [table-overflow? table-underflow? handle-root-width-change] (use-table-flow-at-width total-table-width total-max-col-width)

        ;; Because the data may come in a different order than it should be presented, 
        ;; we need to distinguish between these and provide a conversion. 
        ;; The order the data is stored in is referred to as the cell order.
        ;; The order the data is displayed as is referred to as the col order.
        ;; Since these are called on every render of every cell, and are not dynamic, they are computed up front
        cell-col-map (->> (ffirst data) 
                          (map-indexed (juxt #(identity %1) 
                                             #(.indexOf (:columns table-opts) (.toLowerCase (last-str %2)))))
                          (remove (comp #{-1} second))
                          (into {}))

        ;; There are a couple more computed table properties that are best calculated 
        ;; after the initial object is creaated
        table-opts (assoc table-opts :total-cols (count (:columns table-opts))
                                     :total-table-width total-table-width
                                     :table-overflow? table-overflow?
                                     :table-underflow? table-underflow?
                                     :cell-col-map cell-col-map)]
    ; (js/console.log "shui table opts context" (clj->js context)) 
    ; (js/console.log "shui table opts" (clj->js table-opts)) 
    ; (js/console.log "shui table opts" (pr-str table-opts)) 
    ;; Scrollable Container: if the table is larger than the container, manage the scrolling effects here
    (table-scrollable-overflow handle-root-width-change
     ;; Grid Container: control the outermost table related element (border radius, grid, etc)
     (table-container table-opts
      ;; Gradient Accent: the accent color at the top of the application
      (when (:color table-opts)
        (table-gradient-accent table-opts))
      ;; Rows: the actual table rows
      (for [[group-index group-row-index row-index _group row] (map-with-all-indices data)
            :let [show-separator? (and (= 0 group-row-index) (< 1 group-index))
                  opts (assoc table-opts :group-index group-index 
                                         :group-row-index group-row-index 
                                         :row-index row-index 
                                         :show-separator? show-separator?)]]
          (if (= 0 group-index)
            ;; Table Header: Rows in the first section are rendered as headers
            ^{:key row-index} (table-header-row handle-cell-width-change row opts)
            ;; Table Body: The rest of the data is rendered as cells
            ^{:key row-index} (table-data-row handle-cell-width-change row opts)))))))

