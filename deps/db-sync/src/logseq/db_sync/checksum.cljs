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

(def ^:private checksum-ref-attrs
  [:block/parent :block/page])

(defn- dependent-eids
  [db eids]
  (->> eids
       (mapcat (fn [eid]
                 (mapcat (fn [attr]
                           (map :e (d/datoms db :avet attr eid)))
                         checksum-ref-attrs)))
       (filter number?)
       distinct))

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
    (and (:block/uuid ent)
         (not (ldb/built-in? ent))
         (nil? (:logseq.property/deleted-at ent))
         (or (ldb/page? ent)
             (:block/page ent)))))

(defn- entity-digest
  [db eid e2ee?]
  (when (checksum-eligible-entity? db eid)
    (let [{:keys [block/uuid block/title block/name block/parent block/page block/order]} (entity-values db eid e2ee?)]
      (cond-> [fnv-offset djb-offset]
        true (digest-string (str uuid))
        true (hash-code field-separator)
        (not e2ee?) (digest-string title)
        (not e2ee?) (hash-code field-separator)
        (not e2ee?) (digest-string name)
        (not e2ee?) (hash-code field-separator)
        true (digest-string (some-> parent :block/uuid str))
        true (hash-code field-separator)
        true (digest-string (some-> page :block/uuid str))
        true (digest-string (some-> order str))))))

(defn recompute-checksum
  [db]
  (let [e2ee? (ldb/get-graph-rtc-e2ee? db)
        attrs (relevant-attrs e2ee?)
        eids (->> (d/datoms db :eavt)
                  (keep (fn [datom]
                          (when (contains? attrs (:a datom))
                            (:e datom))))
                  distinct)]
    (->> eids
         (reduce (fn [[sum-fnv sum-djb] eid]
                   (if-let [[fnv djb] (entity-digest db eid e2ee?)]
                     [(add-step sum-fnv fnv)
                      (add-step sum-djb djb)]
                     [sum-fnv sum-djb]))
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
      (let [direct-eids (->> tx-data
                             (remove (fn [d]
                                       (contains? #{:block/tx-id} (:a d))))
                             (keep (fn [d]
                                     (let [e (:e d)]
                                       (when (number? e) e))))
                             distinct)
            affected-eids (->> (concat direct-eids
                                       (dependent-eids db-before direct-eids)
                                       (dependent-eids db-after direct-eids))
                               distinct)
            changed-uuids (->> affected-eids
                               (mapcat (fn [eid]
                                         [(:block/uuid (d/entity db-before eid))
                                          (:block/uuid (d/entity db-after eid))]))
                               (remove nil?)
                               distinct)
            initial-state (if (valid-checksum? checksum)
                            (checksum->state checksum)
                            (checksum->state (recompute-checksum db-before)))]
        (->> changed-uuids
             (reduce (fn [[sum-fnv sum-djb] uuid]
                       (let [old-digest (when-let [eid (:db/id (d/entity db-before [:block/uuid uuid]))]
                                          (entity-digest db-before eid after-e2ee?))
                             new-digest (when-let [eid (:db/id (d/entity db-after [:block/uuid uuid]))]
                                          (entity-digest db-after eid after-e2ee?))]
                         [(cond-> sum-fnv
                            old-digest (sub-step (first old-digest))
                            new-digest (add-step (first new-digest)))
                          (cond-> sum-djb
                            old-digest (sub-step (second old-digest))
                            new-digest (add-step (second new-digest)))]))
                     initial-state)
             state->checksum)))))
