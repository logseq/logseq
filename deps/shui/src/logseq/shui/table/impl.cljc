(ns logseq.shui.table.impl
  "Table impl")

(defn column-id
  [column]
  (assert (some? (:id column)) "No id specified for this column")
  (:id column))

(defn column-visible?
  [column visible-columns]
  (let [value (get visible-columns (column-id column))]
    (not (false? value))))

(defn visible-columns
  [columns visible-columns']
  (filter #(column-visible? % visible-columns') columns))

(defn rows
  [{:keys [row-filter]
    :as opts}]
  (let [rows' (:rows opts)]
    (if row-filter (filter row-filter rows') rows')))
