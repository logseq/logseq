(ns frontend.handler.property.util
  "Utility fns for properties that are for both file and db graphs.
  Some fns like lookup and get-property were written to easily be backwards
  compatible with file graphs"
  (:require [frontend.db.conn :as conn]
            [frontend.state :as state]
            [logseq.db.frontend.property :as db-property]))

(def lookup
  "Get the property value by a built-in property's db-ident from block."
  db-property/lookup)

(defn get-block-property-value
  "Get the value of a built-in block's property by its db-ident"
  [block db-ident]
  (let [db (conn/get-db (state/get-current-repo))]
    (db-property/get-block-property-value db block db-ident)))

(defn shape-block?
  [block]
  (let [repo (state/get-current-repo)
        db (conn/get-db repo)]
    (db-property/shape-block? db block)))
