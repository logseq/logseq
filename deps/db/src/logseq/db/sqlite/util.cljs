(ns logseq.db.sqlite.util
  "Utils fns for backend sqlite db"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.string :as string]))

(defn- type-of-block
  "
  TODO: use :block/type
  FIXME: 4 isn't used. Delete it?
  | value | meaning                                        |
  |-------+------------------------------------------------|
  |     1 | normal block                                   |
  |     2 | page block                                     |
  |     3 | init data, (config.edn, custom.js, custom.css) |
  |     4 | db schema                                      |
  |     5 | unknown type                                   |
  |     6 | property block                                 |
  |     7 | macro                                          |
  "
  [block]
  (cond
    (:block/page block) 1
    (some #{:file/content :schema/version :db/type} (keys block)) 3
    (contains? (:block/type block) "property") 6
    (:block/name block) 2
    (contains? (set (:block/type block)) "macro") 7
    :else 5))

(defonce db-version-prefix "logseq_db_")

(defn time-ms
  "Copy of util/time-ms. Too basic to couple this to main app"
  []
  (tc/to-long (t/now)))

(defn ds->sqlite-block
  "Convert a datascript block to a sqlite map in preparation for a sqlite-db fn"
  [b]
  {:uuid (str (:block/uuid b))
   :type (type-of-block b)
   :page_uuid (str (:page_uuid b))
   :page_journal_day (:block/journal-day b)
   :name (or (:file/path b) (:block/name b))
   :content (or (:file/content b) (:block/content b))
   :datoms (:datoms b)
   :created_at (or (:block/created-at b) (time-ms))
   :updated_at (or (:block/updated-at b) (time-ms))})

(defn block-with-timestamps
  "Adds updated-at timestamp and created-at if it doesn't exist"
  [block]
  (let [updated-at (time-ms)
        block (cond->
               (assoc block :block/updated-at updated-at)
                (nil? (:block/created-at block))
                (assoc :block/created-at updated-at))]
    block))

(defn sanitize-page-name
  "Prepares a string for insertion to :block/name. Not using
  gp-util/page-name-sanity-lc yet because it's unclear if db graphs have all the
  same naming constraints"
  [s]
  (string/lower-case s))

(defn build-new-property
  "Build a standard new property so that it is is consistent across contexts"
  [block]
  (block-with-timestamps
   (merge {:block/type "property"
           :block/journal? false
           :block/format :markdown}
          block)))