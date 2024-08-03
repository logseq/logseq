(ns logseq.db.frontend.property.build
  "Builds core property concepts"
  (:require [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.order :as db-order]
            [datascript.core :as d]
            [logseq.db.frontend.property.type :as db-property-type]))

(defn- closed-value-new-block
  [block-id value property]
  (let [property-id (:db/ident property)]
    (merge {:block/type "closed value"
            :block/format :markdown
            :block/uuid block-id
            :block/page property-id
            :block/closed-value-property property-id
            :logseq.property/created-from-property property-id
            :block/parent property-id}
           (if (db-property-type/original-value-ref-property-types (get-in property [:block/schema :type]))
             {:property.value/content value}
             {:block/title value}))))

(defn build-closed-value-block
  "Builds a closed value block to be transacted"
  [block-uuid block-value property {:keys [db-ident icon]}]
  (assert block-uuid (uuid? block-uuid))
  (cond->
   (closed-value-new-block block-uuid block-value property)
    (and db-ident (keyword? db-ident))
    (assoc :db/ident db-ident)

    icon
    (assoc :logseq.property/icon icon)

    true
    sqlite-util/block-with-timestamps))

(defn build-closed-values
  "Builds all the tx needed for property with closed values including
   the hidden page and closed value blocks as needed"
  [db-ident prop-name property {:keys [property-attributes]}]
  (let [property-schema (:block/schema property)
        property-tx (merge (sqlite-util/build-new-property db-ident property-schema {:title prop-name
                                                                                     :ref-type? true})
                           property-attributes)]
    (into [property-tx]
          (map (fn [{:keys [db-ident value icon uuid]}]
                 (cond->
                  (build-closed-value-block
                   uuid
                   value
                   property
                   {:db-ident db-ident :icon icon})
                   true
                   (assoc :block/order (db-order/gen-key))))
               (:closed-values property)))))

(defn build-property-value-block
  "Builds a property value entity given a block map/entity, a property entity or
  ident and its property value"
  [block property value]
  (-> (merge
       {:block/uuid (d/squuid)
        :block/format :markdown
        :block/page (if (:block/page block)
                      (:db/id (:block/page block))
                     ;; page block
                      (:db/id block))
        :block/parent (:db/id block)
        :logseq.property/created-from-property (or (:db/id property) {:db/ident (:db/ident property)})
        :block/order (db-order/gen-key)}
       (if (db-property-type/original-value-ref-property-types (get-in property [:block/schema :type]))
         {:property.value/content value}
         {:block/title value}))
      sqlite-util/block-with-timestamps))

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
