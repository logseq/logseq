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

(defn sort-rows
  "Support multiple sorts"
  [rows sorting columns]
  (let [column-id->get-value (zipmap (map column-id columns)
                                     (map :get-value-for-sort columns))]
    (loop [[sorting-item & other-sorting] (reverse sorting)
           rows rows]
      (if sorting-item
        (let [{:keys [id asc?]} sorting-item
              rows' (sort-by
                     (fn [row]
                       (let [sort-value (or (get column-id->get-value id)
                                            (let [valid-type? (some-fn number? string? boolean?)]
                                              ;; need to check value type, otherwise `compare` can be failed,
                                              ;; then crash the UI.
                                              (fn [row]
                                                (let [v (get row id)]
                                                  (when (valid-type? v)
                                                    v)))))]
                         (sort-value row)))
                     (if asc? compare #(compare %2 %1))
                     rows)]
          (recur other-sorting rows'))
        rows))))

(comment
  (def columns [{:id :author}
                {:id :published-year}])
  (def sorting [{:id :published-year :asc? true}
                {:id :author :asc? false}])
  (def rows [{:id :author-1
              :author "Charlie"
              :published-year 2014}
             {:id :author-2
              :author "Tienson"
              :published-year 2014}
             {:id :author-2
              :author "Zhiyuan"
              :published-year 2020}])
  (sort-rows rows sorting columns))

(defn rows
  [{:keys [row-filter]
    :as opts}]
  (let [rows' (:rows opts)]
    (if row-filter (filter row-filter rows') rows')))
