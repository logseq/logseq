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

(defn- state->checksum
  [[fnv djb]]
  (str (unsigned-hex fnv)
       (unsigned-hex djb)))

(defn- relevant-attrs
  [e2ee?]
  (cond-> #{:block/uuid :block/parent :block/page}
    (not e2ee?) (into #{:block/title :block/name})))

(defn- get-block-uuid
  [db eid]
  (:block/uuid (d/entity db eid)))

(defn- entity-values
  [db eid e2ee?]
  (let [attrs (relevant-attrs e2ee?)
        datoms (d/datoms db :eavt eid)]
    (reduce (fn [acc datom]
              (let [attr (:a datom)]
                (if (contains? attrs attr)
                  (case attr
                    :block/uuid (assoc acc :block/uuid (:v datom))
                    :block/title (assoc acc :block/title (:v datom))
                    :block/name (assoc acc :block/name (:v datom))
                    :block/parent (assoc acc :block/parent (get-block-uuid db (:v datom)))
                    :block/page (assoc acc :block/page (get-block-uuid db (:v datom)))
                    acc)
                  acc)))
            {}
            datoms)))

(defn- entity-digest
  [db eid e2ee?]
  (let [{:keys [block/uuid block/title block/name block/parent block/page]} (entity-values db eid e2ee?)]
    (when uuid
      (cond-> [fnv-offset djb-offset]
        true (digest-string (str uuid))
        true (hash-code field-separator)
        (not e2ee?) (digest-string title)
        (not e2ee?) (hash-code field-separator)
        (not e2ee?) (digest-string name)
        (not e2ee?) (hash-code field-separator)
        true (digest-string (some-> parent str))
        true (hash-code field-separator)
        true (digest-string (some-> page str))))))

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

(defn update-checksum
  [checksum {:keys [db-before db-after tx-data]}]
  (let [db (or db-after db-before)
        e2ee? (ldb/get-graph-rtc-e2ee? db)
        changed-eids (->> tx-data (keep :e) distinct)
        initial-state (if (string? checksum)
                        (checksum->state checksum)
                        (checksum->state (when db-before (recompute-checksum db-before))))]
    (->> changed-eids
         (reduce (fn [[sum-fnv sum-djb] eid]
                   (let [old-digest (when db-before (entity-digest db-before eid e2ee?))
                         new-digest (when db-after (entity-digest db-after eid e2ee?))
                         [sum-fnv sum-djb] (if old-digest
                                             [(sub-step sum-fnv (first old-digest))
                                              (sub-step sum-djb (second old-digest))]
                                             [sum-fnv sum-djb])]
                     (if new-digest
                       [(add-step sum-fnv (first new-digest))
                        (add-step sum-djb (second new-digest))]
                       [sum-fnv sum-djb])))
                 initial-state)
         state->checksum)))
