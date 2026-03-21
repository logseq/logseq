(ns frontend.worker.sync.legacy-rebase
  "Legacy tx-data rewrite helpers kept only for compatibility rows and
  non-op-driven sync cleanup paths."
  (:require [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.outliner.recycle :as outliner-recycle]))

(defn get-lookup-id
  [x]
  (when (and (vector? x)
             (= 2 (count x))
             (= :block/uuid (first x)))
    (second x)))

(defn- created-block-uuid-entry
  [item]
  (when (and (vector? item)
             (= :db/add (first item))
             (>= (count item) 4)
             (= :block/uuid (nth item 2)))
    [(second item) (nth item 3)]))

(defn- created-block-uuid-by-entity-id
  [tx-data]
  (->> tx-data
       (keep created-block-uuid-entry)
       (into {})))

(defn- created-block-context
  [tx-data]
  (let [uuid-by-entity-id (created-block-uuid-by-entity-id tx-data)]
    {:uuid-by-entity-id uuid-by-entity-id
     :uuids (set (vals uuid-by-entity-id))}))

(defn- tx-created-block-uuid
  [{:keys [uuid-by-entity-id uuids]} entity-id]
  (or (get uuid-by-entity-id entity-id)
      (let [lookup-id (get-lookup-id entity-id)]
        (when (contains? uuids lookup-id)
          lookup-id))))

(defn- add-datom-ref-block-uuids
  [item]
  (when (and (vector? item)
             (= :db/add (first item)))
    (cond-> []
      (get-lookup-id (second item))
      (conj (get-lookup-id (second item)))

      (and (>= (count item) 4)
           (get-lookup-id (nth item 3)))
      (conj (get-lookup-id (nth item 3))))))

