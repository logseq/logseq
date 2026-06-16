(ns logseq.db-sync.repair
  "Builds db-sync repair transactions for missing block entities."
  (:require [datascript.core :as d]))

(defn- block-temp-id
  [block-uuid]
  (str "repair-block-" block-uuid))

(defn- ref-attr?
  [db attr]
  (= :db.type/ref
     (or (get-in (d/schema db) [attr :db/valueType])
         (:db/valueType (d/entity db attr)))))

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

(defn- lookup-ref-block-uuid
  [value]
  (when (and (vector? value)
             (= :block/uuid (first value))
             (uuid? (second value)))
    (second value)))

(defn- missing-dependency-uuids
  [tx-data seen]
  (->> tx-data
       (keep (fn [[_op _e _attr value]]
               (lookup-ref-block-uuid value)))
       (remove seen)
       distinct
       vec))

(defn- block-uuids-with-dependencies
  [db block-uuids]
  (loop [pending (vec (distinct block-uuids))
         seen #{}
         ordered []]
    (if (seq pending)
      (let [seen' (into seen pending)
            tx-data (mapcat (partial block-tx-data db seen') pending)
            deps (missing-dependency-uuids tx-data seen')]
        (recur deps seen' (into ordered pending)))
      ordered)))

(defn tx-data
  [db block-uuids]
  (let [block-uuids* (block-uuids-with-dependencies db block-uuids)
        repair-uuid-set (set block-uuids*)]
    (->> block-uuids*
         (mapcat (partial block-tx-data db repair-uuid-set))
         vec)))
