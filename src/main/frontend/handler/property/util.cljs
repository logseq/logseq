(ns frontend.handler.property.util
  "Utility fns for properties that are for both file and db graphs.
  Some fns like lookup and get-property were written to easily be backwards
  compatible with file graphs"
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [logseq.graph-parser.util :as gp-util]
            [frontend.db :as db]
            [frontend.util :as util]
            [logseq.db.frontend.property :as db-property]))

(defn lookup
  "Get the value of coll's (a map) `key`. For file and db graphs"
  [coll key]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/lookup repo db coll key)))

(defn get-property
  "Get the value of block's property `key`"
  [block key]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/get-property repo db block key)))

(defn get-page-uuid
  "Get a user property's uuid given its unsanitized name"
  ;; Get a page's uuid given its unsanitized name
  ([property-name] (get-page-uuid (state/get-current-repo) property-name))
  ([repo property-name]
   (:block/uuid (db/entity repo [:block/name (gp-util/page-name-sanity-lc (name property-name))]))))

(defn get-pid
  "Get a property's id (name or uuid) given its name. For file and db graphs"
  [property-name]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/get-pid repo db property-name)))

(defn block->shape [block]
  (get-property block :logseq.tldraw.shape))

(defn page-block->tldr-page [block]
  (get-property block :logseq.tldraw.page))

(defn shape-block?
  [block]
  (let [repo (state/get-current-repo)
        db (db/get-db repo)]
    (db-property/shape-block? repo db block)))
