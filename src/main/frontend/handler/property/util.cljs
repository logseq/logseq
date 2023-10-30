(ns frontend.handler.property.util
  "Utility fns for properties. Most of these are used in file or db graphs.
  Some fns like lookup and get-property were written to easily be backwards
  compatible with file graphs"
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [logseq.db.frontend.property :as db-property]
            [logseq.graph-parser.util :as gp-util]
            [frontend.db :as db]
            [clojure.set :as set]
            [frontend.util :as util]))

(defn lookup
  "Get the value of coll's (a map) `key`. For file and db graphs"
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
  (let [block (or (db/entity (:db/id block)) block)]
    (when-let [properties (:block/properties block)]
      (lookup properties key))))

(defn get-property-name
  "Get a property's name given its uuid"
  [uuid]
  (:block/original-name (db/entity [:block/uuid uuid])))

(defn get-built-in-property-uuid
  "Get a built-in property's uuid given its name"
  ([property-name] (get-built-in-property-uuid (state/get-current-repo) property-name))
  ([repo property-name]
   (:block/uuid (db/entity repo [:block/name (name property-name)]))))

(defn get-user-property-uuid
  "Get a user property's uuid given its unsanitized name"
  ([property-name] (get-user-property-uuid (state/get-current-repo) property-name))
  ([repo property-name]
   (:block/uuid (db/entity repo [:block/name (gp-util/page-name-sanity-lc (name property-name))]))))

;; Get a page's uuid given its unsanitized name
(def get-page-uuid get-user-property-uuid)

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

(defonce *hidden-built-in-properties (atom #{}))

(defn all-hidden-built-in-properties?
  "Checks if the given properties are all hidden built-in properties"
  [properties]
  (let [repo (state/get-current-repo)]
    (when (empty? @*hidden-built-in-properties)
      (let [built-in-properties (set (map #(get-built-in-property-uuid repo (name %))
                                          db-property/hidden-built-in-properties))]
        (reset! *hidden-built-in-properties built-in-properties)))
    (set/subset? (set properties) @*hidden-built-in-properties)))

(defn readable-properties
  "Given a DB graph's properties, returns a readable properties map with keys as
  property names and property values dereferenced where possible. A property's
  value will only be a uuid if it's a page or a block"
  [properties]
  (->> properties
       (map (fn [[k v]]
              (let [prop-ent (db/entity [:block/uuid k])]
                [(-> prop-ent
                     :block/name
                     keyword)
                 (if (seq (get-in prop-ent [:block/schema :values])) ; closed values
                   (when-let [block (db/entity [:block/uuid v])]
                     (or (:block/original-name block)
                         (get-in block [:block/schema :value])))
                   v)])))
       (into {})))
