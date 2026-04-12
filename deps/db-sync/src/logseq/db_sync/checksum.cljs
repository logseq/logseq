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

(defn- touched-base-eids
  [db-before db-after tx-data]
  (->> tx-data
       (keep :e)
       (filter (fn [eid]
                 (or (checksum-eligible-entity? db-before eid)
                     (checksum-eligible-entity? db-after eid))))
       set))

(defn- touched-checksum-uuids
  [db-before db-after eids]
  (->> eids
       (mapcat (fn [eid]
                 [(get-block-uuid db-before eid)
                  (get-block-uuid db-after eid)]))
       (remove nil?)
       set))

(defn- eids-by-block-uuid
  [db block-uuid]
  (->> (d/datoms db :avet :block/uuid block-uuid)
       (map :e)
       set))

(defn- block-uuid-datom-count
  [db eid]
  (count (d/datoms db :eavt eid :block/uuid)))

(defn- duplicate-block-uuid?
  [db-before db-after block-uuids]
  (some (fn [uuid]
          (or (> (count (d/datoms db-before :avet :block/uuid uuid)) 1)
              (> (count (d/datoms db-after :avet :block/uuid uuid)) 1)))
        block-uuids))

(defn- tuple-set-for-eids
  [db eids e2ee?]
  (reduce (fn [tuples eid]
            (if (checksum-eligible-entity? db eid)
              (into tuples (or (entity-checksum-tuples db eid e2ee?) #{}))
              tuples))
          #{}
          eids))

(defn- tuple-counts-for-eids
  [db eids e2ee?]
  (reduce
   (fn [counts eid]
     (let [datom-count (block-uuid-datom-count db eid)]
       (if (and (pos? datom-count)
                (checksum-eligible-entity? db eid))
         (reduce (fn [acc tuple]
                   (update acc tuple (fnil + 0) datom-count))
                 counts
                 (or (entity-checksum-tuples db eid e2ee?) #{}))
         counts)))
   {}
   eids))

(defn- net-tuple-delta
  [db-before db-after e2ee? tx-data]
  (let [base-eids (touched-base-eids db-before db-after tx-data)]
    (if (empty? base-eids)
      {:removed {}
       :added {}}
      (let [touched-uuids (touched-checksum-uuids db-before db-after base-eids)]
        (if (duplicate-block-uuid? db-before db-after touched-uuids)
          (let [peer-eids (->> touched-uuids
                               (mapcat (fn [uuid]
                                         (concat (eids-by-block-uuid db-before uuid)
                                                 (eids-by-block-uuid db-after uuid))))
                               (filter (fn [eid]
                                         (or (checksum-eligible-entity? db-before eid)
                                             (checksum-eligible-entity? db-after eid))))
                               set)
                touched-eids (set/union base-eids peer-eids)
                before-counts (tuple-counts-for-eids db-before touched-eids e2ee?)
                after-counts (tuple-counts-for-eids db-after touched-eids e2ee?)
                all-tuples (set/union (set (keys before-counts))
                                      (set (keys after-counts)))]
            (reduce
             (fn [{:keys [removed added]} tuple]
               (let [before-count (get before-counts tuple 0)
                     after-count (get after-counts tuple 0)]
                 (cond
                   (> before-count after-count)
                   {:removed (assoc removed tuple (- before-count after-count))
                    :added added}

                   (> after-count before-count)
                   {:removed removed
                    :added (assoc added tuple (- after-count before-count))}

                   :else
                   {:removed removed
                    :added added})))
             {:removed {}
              :added {}}
             all-tuples))
          (let [before-tuples (tuple-set-for-eids db-before base-eids e2ee?)
                after-tuples (tuple-set-for-eids db-after base-eids e2ee?)
                removed (set/difference before-tuples after-tuples)
                added (set/difference after-tuples before-tuples)]
            {:removed (into {} (map (fn [tuple] [tuple 1]) removed))
             :added (into {} (map (fn [tuple] [tuple 1]) added))}))))))

(defn- apply-digest-n
  [checksum-state tuple count op]
  (let [digest (tuple-digest tuple)]
    (loop [n count
           state checksum-state]
      (if (pos? n)
        (recur (dec n) (op state digest))
        state))))

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
  (time
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
             state-after-removals (reduce-kv (fn [checksum-state tuple count]
                                               (apply-digest-n checksum-state tuple count subtract-digest))
                                             initial-state
                                             removed)
             state-after-additions (reduce-kv (fn [checksum-state tuple count]
                                                (apply-digest-n checksum-state tuple count add-digest))
                                              state-after-removals
                                              added)]
         (state->checksum state-after-additions))))))
