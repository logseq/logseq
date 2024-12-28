(ns ^:node-only logseq.db.test.helper
  "Main ns for providing test fns for DB graphs"
  (:require [datascript.core :as d]
            [logseq.db.frontend.entity-plus :as entity-plus]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(defn find-block-by-content
  "Find first block by exact block string or by fuzzier regex"
  [db content]
  (if (instance? js/RegExp content)
    (->> content
         (d/q '[:find [(pull ?b [*]) ...]
                :in $ ?pattern
                :where
                [?b :block/title ?content]
                [?b :block/page]
                [(re-find ?pattern ?content)]]
              db)
         first)
    (->> content
         (d/q '[:find [(pull ?b [*]) ...]
                :in $ ?content
                :where
                [?b :block/title ?content]
                [?b :block/page]]
              db)
         first)))

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
