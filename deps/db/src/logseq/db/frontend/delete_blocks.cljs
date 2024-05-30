(ns logseq.db.frontend.delete-blocks
  "Delete refs/macros when deleting blocks"
  (:require [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [datascript.core :as d]
            [clojure.string :as string]
            [logseq.db.frontend.entity-plus :as entity-plus]))

(defn update-refs-and-macros
  "When a block is deleted, refs are updated. For file graphs, macros associated
  with the block are also deleted"
  [db txs]
  (let [retracted-block-ids (->> (keep (fn [tx]
                                         (when (and (vector? tx)
                                                    (contains? [:db.fn/retractEntity :db/retractEntity] (first tx)))
                                           (second tx))) txs))]
    (when (seq retracted-block-ids)
      (let [retracted-blocks (map #(d/entity db %) retracted-block-ids)
            retracted-tx (->> (for [block retracted-blocks]
                                (let [refs (:block/_refs block)]
                                  (map (fn [ref]
                                         (let [id (:db/id ref)
                                               block-content (:block/content ref)
                                               new-content (some-> (:block/content ref)
                                                                   (string/replace (re-pattern (common-util/format "(?i){{embed \\(\\(%s\\)\\)\\s?}}" (str (:block/uuid block))))
                                                                                   block-content)
                                                                   (string/replace (block-ref/->block-ref (str (:block/uuid block)))
                                                                                   block-content))
                                               tx (cond->
                                                   [[:db/retract (:db/id ref) :block/refs (:db/id block)]
                                                    [:db/retract (:db/id ref) :block/path-refs (:db/id block)]]
                                                    new-content
                                                    (conj [:db/add id :block/content new-content]))]
                                           {:tx tx})) refs)))
                              (apply concat))
            retracted-tx' (mapcat :tx retracted-tx)
            macros-tx (when-not (entity-plus/db-based-graph? db)
                       (mapcat (fn [b]
                              ;; Only delete if last reference
                                 (keep #(when (<= (count (:block/_macros (d/entity db (:db/id %))))
                                                  1)
                                          (when (:db/id %) (vector :db.fn/retractEntity (:db/id %))))
                                       (:block/macros b)))
                               retracted-blocks))]
        (concat txs retracted-tx' macros-tx)))))
