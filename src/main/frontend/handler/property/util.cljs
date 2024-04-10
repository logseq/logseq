(ns frontend.handler.property.util
  "Utility fns for properties that are for both file and db graphs.
  Some fns like lookup and get-property were written to easily be backwards
  compatible with file graphs"
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [datascript.core :as d]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.property :as db-property]))

(defn lookup
  "Get the value of coll's (a map) by db-ident. For file and db graphs"
  [coll key]
  (let [repo (state/get-current-repo)]
    (db-property/lookup repo coll key)))

(defn lookup-by-name
  "Get the value of coll's (a map) by name. Only use this
   for file graphs or for db graphs when user properties are involved"
  [coll key]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)
        property-name (if (keyword? key)
                        (name key)
                        key)]
    (if (sqlite-util/db-based-graph? repo)
      (when-let [property (d/entity db (db-property/create-user-property-ident-from-name property-name))]
        (get coll (:block/uuid property)))
      (get coll key))))

(defn get-block-property-value
  "Get the value of a built-in block's property by its db-ident"
  [block db-ident]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/get-block-property-value repo db block db-ident)))

(defn get-pid
  "Get a built-in property's id (db-ident or name) given its db-ident. For file and db graphs"
  [db-ident]
  (let [repo (state/get-current-repo)]
    (db-property/get-pid repo db-ident)))

(defn block->shape [block]
  (get-block-property-value block :logseq.property.tldraw/shape))

(defn page-block->tldr-page [block]
  (get-block-property-value block :logseq.property.tldraw/page))

(defn shape-block?
  [block]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/shape-block? repo db block)))

(defn get-closed-property-values
  [property-id]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/get-closed-property-values db property-id)))

(defn get-closed-value-entity-by-name
  [property-id value-name]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/get-closed-value-entity-by-name db property-id value-name)))
