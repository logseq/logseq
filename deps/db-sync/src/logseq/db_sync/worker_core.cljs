(ns logseq.db-sync.worker-core
  (:require [datascript.core :as d]
            [logseq.db.common.order :as db-order]))

(defn- attr-updates-from-tx [tx-data attr]
  (filter (fn [d] (= attr (:a d))) tx-data))

(defn fix-duplicate-orders [db tx-data]
  (let [updates (attr-updates-from-tx tx-data :block/order)
        fixes (reduce
               (fn [acc d]
                 (let [eid (:e d)
                       value (:v d)
                       parent (when eid (:block/parent (d/entity db eid)))
                       parent-eid (:db/id parent)]
                   (if (and eid parent-eid value)
                     (let [siblings (d/datoms db :avet :block/parent parent-eid)
                           same-order-siblings (-> (filter
                                                    (fn [datom]
                                                      (let [sib-eid (:e datom)]
                                                        (when (and (not= sib-eid eid)
                                                                   (= value (:block/order (d/entity db sib-eid))))
                                                          sib-eid)))
                                                    siblings)
                                                   sort
                                                   vec)
                           orders (map (fn [d] (:block/order (d/entity db (:e d)))) siblings)
                           start (some (fn [order] (when (< order value) order)) orders)
                           end (some (fn [order] (when (> order value) order)) orders)]
                       (if same-order-siblings
                         (let [orders (db-order/gen-n-keys (inc (count same-order-siblings)) start end)]
                           (into acc
                                 (map-indexed (fn [idx id] [:db/add id :block/order (nth orders idx)]) (conj same-order-siblings eid))))
                         acc))
                     acc)))
               []
               updates)]
    (if (seq fixes)
      (into tx-data fixes)
      tx-data)))
