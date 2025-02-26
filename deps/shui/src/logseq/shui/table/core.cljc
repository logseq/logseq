(ns logseq.shui.table.core
  "Table"
  (:require [clojure.set :as set]
            [dommy.core :refer-macros [sel1]]
            [logseq.shui.table.impl :as impl]
            [rum.core :as rum]))

(defn- get-head-container
  []
  (sel1 "#head"))

(defn- get-main-scroll-container
  []
  (sel1 "#main-content-container"))

(defn- row-selected?
  [row row-selection]
  (let [id (:id row)]
    (or
     (and (:selected-all? row-selection)
          ;; exclude ids
          (not (contains? (:excluded-ids row-selection) id)))
     (and (not (:selected-all? row-selection))
          ;; included ids
          (contains? (:selected-ids row-selection) id)))))

(defn- select-some?
  [row-selection rows]
  (boolean
   (or
    (and (seq (:selected-ids row-selection))
         (some (:selected-ids row-selection) (map :db/id rows)))
    (and (seq (:exclude-ids row-selection))
         (not= (count rows) (count (:exclude-ids row-selection)))))))

(defn- select-all?
  [row-selection rows]
  (and (seq (:selected-ids row-selection))
       (set/subset? (set (map :db/id rows))
                    (:selected-ids row-selection))))

(defn- toggle-selected-all!
  [table value set-row-selection!]
  (let [group-by-property (get-in table [:state :group-by-property])
        row-selection (get-in table [:state :row-selection])]
    (cond
      (and group-by-property value)
      (let [new-selection (update row-selection :selected-ids
                                  (fn [ids]
                                    (set/union (set ids) (set (map :db/id (:rows table))))))]
        (set-row-selection! new-selection))

      value
      (set-row-selection! {:selected-all? value})

      group-by-property
      (let [new-selection (update row-selection :selected-ids
                                  (fn [ids]
                                    (set/difference (set ids) (set (map :db/id (:rows table))))))]
        (set-row-selection! new-selection))

      :else
      (set-row-selection! {}))))

