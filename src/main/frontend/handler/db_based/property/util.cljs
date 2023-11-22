(ns frontend.handler.db-based.property.util
  "DB-graph only utility fns for properties"
  (:require [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [logseq.db.frontend.property :as db-property]
            [logseq.graph-parser.util :as gp-util]
            [clojure.set :as set]))

(defn get-property-name
  "Get a property's name given its uuid"
  [uuid]
  (:block/original-name (db-utils/entity [:block/uuid uuid])))

(defn get-built-in-property-uuid
  "Get a built-in property's uuid given its name"
  ([property-name] (get-built-in-property-uuid (state/get-current-repo) property-name))
  ([repo property-name]
   (:block/uuid (db-utils/entity repo [:block/name (name property-name)]))))

(defn get-user-property-uuid
  "Get a user property's uuid given its unsanitized name"
  ([property-name] (get-user-property-uuid (state/get-current-repo) property-name))
  ([repo property-name]
   (:block/uuid (db-utils/entity repo [:block/name (gp-util/page-name-sanity-lc (name property-name))]))))

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
              (let [prop-ent (db-utils/entity [:block/uuid k])
                    readable-property-val
                    #(if (seq (get-in prop-ent [:block/schema :values])) ; closed values
                       (when-let [block (db-utils/entity [:block/uuid %])]
                         (or (:block/original-name block)
                             (get-in block [:block/schema :value])))
                       %)]
                [(-> prop-ent :block/name keyword)
                (if (set? v)
                  (set (map readable-property-val v))
                  (readable-property-val v))])))
       (into {})))

(defn property-value-when-closed
  "Returns property value if the given entity is type 'closed value' or nil"
  [ent]
  (when (contains? (:block/type ent) "closed value")
    (get-in ent [:block/schema :value])))