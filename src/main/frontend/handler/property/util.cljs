(ns frontend.handler.property.util
  "Utility fns for properties that are for both file and db graphs.
  Some fns like lookup and get-property were written to easily be backwards
  compatible with file graphs"
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [logseq.graph-parser.util :as gp-util]
            [frontend.db :as db]
            [frontend.util :as util]))

(defn lookup
  "Get the value of coll's (a map) `key`. For file and db graphs"
  [coll key]
  (let [repo (state/get-current-repo)
        property-name (if (keyword? key)
                        (name key)
                        key)]
    (if (config/db-based-graph? repo)
      (when-let [property (db/entity repo [:block/name (gp-util/page-name-sanity-lc property-name)])]
        (get coll (:block/uuid property)))
      (get coll key))))

(defn get-property
  "Get the value of block's property `key`"
  [block key]
  (let [block (or (db/entity (:db/id block)) block)]
    (when-let [properties (:block/properties block)]
      (lookup properties key))))

(defn get-page-uuid
  "Get a user property's uuid given its unsanitized name"
  ;; Get a page's uuid given its unsanitized name
  ([property-name] (get-page-uuid (state/get-current-repo) property-name))
  ([repo property-name]
   (:block/uuid (db/entity repo [:block/name (gp-util/page-name-sanity-lc (name property-name))]))))

(defn get-pid
  "Get a property's id (name or uuid) given its name. For file and db graphs"
  [property-name]
  (let [repo (state/get-current-repo)]
    (if (config/db-based-graph? repo)
      (:block/uuid (db/entity [:block/name (util/page-name-sanity-lc (name property-name))]))
      property-name)))

(defn block->shape [block]
  (get-property block :logseq.tldraw.shape))

(defn page-block->tldr-page [block]
  (get-property block :logseq.tldraw.page))

(defn shape-block? [block]
  (= :whiteboard-shape (get-property block :ls-type)))
