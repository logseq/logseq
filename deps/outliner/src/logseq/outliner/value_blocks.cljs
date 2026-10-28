(ns logseq.outliner.value-blocks
  "Value blocks: the blocks that hold the value of a text or number property,
  marked with :logseq.property/created-from-property. They exist only to be a
  node's property value, so once no node holds one it has to be deleted too."
  (:require [clojure.set :as set]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]))

(defn value-entity-ids
  "The ids of the entities in a property value `v`, which is an entity or a
  collection of them."
  [v]
  (cond
    (de/entity? v) [(:db/id v)]
    (coll? v) (keep #(when (de/entity? %) (:db/id %)) v)
    :else nil))

(defn- kept-by-property-history?
  "True when a property history record of a node that stays records `value`:
  the history of a property keeps the values it used to have. The records of
  nodes in `deleted-ids` are deleted together with those nodes."
  [value deleted-ids]
  (boolean
   (some (fn [history]
           (not (or (contains? deleted-ids (:db/id (:logseq.property.history/block history)))
                    (contains? deleted-ids (:db/id (:logseq.property.history/property history))))))
         (:logseq.property.history/_ref-value value))))

(defn orphaned-value-blocks-tx
  "Tx data deleting, with their children, the value blocks of `property` among
  `value-ids` that no node outside `releasing-ids` holds. `releasing-ids` are the
  nodes that stop holding the values: the one whose value is replaced or removed,
  the ones that are being deleted. `deleted-ids` (default none) are the ones among
  them that are being deleted. A closed value, a page, the property's default
  value and a value that the property history of a node that stays records are
  never deleted."
  ([db property value-ids releasing-ids]
   (orphaned-value-blocks-tx db property value-ids releasing-ids #{}))
  ([db property value-ids releasing-ids deleted-ids]
   (let [releasing-ids (set releasing-ids)
         deleted-ids (set deleted-ids)]
     (->> value-ids
          (keep #(d/entity db %))
          (filter (fn [value]
                    (and (= (:db/id property)
                            (:db/id (:logseq.property/created-from-property value)))
                         (not (entity-util/page? value))
                         (not (ldb/closed-value? value))
                         (not= (:db/id (:logseq.property/default-value property))
                               (:db/id value))
                         (not (kept-by-property-history? value deleted-ids))
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
          (map (fn [block-id] [:db/retractEntity block-id]))))))

(defn deleted-nodes-value-blocks-tx
  "Tx data deleting the value blocks held by the nodes `deleted-ids`, which are
  being deleted, unless a node that stays holds them. A number value, for one,
  belongs to its property and not to the node that has it, so it would be left
  behind owned by nothing."
  [db deleted-ids]
  (let [deleted-ids (set deleted-ids)]
    (->> deleted-ids
         (keep #(d/entity db %))
         (mapcat (fn [node]
                   (mapcat (fn [[property-ident v]]
                             (when-let [property (d/entity db property-ident)]
                               (orphaned-value-blocks-tx
                                db property (value-entity-ids v) deleted-ids deleted-ids)))
                           (db-property/properties node))))
         distinct)))
