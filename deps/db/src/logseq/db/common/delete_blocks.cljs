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
  [retracted-blocks]
  (let [refs (->> (mapcat (fn [block] (:block/_refs block)) retracted-blocks)
                  (common-util/distinct-by :db/id))
        retract-ids (set (map :db/id retracted-blocks))]
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
     refs)))

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
        reaction-entities (->> entities
                               (mapcat :logseq.property.reaction/_target)
                               (common-util/distinct-by :db/id))
        retract-reactions-tx (map (fn [reaction] [:db/retractEntity (:db/id reaction)])
                                  reaction-entities)
        retracted-tx (build-retracted-tx retracted-blocks)
        history-entities (->> entities
                              (mapcat (fn [entity]
                                        (concat (:logseq.property.history/_block entity)
                                                (:logseq.property.history/_property entity)
                                                (:logseq.property.history/_ref-value entity))))
                              (common-util/distinct-by :db/id))
        retract-history-tx (map (fn [history] [:db/retractEntity (:db/id history)])
                                history-entities)
        delete-views (->> entities
                          (mapcat :logseq.property/_view-for)
                          (map (fn [view] [:db/retractEntity (:db/id view)])))]
    (vec (concat retracted-tx delete-views retract-history-tx retract-reactions-tx))))

(defn- build-cleanup-tx
  [db txs]
  (loop [pending-entities (retracted-entities db txs)
         seen-ids #{}
         cleanup-tx []]
    (if-let [entities (seq (remove #(contains? seen-ids (:db/id %))
                                   pending-entities))]
      (let [seen-ids' (into seen-ids (map :db/id) entities)
            next-tx (direct-cleanup-tx entities)]
        (recur (retracted-entities db next-tx) seen-ids' (into cleanup-tx next-tx)))
      (distinct cleanup-tx))))

(defn update-refs-history
  "When an entity is deleted, related property history, views and reactions
   are deleted"
  [db txs _opts]
  (seq (build-cleanup-tx db txs)))