(defn- set-conj
  [col item]
  (if (seq col)
    (conj (if (set? col) col (set col)) item)
    (conj #{} item)))

(defn- row-toggle-selected!
  [row value set-row-selection! row-selection]
  (let [id (:id row)
        new-selection (if (:selected-all? row-selection)
                        (update row-selection :excluded-ids (if value disj set-conj) id)
                        (update row-selection :selected-ids (if value set-conj disj) id))]
    (set-row-selection! new-selection)))

(defn- column-set-sorting!
  [column set-sorting! sorting asc?]
  (let [id (:id column)
        existing-column (some (fn [item] (when (= (:id item) id) item)) sorting)
        value (->> (if existing-column
                     (if (nil? asc?)
                       (remove (fn [item] (= (:id item) id)) sorting)
                       (map (fn [item] (if (= (:id item) id) (assoc item :asc? asc?) item)) sorting))
                     (when-not (nil? asc?)
                       (conj (if (vector? sorting) sorting (vec sorting)) {:id id :asc? asc?})))
                   (remove nil?)
                   vec)]
    (set-sorting! value)
    value))

(defn get-selection-rows
  [row-selection rows]
  (if (:selected-all? row-selection)
    (let [excluded-ids (:excluded-ids row-selection)]
      (if (seq excluded-ids)
        (remove #(excluded-ids (:id %)) rows)
        rows))
    (let [selected-ids (:selected-ids row-selection)]
      (when (seq selected-ids)
        (filter #(selected-ids (:id %)) rows)))))

(defn table-option
  [{:keys [data columns state data-fns]
    :as option}]
  (let [{:keys [sorting row-filter row-selection visible-columns]} state
        {:keys [set-sorting! set-visible-columns! set-row-selection!]} data-fns
        columns' (impl/visible-columns columns visible-columns)
        filtered-rows (impl/rows {:rows data
                                  :columns columns
                                  :sorting sorting
                                  :row-filter row-filter})]
    (assoc option
           ;; visible columns
           :columns columns'
           ;; filtered rows
           :rows filtered-rows

           ;; fns
           :column-visible? (fn [column] (impl/column-visible? column visible-columns))
           :column-toggle-visibility (fn [column v] (set-visible-columns! (assoc visible-columns (impl/column-id column) v)))
           :selected-all? (or (:selected-all? row-selection)
                              (select-all? row-selection filtered-rows))
           :selected-some? (select-some? row-selection filtered-rows)
           :row-selected? (fn [row] (row-selected? row row-selection))
           :row-toggle-selected! (fn [row value] (row-toggle-selected! row value set-row-selection! row-selection))
           :toggle-selected-all! (fn [table value]
                                   (toggle-selected-all! table value set-row-selection!))
           :column-set-sorting! (fn [sorting column asc?] (column-set-sorting! column set-sorting! sorting asc?)))))

(defn- get-prop-and-children
  [prop-and-children]
  (let [prop (when (map? (first prop-and-children)) (first prop-and-children))]
    (if prop
      [prop (rest prop-and-children)]
      [{} prop-and-children])))

(rum/defc table < rum/static
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)]
    [:div (merge {:class "ls-table w-full caption-bottom text-sm table-fixed"}
                 prop)
     children]))

;; FIXME: ux
(defn- use-sticky-element!
  [^js/HTMLElement container target-ref]
  (rum/use-effect!
   (fn []
     (let [^js el (rum/deref target-ref)
           ^js cls (.-classList el)
           *ticking? (volatile! false)
           el-top (-> el (.getBoundingClientRect) (.-top))
           head-top (-> (get-head-container) (js/getComputedStyle) (.-height) (js/parseInt))
           translate (fn [offset]
                       (set! (. (.-style el) -transform) (str "translate3d(0, " offset "px , 0)"))
                       (if (zero? offset)
                         (.remove cls "translated")
                         (.add cls "translated")))
           *last-offset (volatile! 0)
           handle (fn []
                    (let [scroll-top (js/parseInt (.-scrollTop container))
                          offset (if (> (+ scroll-top head-top) el-top)
                                   (+ (- scroll-top el-top) head-top 1) 0)
                          offset (js/parseInt offset)
                          last-offset @*last-offset]
                      (if (and (not (zero? last-offset))
                               (not= offset last-offset))
                        (let [dir (if (neg? (- offset last-offset)) -1 1)]
                          (loop [offset' (+ last-offset dir)]
                            (translate offset')
                            (if (and (not= offset offset')
                                     (< (abs (- offset offset')) 100))
                              (recur (+ offset' dir))
                              (translate offset))))
                        (translate offset))
                      (vreset! *last-offset offset)))
           handler (fn [^js e]
                     (when (not @*ticking?)
                       (js/window.requestAnimationFrame
                        #(do (handle) (vreset! *ticking? false)))
                       (vreset! *ticking? true)))]
       (.addEventListener container "scroll" handler)
       #(.removeEventListener container "scroll" handler)))
   []))

;; FIXME: another solution for the sticky header
(defn- use-sticky-element2!
  [^js/HTMLDivElement target-ref]
  (rum/use-effect!
   (fn []
     (let [^js target (rum/deref target-ref)
           ^js container (or (.closest target ".sidebar-item-list") (get-main-scroll-container))
           ^js table (.closest target ".ls-table-rows")
           refs-table? (.closest table ".references")]
       (when (not refs-table?)
         (let [^js target-cls (.-classList target)
               ^js table-footer (some-> table (.querySelector ".ls-table-footer"))
               ^js page-el (.closest target ".page-inner")
               *ticking? (volatile! false)
               *el-top (volatile! (-> target (.getBoundingClientRect) (.-top)))
               head-height (-> (get-head-container) (js/getComputedStyle) (.-height) (js/parseInt))
               update-target-top! (fn []
                                    (when (not (.contains target-cls "ls-fixed"))
                                      (vreset! *el-top (+ (-> target (.getBoundingClientRect) (.-top))
                                                         (.-scrollTop container)))))
               update-footer! (fn []
                                (let [tw (.-scrollWidth table)]
                                  (when (and table-footer (number? tw) (> tw 0))
                                    (set! (. (.-style table-footer) -width) (str tw "px")))))
               update-target! (fn []
                                (if (.contains target-cls "ls-fixed")
                                  (let [^js rect (-> table (.getBoundingClientRect))
                                        width (.-clientWidth table)
                                        left (.-left rect)]
                                    (set! (. (.-style target) -width) (str width "px"))
                                    (set! (. (.-style target) -left) (str left "px")))
                                  (do
                                    (set! (. (.-style target) -width) "auto")
                                    (set! (. (.-style target) -left) "0px")))
                                ;; update scroll
                                (set! (. target -scrollLeft) (.-scrollLeft table)))
               ;; target observer
               target-observe! (fn []
                                 (let [scroll-top (js/parseInt (.-scrollTop container))
                                       table-in-top (+ scroll-top head-height)
                                       table-bottom (.-bottom (.getBoundingClientRect table))
                                       fixed? (and (> table-bottom (+ head-height 90))
                                                (> table-in-top @*el-top))]
                                   (if fixed?
                                     (.add target-cls "ls-fixed")
                                     (.remove target-cls "ls-fixed"))
                                   (update-target!)))
               target-observe-handle! (fn [^js _e]
                                        (when (not @*ticking?)
                                          (js/window.requestAnimationFrame
                                            #(do (target-observe!) (vreset! *ticking? false)))
                                          (vreset! *ticking? true)))
               resize-observer (js/ResizeObserver. update-target!)
               page-resize-observer (js/ResizeObserver. (fn [] (update-target-top!)))]
           ;; events
           (.observe resize-observer container)
           (.observe resize-observer table)
           (some->> page-el (.observe page-resize-observer))
           (.addEventListener container "scroll" target-observe-handle!)
           (.addEventListener table "scroll" update-target!)
           (.addEventListener table "resize" update-target!)
           (update-footer!)

           ;; teardown
           #(do (.removeEventListener container "scroll" target-observe!)
              (.disconnect resize-observer)
              (.disconnect page-resize-observer))))))
   []))

(rum/defc table-header < rum/static
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)
        el-ref (rum/use-ref nil)
        _ (use-sticky-element2! el-ref)]
    [:div.ls-table-header
     (merge {:class "border-y transition-colors bg-gray-01"
             :ref el-ref
             :style {:z-index 9}}
            prop)
     children]))

(rum/defc table-footer
  [children]
  [:div.ls-table-footer.fade-in.faster
   children])

(rum/defc table-row < rum/static
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)]
    [:div.ls-table-row.flex.flex-row.items-center (merge {:class "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-gray-01 items-stretch"}
                                                         prop)
     children]))

(rum/defc table-cell < rum/static
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)]
    [:div.flex.relative prop
     [:div {:class (str "flex align-middle w-full overflow-x-clip items-center"
                        (cond
                          (:select? prop)
                          " px-0"
                          (:add-property? prop)
                          ""
                          :else
                          " border-r px-2"))}
      children]]))

(rum/defc table-actions < rum/static
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)
        el-ref (rum/use-ref nil)
        ;; _ (use-sticky-element2! (get-main-scroll-container) el-ref)
        ]
    [:div.ls-table-actions.flex.flex-row.items-center.gap-1.bg-gray-01
     (merge {:ref el-ref
             :style {:z-index 101}}
            prop)
     children]))

(def table-sort-rows impl/sort-rows)
