(ns logseq.db.common.delete-blocks
  "For file and DB graphs, provides fn to handle any deletion to occur per ldb/transact!"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.entity-util :as common-entity-util]
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

(defn update-refs-history-and-macros
  "When a block is deleted, refs are updated, property history are deleted. For file graphs, macros associated
  with the block are also deleted"
  [db txs _opts]
  (let [retracted-block-ids (->> (keep (fn [tx]
                                         (when (and (vector? tx)
                                                    (contains? #{:db.fn/retractEntity :db/retractEntity} (first tx)))
                                           (second tx))) txs)
                                 (filter (fn [id]
                                           (not (common-entity-util/page? (d/entity db id))))))]
    (when (seq retracted-block-ids)
      (let [retracted-blocks (map #(d/entity db %) retracted-block-ids)
            retracted-tx (build-retracted-tx retracted-blocks)
            retract-history-tx (mapcat (fn [e]
                                         (map (fn [history] [:db/retractEntity (:db/id history)])
                                              (:logseq.property.history/_block e))) retracted-blocks)
            macros-tx (when-not (entity-plus/db-based-graph? db)
                        (mapcat (fn [b]
                                  ;; Only delete if last reference
                                  (keep #(when (<= (count (:block/_macros (d/entity db (:db/id %))))
                                                   1)
                                           (when (:db/id %) (vector :db.fn/retractEntity (:db/id %))))
                                        (:block/macros b)))
                                retracted-blocks))]
        (concat txs retracted-tx retract-history-tx macros-tx)))))
