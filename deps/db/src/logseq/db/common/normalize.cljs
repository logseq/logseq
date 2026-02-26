(ns logseq.db.common.normalize
  "Normalize && denormalize eid for sync"
  (:require [datascript.core :as d]))

(defn remove-retract-entity-ref
  [db tx-data]
  (let [retracted (-> (keep (fn [[op value]]
                              (when (and (= op :db/retractEntity)
                                         (nil? (d/entity db value)))
                                value)) tx-data)
                      set)
        retract-uuids (set (map second retracted))
        retracted-ids (into retract-uuids
                            ;; handle temp ids
                            (map str retract-uuids))]
    (if (seq retracted)
      (remove (fn [item]
                (and (= 5 (count item))
                     (or
                      (contains? retracted (second item))
                      (contains? retracted-ids (second item))
                      (contains? retracted (nth item 3))
                      (contains? retracted-ids (nth item 3))))) tx-data)
      tx-data)))

(defn replace-attr-retract-with-retract-entity-v2
  [db normalized-tx-data]
  (->> normalized-tx-data
       (map (fn [[op eid a v t]]
              (cond
                (and (= op :db/retract) (= a :block/uuid))
                [:db/retractEntity eid]
                (and a (some? v))
                [op eid a v t]
                :else
                [op eid])))
       (remove-retract-entity-ref db)))

(defn replace-attr-retract-with-retract-entity
  [db-after tx-data]
  (let [e-datoms (->> (group-by first tx-data)
                      (sort-by first))]
    (mapcat
     (fn [[_e datoms]]
       (if-let [d (some (fn [d]
                          (when (and (= :block/uuid (:a d))
                                     (false? (:added d))
                                     (nil? (d/entity db-after [:block/uuid (:v d)])))
                            d)) datoms)]  ; retract entity
         [[:db/retractEntity [:block/uuid (:v d)]]]
         datoms))
     e-datoms)))

(defn eid->lookup
  [db e]
  (when-let [entity (d/entity db e)]
    (if-let [id (:block/uuid entity)]
      [:block/uuid id]
      (:db/ident entity))))

(defn eid->tempid
  [db e]
  (when-let [entity (d/entity db e)]
    (when-let [id (if-let [id (:block/uuid entity)]
                    id
                    (:db/ident entity))]
      (str id))))

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

(defn remove-conflict-datoms
  [datoms]
  (->> datoms
       (group-by (fn [d] (take 4 d))) ; group by '(e a v tx)
       (keep (fn [[_eavt same-eavt-datoms]]
               (first (rseq same-eavt-datoms))))
       ;; sort by :tx, use nth to make this fn works on both vector and datom
       (sort-by #(nth % 3))))

(defn normalize-tx-data
  [db-after db-before tx-data]
  (let [title-updated-entities
        (->> tx-data
             (keep (fn [d]
                     (when (= (count d) 5)
                       (let [[e a _v _t added] d]
                         (when (and added (= :block/title a))
                           e)))))
             set)]
    (->> tx-data
         remove-conflict-datoms
         (replace-attr-retract-with-retract-entity db-after)
         sort-datoms
         (keep
          (fn [d]
            (if (= (count d) 5)
              (let [[e a v t added] d
                    retract? (not added)
                    drop-retract?
                    (and retract?
                         (or (contains? #{:block/created-at :block/updated-at} a)
                             (and (= :block/title a)
                                  (contains? title-updated-entities e))))]
                (when-not drop-retract?
                  (let [e' (if retract?
                             (eid->lookup db-before e)
                             (or (eid->lookup db-before e)
                                 (eid->tempid db-after e)))
                        v' (if (and (integer? v)
                                    (pos? v)
                                    (or (= :db.type/ref (:db/valueType (d/entity db-after a)))
                                        (= :db.type/ref (:db/valueType (d/entity db-before a)))))
                             (if retract?
                               (eid->lookup db-before v)
                               (or (eid->lookup db-before v)
                                   (eid->tempid db-after v)))
                             v)]
                    (when (and (some? e') (some? v'))
                      (if added
                        [:db/add e' a v' t]
                        [:db/retract e' a v' t])))))
              d)))
         (remove-retract-entity-ref db-after)
         distinct)))
