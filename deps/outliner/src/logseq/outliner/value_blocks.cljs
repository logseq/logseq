(ns logseq.outliner.value-blocks
  "Value blocks: the blocks that hold the value of a text or number property,
  marked with :logseq.property/created-from-property. They exist only to be a
  node's property value, so once no node holds one it has to be deleted too."
  (:require [clojure.set :as set]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]
            [logseq.db.frontend.entity-util :as entity-util]))

(defn value-entity-ids
  "The ids of the entities in a property value `v`, which is an entity or a
  collection of them."
  [v]
  (cond
    (de/entity? v) [(:db/id v)]
    (coll? v) (keep #(when (de/entity? %) (:db/id %)) v)
    :else nil))

(defn orphaned-value-blocks-tx
  "Tx data deleting, with their children, the value blocks of `property` among
  `value-ids` that no node outside `releasing-ids` holds. `releasing-ids` are the
  nodes that stop holding the values: the one whose value is replaced or removed,
  the ones that are being deleted. A closed value, a page and the property's
  default value are never deleted."
  [db property value-ids releasing-ids]
  (let [releasing-ids (set releasing-ids)]
    (->> value-ids
         (keep #(d/entity db %))
         (filter (fn [value]
                   (and (= (:db/id property)
                           (:db/id (:logseq.property/created-from-property value)))
                        (not (entity-util/page? value))
                        (not (ldb/closed-value? value))
                        (not= (:db/id (:logseq.property/default-value property))
                              (:db/id value))
                        (empty? (set/difference
                                 (set (d/q '[:find [?e ...]
                                             :in $ ?property-ident ?value-id
                                             :where [?e ?property-ident ?value-id]]
                                           db (:db/ident property) (:db/id value)))
                                 releasing-ids)))))
         (mapcat (fn [value]
                   (cons (:db/id value)
                         (ldb/get-block-full-children-ids db (:db/id value)))))
         distinct
         (map (fn [block-id] [:db/retractEntity block-id])))))
