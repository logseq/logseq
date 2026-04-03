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
  (let [retract-eids-by-entity
        (into {}
              (keep (fn [d]
                      (when (and (= :block/uuid (:a d))
                                 (false? (:added d)))
                        (let [entity (d/entity db-after [:block/uuid (:v d)])]
                          (when (not= (:db/id entity) (:e d)) ; eid changed
                            [(:e d) (if entity
                                      (:e d)
                                      [:block/uuid (:v d)])])))))
              tx-data)]
    (loop [result []
           seen #{}
           [d & more] tx-data]
      (if-not d
        result
        (if-let [eid (get retract-eids-by-entity (:e d))]
          (if (contains? seen (:e d))
            (recur result seen more)
            (recur (conj result [:db/retractEntity eid])
                   (conj seen (:e d))
                   more))
          (recur (conj result d) seen more))))))

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

(defn- retract-entity-op?
  [item]
  (and (= 2 (count item))
       (= :db/retractEntity (first item))))

(defn- retract-entity-match-keys
  [e]
  (if (and (vector? e) (= :block/uuid (first e)))
    (let [block-uuid (second e)]
      #{e block-uuid (str block-uuid)})
    #{e}))

(defn- reorder-retract-entity
  [tx-data]
  (let [retract-ops (filter retract-entity-op? tx-data)
        {recreated-block-retract-ops true
         end-retract-ops false} (->> retract-ops
                                     (group-by (fn [[_ [_ id]]]
                                                 (boolean
                                                  (some (fn [x]
                                                          (and
                                                           (= 5 (count x))
                                                           (= (first x) :db/add)
                                                           (= (nth x 2) :block/uuid)
                                                           (= (nth x 3) id))) tx-data)))))
        retract-keys (->> retract-ops
                          (map second)
                          (mapcat retract-entity-match-keys)
                          set)
        datom-for-retracted-eid?
        (fn [item]
          (and (= 5 (count item))
               (contains? retract-keys (second item))))
        datoms-for-retracted-eids (filter datom-for-retracted-eid? tx-data)
        others (remove (fn [item]
                         (or (retract-entity-op? item)
                             (datom-for-retracted-eid? item)))
                       tx-data)]
    (concat recreated-block-retract-ops datoms-for-retracted-eids others end-retract-ops)))

(defn- collect-title-updated-entities
  [tx-data]
  (->> tx-data
       (keep (fn [d]
               (when (= (count d) 5)
                 (let [[e a _v _t added] d]
                   (when (and added (= :block/title a))
                     e)))))
       set))

(defn- resolve-eid
  [db-before db-after retract? e]
  (if retract?
    (eid->lookup db-before e)
    (or (eid->lookup db-before e)
        (eid->tempid db-after e))))

(defn- ref-value-type?
  [db-after db-before attr]
  (or (= :db.type/ref (:db/valueType (d/entity db-after attr)))
      (= :db.type/ref (:db/valueType (d/entity db-before attr)))))

(defn- normalize-datom-item
  [db-after db-before title-updated-entities [e a v t added]]
  (let [retract? (not added)
        drop-retract?
        (and retract?
             (or (contains? #{:block/created-at :block/updated-at} a)
                 (and (= :block/title a)
                      (contains? title-updated-entities e))))]
    (when-not drop-retract?
      (let [e' (resolve-eid db-before db-after retract? e)
            v' (if (and (integer? v)
                        (pos? v)
                        (ref-value-type? db-after db-before a))
                 (resolve-eid db-before db-after retract? v)
                 v)]
        (when (and (some? e') (some? v'))
          (if added
            [:db/add e' a v' t]
            [:db/retract e' a v' t]))))))

(defn- normalize-retract-entity-item
  [db-before d]
  (when-let [[op e] (and (= 2 (count d))
                         (= :db/retractEntity (first d))
                         d)]
    (when-let [e' (eid->lookup db-before e)]
      [op e'])))

(defn- normalize-tx-item
  [db-after db-before title-updated-entities d]
  (case (count d)
    5 (normalize-datom-item db-after db-before title-updated-entities d)
    2 (normalize-retract-entity-item db-before d)
    nil))

(defn normalize-tx-data
  [db-after db-before tx-data]
  (let [title-updated-entities (collect-title-updated-entities tx-data)]
    (->> tx-data
         remove-conflict-datoms
         (replace-attr-retract-with-retract-entity db-after)
         sort-datoms
         (keep #(normalize-tx-item db-after db-before title-updated-entities %))
         (remove-retract-entity-ref db-after)
         reorder-retract-entity
         distinct)))
