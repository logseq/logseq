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

(def ^:private encrypted-attrs
  #{:block/title :block/name})

(defn- drop-conflicted-encrypted-retracts
  "When encrypted tx data is decrypted, old/new ciphertexts can collapse to the
   same plaintext value. A valid pair like
   [:db/retract e :block/title old-cipher] + [:db/add e :block/title new-cipher]
   may become a same-key add/retract pair. Keep the add, drop the retract."
  [tx-data]
  (let [conflicted-keys (->> tx-data
                             (keep (fn [item]
                                     (when (and (vector? item)
                                                (<= 4 (count item))
                                                (contains? entity-op-kinds (first item))
                                                (contains? encrypted-attrs (nth item 2)))
                                       {:op (first item)
                                        :k [(second item) (nth item 2) (nth item 3)]})))
                             (group-by :k)
                             (keep (fn [[k entries]]
                                     (let [ops (set (map :op entries))]
                                       (when (and (contains? ops :db/add)
                                                  (contains? ops :db/retract))
                                         k))))
                             set)]
    (if (empty? conflicted-keys)
      tx-data
      (remove (fn [item]
                (and (vector? item)
                     (<= 4 (count item))
                     (= :db/retract (first item))
                     (contains? conflicted-keys
                                [(second item) (nth item 2) (nth item 3)])))
              tx-data))))

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
         tx-data* (drop-conflicted-encrypted-retracts tx-data*)
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
