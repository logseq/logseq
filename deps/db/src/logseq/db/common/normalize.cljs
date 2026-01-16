(ns logseq.db.common.normalize
  "Normalize && denormalize eid for sync"
  (:require [datascript.core :as d]))

(defn- remove-retract-entity-ref
  [tx-data]
  (let [retracted (-> (keep (fn [[op value]]
                              (when (= op :db.fn/retractEntity)
                                value)) tx-data)
                      set)]
    (if (seq retracted)
      (remove (fn [item]
                (and (= :db/retract (first item))
                     (= 4 (count item))
                     (contains? retracted (last item)))) tx-data)
      tx-data)))

(defn replace-attr-retract-with-retract-entity-v2
  [normalized-tx-data]
  (->
   (map (fn [[op eid a v]]
          (cond
            (and (= op :db/retract) (= a :block/uuid))
            [:db.fn/retractEntity eid]
            (and a (some? v))
            [op eid a v]
            :else
            [op eid]))
        normalized-tx-data)
   remove-retract-entity-ref))

(defn- replace-attr-retract-with-retract-entity
  [tx-data]
  (let [e-datoms (->> (group-by first tx-data)
                      (sort-by first))]
    (mapcat
     (fn [[_e datoms]]
       (if-let [d (some (fn [d]
                          (when (and (= :block/uuid (:a d)) (false? (:added d)))
                            d)) datoms)]  ; retract entity
         [[:db.fn/retractEntity [:block/uuid (:v d)]]]
         datoms))
     e-datoms)))

(defn eid->lookup
  [db e]
  (when-let [entity (d/entity db e)]
    (if-let [id (:block/uuid entity)]
      [:block/uuid id]
      (:db/ident entity))))

(defn- sort-datoms
  "Properties first"
  [datoms]
  (sort-by
   (fn [item]
     (case (nth item 1)
       :db/ident
       0
       :db/valueType
       1
       :db/cardinality
       2
       3))
   datoms))

(defn normalize-tx-data
  [db-after db-before tx-data]
  (->> tx-data
       replace-attr-retract-with-retract-entity
       sort-datoms
       (keep
        (fn [d]
          (if (= (count d) 5)
            (let [[e a v _t added] d
                  retract? (not added)
                  e' (if retract?
                       (eid->lookup db-before e)
                       (or (eid->lookup db-before e)
                           (- e)))
                  v' (if (and (integer? v)
                              (pos? v)
                              (or (= :db.type/ref (:db/valueType (d/entity db-after a)))
                                  (= :db.type/ref (:db/valueType (d/entity db-before a)))))
                       (if retract?
                         (eid->lookup db-before v)
                         (or (eid->lookup db-before v)
                             (- v)))
                       v)]
              (when (and (some? e') (some? v'))
                (if added
                  [:db/add e' a v']
                  [:db/retract e' a v'])))
            d)))
       remove-retract-entity-ref
       distinct))
