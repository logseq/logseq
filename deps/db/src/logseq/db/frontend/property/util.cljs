(ns logseq.db.frontend.property.util
  "Util fns for building core property concepts"
  (:require [logseq.db.sqlite.util :as sqlite-util]
            [datascript.core :as d]))

(defonce hidden-page-name-prefix "$$$")

(defn- closed-value-new-block
  [page-id block-id value property]
  {:block/type #{"closed value"}
   :block/format :markdown
   :block/uuid block-id
   :block/page page-id
   :block/metadata {:created-from-property (:block/uuid property)}
   :block/schema {:value value}
   :block/parent page-id})

(defn build-closed-value-block
  "Builds a closed value block to be transacted"
  [block-uuid block-value page-id property {:keys [icon-id icon description]}]
  (cond->
   (closed-value-new-block page-id (or block-uuid (d/squuid)) block-value property)
    icon
    (assoc :block/properties {icon-id icon})

    description
    (update :block/schema assoc :description description)

    true
    sqlite-util/block-with-timestamps))

(defn- build-new-page
  "Builds a basic page to be transacted. A minimal version of gp-block/page-name->map"
  [page-name]
  (sqlite-util/block-with-timestamps
   {:block/name (sqlite-util/sanitize-page-name page-name)
    :block/original-name page-name
    :block/journal? false
    :block/uuid (d/squuid)}))

(defn build-property-hidden-page
  "Builds a hidden property page for closed values to be transacted"
  [property]
  (let [page-name (str hidden-page-name-prefix (:block/uuid property))]
    (-> (build-new-page page-name)
        (assoc :block/type #{"hidden"}
               :block/format :markdown))))

(defn new-property-tx
  "Provide attributes for a new built-in property given name, schema and uuid.
   TODO: Merge this with sqlite-util/build-new-property once gp-util/page-name-sanity-lc
   is available to deps/db"
  [prop-name prop-schema prop-uuid]
  {:block/uuid prop-uuid
   :block/schema (merge {:type :default} prop-schema)
   :block/original-name (name prop-name)
   :block/name (sqlite-util/sanitize-page-name (name prop-name))})

(defn build-closed-values
  "Builds all the tx needed for property with closed values including
   the hidden page and closed value blocks as needed"
  [prop-name property {:keys [icon-id translate-closed-page-value-fn property-attributes]
                       :or {translate-closed-page-value-fn identity}}]
  (let [page-tx (build-property-hidden-page property)
        page-id [:block/uuid (:block/uuid page-tx)]
        closed-value-page-uuids? (contains? #{:page :date} (get-in property [:block/schema :type]))
        closed-value-blocks-tx
        (if closed-value-page-uuids?
          (map translate-closed-page-value-fn (:closed-values property))
          (map (fn [{:keys [value icon description uuid]}]
                 (build-closed-value-block
                  uuid value page-id property {:icon-id icon-id
                                               :icon icon
                                               :description description}))
               (:closed-values property)))
        property-schema (assoc (:block/schema property)
                               :values (mapv :block/uuid closed-value-blocks-tx))
        property-tx (merge (sqlite-util/build-new-property
                            (new-property-tx prop-name property-schema (:block/uuid property)))
                           property-attributes)]
    (into [property-tx page-tx]
          (when-not closed-value-page-uuids? closed-value-blocks-tx))))
