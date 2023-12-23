(ns frontend.db.utils
  "Some utils are required by other namespace in frontend.db package."
  (:require [datascript.core :as d]
            [frontend.state :as state]
            [datascript.transit :as dt]
            [frontend.db.conn :as conn]
            [frontend.config :as config]
            [logseq.graph-parser.util :as gp-util]
            [clojure.string :as string]
            [logseq.graph-parser.util.page-ref :as page-ref]))

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

(defn special-id->page
  "Convert special id backs to page name."
  [content refs]
  (reduce
   (fn [content ref]
     (if (:block/name ref)
       (string/replace content (str config/page-ref-special-chars (:block/uuid ref)) (:block/original-name ref))
       content))
   content
   refs))

(defn special-id-ref->page
  "Convert special id ref backs to page name."
  [content refs]
  (reduce
   (fn [content ref]
     (if (:block/name ref)
       (string/replace content
                       (str page-ref/left-brackets
                            config/page-ref-special-chars
                            (:block/uuid ref)
                            page-ref/right-brackets)
                       (:block/original-name ref))
       content))
   content
   refs))

(defn update-block-content
  "Replace `[[internal-id]]` with `[[page name]]`"
  [item eid]
  (if (config/db-based-graph? (state/get-current-repo))
    (if-let [content (:block/content item)]
      (let [refs (:block/refs (entity eid))]
        (assoc item :block/content (special-id->page content refs)))
      item)
    item))

(defn pull
  ([eid]
   (pull (state/get-current-repo) '[*] eid))
  ([selector eid]
   (pull (state/get-current-repo) selector eid))
  ([repo selector eid]
   (when-let [db (conn/get-db repo)]
     (let [result (d/pull db selector eid)]
       (update-block-content result eid)))))

(defn pull-many
  ([eids]
   (pull-many '[*] eids))
  ([selector eids]
   (pull-many (state/get-current-repo) selector eids))
  ([repo selector eids]
   (when-let [db (conn/get-db repo)]
     (let [selector (if (some #{:db/id} selector) selector (conj selector :db/id))]
       (->> (d/pull-many db selector eids)
            (map #(update-block-content % (:db/id %))))))))

(defn- actual-transact!
  [repo-url tx-data tx-meta]
  (let [tx-data (gp-util/fast-remove-nils tx-data)]
    (when (seq tx-data)
      (conn/transact! repo-url tx-data tx-meta))))

(if config/publishing?
  (defn- transact!*
    [repo-url tx-data tx-meta]
    ;; :save-block is for query-table actions like sorting and choosing columns
    (when (#{:collapse-expand-blocks :save-block} (:outliner-op tx-meta))
      (actual-transact! repo-url tx-data tx-meta)))
  (def transact!* actual-transact!))

(defn transact!
  ([tx-data]
   (transact! (state/get-current-repo) tx-data))
  ([repo-url tx-data]
   (transact! repo-url tx-data nil))
  ([repo-url tx-data tx-meta]
   (transact!* repo-url tx-data tx-meta)))

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
