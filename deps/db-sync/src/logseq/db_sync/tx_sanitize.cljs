(ns logseq.db-sync.tx-sanitize
  (:require [clojure.set :as set]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.frontend.kv-entity :as kv-entity]
            [logseq.db.frontend.property :as db-property]))

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

(defn- entity-op?
  [item]
  (and (vector? item)
       (<= 4 (count item))
       (contains? entity-op-kinds (first item))))

(def ^:private ignored-kv-entities
  (into #{}
        (keep (fn [[kw config]]
                (when (get-in config [:rtc :rtc/ignore-entity-when-init-upload])
                  kw)))
        kv-entity/kv-entities))

(defn- tx-ignored-kv-entity-refs
  [tx-data]
  (into ignored-kv-entities
        (keep (fn [item]
                (cond
                  (and (map? item)
                       (contains? ignored-kv-entities (:db/ident item)))
                  (:db/id item)

                  (and (entity-op? item)
                       (= :db/ident (nth item 2))
                       (contains? ignored-kv-entities (nth item 3)))
                  (second item))))
        tx-data))

(defn- ignored-kv-entity-ref?
  [db ignored-entity-refs entity-ref]
  (or (contains? ignored-entity-refs entity-ref)
      (when-let [eid (entity-ref->eid db entity-ref)]
        (contains? ignored-kv-entities (:db/ident (d/entity db eid))))))

(defn- ignored-kv-entity-op?
  [db ignored-entity-refs item]
  (cond
    (and (map? item) (contains? item :db/id))
    (ignored-kv-entity-ref? db ignored-entity-refs (:db/id item))

    (retract-entity-op? item)
    (ignored-kv-entity-ref? db ignored-entity-refs (second item))

    (entity-op? item)
    (ignored-kv-entity-ref? db ignored-entity-refs (second item))

    :else
    false))

(defn- strip-ignored-kv-entity-ops
  [db tx-data]
  (let [ignored-entity-refs (tx-ignored-kv-entity-refs tx-data)]
    (remove (partial ignored-kv-entity-op? db ignored-entity-refs) tx-data)))

(defn- drop-ops-targeting-retracted-entities
  [db tx-data]
  (let [retract-eids (->> tx-data
                          (keep (fn [item]
                                  (when (retract-entity-op? item)
                                    (entity-ref->eid db (second item)))))
                          set)]
    (if (empty? retract-eids)
      tx-data
      (remove (fn [item]
                (and (entity-op? item)
                     (contains? retract-eids
                                (entity-ref->eid db (second item)))))
              tx-data))))

(def ^:private bookkeeping-attrs
  "Attrs that are safe to drop when their target entity doesn't exist on the
   server. Stamping them on a retracted eid would resurrect an invalid ghost
   entity (e.g. only {:block/updated-at}), which then fails validation and
   rejects the tx."
  #{:block/created-at :block/updated-at :block/order})

(defn- missing-positive-eid?
  [db entity-ref]
  (and (integer? entity-ref)
       (pos? entity-ref)
       (nil? (d/entity db entity-ref))))

(defn- drop-stamps-on-missing-entities
  "Drops stamp ops (`[:db/add e bookkeeping-attr v]` and entity maps carrying
   only bookkeeping attrs) whose target eid has no entity in db. Synced txs
   carry raw eids that can go stale when another client deleted the entity;
   writing them would resurrect a ghost entity that fails validation."
  [db tx-data]
  (remove (fn [item]
            (cond
              (and (entity-op? item)
                   (= :db/add (first item))
                   (contains? bookkeeping-attrs (nth item 2)))
              (missing-positive-eid? db (second item))

              (and (map? item) (contains? item :db/id))
              (and (missing-positive-eid? db (:db/id item))
                   (every? #(contains? (conj bookkeeping-attrs :db/id) %)
                           (keys item)))

              :else
              false))
          tx-data))

(def ^:private migration-deleted-attrs
  #{:block/path-refs
    :block/scheduled
    :block/deadline
    :block/marker
    :block/priority
    :block/properties-text-values
    :block/invalid-properties
    :block/pre-block?
    :logseq.property.embedding/hnsw-label
    :logseq.property.embedding/hnsw-label-updated-at})

(defn- strip-migration-deleted-attrs
  [tx-data]
  (keep (fn [item]
          (when-not (and (vector? item)
                         (<= 4 (count item))
                         (entity-op? item)
                         (contains? migration-deleted-attrs (nth item 2)))
            item))
        tx-data))

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

