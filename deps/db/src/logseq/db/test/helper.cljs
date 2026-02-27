(ns ^:node-only logseq.db.test.helper
  "Main ns for providing test fns for DB graphs"
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.sqlite.export :as sqlite-export]))

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

(defn find-journal-by-journal-day
  [db journal-day]
  (->> journal-day
       (d/q
        '[:find [?page ...]
          :in $ ?journal-day
          :where
          [?page :block/journal-day ?journal-day]]
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
                  (#{:block/tags :logseq.property.class/extends} k)
                  (mapv :db/ident v)
                  (and (set? v) (every? de/entity? v))
                  (set (map db-property/property-value-content v))
                  (de/entity? v)
                  (or (:db/ident v) (db-property/property-value-content v))
                  :else
                  v)]))
       (into {})))

(def create-conn sqlite-export/create-conn)

(defn create-conn-with-blocks
  "Create a conn with create-conn and then create blocks using sqlite-build"
  [opts]
  (let [conn (create-conn)
        _ (sqlite-build/create-blocks conn opts)]
    conn))

(defn create-conn-with-import-map
  "Create a conn with create-conn and then create/upsert entities using sqlite-export/build-import.
   Unlike create-conn-with-blocks, this fn can upsert existing entities"
  [export-map]
  (let [conn (create-conn)
        {:keys [init-tx block-props-tx misc-tx]}
        (sqlite-export/build-import (dissoc export-map ::sqlite-export/graph-files) @conn {})
        _ (d/transact! conn (concat init-tx block-props-tx misc-tx))
        ;; Handle graph-files separately b/c build-import can't upsert them
        _ (when (::sqlite-export/graph-files export-map)
            (d/transact! conn (::sqlite-export/graph-files export-map)))]
    conn))

(defmacro silence-stderr
  "Silence stderr as successful tests should print long stderr messages"
  [& body]
  `(let [orig-write# (.-write js/process.stderr)]
     (set! (.-write js/process.stderr)
           (fn [& _] true))
     (try
       ~@body
       (finally
         (set! (.-write js/process.stderr) orig-write#)))))
