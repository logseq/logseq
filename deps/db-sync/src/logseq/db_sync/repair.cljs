(ns logseq.db-sync.repair
  "Builds db-sync repair transactions for missing block entities."
  (:require [datascript.core :as d]))

(defn- block-temp-id
  [block-uuid]
  (str "repair-block-" block-uuid))

(defn- ref-attr?
  [db attr]
  (= :db.type/ref (get-in (d/schema db) [attr :db/valueType])))

(defn- repair-ref-value
  [db repair-uuid-set attr value]
  (if-let [entity (and (ref-attr? db attr)
                       (number? value)
                       (d/entity db value))]
    (if-let [block-uuid (:block/uuid entity)]
      (if (contains? repair-uuid-set block-uuid)
        (block-temp-id block-uuid)
        [:block/uuid block-uuid])
      (or (:db/ident entity) value))
    value))

(defn block-tx-data
  [db repair-uuid-set block-uuid]
  (when-let [eid (d/entid db [:block/uuid block-uuid])]
    (->> (d/datoms db :eavt eid)
         (mapv (fn [datom]
                 [:db/add
                  (block-temp-id block-uuid)
                  (:a datom)
                  (repair-ref-value db repair-uuid-set (:a datom) (:v datom))])))))

(defn tx-data
  [db block-uuids]
  (let [block-uuids* (vec (distinct block-uuids))
        repair-uuid-set (set block-uuids*)]
    (->> block-uuids*
         (mapcat (partial block-tx-data db repair-uuid-set))
         vec)))
