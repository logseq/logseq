(ns logseq.db-sync.checksum
  (:require [datascript.core :as d]
            [logseq.db :as ldb]))

(def ^:private fnv-offset 2166136261)
(def ^:private djb-offset 5381)
(def ^:private field-separator 31)

(defn- fnv-step
  [h code]
  (bit-or (js/Math.imul (bit-xor h code) 16777619) 0))

(defn- djb-step
  [h code]
  (bit-or (+ (js/Math.imul h 33) code) 0))

(defn- add-step
  [acc value]
  (bit-or (+ acc value) 0))

(defn- sub-step
  [acc value]
  (bit-or (- acc value) 0))

(defn- hash-code
  [[fnv djb] code]
  [(fnv-step fnv code)
   (djb-step djb code)])

(defn- digest-string
  [state value]
  (let [value (or value "")]
    (loop [idx 0
           state state]
      (if (< idx (count value))
        (recur (inc idx)
               (hash-code state (.charCodeAt value idx)))
        state))))

(defn- unsigned-hex
  [n]
  (-> (unsigned-bit-shift-right n 0)
      (.toString 16)
      (.padStart 8 "0")))

(defn- parse-hex32
  [s]
  (when (= 8 (count s))
    (bit-or (js/parseInt s 16) 0)))

(defn- checksum->state
  [checksum]
  (if (and (string? checksum) (= 16 (count checksum)))
    [(or (parse-hex32 (subs checksum 0 8)) 0)
     (or (parse-hex32 (subs checksum 8 16)) 0)]
    [0 0]))

