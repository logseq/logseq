(ns frontend.components.page-window)

(defn- row-id
  [row]
  (or (:block/uuid row) (:db/id row)))

(defn- merge-row
  [current incoming]
  (if (contains? incoming :block/title)
    incoming
    (merge current incoming)))

(defn merge-layout
  [current incoming]
  (if-not current
    incoming
    (let [current-rows (into {} (map (juxt row-id identity) (:rows current)))]
      (-> incoming
          (update :rows (fn [rows]
                          (mapv #(merge-row (get current-rows (row-id %)) %) rows)))))))
