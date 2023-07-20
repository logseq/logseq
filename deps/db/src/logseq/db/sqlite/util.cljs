(ns logseq.db.sqlite.util
  "Utils fns for backend sqlite db"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cognitect.transit :as transit]
            [logseq.db.schema :as db-schema]))

(defn- type-of-block
  "
  TODO: use :block/type
  | value | meaning                                        |
  |-------+------------------------------------------------|
  |     1 | normal block                                   |
  |     2 | page block                                     |
  |     3 | init data, (config.edn, custom.js, custom.css) |
  |     4 | db schema                                      |
  |     5 | unknown type                                   |
  |     6 | property block                                 |
  "
  [block]
  (cond
    (:block/page block) 1
    (:file/content block) 3
    (= "property" (:block/type block)) 6
    (:block/name block) 2
    :else 5))

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

(defn block-map->datoms-str
  "Given a block map and all existing blocks, return the block as transit data
   to be stored in the `datoms` column. This is currently only used in testing"
  [blocks m]
  (let [t-writer (transit/writer :json)]
    (->> (dissoc m :db/id)
         ;; This fn should match pipeline/datom->av-vector
         (map (fn m->av-vector [[a v]]
                [a v]
                (if (contains? db-schema/ref-type-attributes a)
                  [a
                   [:block/uuid (str (some #(when (= (:db/id %) (:db/id v)) (:block/uuid %)) blocks))]]
                  [a v])))
         (transit/write t-writer))))
