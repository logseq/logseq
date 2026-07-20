(ns frontend.worker.render-delta
  (:require [clojure.set :as set]
            [datascript.core :as d]))

(def ^:private membership-affecting-attrs
  #{:block/closed-value-property
    :block/order
    :block/parent
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

(defn- structural-entity-ids
  [tx-data]
  (into #{}
        (keep (fn [datom]
                (when (contains? membership-affecting-attrs (:a datom))
                  (:e datom))))
        tx-data))

(defn- membership-at
  [db entity-id]
  (when-let [entity (d/entity db entity-id)]
    (when-not (or (:block/closed-value-property entity)
                  (:logseq.property/deleted-at entity))
      (when-let [parent (:block/parent entity)]
        (let [block-uuid (:block/uuid entity)
              parent-uuid (:block/uuid parent)
              order (:block/order entity)]
          (when-not (uuid? block-uuid)
            (fail! "Invalid child UUID"
                   {:entity-id entity-id :block-uuid block-uuid}))
          (when-not (uuid? parent-uuid)
            (fail! "Invalid parent UUID"
                   {:entity-id entity-id :parent-uuid parent-uuid}))
          (when (nil? order)
            (fail! "Missing child order"
                   {:entity-id entity-id :block-uuid block-uuid}))
          {:block-uuid block-uuid
           :parent-uuid parent-uuid
           :order order})))))

(defn- append-membership-op
  [operations operation membership]
  (if membership
    (update-in operations
               [(:parent-uuid membership) operation]
               (fnil conj [])
               [(:block-uuid membership) (:order membership)])
    operations))

(defn- membership-operations
  [{:keys [db-before db-after tx-data]}]
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
   (structural-entity-ids tx-data)))

(defn- require-parent-tx-id
  [parent parent-uuid]
  (let [tx-id (:block/tx-id parent)]
    (when-not (valid-tx-id? tx-id)
      (fail! "Invalid parent transaction ID"
             {:parent-uuid parent-uuid :block-tx-id tx-id}))
    tx-id))

(defn- ordered-operations
  [operations]
  (->> operations
       (sort-by (juxt (comp str second) (comp str first)))
       vec))

(defn- parent-patch
  [db-before db-after parent-uuid operations]
  (when-let [parent-after (d/entity db-after [:block/uuid parent-uuid])]
    (let [parent-before (d/entity db-before [:block/uuid parent-uuid])
          base-tx-id (when parent-before
                       (require-parent-tx-id parent-before parent-uuid))
          tx-id (require-parent-tx-id parent-after parent-uuid)]
      (when (= base-tx-id tx-id)
        (fail! "Invalid parent transaction ID"
               {:parent-uuid parent-uuid
                :base-tx-id base-tx-id
                :block-tx-id tx-id}))
      {:base-tx-id base-tx-id
       :tx-id tx-id
       :remove (ordered-operations (:remove operations))
       :upsert (ordered-operations (:upsert operations))})))

(defn- build-children-patches
  [{:keys [db-before db-after] :as tx-report}]
  (reduce-kv
   (fn [patches parent-uuid operations]
     (if-let [patch (parent-patch db-before db-after parent-uuid operations)]
       (assoc patches parent-uuid patch)
       patches))
   {}
   (membership-operations tx-report)))

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
                         [block-uuid {:rev rev}]))
                  deleted-block-uuids)
   :children (build-children-patches tx-report)
   :affected-keys affected-keys})
