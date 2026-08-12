(ns frontend.handler.property.util
  "Utility fns for properties"
  (:require [logseq.db.frontend.property :as db-property]))

(def lookup
  "Get the property value by a built-in property's db-ident from block."
  db-property/lookup)

(defn get-block-property-value
  "Get the value of a built-in block's property by its db-ident"
  [block db-ident]
  (db-property/lookup block db-ident))
