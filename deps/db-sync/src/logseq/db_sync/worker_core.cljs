(ns logseq.db-sync.worker-core
  (:require [datascript.core :as d]
            [logseq.db.common.order :as db-order]))

(defn- normalize-eid [db entity]
  (cond
    (number? entity) (when (pos? entity) entity)
    (vector? entity) (d/entid db entity)
    (uuid? entity) (d/entid db [:block/uuid entity])
    (keyword? entity) (d/entid db [:db/ident entity])
    :else nil))

(defn- attr-updates-from-tx [db tx-data attr]
  (keep (fn [tx]
          (cond
            (and (vector? tx)
                 (= :db/add (first tx))
                 (= attr (nth tx 2 nil)))
            (let [eid (normalize-eid db (nth tx 1 nil))]
              (when eid
                {:e eid
                 :a attr
                 :v (nth tx 3 nil)}))

            (and (map? tx) (contains? tx attr))
            (let [entity (or (:db/id tx) (:block/uuid tx) (:db/ident tx))
                  eid (normalize-eid db entity)]
              (when eid
                {:e eid
                 :a attr
                 :v (get tx attr)}))

            :else nil))
        tx-data))

(defn fix-duplicate-orders! [conn tx-data]
  (let [db @conn
        updates (->> (attr-updates-from-tx db tx-data :block/order)
                     (filter (fn [{:keys [e v]}] (and e v))))
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
