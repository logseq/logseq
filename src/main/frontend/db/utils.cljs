(ns frontend.db.utils
  "Some utils are required by other namespace in frontend.db package."
  (:require [datascript.core :as d]
            [frontend.state :as state]
            [clojure.string :as string]
            [datascript.transit :as dt]
            [frontend.util :as util]
            [frontend.date :as date]
            [frontend.db.conn :as conn]
            [frontend.config :as config]))

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

(defn entity
  ([id-or-lookup-ref]
   (entity (state/get-current-repo) id-or-lookup-ref))
  ([repo id-or-lookup-ref]
   (when-let [db (conn/get-conn repo)]
     (d/entity db id-or-lookup-ref))))

(defn pull
  ([eid]
   (pull (state/get-current-repo) '[*] eid))
  ([selector eid]
   (pull (state/get-current-repo) selector eid))
  ([repo selector eid]
   (when-let [conn (conn/get-conn repo)]
     (try
       (d/pull conn
               selector
               eid)
       (catch js/Error e
         nil)))))

(defn pull-many
  ([eids]
   (pull-many '[*] eids))
  ([selector eids]
   (pull-many (state/get-current-repo) selector eids))
  ([repo selector eids]
   (when-let [conn (conn/get-conn repo)]
     (try
       (d/pull-many conn selector eids)
       (catch js/Error e
         (js/console.error e))))))

(defn transact!
  ([tx-data]
   (transact! (state/get-current-repo) tx-data))
  ([repo-url tx-data]
   (when-not config/publishing?
     (let [tx-data (->> (util/remove-nils tx-data)
                        (remove nil?))]
       (when (seq tx-data)
         (when-let [conn (conn/get-conn repo-url false)]
           (d/transact! conn (vec tx-data))))))))

(defn get-key-value
  ([key]
   (get-key-value (state/get-current-repo) key))
  ([repo-url key]
   (when-let [db (conn/get-conn repo-url)]
     (some-> (d/entity db key)
             key))))
