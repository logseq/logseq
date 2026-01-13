(ns logseq.db-sync.order
  (:require [datascript.core :as d]
            [logseq.db.common.order :as db-order]))

(defn fix-duplicate-orders! [conn tx-data]
  (let [db @conn
        updates (->> tx-data
                     (filter (fn [[e a v _tx added]] (and (= a :block/order) added e v))))
        groups (group-by (fn [{:keys [e v]}]
                           (let [parent (:block/parent (d/entity db e))]
                             [(:db/id parent) v]))
                         updates)
        fixes (reduce-kv
               (fn [acc [parent-eid value] group]
                 (if (and parent-eid value)
                   (let [update-eids (->> group (map :e) sort vec)
                         siblings (d/datoms db :avet :block/parent parent-eid)
                         update-eids-set (set update-eids)
                         existing-same (->> siblings
                                            (keep (fn [datom]
                                                    (let [sib-eid (:e datom)]
                                                      (when (and (not (contains? update-eids-set sib-eid))
                                                                 (= value (:block/order (d/entity db sib-eid))))
                                                        sib-eid)))))
                         need-fix? (or (seq existing-same)
                                       (> (count update-eids) 1))]
                     (if need-fix?
                       (let [orders (->> siblings
                                         (keep (fn [d]
                                                 (let [sib-eid (:e d)]
                                                   (when-not (contains? update-eids-set sib-eid)
                                                     (:block/order (d/entity db sib-eid)))))))
                             end (some (fn [order]
                                         (when (> (compare order value) 0)
                                           order))
                                       orders)
                             new-orders (db-order/gen-n-keys (count update-eids) value end)]
                         (into acc
                               (map-indexed (fn [idx id]
                                              [:db/add id :block/order (nth new-orders idx)])
                                            update-eids)))
                       acc))
                   acc))
               []
               groups)]
    (when (seq fixes)
      (d/transact! conn fixes {:op :fix-duplicate-order}))))
