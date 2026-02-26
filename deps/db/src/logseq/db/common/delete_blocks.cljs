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

(defn update-refs-history
  "When an entity is deleted, related property history, views and reactions
   are deleted"
  [db txs _opts]
  (let [retracted-ids (keep (fn [tx]
                              (when (and (vector? tx)
                                         (contains? #{:db.fn/retractEntity :db/retractEntity} (first tx)))
                                (second tx))) txs)
        retracted-entities (map #(d/entity db %) retracted-ids)]
    (when (seq retracted-ids)
      (let [retracted-blocks (remove entity-util/page? retracted-entities)
            reaction-entities (->> retracted-entities
                                   (mapcat :logseq.property.reaction/_target)
                                   (common-util/distinct-by :db/id))
            retract-reactions-tx (map (fn [reaction] [:db/retractEntity (:db/id reaction)])
                                      reaction-entities)
            retracted-tx (build-retracted-tx retracted-blocks)
            history-entities (->> retracted-entities
                                  (mapcat (fn [e]
                                            (concat (:logseq.property.history/_block e)
                                                    (:logseq.property.history/_ref-value e))))
                                  (common-util/distinct-by :db/id))
            retract-history-tx (map (fn [history] [:db/retractEntity (:db/id history)])
                                    history-entities)
            delete-views (->>
                          (mapcat
                           (fn [item]
                             (let [block (d/entity db (:db/id item))]
                               (:logseq.property/_view-for block)))
                           retracted-entities)
                          (map (fn [b] [:db/retractEntity (:db/id b)])))]
        (concat retracted-tx delete-views retract-history-tx retract-reactions-tx)))))
