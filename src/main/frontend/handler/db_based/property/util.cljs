(ns frontend.handler.db-based.property.util
  "DB-graph only utility fns for properties"
  (:require [frontend.db.utils :as db-utils]
            [frontend.db.conn :as conn]
            [frontend.state :as state]
            [logseq.db.frontend.property :as db-property]))

(defn get-property-name
  "Get a property's name given its id"
  [id]
  (:block/title (db-utils/entity id)))

(defn get-property-value
  "Get a property's name given its id"
  [e]
  (if-let [e (if (number? e) (db-utils/pull e) e)]
    (db-property/property-value-content e)
    e))

(defn properties-by-name
  "Given a block from a query result, returns a map of its properties indexed by property names"
  [repo block]
  (let [db (conn/get-db repo)]
    (db-property/properties-by-name db block)))

(defn all-hidden-properties?
  "Checks if the given properties are all hidden properties"
  [properties]
  (every? (fn [id]
            (:hide? (:block/schema (db-utils/entity id)))) properties))

(defn readable-properties
  "Given a DB graph's properties, returns a readable properties map with keys as
  property names and property values dereferenced where possible. Has some
  overlap with db-property/properties-by-name"
  ([properties] (readable-properties properties true))
  ([properties original-key?]
   (->> properties
     (map (fn [[k v]]
            (let [prop-ent (db-utils/entity k)]
              [(if original-key? k (-> prop-ent :block/title keyword))
               (cond
                 (set? v)
                 (set (map db-property/property-value-content v))

                 (sequential? v)
                 (map #(get-property-value (or (:db/id %) %)) v)

                 (:db/id v)
                 (get-property-value (or (:db/id v) v))

                 :else
                 v)])))
     (into {}))))

(defn get-closed-property-values
  [property-id]
  (let [repo (state/get-current-repo)
        db (conn/get-db repo)]
    (db-property/get-closed-property-values db property-id)))
