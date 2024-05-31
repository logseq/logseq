(ns frontend.handler.db-based.property.util
  "DB-graph only utility fns for properties"
  (:require [frontend.db.utils :as db-utils]
            [frontend.db :as db]
            [logseq.db.frontend.property :as db-property]))

(defn get-property-name
  "Get a property's name given its id"
  [e]
  (:block/original-name (if (number? e) (db-utils/pull e) e)))

(defn get-property-value
  "Get a property's name given its id"
  [e]
  (if-let [e (if (number? e) (db-utils/pull e) e)]
    (or (:block/content e)
      (:block/original-name e))
    e))

(defn all-hidden-properties?
  "Checks if the given properties are all hidden properties"
  [properties]
  (every? (fn [id]
            (:hide? (:block/schema (db/entity id)))) properties))

(defn readable-properties
  "Given a DB graph's properties, returns a readable properties map with keys as
  property names and property values dereferenced where possible. A property's
  value will only be a uuid if it's a page or a block"
  ([properties] (readable-properties properties true))
  ([properties original-key?]
   (->> properties
     (map (fn [[k v]]
            (let [prop-ent (db-utils/entity k)]
              [(if original-key? k (-> prop-ent :block/original-name keyword))
               (cond
                 (set? v)
                 (set (map db-property/get-property-value-name v))

                 (sequential? v)
                 (map #(get-property-value (or (:db/id %) %)) v)

                 (:db/id v)
                 (get-property-value (or (:db/id v) v))

                 :else
                 v)])))
     (into {}))))
