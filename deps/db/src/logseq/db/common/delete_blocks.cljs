(ns logseq.db.common.delete-blocks
  "Provides fn to handle any deletion to occur per ldb/transact!"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.entity-util :as entity-util]))

(defn- replace-ref-with-deleted-block-title
  [block ref-raw-title]
  (let [block-content (if (entity-util/asset? block)
                        ""
                        (:block/title block))]
    (some-> ref-raw-title
            (string/replace (re-pattern (common-util/format "(?i){{embed \\(\\(%s\\)\\)\\s?}}" (str (:block/uuid block))))
                            block-content)

            (string/replace (block-ref/->block-ref (str (:block/uuid block)))
                            block-content)
            (string/replace (page-ref/->page-ref (str (:block/uuid block)))
                            block-content))))

(defn- build-retracted-tx
  ([retracted-blocks]
   (build-retracted-tx retracted-blocks #{}))
  ([retracted-blocks extra-retract-ids]
  (let [refs (->> (mapcat (fn [block] (:block/_refs block)) retracted-blocks)
                  (common-util/distinct-by :db/id))
        retract-ids (into (set (map :db/id retracted-blocks)) extra-retract-ids)]
    (mapcat
     (fn [ref]
       (let [id (:db/id ref)
             replaced-title (when-not (contains? retract-ids id)
                              (when-let [raw-title (:block/raw-title ref)]
                                (reduce
                                 (fn [raw-title block]
                                   (replace-ref-with-deleted-block-title block raw-title))
                                 raw-title
                                 retracted-blocks)))
             tx (cond->
                 (mapcat
                  (fn [block]
                    [[:db/retract (:db/id ref) :block/refs (:db/id block)]]) retracted-blocks)
                  replaced-title
                  (conj [:db/add id :block/title replaced-title]))]
         tx))
     refs))))

(defn- block-entity?
  [entity]
  (and (:block/uuid entity)
       (:block/page entity)
       (not (entity-util/page? entity))))

(defn- retracted-entities
  [db txs]
  (->> txs
       (keep (fn [tx]
               (when (and (vector? tx)
                          (contains? #{:db.fn/retractEntity :db/retractEntity} (first tx)))
                 (d/entity db (second tx)))))
       (common-util/distinct-by :db/id)))

(def ^:private property-history-ref-attrs
  #{:logseq.property.history/block
    :logseq.property.history/property
    :logseq.property.history/ref-value})

(defn- property-history-entity?
  [entity]
  (boolean
   (and entity
        (or (:logseq.property.history/block entity)
            (:logseq.property.history/property entity)
            (:logseq.property.history/ref-value entity)
            (contains? entity :logseq.property.history/scalar-value)))))

(defn- property-history-ref-retracted-entities
  [db txs]
  (->> txs
       (keep (fn [tx]
               (when (and (vector? tx)
                          (= :db/retract (first tx))
                          (contains? property-history-ref-attrs (nth tx 2 nil)))
                 (let [entity (d/entity db (second tx))]
                   (when (property-history-entity? entity)
                     entity)))))
       (common-util/distinct-by :db/id)))

(defn- tx-entity-id
  [db eid]
  (cond
    (integer? eid)
    eid

    (vector? eid)
    (some-> (d/entity db eid) :db/id)))

(defn- vector-adds-by-eid
  [txs]
  (reduce (fn [result tx]
            (if (and (vector? tx)
                     (= :db/add (first tx))
                     (integer? (second tx)))
              (update result (second tx) assoc (nth tx 2) (nth tx 3))
              result))
          {}
          txs))

(defn- property-history-ref-retracted-ids
  [txs]
  (->> txs
       (keep (fn [tx]
               (when (and (vector? tx)
                          (= :db/retract (first tx))
                          (integer? (second tx))
                          (contains? property-history-ref-attrs (nth tx 2 nil)))
                 (second tx))))
       set))

(defn- new-property-history-retract-tx
  [db txs retracted-ids]
  (let [referencing-retracted-entity?
        (fn [history]
          (or (contains? retracted-ids
                         (tx-entity-id db (:logseq.property.history/block history)))
              (contains? retracted-ids
                         (tx-entity-id db (:logseq.property.history/property history)))
              (contains? retracted-ids
                         (tx-entity-id db (:logseq.property.history/ref-value history)))))
        map-retract-tx
        (keep (fn [tx]
                (when (and (map? tx)
                           (:block/uuid tx)
                           (property-history-entity? tx)
                           (referencing-retracted-entity? tx))
                  [:db/retractEntity [:block/uuid (:block/uuid tx)]]))
              txs)
        retracted-history-ref-ids (property-history-ref-retracted-ids txs)
        vector-retract-tx
        (->> (vector-adds-by-eid txs)
             (keep (fn [[eid tx-entity]]
                     (when (and (:block/uuid tx-entity)
                                (property-history-entity? tx-entity)
                                (or (contains? retracted-history-ref-ids eid)
                                    (referencing-retracted-entity? tx-entity)))
                       [:db/retractEntity eid]))))]
    (distinct (concat map-retract-tx vector-retract-tx))))

(defn- block-subtree-entities
  [root]
  (loop [pending [root]
         seen-ids #{}
         result []]
    (if-let [entity (first pending)]
      (if (or (nil? (:db/id entity))
              (contains? seen-ids (:db/id entity)))
        (recur (rest pending) seen-ids result)
        (recur (concat (rest pending) (filter block-entity? (:block/_parent entity)))
               (conj seen-ids (:db/id entity))
               (conj result entity)))
      result)))

(defn expand-delete-blocks-tx
  "Expands delete-blocks retracts to the current DB subtree before transacting."
  [db txs {:keys [outliner-op]}]
  (if (= :delete-blocks outliner-op)
    (let [subtree-tx (->> (retracted-entities db txs)
                          (filter block-entity?)
                          (mapcat block-subtree-entities)
                          (map (fn [entity] [:db/retractEntity (:db/id entity)])))]
      (distinct (concat txs subtree-tx)))
    txs))

(defn- direct-cleanup-tx
  [entities]
  (let [retracted-blocks (filter block-entity? entities)
        retracted-history-self-entities (filter property-history-entity? entities)
        retracted-history-self-tx (map (fn [history] [:db/retractEntity (:db/id history)])
                                       retracted-history-self-entities)
        reaction-entities (->> entities
                               (mapcat :logseq.property.reaction/_target)
                               (common-util/distinct-by :db/id))
        retract-reactions-tx (map (fn [reaction] [:db/retractEntity (:db/id reaction)])
                                  reaction-entities)
        view-entities (->> entities
                           (mapcat :logseq.property/_view-for)
                           (common-util/distinct-by :db/id))
        history-entities (->> entities
                              (mapcat (fn [entity]
                                        (concat (:logseq.property.history/_block entity)
                                                (:logseq.property.history/_property entity)
                                                (:logseq.property.history/_ref-value entity))))
                              (common-util/distinct-by :db/id))
        retract-history-tx (map (fn [history] [:db/retractEntity (:db/id history)])
                                history-entities)
        cleanup-retract-ids (->> (concat retracted-history-self-entities
                                          reaction-entities
                                          view-entities
                                          history-entities)
                                 (keep :db/id)
                                 set)
        retracted-tx (build-retracted-tx retracted-blocks cleanup-retract-ids)
        delete-views (map (fn [view] [:db/retractEntity (:db/id view)]) view-entities)]
    (vec (concat retracted-tx delete-views retracted-history-self-tx retract-history-tx retract-reactions-tx))))

(defn- build-cleanup-tx
  [db txs]
  (let [initial-entities (concat (retracted-entities db txs)
                                 (property-history-ref-retracted-entities db txs))]
    (loop [pending-entities initial-entities
           seen-ids #{}
           cleanup-tx (new-property-history-retract-tx db txs (set (map :db/id initial-entities)))]
      (if-let [entities (seq (remove #(contains? seen-ids (:db/id %))
                                     pending-entities))]
        (let [seen-ids' (into seen-ids (map :db/id) entities)
              next-tx (direct-cleanup-tx entities)]
          (recur (retracted-entities db next-tx) seen-ids' (into cleanup-tx next-tx)))
        (distinct cleanup-tx)))))

(defn update-refs-history
  "When an entity is deleted, related property history, views and reactions
   are deleted"
  [db txs _opts]
  (seq (build-cleanup-tx db txs)))
