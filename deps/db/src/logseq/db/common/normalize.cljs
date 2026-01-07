(ns logseq.db.common.normalize
  "Normalize && denormalize eid for sync"
  (:require [datascript.core :as d]))

(defn normalize-tx-data
  [db-after db-before tx-data]
  (->> tx-data
       (map
        (fn [[e a v _t added]]
          (let [e' (if-let [entity (d/entity db-before e)]
                     (if-let [id (:block/uuid entity)]
                       [:block/uuid id]
                       (:db/ident entity))
                     (- e))
                v' (if (and (integer? v)
                            (or (= :db.type/ref (:db/valueType (d/entity db-after a)))
                                (= :db.type/ref (:db/valueType (d/entity db-before a)))))
                     (if-let [entity (d/entity db-before v)]
                       (if-let [id (:block/uuid entity)]
                         [:block/uuid id]
                         (:db/ident entity))
                       (- v))
                     v)]
            (when (and (not added)
                       (number? e')
                       (neg-int? e'))
              (throw (ex-info "temp id shouldn't be used in :db/retract"
                              {:datom [e a v added]
                               :e' e'})))
            (if added
              [:db/add e' a v']
              [:db/retract e' a v']))))))

(defn- lookup-id?
  [v]
  (and (vector? v)
       (= 2 (count v))
       (= (first v) :block/uuid)
       (uuid? (second v))))

(defn de-normalize-tx-data
  [db tx-data]
  (keep
   (fn [[op e a v]]
     (let [e' (if (lookup-id? e)
                (:db/id (d/entity db e))
                e)
           v' (if (lookup-id? v)
                (:db/id (d/entity db v))
                v)]
       (when (and e' v')
         [op e' a v'])))
   tx-data))
