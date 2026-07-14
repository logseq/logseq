(ns frontend.handler.db-based.property.util
  "DB-graph only utility fns for properties"
  (:require [logseq.db.frontend.property :as db-property]))

(defn get-property-value
  "Get a property's name given its id"
  [e]
  (if-let [e (when-not (number? e) e)]
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
               (let [property-key (if original-key?
                                    k
                                    (-> (name k) keyword))]
                 [(key-fn property-key)
                  (cond
                    (set? v)
                    (set (map db-property/property-value-content v))

                    (sequential? v)
                    (map get-property-value v)

                    (map? v)
                    (get-property-value v)

                    :else
                    v)])))
        (into {}))))

(defn get-closed-property-values
  [property-id]
  (some->> (db-property/built-in-closed-values property-id)
           (map-indexed
            (fn [index {:keys [db-ident value uuid icon properties]}]
              (merge
               {:db/ident db-ident
                :block/title value
                :block/uuid uuid
                :block/order index}
               (when icon
                 {:logseq.property/icon icon})
               properties)))
           vec))
