(ns frontend.handler.property.util
  "Utility fns for properties"
  (:require [frontend.db.conn :as conn]
            [frontend.state :as state]
            [logseq.melange.bridge.db.property :as melange-property]))

(def lookup
  "Get the property value by a built-in property's db-ident from block."
  melange-property/lookup)

(defn get-block-property-value
  "Get the value of a built-in block's property by its db-ident"
  [block db-ident]
  (let [db (conn/get-db (state/get-current-repo))]
    (melange-property/get-block-property-value db block db-ident)))
