(ns logseq.db-sync.order
  (:require [datascript.core :as d]
            [logseq.db.common.order :as db-order]))

(defn fix-duplicate-orders! [conn tx-data tx-meta]
  (let [db @conn
        updates (->> tx-data
                     (filter (fn [[e a v _tx added]] (and (= a :block/order) added e v))))
        groups (group-by (fn [{:keys [e v]}]
                           (let [parent (:block/parent (d/entity db e))]
                             [(:db/id parent) v]))
                         updates)
        fixes (reduce-kv
               (fn [acc [parent-eid value] _group]
                 (if (and parent-eid value)
                   (let [siblings (d/datoms db :avet :block/parent parent-eid)
                         existing-same (->> siblings
                                            (keep (fn [datom]
                                                    (let [sib-eid (:e datom)]
                                                      (when (= value (:block/order (d/entity db sib-eid)))
                                                        sib-eid)))))
                         same-order-siblings (->> (map (fn [id] (d/entity db id)) existing-same)
                                                  (sort-by :block/uuid))
                         need-fix? (> (count same-order-siblings) 1)]
                     (if need-fix?
                       (let [orders (->> siblings
                                         (keep (fn [d]
                                                 (let [sib-eid (:e d)]
                                                   (:block/order (d/entity db sib-eid))))))
                             end (some (fn [order]
                                         (when (> (compare order value) 0)
                                           order))
                                       orders)
                             new-orders (db-order/gen-n-keys (count same-order-siblings) value end)]
                         (into acc
                               (map-indexed (fn [idx id]
                                              [:db/add id :block/order (nth new-orders idx)])
                                            (map :db/id same-order-siblings))))
                       acc))
                   acc))
               []
               groups)]
    (when (seq fixes)
      (d/transact! conn fixes (merge tx-meta {:op :fix-duplicate-order})))))
