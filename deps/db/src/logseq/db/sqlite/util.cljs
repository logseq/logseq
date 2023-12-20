(ns logseq.db.sqlite.util
  "Utils fns for backend sqlite db"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.string :as string]))

(defonce db-version-prefix "logseq_db_")
(defonce file-version-prefix "logseq_local_")

(defn time-ms
  "Copy of util/time-ms. Too basic to couple this to main app"
  []
  (tc/to-long (t/now)))

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
