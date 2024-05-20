(ns frontend.handler.db-based.property.util
  "DB-graph only utility fns for properties"
  (:require [frontend.db.utils :as db-utils]
            [frontend.db :as db]
            [logseq.db.frontend.property :as db-property]))

(defn get-property-name
  "Get a property's name given its id"
  [id]
  (:block/original-name (db-utils/entity id)))

(defn all-hidden-properties?
  "Checks if the given properties are all hidden properties"
  [properties]
  (every? (fn [id]
            (:hide? (:block/schema (db/entity id)))) properties))

(defn readable-properties
  "Given a DB graph's properties, returns a readable properties map with keys as
  property names and property values dereferenced where possible. A property's
  value will only be a uuid if it's a page or a block"
  [properties]
  (->> properties
       (map (fn [[k v]]
              (let [prop-ent (db-utils/entity k)]
                [(-> prop-ent :block/original-name keyword)
                (if (set? v)
                  (set (map db-property/get-property-value-name v))
                  (db-property/get-property-value-name v))])))
       (into {})))
