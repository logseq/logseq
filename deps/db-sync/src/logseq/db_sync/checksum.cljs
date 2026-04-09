(ns logseq.db-sync.checksum
  (:require [clojure.set :as set]
            [datascript.core :as d]
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
    (and (uuid? (:block/uuid ent))
         (not (ldb/built-in? ent))
         (or (ldb/page? ent)
             (some? (:block/page ent))
             (some? (:block/name ent))))))

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
                 (when (checksum-eligible-entity? db e)
                   (entity-checksum-tuples db e e2ee?))))))

(defn- touched-checksum-eids
  [db-before db-after tx-data]
  (->> tx-data
       (keep :e)
       (filter (fn [eid]
                 (or (checksum-eligible-entity? db-before eid)
                     (checksum-eligible-entity? db-after eid))))
       set))

(defn- net-tuple-delta
  [db-before db-after e2ee? tx-data]
  (let [touched-eids (touched-checksum-eids db-before db-after tx-data)]
    (reduce
     (fn [{:keys [removed added]} eid]
       (let [before-tuples (if (checksum-eligible-entity? db-before eid)
                             (or (entity-checksum-tuples db-before eid e2ee?) #{})
                             #{})
             after-tuples (if (checksum-eligible-entity? db-after eid)
                            (or (entity-checksum-tuples db-after eid e2ee?) #{})
                            #{})]
         {:removed (into removed (set/difference before-tuples after-tuples))
          :added (into added (set/difference after-tuples before-tuples))}))
     {:removed #{}
      :added #{}}
     touched-eids)))

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
                              (let [{:block/keys [uuid title name parent page order]}
                                    (entity-values db eid e2ee?)]
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
        after-e2ee? (ldb/get-graph-rtc-e2ee? db-after)
        tx-data (or tx-data [])]
    (cond
      (not= before-e2ee? after-e2ee?)
      ;; E2EE mode changes the global digest semantics, so incremental deltas are invalid.
      (recompute-checksum db-after)

      (empty? tx-data)
      checksum

      :else
      (let [initial-state (if (valid-checksum? checksum)
                            (checksum->state checksum)
                            (checksum->state (recompute-checksum db-before)))
            {:keys [removed added]} (net-tuple-delta db-before db-after after-e2ee? tx-data)
            state-after-removals (reduce (fn [checksum-state tuple]
                                           (subtract-digest checksum-state (tuple-digest tuple)))
                                         initial-state
                                         removed)
            state-after-additions (reduce (fn [checksum-state tuple]
                                            (add-digest checksum-state (tuple-digest tuple)))
                                          state-after-removals
                                          added)]
        (state->checksum state-after-additions)))))
