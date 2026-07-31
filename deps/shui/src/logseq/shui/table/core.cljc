(ns logseq.shui.table.core
  "Table"
  (:require [clojure.set :as set]
            [dommy.core :refer-macros [sel1] :as dom]
            [frontend.util :as util]
            [goog.object :as gobj]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.table.impl :as impl]))

(defn- get-head-container
  []
  #_{:clj-kondo/ignore [:unresolved-namespace]}
  (if (and js/window (gobj/get js/window "isCapacitorNew"))
    (sel1 "ion-header")
    (sel1 "#head")))

(defn- row-selected?
  [row row-selection]
  (let [id (:db/id row)]
    (or
     (and (:selected-all? row-selection)
          ;; exclude ids
          (not (contains? (:excluded-ids row-selection) id)))
     (and (not (:selected-all? row-selection))
          ;; included ids
          (contains? (:selected-ids row-selection) id)))))

(defn- select-some?
  [row-selection rows]
  (or
   (and (seq (:selected-ids row-selection))
        (some (:selected-ids row-selection) rows))
   (and (seq (:excluded-ids row-selection))
        (not= (count rows) (count (:excluded-ids row-selection))))))

(defn- select-all?
  [row-selection rows]
  (and (seq (:selected-ids row-selection))
       (set/subset? (set rows)
                    (:selected-ids row-selection))))

(defn- toggle-selected-all!
  [table value set-row-selection!]
  (let [group-by-property (get-in table [:state :group-by-property])
        row-selection (get-in table [:state :row-selection])]
    (cond
      (and group-by-property value)
      (let [new-selection (update row-selection :selected-ids
                                  (fn [ids]
                                    (set/union (set ids) (set (:rows table)))))]
        (set-row-selection! new-selection))

      value
      (set-row-selection! {:selected-all? value})

      group-by-property
      (let [new-selection (update row-selection :selected-ids
                                  (fn [ids]
                                    (set/difference (set ids) (set (:rows table)))))]
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
  (let [id (:db/id row)
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
                       (into [{:id id :asc? asc?}] sorting)))
                   (remove nil?)
                   vec)]
    (set-sorting! value)
    value))

(defn get-selection-rows
  [row-selection rows]
  (if (:selected-all? row-selection)
    (let [excluded-ids (:excluded-ids row-selection)]
      (if (seq excluded-ids)
        (remove #(excluded-ids %) rows)
        rows))
    (let [selected-ids (:selected-ids row-selection)]
      (when (seq selected-ids)
        (filter #(selected-ids %) rows)))))

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
           :selected-all? (or (and (:selected-all? row-selection)
                                   (nil? (seq (:excluded-ids row-selection))))
                              (select-all? row-selection filtered-rows))
           :selected-some? (select-some? row-selection filtered-rows)
           :row-selected? (fn [row] (row-selected? row row-selection))
           :row-toggle-selected! (fn [row-selection row value] (row-toggle-selected! row value set-row-selection! row-selection))
           :toggle-selected-all! (fn [table value]
                                   (toggle-selected-all! table value set-row-selection!))
           :column-set-sorting! (fn [sorting column asc?] (column-set-sorting! column set-sorting! sorting asc?)))))

(defn- get-prop-and-children
  [prop-and-children]
  (let [prop (when (map? (first prop-and-children)) (first prop-and-children))]
    (if prop
      [prop (rest prop-and-children)]
      [{} prop-and-children])))

(hsx/defc table
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)]
    (into
     [:div (merge {:class "ls-table w-full caption-bottom text-sm table-fixed"}
                  prop)]
     children)))

(defn- remove-sticky-header
  []
  (let [existing-headings (dom/sel ".ls-fixed")]
    (doseq [node existing-headings]
      (dom/remove-class! node "ls-fixed"))))