(defn drop-missing-created-block-datoms
  [db tx-data]
  (if db
    (let [{:keys [uuid-by-entity-id]} (created-block-context tx-data)
          missing-created-uuids (->> (vals uuid-by-entity-id)
                                     (remove #(d/entity db [:block/uuid %]))
                                     set)]
      (if (seq missing-created-uuids)
        (remove (fn [item]
                  (when (vector? item)
                    (let [entity-lookup-id (get-lookup-id (second item))
                          value-lookup-id (when (>= (count item) 4)
                                            (get-lookup-id (nth item 3)))
                          created-uuid (or (get uuid-by-entity-id (second item))
                                           entity-lookup-id)]
                      (or (contains? missing-created-uuids created-uuid)
                          (contains? missing-created-uuids entity-lookup-id)
                          (contains? missing-created-uuids value-lookup-id)))))
                tx-data)
        tx-data))
    tx-data))

(defn- missing-block-ref?
  [db x]
  (and db
       (or (and (vector? x)
                (some? (get-lookup-id x))
                (nil? (d/entity db x)))
           (and (number? x)
                (not (neg? x))
                (nil? (d/entity db x))))))

(defn- invalid-block-ref?
  [db x]
  (missing-block-ref? db x))

(defn- ref-attr?
  [db a]
  (and db
       (keyword? a)
       (= :db.type/ref
          (:db/valueType (d/entity db a)))))

(defn- tx-entity-key
  [entity]
  (or (get-lookup-id entity)
      entity))

(defn- strip-tx-id
  [item]
  (if (= (count item) 5)
    (vec (butlast item))
    item))

(defn drop-orphaning-parent-retracts
  [tx-data]
  (let [entities-with-parent-add (->> tx-data
                                      (keep (fn [item]
                                              (when (and (vector? item)
                                                         (= :db/add (first item))
                                                         (= :block/parent (nth item 2 nil)))
                                                (tx-entity-key (second item)))))
                                      set)]
    (remove (fn [item]
              (and (vector? item)
                   (= :db/retract (first item))
                   (= :block/parent (nth item 2 nil))
                   (not (contains? entities-with-parent-add
                                   (tx-entity-key (second item))))))
            tx-data)))

(defn- created-block-ref?
  [created-context x]
  (when-let [block-uuid (or (tx-created-block-uuid created-context x)
                            (get-lookup-id x))]
    (contains? (:uuids created-context) block-uuid)))

(defn- invalid-block-uuid?
  [db created-context broken-block-uuids block-uuid]
  (and block-uuid
       (or (contains? broken-block-uuids block-uuid)
           (and (not (contains? (:uuids created-context) block-uuid))
                (nil? (d/entity db [:block/uuid block-uuid]))))))

(defn- add-datom-invalid-block-ref?
  [db created-context broken-block-uuids item]
  (some (partial invalid-block-uuid? db created-context broken-block-uuids)
        (add-datom-ref-block-uuids item)))

(defn- broken-created-block-uuids
  [db created-context tx-data]
  (loop [broken-block-uuids #{}]
    (let [next-broken-block-uuids (->> tx-data
                                       (keep (fn [item]
                                               (when (and (vector? item)
                                                          (= :db/add (first item))
                                                          (add-datom-invalid-block-ref? db created-context broken-block-uuids item))
                                                 (tx-created-block-uuid created-context (second item)))))
                                       (into broken-block-uuids))]
      (if (= broken-block-uuids next-broken-block-uuids)
        broken-block-uuids
        (recur next-broken-block-uuids)))))

(defn- invalid-block-ref-datom?
  [db created-context broken-block-uuids item]
  (when (vector? item)
    (let [op (first item)
          e (second item)
          a (nth item 2 nil)
          has-value? (>= (count item) 4)
          v (when has-value? (nth item 3))
          block-uuid (tx-created-block-uuid created-context e)
          value-ref? (and has-value?
                          (contains? #{:db/add :db/retract} op)
                          (ref-attr? db a))]
      (or (and (= :db/add op)
               (add-datom-invalid-block-ref? db created-context broken-block-uuids item))
          (contains? broken-block-uuids block-uuid)
          (and (contains? #{:db/add :db/retract} op)
               (not (created-block-ref? created-context e))
               (invalid-block-ref? db e))
          (and (= :db/retractEntity op)
               (number? e)
               (not (created-block-ref? created-context e))
               (invalid-block-ref? db e))
          (and value-ref?
               (not (created-block-ref? created-context v))
               (invalid-block-ref? db v))))))

(defn sanitize-block-ref-datoms
  [db tx-data]
  (if db
    (let [created-context (created-block-context tx-data)
          broken-block-uuids (broken-created-block-uuids db created-context tx-data)]
      (remove (partial invalid-block-ref-datom? db created-context broken-block-uuids)
              tx-data))
    tx-data))

(defn- canonical-entity-id
  [db e]
  (cond
    (vector? e) (or (get-lookup-id e) e)
    (and (number? e) (not (neg? e))) (or (:block/uuid (d/entity db e)) e)
    :else e))

(defn drop-remote-conflicted-local-tx
  [db remote-updated-keys tx-data]
  (if (seq remote-updated-keys)
    (let [structural-attrs #{:block/parent :block/page :block/order}
          conflicted-structural-entities
          (->> tx-data
               (keep (fn [item]
                       (when (and (vector? item)
                                  (>= (count item) 4)
                                  (contains? #{:db/add :db/retract} (first item)))
                         (let [entity-key (canonical-entity-id db (second item))
                               attr (nth item 2)]
                           (when (and (contains? structural-attrs attr)
                                      (contains? remote-updated-keys [entity-key attr]))
                             entity-key)))))
               set)]
      (remove (fn [item]
                (and (vector? item)
                     (let [entity-key (canonical-entity-id db (second item))]
                       (or
                        (and (contains? conflicted-structural-entities entity-key)
                             (contains? #{:db/add :db/retract :db/retractEntity} (first item)))
                        (and (>= (count item) 4)
                             (contains? #{:db/add :db/retract} (first item))
                             (contains? remote-updated-keys
                                        [entity-key (nth item 2)]))))))
              tx-data))
    tx-data))

(defn- missing-block-lookup-update?
  [db item]
  (when (and db
             (vector? item)
             (>= (count item) 4)
             (contains? #{:db/add :db/retract} (first item)))
    (let [entity (second item)
          attr (nth item 2)
          create-attrs #{:block/uuid :block/name :db/ident :block/page :block/parent :block/order}]
      (and (vector? entity)
           (= :block/uuid (first entity))
           (nil? (d/entity db entity))
           (not (contains? create-attrs attr))))))

(defn- drop-missing-block-lookup-updates
  [db tx-data]
  (if db
    (let [stale-lookups (->> tx-data
                             (keep (fn [item]
                                     (when (missing-block-lookup-update? db item)
                                       (second item))))
                             set)]
      (if (seq stale-lookups)
        (remove (fn [item]
                  (and (vector? item)
                       (contains? stale-lookups (second item))))
                tx-data)
        tx-data))
    tx-data))

(defn- retract-entity-eid
  [db item]
  (when (and db
             (vector? item)
             (= :db/retractEntity (first item)))
    (let [entity (second item)]
      (cond
        (number? entity) entity
        (vector? entity) (some-> (d/entity db entity) :db/id)
        :else nil))))

(defn- content-block?
  [block]
  (and block
       (not (ldb/page? block))
       (not (ldb/class? block))
       (not (ldb/property? block))))

(def ^:private sync-recycle-meta-attrs
  [:logseq.property.recycle/original-parent
   :logseq.property.recycle/original-page
   :logseq.property.recycle/original-order])

(defn orphaned-blocks->recycle-tx-data
  [db blocks]
  (->> (outliner-recycle/recycle-blocks-tx-data db blocks {})
       (map (fn [item]
              (if (map? item)
                (apply dissoc item sync-recycle-meta-attrs)
                item)))))

(defn- move-missing-location-blocks-to-recycle
  [db tx-data]
  (if db
    (let [retracted-eids (->> tx-data
                              (keep #(retract-entity-eid db %))
                              set)
          location-fixed-eids (->> tx-data
                                   (keep (fn [item]
                                           (when (and (vector? item)
                                                      (= :db/add (first item))
                                                      (contains? #{:block/parent :block/page} (nth item 2 nil)))
                                             (second item))))
                                   (keep (fn [eid]
                                           (cond
                                             (number? eid) eid
                                             (vector? eid) (some-> (d/entity db eid) :db/id)
                                             :else nil)))
                                   set)
          direct-orphans (->> retracted-eids
                              (mapcat #(ldb/get-children db %))
                              (filter content-block?))
          page-orphans (->> retracted-eids
                            (mapcat (fn [eid]
                                      (->> (ldb/get-page-blocks db eid)
                                           (filter (fn [block]
                                                     (= eid (:db/id (:block/parent block))))))))
                            (filter content-block?))
          recycle-roots (->> (concat direct-orphans page-orphans)
                             (remove (fn [block]
                                       (or (contains? retracted-eids (:db/id block))
                                           (contains? location-fixed-eids (:db/id block)))))
                             distinct
                             vec)]
      (if (seq recycle-roots)
        (concat tx-data
                (orphaned-blocks->recycle-tx-data db recycle-roots))
        tx-data))
    tx-data))

(defn sanitize-tx-data
  [db tx-data]
  (let [vector-items (filter vector? tx-data)
        other-items (remove vector? tx-data)
        sanitized-tx-data (->> (concat
                                (->> vector-items
                                     (db-normalize/replace-attr-retract-with-retract-entity-v2 db)
                                     (map strip-tx-id))
                                other-items)
                               (drop-missing-block-lookup-updates db)
                               (sanitize-block-ref-datoms db)
                               (move-missing-location-blocks-to-recycle db)
                               drop-orphaning-parent-retracts)]
    sanitized-tx-data))
