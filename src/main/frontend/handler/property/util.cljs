(ns frontend.handler.property.util
  "Utility fns for properties that are for both file and db graphs.
  Some fns like lookup and get-property were written to easily be backwards
  compatible with file graphs"
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [logseq.db.frontend.property :as db-property]))

(defn lookup
  "Get the value of coll's (a map) `key`. For file and db graphs"
  [coll key]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/lookup repo db coll key)))

(defn get-block-property-value
  "Get the value of block's property `key`"
  [block key]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/get-block-property-value repo db block key)))

(defn get-property
  "Get a property given its unsanitized name"
  [property-name]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/get-property db property-name)))

;; TODO: move this to another ns
(defn get-page-uuid
  "Get a user property's uuid given its unsanitized name"
  ;; Get a page's uuid given its unsanitized name
  [property-name]
  (:block/uuid (get-property property-name)))

(defn get-pid
  "Get a property's id (name or uuid) given its name. For file and db graphs"
  [property-name]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/get-pid repo db property-name)))

(defn block->shape [block]
  (get-block-property-value block :logseq.tldraw.shape))

(defn page-block->tldr-page [block]
  (get-block-property-value block :logseq.tldraw.page))

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
