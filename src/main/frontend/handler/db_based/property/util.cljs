(ns frontend.handler.db-based.property.util
  "DB-graph only utility fns for properties"
  (:require [frontend.db.utils :as db-utils]
            [frontend.db.conn :as conn]
            [frontend.state :as state]
            [logseq.db.frontend.property :as db-property]))

(defn get-property-value
  "Get a property's name given its id"
  [e]
  (if-let [e (if (number? e) (db-utils/pull e) e)]
    (db-property/property-value-content e)
    e))

(defn readable-properties
  "Given a DB graph's properties, returns a readable properties map with keys as
  property names and property values dereferenced where possible. Has some
  overlap with block-macros/properties-by-name"
  ([properties] (readable-properties properties {:original-key? true}))
  ([properties {:keys [original-key? key-fn]
                :or {key-fn identity}}]
   (->> properties
     (map (fn [[k v]]
            (let [prop-ent (db-utils/entity k)]
              [(key-fn (if original-key? k (-> prop-ent :block/title keyword)))
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
