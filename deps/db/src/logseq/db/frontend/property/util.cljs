(ns logseq.db.frontend.property.util
  "Util fns for building core property concepts"
  (:require [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.default :as default-db]
            [datascript.core :as d]))

(defonce hidden-page-name-prefix "$$$")

(defn- closed-value-new-block
  [page-id block-id value property]
  {:block/type #{"closed value"}
   :block/format :markdown
   :block/uuid block-id
   :block/page page-id
   :logseq.property/created-from-property (:db/ident property)
   :block/schema {:value value}
   :block/parent page-id})

(defn build-closed-value-block
  "Builds a closed value block to be transacted"
  [block-uuid block-value page-id property {:keys [db-ident icon description]}]
  (cond->
   (closed-value-new-block page-id (or block-uuid (d/squuid)) block-value property)
    (and db-ident (keyword? db-ident))
    (assoc :db/ident db-ident)

    icon
    (assoc :logseq.property/icon icon)

    ;; For now, only closed values with :db/ident are built-in?
    (and db-ident (keyword? db-ident))
    default-db/mark-block-as-built-in

    description
    (update :block/schema assoc :description description)

    true
    sqlite-util/block-with-timestamps))

(defn build-property-hidden-page
  "Builds a hidden property page for closed values to be transacted"
  [property]
  (let [page-name (str hidden-page-name-prefix (:block/uuid property))]
    (-> (sqlite-util/build-new-page page-name)
        (assoc :block/type #{"hidden"}))))

(defn build-closed-values
  "Builds all the tx needed for property with closed values including
   the hidden page and closed value blocks as needed"
  [db-ident prop-name property {:keys [translate-closed-page-value-fn property-attributes]
                                :or {translate-closed-page-value-fn identity}}]
  (let [page-tx (build-property-hidden-page property)
        page-id [:block/uuid (:block/uuid page-tx)]
        closed-value-page-uuids? (contains? #{:page :date} (get-in property [:block/schema :type]))
        closed-value-blocks-tx
        (if closed-value-page-uuids?
          (map translate-closed-page-value-fn (:closed-values property))
          (map (fn [{:keys [db-ident value icon description uuid]}]
                 (build-closed-value-block
                  uuid value page-id property {:db-ident db-ident
                                               :icon icon
                                               :description description}))
               (:closed-values property)))
        property-schema (assoc (:block/schema property)
                               :values (mapv :block/uuid closed-value-blocks-tx))
        property-tx (merge (sqlite-util/build-new-property db-ident prop-name property-schema)
                           property-attributes)]
    (into [property-tx page-tx]
          (when-not closed-value-page-uuids? closed-value-blocks-tx))))
