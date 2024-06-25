(ns logseq.shui.table.core
  "Table"
  (:require [logseq.shui.table.impl :as impl]
            [rum.core :as rum]))

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
    (seq (:selected-ids row-selection))
    (and (seq (:exclude-ids row-selection))
         (not= (count rows) (count (:exclude-ids row-selection)))))))

(defn- toggle-selected-all!
  [value set-row-selection!]
  (if value
    (set-row-selection! {:selected-all? value})
    (set-row-selection! {})))

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

(defn- column-toggle-sorting!
  [column set-sorting! sorting]
  (let [id (:id column)
        existing-column (some (fn [item] (when (= (:id item) id) item)) sorting)
        value' (if existing-column
                 (mapv (fn [item] (when (= (:id item) id) (update item :asc? not))) sorting)
                 (conj (if (vector? sorting) sorting (vec sorting)) {:id id :asc? true}))]
    (set-sorting! value')))

(defn get-selection-rows-count
  [row-selection rows]
  (if (:selected-all? row-selection)
    (- (count rows) (count (:excluded-ids row-selection)))
    (count (:selected-ids row-selection))))

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
           :column-toggle-visiblity (fn [column v] (set-visible-columns! (assoc visible-columns (impl/column-id column) v)))
           :selected-all? (:selected-all? row-selection)
           :selected-some? (select-some? row-selection filtered-rows)
           :row-selected? (fn [row] (row-selected? row row-selection))
           :row-toggle-selected! (fn [row value] (row-toggle-selected! row value set-row-selection! row-selection))
           :toggle-selected-all! (fn [value] (toggle-selected-all! value set-row-selection!))
           :column-toggle-sorting! (fn [column] (column-toggle-sorting! column set-sorting! sorting)))))

(defn- get-prop-and-children
  [prop-and-children]
  (let [prop (when (map? (first prop-and-children)) (first prop-and-children))]
    (if prop
      [prop (rest prop-and-children)]
      [{} prop-and-children])))

(rum/defc table < rum/static
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)]
    [:table (merge {:class "w-full caption-bottom text-sm"}
                   prop)
     children]))

(rum/defc table-header < rum/static
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)]
    [:thead prop
     children]))

(rum/defc table-row < rum/static
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)]
    [:tr (merge {:class "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"}
                prop)
     children]))

(rum/defc table-head < rum/static
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)]
    [:th (merge {:class "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"}
                prop)
     children]))

(rum/defc table-body < rum/static
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)]
    [:tbody (merge {:class "[&_tr:last-child]:border-0"}
                   prop)
     children]))

(rum/defc table-cell < rum/static
  [& prop-and-children]
  (let [[prop children] (get-prop-and-children prop-and-children)]
    [:td (merge {:class "p-4 align-middle [&:has([role=checkbox])]:pr-0"}
                   prop)
     children]))
