(ns ^:node-only logseq.db.test.helper
  "Main ns for providing test fns for DB graphs"
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db.frontend.entity-plus :as entity-plus]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(defn find-block-by-content
  "Find first block by exact block string or by fuzzier regex"
  [db content]
  (if (instance? js/RegExp content)
    (->> content
         (d/q '[:find [?b ...]
                :in $ ?pattern
                :where
                [?b :block/title ?content]
                [?b :block/page]
                [(re-find ?pattern ?content)]]
              db)
         first
         (d/entity db))
    (->> content
         (d/q '[:find [?b ...]
                :in $ ?content
                :where
                [?b :block/title ?content]
                [?b :block/page]]
              db)
         first
         (d/entity db))))

(defn find-page-by-title
  "Find first page by its title"
  [db title]
  (->> title
       (d/q '[:find [?b ...]
              :in $ ?title
              :where [?b :block/title ?title]]
            db)
       first
       (d/entity db)))

(defn readable-properties
  "Returns an entity's properties and tags in readable form for assertions.
   tags are included here since they behave like properties on an ent"
  [ent]
  (->> (db-property/properties ent)
       (mapv (fn [[k v]]
               [k
                (cond
                  (= :block/tags k)
                  (mapv :db/ident v)
                  (and (set? v) (every? de/entity? v))
                  (set (map db-property/property-value-content v))
                  (de/entity? v)
                  (or (:db/ident v) (db-property/property-value-content v))
                  :else
                  v)]))
       (into {})))

(defn create-conn
  "Create a conn for a DB graph seeded with initial data"
  []
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
        _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))]
    (entity-plus/reset-immutable-entities-cache!)
    conn))

(defn create-conn-with-blocks
  "Create a conn with create-db-conn and then create blocks using sqlite-build"
  [opts]
  (let [conn (create-conn)
        _ (sqlite-build/create-blocks conn opts)]
    conn))
