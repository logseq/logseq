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
