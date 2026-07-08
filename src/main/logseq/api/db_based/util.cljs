(ns logseq.api.db-based.util
  "Shared helpers for DB-based API namespaces.")

(defn remove-hidden-properties
  "Given an entity map, remove properties that shouldn't be returned in api calls."
  [m]
  (->> (remove (fn [[k _v]]
                 (or (= "block.temp" (namespace k))
                     (contains? #{:block/tx-id} k))) m)
       (into {})))

(defn summarize-upsert-operations
  [operations {:keys [dry-run]}]
  (let [counts (reduce (fn [acc op]
                         (let [entity-type (keyword (:entityType op))
                               operation-type (keyword (:operation op))]
                           (update-in acc [operation-type entity-type] (fnil inc 0))))
                       {}
                       operations)]
    (str (if dry-run "Dry run: " "")
         (when (counts :add)
           (str "Added: " (pr-str (counts :add)) "."))
         (when (counts :edit)
           (str " Edited: " (pr-str (counts :edit)) ".")))))