(defn- valid-checksum?
  [checksum]
  (boolean
   (and (string? checksum)
        (re-matches #"[0-9a-fA-F]{16}" checksum))))

(defn- state->checksum
  [[fnv djb]]
  (str (unsigned-hex fnv)
       (unsigned-hex djb)))

(defn- relevant-attrs
  [e2ee?]
  (cond-> #{:block/uuid :block/parent :block/page :block/order}
    (not e2ee?) (into #{:block/title :block/name})))

(defn- get-block-uuid
  [db eid]
  (:block/uuid (d/entity db eid)))

(defn- normalize-checksum-value
  [db attr value]
  (case attr
    :block/parent (get-block-uuid db value)
    :block/page (get-block-uuid db value)
    value))

(defn- entity-values
  [db eid e2ee?]
  (let [attrs (relevant-attrs e2ee?)
        datoms (d/datoms db :eavt eid)]
    (reduce (fn [acc datom]
              (let [attr (:a datom)]
                (if (contains? attrs attr)
                  (case attr
                    :block/uuid (assoc acc :block/uuid (:v datom))
                    :block/order (assoc acc :block/order (:v datom))
                    :block/title (assoc acc :block/title (:v datom))
                    :block/name (assoc acc :block/name (:v datom))
                    :block/parent (assoc acc :block/parent (get-block-uuid db (:v datom)))
                    :block/page (assoc acc :block/page (get-block-uuid db (:v datom)))
                    acc)
                  acc)))
            {}
            datoms)))

(defn- checksum-eligible-entity?
  [db eid]
  (when-let [ent (d/entity db eid)]
    (uuid? (:block/uuid ent))))

(defn- entity-checksum-tuples
  [db eid e2ee?]
  (when-let [entity-uuid (get-block-uuid db eid)]
    (let [attrs (relevant-attrs e2ee?)]
      (->> (d/datoms db :eavt eid)
           (keep (fn [{:keys [a v]}]
                   (when (contains? attrs a)
                     [entity-uuid
                      a
                      (normalize-checksum-value db a v)])))
           set))))

(defn- tuple-digest
  [[entity-uuid attr value]]
  (-> [fnv-offset djb-offset]
      (digest-string (str entity-uuid))
      (hash-code field-separator)
      (digest-string (str attr))
      (hash-code field-separator)
      (digest-string (some-> value str))))

(defn- subtract-digest
  [[sum-fnv sum-djb] [fnv djb]]
  [(sub-step sum-fnv fnv)
   (sub-step sum-djb djb)])

(defn- add-digest
  [[sum-fnv sum-djb] [fnv djb]]
  [(add-step sum-fnv fnv)
   (add-step sum-djb djb)])

(defn- db-checksum-tuples
  [db e2ee?]
  (->> (d/datoms db :avet :block/uuid)
       (mapcat (fn [{:keys [e]}]
                 (entity-checksum-tuples db e e2ee?)))))

(defn- datom->checksum-tuple
  [db attrs datom]
  (let [attr (:a datom)
        eid (:e datom)]
    (when (and (contains? attrs attr)
               (number? eid))
      (when-let [entity-uuid (get-block-uuid db eid)]
        [entity-uuid
         attr
         (normalize-checksum-value db attr (:v datom))]))))

(defn- existing-entity-in-db?
  [db eid]
  (and (number? eid)
       (some? (d/entity db eid))))

(defn recompute-checksum
  [db]
  (let [e2ee? (ldb/get-graph-rtc-e2ee? db)
        tuples (db-checksum-tuples db e2ee?)]
    (->> tuples
         (reduce (fn [checksum-state tuple]
                   (add-digest checksum-state (tuple-digest tuple)))
                 [0 0])
         state->checksum)))

(defn recompute-checksum-diagnostics
  [db]
  (let [e2ee? (boolean (ldb/get-graph-rtc-e2ee? db))
        attrs (relevant-attrs e2ee?)
        eids (->> (d/datoms db :eavt)
                  (keep (fn [datom]
                          (when (contains? attrs (:a datom))
                            (:e datom))))
                  distinct)
        blocks (->> eids
                    (keep (fn [eid]
                            (when (checksum-eligible-entity? db eid)
                              (let [{:keys [block/uuid block/title block/name block/parent block/page :block/order]} (entity-values db eid e2ee?)]
                                (cond-> {:block/uuid uuid
                                         :block/parent parent
                                         :block/page page
                                         :block/order order}
                                  (not e2ee?) (assoc :block/title title
                                                     :block/name name))))))
                    (sort-by (comp str :block/uuid))
                    vec)]
    {:checksum (recompute-checksum db)
     :e2ee? e2ee?
     :attrs (->> attrs (sort-by str) vec)
     :blocks blocks}))

(defn update-checksum
  [checksum {:keys [db-before db-after tx-data]}]
  (let [before-e2ee? (ldb/get-graph-rtc-e2ee? db-before)
        after-e2ee? (ldb/get-graph-rtc-e2ee? db-after)]
    (if (not= before-e2ee? after-e2ee?)
      ;; E2EE mode changes the global digest semantics, so incremental deltas are invalid.
      (recompute-checksum db-after)
      (let [tx-data (or tx-data [])
            initial-state (if (valid-checksum? checksum)
                            (checksum->state checksum)
                            (checksum->state (recompute-checksum db-before)))
            ;; UUID mutation on an existing entity can implicitly affect
            ;; normalized parent/page tuples of referencing entities.
            ;; Keep incremental logic simple and robust by full recompute.
            existing-uuid-mutation?
            (some (fn [{:keys [a e]}]
                    (and (= :block/uuid a)
                         (existing-entity-in-db? db-before e)))
                  tx-data)
            attrs (relevant-attrs after-e2ee?)
            removed-tuples (keep #(when (false? (:added %))
                                    (datom->checksum-tuple db-before attrs %))
                                tx-data)
            added-tuples (keep #(when (:added %)
                                  (datom->checksum-tuple db-after attrs %))
                              tx-data)
            state-after-removals (reduce (fn [checksum-state tuple]
                                           (subtract-digest checksum-state (tuple-digest tuple)))
                                         initial-state
                                         removed-tuples)
            state-after-additions (reduce (fn [checksum-state tuple]
                                            (add-digest checksum-state (tuple-digest tuple)))
                                          state-after-removals
                                          added-tuples)]
        (if existing-uuid-mutation?
          (recompute-checksum db-after)
          (state->checksum state-after-additions))))))
