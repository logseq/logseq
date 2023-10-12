(ns frontend.handler.property.util
  "Utility fns for properties. Most of these are used in file or db graphs.
  Some fns like lookup and get-property were written to easily be backwards
  compatible with file graphs"
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [logseq.db.property :as db-property]
            [logseq.graph-parser.util :as gp-util]
            [frontend.db :as db]
            [clojure.set :as set]
            [frontend.util :as util]))

(defn lookup
  "Get the value of coll's (a map) `key`"
  [coll key]
  (let [repo (state/get-current-repo)]
    (if (and (config/db-based-graph? repo)
             (keyword? key))
      (when-let [property (db/entity repo [:block/name (gp-util/page-name-sanity-lc (name key))])]
        (get coll (:block/uuid property)))
      (get coll key))))

(defn get-property
  "Get the value of block's property `key`"
  [block key]
  (let [block (db/entity (:db/id block))]
    (when-let [properties (:block/properties block)]
      (lookup properties key))))

(defn get-property-name
  "Get a property's name given its uuid"
  [uuid]
  (:block/original-name (db/entity [:block/uuid uuid])))

(defn get-pid
  "Get a property's id (name or uuid) given its name"
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

(defonce *db-built-in-properties (atom {}))

(defn all-built-in-properties?
  [properties]
  (let [repo (state/get-current-repo)]
    (when (empty? @*db-built-in-properties)
      (let [built-in-properties (set (map
                                      (fn [p]
                                        (:block/uuid (db/entity [:block/name (name p)])))
                                      db-property/built-in-properties-keys))]
        (swap! *db-built-in-properties assoc repo built-in-properties)))
    (set/subset? (set properties) (get @*db-built-in-properties repo))))
