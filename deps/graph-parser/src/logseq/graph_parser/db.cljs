(ns logseq.graph-parser.db
  "File graph specific db fns"
  (:require [datascript.core :as d]
            [clojure.set :as set]
            [clojure.string :as string]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db :as ldb]))

(defonce built-in-markers
  ["NOW" "LATER" "DOING" "DONE" "CANCELED" "CANCELLED" "IN-PROGRESS" "TODO" "WAIT" "WAITING"])

(defonce built-in-priorities
  ["A" "B" "C"])

(defonce built-in-pages-names
  (set/union
   (set built-in-markers)
   (set built-in-priorities)
   #{"Favorites" "Contents" "card"}))

(defn- page-title->block
  [title]
  {:block/name (string/lower-case title)
   :block/original-name title
   :block/journal? false
   :block/uuid (random-uuid)})

(def built-in-pages
  (mapv page-title->block built-in-pages-names))

(defn- build-pages-tx
  [pages]
  (let [time (common-util/time-ms)]
    (map
     (fn [m]
       (-> m
           (assoc :block/created-at time)
           (assoc :block/updated-at time)))
     pages)))

(defn create-default-pages!
  "Creates default pages if one of the default pages does not exist. This
   fn is idempotent"
  [db-conn]
  (when-not (d/entity @db-conn [:block/name "card"])
    (let [built-in-pages (build-pages-tx built-in-pages)]
      (ldb/transact! db-conn built-in-pages))))

(defn start-conn
  "Create datascript conn with schema and default data"
  []
  (let [db-conn (d/create-conn db-schema/schema)]
    (create-default-pages! db-conn)
    db-conn))

(defn get-page-file
  [db page-name]
  (some-> (or (d/entity db [:block/name page-name])
              (d/entity db [:block/original-name page-name]))
          :block/file))
