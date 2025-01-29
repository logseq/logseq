(ns logseq.db.sqlite.export
  "Builds sqlite.build EDN to represent nodes in a graph-agnostic way.
   Useful for exporting and importing across DB graphs"
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.build :as sqlite-build]))

(defn build-entity-export
  "Given entity id, build an EDN map"
  [db eid]
  (let [entity (d/entity db eid)
        properties (dissoc (:block/properties entity) :block/tags)
        result (cond-> (select-keys entity [:block/title])
                 (seq (:block/tags entity))
                 (assoc :build/tags
                        (mapv :db/ident (:block/tags entity)))
                 (seq properties)
                 (assoc :build/properties
                        (->> properties
                             (map (fn [[k v]]
                                    [k
                                     ;; Copied from readable-properties
                                     (cond
                                       (de/entity? v)
                                       (or (:db/ident v) (db-property/property-value-content v))
                                       (and (set? v) (every? de/entity? v))
                                       (set (map db-property/property-value-content v))
                                       :else
                                       v)]))
                             (into {}))))]
    result))

(defn build-entity-import
  "Given an entity's export map, build the import tx to create it"
  [db block]
  (let [opts (cond-> {:pages-and-blocks [{:page (select-keys (:block/page block) [:block/title :block/uuid])
                                          :blocks [block]}]
                      :build-existing-tx? true}
               (seq (:build/properties block))
               (assoc :properties (into {}
                                        (map #(vector % (select-keys (d/entity db %) [:logseq.property/type]))
                                             (keys (:build/properties block))))))]
    (sqlite-build/build-blocks-tx opts)))