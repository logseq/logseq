(ns frontend.handler.property.util
  "Utility fns for properties that are for both file and db graphs.
  Some fns like lookup and get-property were written to easily be backwards
  compatible with file graphs"
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.property :as db-property]))

(defn lookup
  "Get the value of coll's (a map) by db-ident. For file and db graphs"
  [coll key]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/lookup repo db coll key)))

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
      (when-let [property (d/entity db [:block/name (common-util/page-name-sanity-lc property-name)])]
        (get coll (:block/uuid property)))
      (get coll key))))

(defn get-block-property-value
  "Get the value of a built-in block's property by its db-ident"
  [block db-ident]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/get-block-property-value repo db block db-ident)))

(defn get-property
  "Get a property given its unsanitized name"
  [property-name]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (d/entity db [:block/name (common-util/page-name-sanity-lc (name property-name))])))

;; TODO: move this to another ns
(defn get-page-uuid
  "Get a user property's uuid given its unsanitized name"
  ;; Get a page's uuid given its unsanitized name
  [property-name]
  (:block/uuid (get-property property-name)))

(defn get-pid
  "Get a built-in property's id (name or uuid) given its db-ident. For file and db graphs"
  [db-ident]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/get-pid repo db db-ident)))

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
  [property-name]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/get-closed-property-values db property-name)))

(defn get-closed-value-entity-by-name
  [property-name value-name]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/get-closed-value-entity-by-name db property-name value-name)))
