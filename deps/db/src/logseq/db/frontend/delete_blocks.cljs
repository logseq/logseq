(ns logseq.db.frontend.delete-blocks
  "Delete refs/macros when deleting blocks"
  (:require [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.page-ref :as page-ref]
            [datascript.core :as d]
            [clojure.string :as string]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.content :as db-content]))

(defn- build-retracted-tx [retracted-blocks]
  (->> (for [block retracted-blocks]
         (let [refs (:block/_refs block)]
           (mapcat (fn [ref]
                     (let [id (:db/id ref)
                           block-content (:block/title block)
                           new-content (some-> (:block/raw-title ref)
                                               (string/replace (re-pattern (common-util/format "(?i){{embed \\(\\(%s\\)\\)\\s?}}" (str (:block/uuid block))))
                                                               block-content)

                                               (string/replace (block-ref/->block-ref (str (:block/uuid block)))
                                                               block-content)

                                               ;; Replace object
                                               (string/replace (db-content/block-id->special-id-ref (:block/uuid block))
                                                               block-content)
                                               ;; Replace non-object
                                               (string/replace (page-ref/->page-ref (str (:block/uuid block)))
                                                               block-content))
                           tx (cond->
                               [[:db/retract (:db/id ref) :block/refs (:db/id block)]
                                [:db/retract (:db/id ref) :block/path-refs (:db/id block)]]
                                new-content
                                (conj [:db/add id :block/title new-content]))]
                       tx))
                   refs)))
       (apply concat)))

(defn update-refs-and-macros
  "When a block is deleted, refs are updated. For file graphs, macros associated
  with the block are also deleted"
  [db txs _opts]
  (let [retracted-block-ids (->> (keep (fn [tx]
                                         (when (and (vector? tx)
                                                    (contains? #{:db.fn/retractEntity :db/retractEntity} (first tx)))
                                           (second tx))) txs)
                                 (filter (fn [id]
                                           (not (sqlite-util/page? (d/entity db id))))))]
    (when (seq retracted-block-ids)
      (let [retracted-blocks (map #(d/entity db %) retracted-block-ids)
            retracted-tx (build-retracted-tx retracted-blocks)
            macros-tx (when-not (entity-util/db-based-graph? db)
                        (mapcat (fn [b]
                                  ;; Only delete if last reference
                                  (keep #(when (<= (count (:block/_macros (d/entity db (:db/id %))))
                                                   1)
                                           (when (:db/id %) (vector :db.fn/retractEntity (:db/id %))))
                                        (:block/macros b)))
                                retracted-blocks))]
        (concat txs retracted-tx macros-tx)))))
