(ns logseq.api.db-based.util
  "Shared helpers for DB-based API namespaces."
  (:require [clojure.walk :as walk]))

(defn with-embed-info
  [block]
  (let [target (or (:block/link block) (:link block))
        target-uuid (or (:block/uuid target) (:uuid target))]
    (if target-uuid
      (cond-> (assoc block :embed {:target_uuid (str target-uuid)
                                  :target_type (if (or (:block/name target) (:name target)) "page" "block")
                                  :target_title (or (:block/title target) (:title target))})
        (:block/link block)
        (assoc :block/link (select-keys target [:db/id :block/uuid :block/title :block/name])))
      block)))

(defn with-embed-info-tree
  [data]
  (walk/postwalk #(if (map? %) (with-embed-info %) %) data))

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