(defn- use-sticky-element!
  [target-ref container enabled?]
  (hooks/use-effect!
   (fn []
     (when enabled?
       (let [^js/HTMLElement target (hooks/deref target-ref)
             ^js/HTMLElement container (or (.closest target ".sidebar-item-list") container)
             ^js/HTMLElement table-el (.closest target ".ls-table-rows")]
         (when (and container table-el)
         (let [^js/DOMTokenList target-cls (.-classList target)
               ^js/HTMLElement table-footer (some-> table-el (.querySelector ".ls-table-footer"))
               ^js/HTMLElement page-el (.closest target ".page-inner")
               *el-top (volatile! (-> target (.getBoundingClientRect) (.-top)))
               head-height (-> (get-head-container) (.-offsetHeight))
               update-target-top! (fn []
                                    (when (not (.contains target-cls "ls-fixed"))
                                      (vreset! *el-top (+ (-> target (.getBoundingClientRect) (.-top))
                                                          (.-scrollTop container)))))
               update-footer! (fn []
                                (let [tw (.-scrollWidth table-el)]
                                  (when (and table-footer (number? tw) (> tw 0))
                                    (set! (. (.-style table-footer) -width) (str tw "px")))))
               update-target! (fn []
                                (if (.contains target-cls "ls-fixed")
                                  (let [^js/DOMRect rect (-> table-el (.getBoundingClientRect))
                                        width (.-clientWidth table-el)
                                        left (.-left rect)]
                                    (set! (. (.-style target) -width) (str width "px"))
                                    (set! (. (.-style target) -left) (str left "px")))
                                  (do
                                    (set! (. (.-style target) -width) "auto")
                                    (set! (. (.-style target) -left) "0px")))
                                ;; update scroll
                                (set! (. target -scrollLeft) (.-scrollLeft table-el)))
               ;; target observer
               target-observe! (fn [_e]
                                 (let [first-visible-table (some #(when (util/el-visible-in-viewport? % true) %)
                                                                 (dom/sel container ".ls-table-rows"))]
                                   (when (= table-el first-visible-table)
                                     (let [table-bottom (.-bottom (.getBoundingClientRect table-el))
                                           table-top (.-top (.getBoundingClientRect table-el))]
                                       (if (and (< table-top head-height)
                                                (> table-bottom 100))
                                         (do
                                           (remove-sticky-header)
                                           (.add target-cls "ls-fixed"))
                                         (.remove target-cls "ls-fixed"))
                                       (update-target!)))))
               resize-observer (js/ResizeObserver. update-target!)
               page-resize-observer (js/ResizeObserver. (fn [] (update-target-top!)))]
           ;; events
           (.observe resize-observer container)
           (.observe resize-observer table-el)
           (some->> page-el (.observe page-resize-observer))
           (.addEventListener container "scroll" target-observe!)
           (.addEventListener table-el "scroll" update-target!)
           (.addEventListener table-el "resize" update-target!)
           (update-footer!)

           ;; teardown
           #(do (.removeEventListener container "scroll" target-observe!)
                (.disconnect resize-observer)
                (.disconnect page-resize-observer)))))))
   [enabled? container]))

(defn- mobile?
  []
  (when-let [user-agent js/navigator.userAgent]
    (re-find #"Mobi" user-agent)))

(hsx/defc table-header
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)
        el-ref (hooks/use-ref nil)
        _ (use-sticky-element! el-ref (:main-container prop) (not (mobile?)))]
    (into
     [:div.ls-table-header
      (merge {:class "border-y transition-colors bg-gray-01"
              :ref el-ref
              :style {:z-index 9}}
             (dissoc prop :main-container))]
     children)))

(hsx/defc table-footer
  [& children]
  (into [:div.ls-table-footer.fade-in.faster] children))

(hsx/defc table-row
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)]
    (into
     [:div.ls-table-row.ls-block.flex.flex-row.items-center
      (merge {:class "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-gray-01 items-stretch"}
             prop)]
     children)))

(hsx/defc table-cell
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)]
    [:div.ls-table-cell.flex.relative.h-full (dissoc prop :select? :add-property?)
     (into
      [:div {:class (str "flex align-middle w-full overflow-x-clip items-center"
                         (cond
                           (:select? prop)
                           " px-0"
                           (:add-property? prop)
                           ""
                           :else
                           " border-r px-2"))}]
      children)]))

(hsx/defc table-actions
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)
        el-ref (hooks/use-ref nil)]
    (into
     [:div.ls-table-actions.flex.flex-row.items-center.gap-1.bg-gray-01
      (merge {:ref el-ref
              :style {:z-index 101}}
             prop)]
     children)))
