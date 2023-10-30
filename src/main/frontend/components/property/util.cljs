(ns frontend.components.property.util
  "Property component utils"
  (:require [frontend.state :as state]
            [frontend.handler.property :as property-handler]))

(defn- update-property!
  [property property-name property-schema]
  (property-handler/update-property!
   (state/get-current-repo)
   (:block/uuid property)
   {:property-name property-name
    :property-schema property-schema}))
