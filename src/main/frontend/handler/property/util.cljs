(ns frontend.handler.property.util
  "Utility fns for properties that are for both file and db graphs.
  Some fns like lookup and get-property were written to easily be backwards
  compatible with file graphs"
  (:require [frontend.state :as state]
            [frontend.db.conn :as conn]
            [logseq.db.frontend.property.util :as db-property-util]))

(defn lookup
  "Get the property value by a built-in property's db-ident from coll. For file and db graphs"
  [coll key]
  (let [repo (state/get-current-repo)]
    (db-property-util/lookup repo coll key)))

(defn get-block-property-value
  "Get the value of a built-in block's property by its db-ident"
  [block db-ident]
  (let [repo (state/get-current-repo)
        db (conn/get-db repo)]
    (db-property-util/get-block-property-value repo db block db-ident)))

(defn get-pid
  "Get a built-in property's id (db-ident or name) given its db-ident. For file and db graphs"
  [db-ident]
  (let [repo (state/get-current-repo)]
    (db-property-util/get-pid repo db-ident)))

(defn block->shape [block]
  (get-block-property-value block :logseq.property.tldraw/shape))

(defn page-block->tldr-page [block]
  (get-block-property-value block :logseq.property.tldraw/page))

(defn shape-block?
  [block]
  (let [repo (state/get-current-repo)
        db (conn/get-db repo)]
    (db-property-util/shape-block? repo db block)))