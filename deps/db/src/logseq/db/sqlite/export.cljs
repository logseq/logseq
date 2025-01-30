(ns logseq.db.sqlite.export
  "Builds sqlite.build EDN to represent nodes in a graph-agnostic way.
   Useful for exporting and importing across DB graphs"
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.frontend.class :as db-class]))

(defn build-entity-export
  "Given entity id, build an EDN export map"
  [db eid]
  (let [entity (d/entity db eid)
        properties (dissoc (db-property/properties entity) :block/tags)
        user-defined-properties (concat (remove db-property/logseq-property? (keys properties))
                                        (->> (:block/tags entity)
                                             (mapcat :logseq.property.class/properties)
                                             (map :db/ident)))
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
    (cond-> {:build/block result}
      (seq (:block/tags entity))
      (assoc :classes
             (->> (:block/tags entity)
                  (remove #(db-class/logseq-class? (:db/ident %)))
                  ;; TODO: Export class parents when there's ability to control granularity of export
                  (map #(vector (:db/ident %)
                                (cond-> (select-keys % [:block/title])
                                 (:logseq.property.class/properties %)
                                  (assoc :build/class-properties
                                         (mapv :db/ident (:logseq.property.class/properties %))))))
                  (into {})))
      (seq user-defined-properties)
      (assoc :properties
             (->> user-defined-properties
                  (map (fn [ident]
                         [ident (select-keys (d/entity db ident)
                                             (-> (disj db-property/schema-properties :logseq.property/classes)
                                                 (conj :block/title)))]))
                  (into {}))))))

(defn build-entity-import
  "Given an entity's export map, build the import tx to create it"
  [db {:build/keys [block] :keys [properties classes]}]
  (let [opts (cond-> {:pages-and-blocks [{:page (select-keys (:block/page block) [:block/uuid])
                                          :blocks [(dissoc block :block/page)]}]
                      :build-existing-tx? true}
               (seq classes)
               (assoc :classes
                      (->> classes
                           (map (fn [[k v]]
                                  (if-let [ent (d/entity db k)]
                                    [k (assoc v :block/uuid (:block/uuid ent))]
                                    [k v])))
                           (into {})))
               (seq properties)
               (assoc :properties
                      (->> properties
                           (map (fn [[k v]]
                                  (if-let [ent (d/entity db k)]
                                    [k (assoc v :block/uuid (:block/uuid ent))]
                                    [k v])))
                           (into {}))))]
    (sqlite-build/build-blocks-tx opts)))

(defn merge-export-map
  "Merges export map with the block that will receive the import"
  [existing-block export-map]
  (merge-with merge
              export-map
              {:build/block
               {:block/uuid (:block/uuid existing-block)
                :block/page (select-keys (:block/page existing-block) [:block/uuid])}}))