(defn- temp-entity-ref?
  [entity-ref]
  (or (and (integer? entity-ref) (neg? entity-ref))
      (string? entity-ref)))

(defn- lookup-uuid
  [v]
  (cond
    (uuid? v)
    v

    (and (vector? v)
         (= 2 (count v))
         (= :block/uuid (first v))
         (uuid? (second v)))
    (second v)

    :else
    nil))

(defn- entity-ref-forms
  [entity-ref]
  (when (some? entity-ref)
    (let [block-uuid (lookup-uuid entity-ref)]
      (cond-> #{entity-ref}
        block-uuid (conj block-uuid [:block/uuid block-uuid] (str block-uuid))))))

(defn- item-entity-ref
  [item]
  (cond
    (and (map? item) (contains? item :db/id))
    (:db/id item)

    (retract-entity-op? item)
    (second item)

    (entity-op? item)
    (second item)

    :else
    nil))

(defn- user-or-plugin-property-ident?
  [attr]
  (and (qualified-keyword? attr)
       (let [attr-ns (namespace attr)]
         (and (some? attr-ns)
              (not (contains? db-property/logseq-property-namespaces attr-ns))
              (or (db-property/plugin-property? attr)
                  (db-property/user-property-namespace? attr-ns))))))

(defn- tx-created-idents
  [tx-data]
  (into #{}
        (keep (fn [item]
                (cond
                  (and (map? item) (qualified-keyword? (:db/ident item)))
                  (:db/ident item)

                  (and (entity-op? item)
                       (= :db/add (first item))
                       (= :db/ident (nth item 2))
                       (qualified-keyword? (nth item 3)))
                  (nth item 3))))
        tx-data))

(defn- tx-created-block-uuids
  [tx-data]
  (into #{}
        (keep (fn [item]
                (cond
                  (and (map? item) (uuid? (:block/uuid item)))
                  (:block/uuid item)

                  (and (entity-op? item)
                       (= :db/add (first item))
                       (= :block/uuid (nth item 2))
                       (uuid? (nth item 3)))
                  (nth item 3))))
        tx-data))

(defn- deleted-user-property-ident?
  [db created-idents attr]
  (and (user-or-plugin-property-ident? attr)
       (not (contains? created-idents attr))
       (nil? (d/entity db attr))))

(defn- missing-property-attrs
  [db created-idents tx-data]
  (into #{}
        (mapcat (fn [item]
                  (cond
                    (map? item)
                    (filter #(deleted-user-property-ident? db created-idents %)
                            (keys item))

                    (entity-op? item)
                    (let [attr (nth item 2)]
                      (when (deleted-user-property-ident? db created-idents attr)
                        [attr]))

                    :else
                    nil)))
        tx-data))

(defn- missing-property-target?
  [db created-idents created-uuids v]
  (let [ident (cond
                (qualified-keyword? v) v
                (and (map? v) (qualified-keyword? (:db/ident v))) (:db/ident v)
                :else nil)
        block-uuid (lookup-uuid v)]
    (cond
      (contains? created-idents ident)
      false

      (and block-uuid (contains? created-uuids block-uuid))
      false

      (temp-entity-ref? v)
      false

      ident
      (deleted-user-property-ident? db created-idents ident)

      :else
      (nil? (entity-ref->eid db v)))))

(defn- new-in-tx-entity-ref?
  [created-uuids entity-ref]
  (or (temp-entity-ref? entity-ref)
      (let [block-uuid (lookup-uuid entity-ref)]
        (boolean (and block-uuid (contains? created-uuids block-uuid))))))

(defn- collect-orphan-value-block-refs
  [db created-idents missing-attrs created-uuids tx-data]
  (into #{}
        (mapcat
         (fn [item]
           (cond
             (and (map? item)
                  (contains? item :logseq.property/created-from-property)
                  (missing-property-target?
                   db created-idents created-uuids
                   (:logseq.property/created-from-property item)))
             (mapcat entity-ref-forms [(:db/id item) (:block/uuid item)])

             (and (entity-op? item)
                  (= :db/add (first item))
                  (= :logseq.property/created-from-property (nth item 2))
                  (missing-property-target?
                   db created-idents created-uuids (nth item 3)))
             (entity-ref-forms (second item))

             (and (entity-op? item)
                  (= :db/add (first item))
                  (contains? missing-attrs (nth item 2))
                  (new-in-tx-entity-ref? created-uuids (nth item 3)))
             (entity-ref-forms (nth item 3))

             (map? item)
             (mapcat (fn [attr]
                       (when (and (contains? missing-attrs attr)
                                  (new-in-tx-entity-ref? created-uuids (get item attr)))
                         (entity-ref-forms (get item attr))))
                     (keys item))

             :else
             nil)))
        tx-data))

