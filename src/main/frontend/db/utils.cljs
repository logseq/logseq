(ns frontend.db.utils
  "Some utils are required by other namespace in frontend.db package."
  (:require [datascript.core :as d]
            [frontend.state :as state]
            [clojure.string :as string]
            [datascript.transit :as dt]
            [frontend.util :as util]
            [frontend.date :as date]))

;; transit serialization

(defn db->string [db]
  (dt/write-transit-str db))

(defn db->json [db]
  (js/JSON.stringify
   (into-array
    (for [d (d/datoms db :eavt)]
      #js [(:e d) (name (:a d)) (:v d)]))))

(defn string->db [s]
  (dt/read-transit-str s))

(defn me-tx
  [db {:keys [name email avatar]}]
  (util/remove-nils {:me/name name
                     :me/email email
                     :me/avatar avatar}))

(defn seq-flatten [col]
  (flatten (seq col)))

(defn sort-by-pos
  [blocks]
  (sort-by
   #(get-in % [:block/meta :start-pos])
   blocks))

(defn group-by-page
  [blocks]
  (some->> blocks
           (group-by :block/page)
           (sort-by (fn [[p _blocks]] (:page/last-modified-at p)) >)))

(defn get-tx-id [tx-report]
  (get-in tx-report [:tempids :db/current-tx]))

(defn get-max-tx-id
  [db]
  (:max-tx db))

(defn date->int
  [date]
  (util/parse-int
   (string/replace (date/ymd date) "/" "")))

(defn with-repo
  [repo blocks]
  (map (fn [block]
         (assoc block :block/repo repo))
       blocks))
