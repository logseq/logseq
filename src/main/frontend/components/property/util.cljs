(ns frontend.components.property.util
  "Property component utils"
  (:require [frontend.handler.db-based.property :as db-property-handler]))

(defn update-property!
  [property property-name property-schema]
  (when (or (not= (:block/title property) property-name)
            (not= (:block/schema property) property-schema))
    (db-property-handler/upsert-property!
     (:db/ident property)
     property-schema
     {:property-name property-name})))
