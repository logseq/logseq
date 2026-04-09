(ns logseq.db-sync.tx-sanitize
  (:require [clojure.set :as set]
            [datascript.core :as d]
            [logseq.db :as ldb]))

(def ^:private retract-entity-ops
  #{:db/retractEntity :db.fn/retractEntity})

(defn- retract-entity-op?
  [item]
  (and (vector? item)
       (= 2 (count item))
       (contains? retract-entity-ops (first item))))

(defn- entity-ref->eid
  [db entity-ref]
  (cond
    (and (number? entity-ref) (neg? entity-ref))
    nil

    :else
    (try
      (some-> (d/entity db entity-ref) :db/id)
      (catch :default _
        nil))))

(def ^:private entity-op-kinds
  #{:db/add :db/retract :db/cas :db.fn/cas})

(defn- touched-entity-eid
  [db item]
  (cond
    (and (map? item) (contains? item :db/id))
    (entity-ref->eid db (:db/id item))

    (and (map? item) (contains? item :block/uuid))
    (entity-ref->eid db [:block/uuid (:block/uuid item)])

    (and (vector? item)
         (contains? entity-op-kinds (first item))
         (<= 4 (count item)))
    (entity-ref->eid db (second item))

    :else
    nil))

(defn sanitize-tx
  ([db tx-data]
   (sanitize-tx db tx-data nil))
  ([db tx-data {:keys [drop-missing-retract-ops?]
                :or {drop-missing-retract-ops? false}}]
   (let [tx-data* (cond->> tx-data
                    drop-missing-retract-ops?
                    (remove (fn [item]
                              (and (retract-entity-op? item)
                                   (nil? (entity-ref->eid db (second item)))))))
         tx-data* (vec tx-data*)
         retract-eids (->> tx-data*
                           (keep (fn [item]
                                   (when (retract-entity-op? item)
                                     (entity-ref->eid db (second item)))))
                           set)
         touched-eids (->> tx-data*
                           (remove retract-entity-op?)
                           (keep (partial touched-entity-eid db))
                           set)
         descendant-retract-eids (->> retract-eids
                                      (mapcat (fn [eid]
                                                (let [entity (d/entity db eid)]
                                                  (when (:block/uuid entity)
                                                    (ldb/get-block-full-children-ids db eid)))))
                                      set)
         missing-retract-eids (sort (set/difference descendant-retract-eids retract-eids touched-eids))]
     (cond-> tx-data*
       (seq missing-retract-eids)
       (into (map (fn [eid] [:db/retractEntity eid]) missing-retract-eids))))))
