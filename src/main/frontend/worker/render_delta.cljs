(ns frontend.worker.render-delta
  "Builds the incremental render delta (block replacements, tombstones, and
   children patches) published to the renderer after each transaction."
  (:require [clojure.set :as set]
            [datascript.core :as d]))

(def ^:private membership-affecting-attrs
  #{:block/closed-value-property
    :block/order
    :block/parent
    :logseq.property/created-from-property
    :logseq.property/deleted-at})

(defn- fail!
  [message data]
  (throw (ex-info message data)))

(defn- valid-tx-id?
  [value]
  (and (integer? value) (not (neg? value))))

(defn- validate-blocks!
  [blocks]
  (when-not (map? blocks)
    (fail! "Invalid block replacements" {:blocks blocks}))
  (doseq [[block-uuid block] blocks]
    (when-not (uuid? block-uuid)
      (fail! "Invalid block UUID" {:block-uuid block-uuid}))
    (when-not (map? block)
      (fail! "Invalid block replacement"
             {:block-uuid block-uuid :block block}))
    (when-not (= block-uuid (:block/uuid block))
      (fail! "Block UUID does not match its key"
             {:block-uuid block-uuid
              :replacement-uuid (:block/uuid block)}))
    (when-not (valid-tx-id? (:block/tx-id block))
      (fail! "Invalid block transaction ID"
             {:block-uuid block-uuid
              :block-tx-id (:block/tx-id block)}))))

(defn- validate-deleted-block-uuids!
  [deleted-block-uuids]
  (when-not (set? deleted-block-uuids)
    (fail! "Invalid deleted block UUID set"
           {:deleted-block-uuids deleted-block-uuids}))
  (doseq [block-uuid deleted-block-uuids]
    (when-not (uuid? block-uuid)
      (fail! "Invalid deleted block UUID" {:block-uuid block-uuid}))))

(defn- validate-input!
  [{:keys [rev blocks deleted-block-uuids affected-keys tx-report]}]
  (when-not (valid-tx-id? rev)
    (fail! "Invalid renderer revision" {:rev rev}))
  (validate-blocks! blocks)
  (validate-deleted-block-uuids! deleted-block-uuids)
  (when-not (set? affected-keys)
    (fail! "Invalid affected key set" {:affected-keys affected-keys}))
  (when-not (and (map? tx-report)
                 (:db-before tx-report)
                 (:db-after tx-report)
                 (sequential? (:tx-data tx-report)))
    (fail! "Invalid transaction report" {:tx-report tx-report}))
  (when-let [block-uuid (first (set/intersection (set (keys blocks))
                                                deleted-block-uuids))]
    (fail! "Block cannot be replaced and deleted"
           {:block-uuid block-uuid})))

(defn- eavt-scalar
  [db eid attr]
  (some-> (first (d/datoms db :eavt eid attr)) :v))

