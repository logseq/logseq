(ns logseq.db.frontend.property.build
  "Builds core property concepts"
  (:require [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.order :as db-order]
            [datascript.core :as d]))

(defn- closed-value-new-block
  [block-id value property]
  (let [property-id (:db/ident property)]
    {:block/type #{"closed value"}
     :block/format :markdown
     :block/uuid block-id
     :block/page property-id
     :block/content value
     :block/closed-value-property property-id
     :block/parent property-id}))

(defn build-closed-value-block
  "Builds a closed value block to be transacted"
  [block-uuid block-value property {:keys [db-ident icon description]}]
  (assert block-uuid (uuid? block-uuid))
  (cond->
   (closed-value-new-block block-uuid block-value property)
    (and db-ident (keyword? db-ident))
    (assoc :db/ident db-ident)

    icon
    (assoc :logseq.property/icon icon)

    ;; For now, only closed values with :db/ident are built-in?
    (and db-ident (keyword? db-ident))
    sqlite-util/mark-block-as-built-in

    description
    (update :block/schema assoc :description description)

    true
    sqlite-util/block-with-timestamps))

(defn build-closed-values
  "Builds all the tx needed for property with closed values including
   the hidden page and closed value blocks as needed"
  [db-ident prop-name property {:keys [property-attributes]}]
  (let [property-schema (:block/schema property)
        property-tx (merge (sqlite-util/build-new-property db-ident property-schema {:original-name prop-name
                                                                                     :ref-type? true})
                           property-attributes)
        ref-type? (contains? (set (remove #{:default} db-property-type/ref-property-types))
                             (get-in property [:block/schema :type]))
        hidden-tx
        ;; closed ref types don't have hidden tx
        (if ref-type?
          []
          (let [closed-value-blocks-tx
                (map (fn [{:keys [db-ident value icon description uuid]}]
                       (cond->
                        (build-closed-value-block
                         uuid
                         value
                         property
                         {:db-ident db-ident :icon icon :description description})
                         true
                         (assoc :block/order (db-order/gen-key))))
                     (:closed-values property))]
            closed-value-blocks-tx))]
    (into [property-tx] hidden-tx)))

(defn build-property-value-block
  [block property value]
  (-> {:block/uuid (d/squuid)
       :block/format :markdown
       :block/content value
       :block/page (if (:block/page block)
                     (:db/id (:block/page block))
                     ;; page block
                     (:db/id block))
       :block/parent (:db/id block)
       :logseq.property/created-from-property (or (:db/id property)
                                                  {:db/ident (:db/ident property)})
       :block/order (db-order/gen-key)}
      sqlite-util/block-with-timestamps))
