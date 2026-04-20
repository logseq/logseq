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
  (let [entity-ref' (if (and (sequential? entity-ref)
                             (not (vector? entity-ref)))
                      (vec entity-ref)
                      entity-ref)]
    (cond
      (and (number? entity-ref') (neg? entity-ref'))
      nil

      :else
      (try
        (some-> (d/entity db entity-ref') :db/id)
        (catch :default _
          nil)))))

(def ^:private entity-op-kinds
  #{:db/add :db/retract :db/cas :db.fn/cas})

(def ^:private encrypted-attrs
  #{:block/title :block/name})

(def ^:private optional-missing-lookup-ref-attrs
  #{:logseq.property/created-by-ref
    :block/refs
    :block/tags})

(defn- tx-block-uuids
  [tx-data]
  (reduce (fn [acc item]
            (cond
              (and (map? item)
                   (uuid? (:block/uuid item)))
              (conj acc (:block/uuid item))

              (and (vector? item)
                   (<= 4 (count item))
                   (contains? entity-op-kinds (first item))
                   (= :block/uuid (nth item 2))
                   (uuid? (nth item 3)))
              (conj acc (nth item 3))

              :else
              acc))
          #{}
          tx-data))

(defn- lookup-ref-target-exists?
  [db tx-created-block-uuids target]
  (cond
    (nil? target)
    false

    ;; Tempids may resolve later within the same tx.
    (and (number? target) (neg? target))
    true

    ;; Newly introduced block/uuid refs are valid in this tx even when not yet in db.
    (and (sequential? target)
         (= 2 (count target))
         (= :block/uuid (first target))
         (uuid? (second target)))
    (or (contains? tx-created-block-uuids (second target))
        (some? (entity-ref->eid db [:block/uuid (second target)])))

    :else
    (some? (entity-ref->eid db target))))

(defn- drop-missing-optional-lookup-refs
  [db tx-data]
  (let [tx-created-block-uuids (tx-block-uuids tx-data)]
    (reduce (fn [result item]
              (cond
                ;; Remove stale lookup refs when target is missing.
                (and (vector? item)
                     (<= 4 (count item))
                     (= :db/add (first item))
                     (contains? optional-missing-lookup-ref-attrs (nth item 2)))
                (if (lookup-ref-target-exists? db tx-created-block-uuids (nth item 3))
                  (conj result item)
                  result)

                ;; Same cleanup for map tx entities.
                (map? item)
                (let [item' (reduce (fn [m attr]
                                      (if (and (contains? m attr)
                                               (not (lookup-ref-target-exists? db tx-created-block-uuids (get m attr))))
                                        (dissoc m attr)
                                        m))
                                    item
                                    optional-missing-lookup-ref-attrs)]
                  (if (some (fn [k] (not= :db/id k)) (keys item'))
                    (conj result item')
                    result))

                :else
                (conj result item)))
            []
            tx-data)))

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
         tx-data* (drop-missing-optional-lookup-refs db tx-data*)
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
