(ns frontend.components.property.util
  "Property component utils"
  (:require [frontend.state :as state]
            [frontend.handler.db-based.property :as db-property-handler]))

(defn update-property!
  [property property-name property-schema]
  (db-property-handler/<update-property!
   (state/get-current-repo)
   (:db/ident property)
   {:property-name property-name
    :property-schema property-schema}))
