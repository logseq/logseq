(ns logseq.db.frontend.property.build
  "Builds core property concepts"
  (:require [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.sqlite.util :as sqlite-util]))

(defn- closed-value-new-block
  [block-id block-type value property]
  (let [property-id (:db/ident property)]
    (merge {:block/uuid block-id
            :block/page property-id
            :block/closed-value-property property-id
            :logseq.property/created-from-property (if (= property-id :logseq.property/default-value)
                                                     [:block/uuid block-id]
                                                     property-id)
            :block/parent property-id}
           (if (db-property-type/property-value-content? block-type property)
             {:logseq.property/value value}
             {:block/title value}))))

(defn build-closed-value-block
  "Builds a closed value block to be transacted"
  [block-uuid block-type block-value property {:keys [db-ident icon]}]
  (assert block-uuid (uuid? block-uuid))
  (cond->
   (closed-value-new-block block-uuid block-type block-value property)
    (and db-ident (keyword? db-ident))
    (assoc :db/ident db-ident)

    icon
    (assoc :logseq.property/icon icon)

    true
    sqlite-util/block-with-timestamps))

(defn closed-values->blocks
  [property]
  (map (fn [{uuid' :uuid :keys [db-ident value icon schema properties]}]
         (cond->
          (build-closed-value-block
           uuid'
           (:type schema)
           value
           property
           {:db-ident db-ident :icon icon})
           (seq properties)
           (merge properties)
           true
           (assoc :block/order (db-order/gen-key))))
       (:closed-values property)))

(defn build-closed-values
  "Builds all the tx needed for property with closed values including
   the hidden page and closed value blocks as needed"
  [db-ident prop-name property {:keys [property-attributes properties]}]
  (let [property-schema (or (:schema property)
                            (db-property/get-property-schema property))
        property-tx (merge (sqlite-util/build-new-property db-ident property-schema {:title prop-name
                                                                                     :ref-type? true
                                                                                     :properties properties})
                           property-attributes)]
    (into [property-tx]
          (closed-values->blocks property))))

(defn- build-property-value-block
  "Builds a property value entity given a block map/entity, a property entity or
  ident and its property value"
  [block property value]
  (let [block-id (or (:db/id block) (:db/ident block))]
    (-> (merge
         {:block/uuid (d/squuid)
          :block/page (if (:block/page block)
                        (:db/id (:block/page block))
                        ;; page block
                        block-id)
          :block/parent block-id
          :logseq.property/created-from-property (if (= (:db/ident property) :logseq.property/default-value)
                                                   block-id
                                                   (or (:db/id property) {:db/ident (:db/ident property)}))
          :block/order (db-order/gen-key)}
         (if (db-property-type/property-value-content? (:logseq.property/type property) property)
           {:logseq.property/value value}
           {:block/title value}))
        common-util/block-with-timestamps)))

(defn build-property-values-tx-m
  "Builds a map of property names to their property value blocks to be
  transacted, given a block and a properties map with raw property values. The
  properties map can have keys that are db-idents or they can be maps. If a map,
  it should have :original-property-id and :db/ident keys.  See
  ->property-value-tx-m for such an example"
  [block properties]
  ;; Build :db/id out of uuid if block doesn't have one for tx purposes
  (let [block' (if (:db/id block) block (assoc block :db/id [:block/uuid (:block/uuid block)]))]
    (->> properties
         (map (fn [[k v]]
                (let [property-map (if (map? k) k {:db/ident k})]
                  (assert (:db/ident property-map) "Key in map must have a :db/ident")
                  [(or (:original-property-id property-map) (:db/ident property-map))
                   (if (set? v)
                     (set (map #(build-property-value-block block' property-map %) v))
                     (build-property-value-block block' property-map v))])))
         (into {}))))

(defn build-properties-with-ref-values
  "Given a properties map with property values to be transacted e.g. from
  build-property-values-tx-m, build a properties map to be transacted with the block"
  [prop-vals-tx-m]
  (update-vals prop-vals-tx-m
               (fn [v]
                 (if (set? v)
                   (set (map #(vector :block/uuid (:block/uuid %)) v))
                   (vector :block/uuid (:block/uuid v))))))
