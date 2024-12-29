(ns logseq.db.frontend.delete-blocks
  "Delete refs/macros when deleting blocks"
  (:require [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.page-ref :as page-ref]
            [datascript.core :as d]
            [clojure.string :as string]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.entity-plus :as entity-plus]))

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
                  (common-util/distinct-by :db/id))]
    (mapcat
     (fn [ref]
       (let [id (:db/id ref)
             replaced-title (when-let [raw-title (:block/raw-title ref)]
                              (reduce
                               (fn [raw-title block]
                                 (replace-ref-with-deleted-block-title block raw-title))
                               raw-title
                               retracted-blocks))
             tx (cond->
                 (mapcat
                  (fn [block]
                    [[:db/retract (:db/id ref) :block/refs (:db/id block)]
                     [:db/retract (:db/id ref) :block/path-refs (:db/id block)]]) retracted-blocks)
                  replaced-title
                  (conj [:db/add id :block/title replaced-title]))]
         tx))
     refs)))

(defn update-refs-and-macros
  "When a block is deleted, refs are updated. For file graphs, macros associated
  with the block are also deleted"
  [db txs _opts]
  (let [retracted-block-ids (->> (keep (fn [tx]
                                         (when (and (vector? tx)
                                                    (contains? #{:db.fn/retractEntity :db/retractEntity} (first tx)))
                                           (second tx))) txs)
                                 (filter (fn [id]
                                           (not (entity-util/page? (d/entity db id))))))]
    (when (seq retracted-block-ids)
      (let [retracted-blocks (map #(d/entity db %) retracted-block-ids)
            retracted-tx (build-retracted-tx retracted-blocks)
            macros-tx (when-not (entity-plus/db-based-graph? db)
                        (mapcat (fn [b]
                                  ;; Only delete if last reference
                                  (keep #(when (<= (count (:block/_macros (d/entity db (:db/id %))))
                                                   1)
                                           (when (:db/id %) (vector :db.fn/retractEntity (:db/id %))))
                                        (:block/macros b)))
                                retracted-blocks))]
        (concat txs retracted-tx macros-tx)))))
