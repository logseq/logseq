(ns logseq.db-sync.order
  (:require [datascript.core :as d]
            [logseq.db.common.order :as db-order]))

(defn- parent-order-fixes
  [db parent-eid values]
  (let [siblings-by-order (->> (d/datoms db :avet :block/parent parent-eid)
                              (keep (fn [datom]
                                      (let [sibling (d/entity db (:e datom))]
                                        (when (:block/order sibling)
                                          sibling))))
                              (group-by :block/order))]
    (reduce
     (fn [acc [value end]]
       (let [siblings (get siblings-by-order value)]
         (if (and (contains? values value) (> (count siblings) 1))
           (let [same-order-siblings (sort-by :block/uuid siblings)
                 ;; Generate the open-ended sequence incrementally to avoid repeated tail scans.
                 new-orders (if end
                              (db-order/gen-n-keys (count siblings) value end)
                              (rest (reductions (fn [previous _]
                                                  (db-order/gen-key previous nil))
                                                value
                                                siblings)))]
             (into acc (map (fn [sibling order]
                             [:db/add (:db/id sibling) :block/order order])
                           same-order-siblings new-orders)))
           acc)))
     []
     ;; Adjacent distinct orders keep all repairs inside disjoint snapshot intervals.
     (partition-all 2 1 (sort (keys siblings-by-order))))))

(defn fix-duplicate-orders! [conn tx-data tx-meta]
  (let [db @conn
        values-by-parent (reduce
                          (fn [acc {:keys [e a v added]}]
                            (if (and (= a :block/order) added e v)
                              (let [block (d/entity db e)
                                    parent-eid (:db/id (:block/parent block))]
                                (if (and (:block/uuid block) parent-eid)
                                  (update acc parent-eid (fnil conj #{}) v)
                                  acc))
                              acc))
                          {}
                          tx-data)
        fixes (reduce-kv (fn [acc parent-eid values]
                           (into acc (parent-order-fixes db parent-eid values)))
                         []
                         values-by-parent)]
    (when (seq fixes)
      (d/transact! conn fixes (merge tx-meta {:op :fix-duplicate-order})))))
