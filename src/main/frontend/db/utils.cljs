(ns frontend.db.utils
  "Some utils are required by other namespace in frontend.db package."
  (:require [datascript.core :as d]
            [frontend.state :as state]
            [datascript.transit :as dt]
            [frontend.db.conn :as conn]
            [frontend.config :as config]
            [logseq.graph-parser.util :as gp-util]))

;; transit serialization

(defn db->string [db]
  (dt/write-transit-str db))

(defn db->json [db]
  (js/JSON.stringify
   (into-array
    (for [d (d/datoms db :eavt)]
      #js [(:e d) (name (:a d)) (:v d)]))))

(defn db->edn-str [db]
  (pr-str db))

(defn string->db [s]
  (dt/read-transit-str s))

(defn seq-flatten [col]
  (flatten (seq col)))

(defn group-by-page
  [blocks]
  (if (:block/page (first blocks))
    (some->> blocks
             (group-by :block/page))
    blocks))

(defn get-tx-id [tx-report]
  (get-in tx-report [:tempids :db/current-tx]))

(defn get-max-tx-id
  [db]
  (:max-tx db))

(defn entity
  "This function will return nil if passed `id-or-lookup-ref` is an integer and
  the entity doesn't exist in db.
  `repo-or-db`: a repo string or a db,
  `id-or-lookup-ref`: same as d/entity."
  ([id-or-lookup-ref]
   (entity (state/get-current-repo) id-or-lookup-ref))
  ([repo-or-db id-or-lookup-ref]
   (when-let [db (if (string? repo-or-db)
                   ;; repo
                   (let [repo (or repo-or-db (state/get-current-repo))]
                     (conn/get-db repo))
                   ;; db
                   repo-or-db)]
     (d/entity db id-or-lookup-ref))))

(defn pull
  ([eid]
   (pull (state/get-current-repo) '[*] eid))
  ([selector eid]
   (pull (state/get-current-repo) selector eid))
  ([repo selector eid]
   (when-let [db (conn/get-db repo)]
     (try
       (d/pull db
               selector
               eid)
       (catch :default _e
         nil)))))

(defn pull-many
  ([eids]
   (pull-many '[*] eids))
  ([selector eids]
   (pull-many (state/get-current-repo) selector eids))
  ([repo selector eids]
   (when-let [db (conn/get-db repo)]
     (try
       (d/pull-many db selector eids)
       (catch :default e
         (js/console.error e))))))

(defn transact!
  ([tx-data]
   (transact! (state/get-current-repo) tx-data))
  ([repo-url tx-data]
   (transact! repo-url tx-data nil))
  ([repo-url tx-data tx-meta]
   (when-not config/publishing?
     (let [tx-data (gp-util/fast-remove-nils tx-data)]
       (when (seq tx-data)
         (when-let [conn (conn/get-db repo-url false)]
           (if tx-meta
             (d/transact! conn (vec tx-data) tx-meta)
             (d/transact! conn (vec tx-data)))))))))

(defn get-key-value
  ([key]
   (get-key-value (state/get-current-repo) key))
  ([repo-url key]
   (when-let [db (conn/get-db repo-url)]
     (some-> (d/entity db key)
             key))))

(defn q
  [query & inputs]
  (when-let [repo (state/get-current-repo)]
    (apply d/q query (conn/get-db repo) inputs)))