(defn- item-entity-aliases
  [item]
  (let [e (item-entity-ref item)
        block-uuid (cond
                     (and (map? item) (uuid? (:block/uuid item)))
                     (:block/uuid item)

                     (and (entity-op? item)
                          (= :db/add (first item))
                          (= :block/uuid (nth item 2))
                          (uuid? (nth item 3)))
                     (nth item 3)

                     :else
                     nil)
        ident (cond
                (and (map? item) (qualified-keyword? (:db/ident item)))
                (:db/ident item)

                (and (entity-op? item)
                     (= :db/add (first item))
                     (= :db/ident (nth item 2))
                     (qualified-keyword? (nth item 3)))
                (nth item 3)

                :else
                nil)]
    (cond-> (or (entity-ref-forms e) #{})
      block-uuid (into (entity-ref-forms block-uuid))
      ident (conj ident))))

(defn- expand-orphan-refs
  [tx-data orphan-refs]
  (loop [refs orphan-refs]
    (let [refs' (reduce
                 (fn [acc item]
                   (let [aliases (item-entity-aliases item)]
                     (if (some acc aliases)
                       (into acc aliases)
                       acc)))
                 refs
                 tx-data)]
      (if (= refs refs')
        refs
        (recur refs')))))

(defn- orphan-item?
  [orphan-refs item]
  (boolean (some orphan-refs (item-entity-aliases item))))

(defn- rewrite-or-drop-missing-property-item
  [missing-attrs orphan-refs item]
  (cond
    (orphan-item? orphan-refs item)
    nil

    (and (entity-op? item)
         (contains? missing-attrs (nth item 2)))
    nil

    (map? item)
    (let [stripped (into {}
                         (remove (fn [[k _]] (contains? missing-attrs k)))
                         item)]
      (when (seq (dissoc stripped :db/id))
        stripped))

    :else
    item))

(defn- drop-ops-for-missing-properties
  "Delete wins: drop property-value ops (and value blocks created only for that
  property) when the user/plugin property entity is gone on the server and is
  not being created in this tx. Built-in properties and non-property attrs are
  left alone."
  [db tx-data]
  (let [created-idents (tx-created-idents tx-data)
        created-uuids (tx-created-block-uuids tx-data)
        missing-attrs (missing-property-attrs db created-idents tx-data)
        orphan-refs (expand-orphan-refs
                     tx-data
                     (collect-orphan-value-block-refs
                      db created-idents missing-attrs created-uuids tx-data))]
    (if (and (empty? missing-attrs) (empty? orphan-refs))
      tx-data
      (keep (fn [item]
              (rewrite-or-drop-missing-property-item
               missing-attrs orphan-refs item))
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
  ([db tx-data {:keys [drop-missing-retract-ops?
                       drop-ops-targeting-retracted-entities?
                       retract-touched-descendants?]
                :or {drop-missing-retract-ops? false
                     drop-ops-targeting-retracted-entities? false
                     retract-touched-descendants? false}}]
   (let [tx-data* (cond->> (strip-migration-deleted-attrs tx-data)
                    true
                    (drop-stamps-on-missing-entities db)
                    (seq ignored-kv-entities)
                    (strip-ignored-kv-entity-ops db)
                    drop-missing-retract-ops?
                    (remove (fn [item]
                              (and (retract-entity-op? item)
                                   (nil? (entity-ref->eid db (second item))))))
                    drop-ops-targeting-retracted-entities?
                    (drop-ops-targeting-retracted-entities db))
         tx-data* (drop-conflicted-encrypted-retracts tx-data*)
         tx-data* (drop-ops-for-missing-properties db tx-data*)
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
         preserved-eids (cond-> retract-eids
                          (not retract-touched-descendants?)
                          (set/union touched-eids))
         missing-retract-eids (sort (set/difference descendant-retract-eids preserved-eids))]
     (cond-> tx-data*
       (seq missing-retract-eids)
       (into (map (fn [eid] [:db/retractEntity eid]) missing-retract-eids))))))