(defn- recycled-chain?
  "Whether the entity or any ancestor is marked deleted. Matches
   frontend.worker.handler.block/direct-children-membership so incremental
   patches hide and restore the same rows as a full children-slot load."
  [db entity-id]
  (loop [eid entity-id
         seen #{}]
    (cond
      (nil? eid) false
      (contains? seen eid) false
      (some? (eavt-scalar db eid :logseq.property/deleted-at)) true
      :else (recur (eavt-scalar db eid :block/parent) (conj seen eid)))))

(defn- child-entity-ids
  [db parent-id]
  (map :e (d/datoms db :avet :block/parent parent-id)))

(defn- descendant-entity-ids
  [db root-id]
  (loop [pending (vec (child-entity-ids db root-id))
         seen #{}]
    (if-let [id (peek pending)]
      (if (contains? seen id)
        (recur (pop pending) seen)
        (recur (into (pop pending) (child-entity-ids db id))
               (conj seen id)))
      seen)))

(defn- recycle-chain-flipped?
  [db-before db-after entity-id]
  (not= (recycled-chain? db-before entity-id)
        (recycled-chain? db-after entity-id)))

(defn- structural-entity-ids
  "Entities whose own membership-affecting attrs changed, plus descendants of
   any such entity whose recycle-chain visibility flipped. Children membership
   hides every node under a recycled ancestor, so restoring, recycling, or
   moving a node across that boundary must refresh already-open descendant
   children slots. Live-to-live parent moves do not walk descendants."
  [{:keys [db-before db-after tx-data]}]
  (let [direct (into #{}
                     (keep (fn [datom]
                             (when (contains? membership-affecting-attrs (:a datom))
                               (:e datom))))
                     tx-data)]
    (into direct
          (mapcat (fn [entity-id]
                    (concat (descendant-entity-ids db-before entity-id)
                            (descendant-entity-ids db-after entity-id))))
          (filter #(recycle-chain-flipped? db-before db-after %)
                  direct))))

(defn- membership-at
  [db entity-id]
  (when-let [entity (d/entity db entity-id)]
    (when-not (or (:block/closed-value-property entity)
                  (:logseq.property/created-from-property entity)
                  (recycled-chain? db entity-id))
      (when-let [parent (:block/parent entity)]
        (let [block-uuid (:block/uuid entity)
              parent-uuid (:block/uuid parent)
              order (:block/order entity)]
          (when (some? order)
            (when-not (uuid? block-uuid)
              (fail! "Invalid child UUID"
                     {:entity-id entity-id :block-uuid block-uuid}))
            (when-not (uuid? parent-uuid)
              (fail! "Invalid parent UUID"
                     {:entity-id entity-id :parent-uuid parent-uuid}))
            {:block-uuid block-uuid
             :parent-uuid parent-uuid
             :order order}))))))

(defn- append-membership-op
  [operations operation membership]
  (if membership
    (update-in operations
               [(:parent-uuid membership) operation]
               (fnil conj [])
               [(:block-uuid membership) (:order membership)])
    operations))

(defn- membership-operations
  [{:keys [db-before db-after] :as tx-report}]
  (reduce
   (fn [operations entity-id]
     (let [before (membership-at db-before entity-id)
           after (membership-at db-after entity-id)]
       (if (= before after)
         operations
         (-> operations
             (append-membership-op :remove before)
             (append-membership-op :upsert after)))))
   {}
   (structural-entity-ids tx-report)))

(defn- ordered-operations
  [operations]
  (->> operations
       (sort-by (juxt (comp str second) (comp str first)))
       vec))

(defn- parent-patch
  [base-rev rev db-after parent-uuid operations]
  (when (d/entity db-after [:block/uuid parent-uuid])
    {:base-rev base-rev
     :rev rev
     :remove (ordered-operations (:remove operations))
     :upsert (ordered-operations (:upsert operations))}))

(defn- build-children-patches
  [rev {:keys [db-before db-after] :as tx-report}]
  (let [base-rev (:max-tx db-before)]
    (reduce-kv
     (fn [patches parent-uuid operations]
       (if-let [patch (parent-patch base-rev rev db-after parent-uuid operations)]
         (assoc patches parent-uuid patch)
         patches))
     {}
     (membership-operations tx-report))))

(defn build
  "Build one renderer delta from complete block replacements and a transaction report."
  [{:keys [graph-id rev op-id blocks deleted-block-uuids affected-keys tx-report]
    :as input}]
  (validate-input! input)
  {:graph-id graph-id
   :rev rev
   :op-id op-id
   :blocks blocks
   :deleted (into {}
                  (map (fn [block-uuid]
                          (let [db-id (:e (first (d/datoms (:db-before tx-report)
                                                           :avet :block/uuid block-uuid)))]
                            [block-uuid (cond-> {:rev rev}
                                          db-id (assoc :db/id db-id))])))
                  deleted-block-uuids)
   :children (build-children-patches rev tx-report)
   :affected-keys affected-keys})
