(ns frontend.db-worker
  "Worker used for browser DB implementation"
  (:require ["@logseq/sqlite" :as sqlite-db :default wasm-bindgen-init]
            ["comlink" :as Comlink]
            [promesa.core :as p]
            [datascript.storage :refer [IStorage]]
            [cljs.cache :as cache]
            [cljs.reader :as reader]
            [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            [shadow.cljs.modern :refer [defclass]]
            [datascript.transit :as dt]
            [clojure.edn :as edn]
            [clojure.string :as string]))

(def *wasm-loaded (atom false))

;; datascript conns
(defonce conns (atom nil))

(defn get-conn
  [repo]
  (get @conns repo))

(defn upsert-addr-content!
  "Upsert addr+data-seq"
  [repo data]
  (.upsert_addr_content sqlite-db repo data))

(defn restore-data-from-addr
  [repo addr]
  (.get_content_by_addr sqlite-db repo addr))


(defn new-sqlite-storage
  [repo {:keys [threshold]
         :or {threshold 4096}}]
  (let [_cache (cache/lru-cache-factory {} :threshold threshold)]
    (reify IStorage
      (-store [_ addr+data-seq]
        (let [data (->>
                    (map
                     (fn [[addr data]]
                       #js {:addr addr
                            :content (pr-str data)})
                     addr+data-seq)
                    (to-array))]
          (upsert-addr-content! repo data)
          {:result "ok"}))

      (-restore [_ addr]
        (let [content (restore-data-from-addr repo addr)]
          (edn/read-string content))))))

(defn split-last [pattern s]
  (when-let [last-index (string/last-index-of s pattern)]
    [(subs s 0 last-index)
     (subs s (+ last-index (count pattern)) (count s))]))

#_:clj-kondo/ignore
(defclass SQLiteDB
  (extends js/Object)

  (constructor
   [this]
   (super))

  Object
  (init
   [_this]
   (let [[_ sqlite-wasm-url] (split-last "url=" (.. js/location -href))]
     (assert (some? sqlite-wasm-url) "sqlite-wasm-url is empty")
     (p/let [wasm-url (js/URL. sqlite-wasm-url (.. js/location -href))
            _ (wasm-bindgen-init wasm-url)]
      (prn ::init-ok
           :has-opfs-support (.has_opfs_support sqlite-db)
           :sqlite-version (.get_version sqlite-db))
      (reset! *wasm-loaded true))))

  (inited
   [_this]
   (boolean @*wasm-loaded))

  ;; dev-only, close all db connections and db files
  (unsafeDevCloseAll
   [_this]
   (.dev_close sqlite-db))

  (getVersion
   [_this]
   (.get_version sqlite-db))

  (supportOPFS
   [_this]
   (.has_opfs_support sqlite-db))

  (listDB
   [_this]
   (.list_db sqlite-db))

  (newDB
   [_this repo]
   (p/do!
    (.ensure_init sqlite-db)
    (.init_db sqlite-db repo) ;; close another and init this one
    (.new_db sqlite-db repo)
    (let [db-name repo
          storage (new-sqlite-storage db-name {})
          conn (or (d/restore-conn storage)
                   (d/create-conn db-schema/schema-for-db-based-graph {:storage storage}))]
      (swap! conns assoc db-name conn)
      nil)))

  (transact
   [_this repo tx-data tx-meta]
   (when-let [conn (get-conn repo)]
     (try
       (let [tx-data (reader/read-string tx-data)
             tx-meta (reader/read-string tx-meta)]
         (d/transact! conn tx-data tx-meta))
       (catch :default e
         (prn :debug :error)
         (js/console.error e)))))

  (getInitialData
   [_this repo]
   (when-let [conn (get-conn repo)]
     (let [db @conn]
       (->> (d/datoms db :eavt)
              ;; (remove (fn [e] (= :block/content (:a e))))
            vec
            dt/write-transit-str))))

  (openDB
   [_this repo]
   (p/do!
    (.ensure_init sqlite-db)
    ;; close another and init this one
    (.init_db sqlite-db repo)))

  (deleteBlocks
   [_this repo uuids]
   (when (seq uuids)
     (p/do!
      (.ensure_init sqlite-db)
      (.delete_blocks sqlite-db repo uuids))))

  (upsertBlocks
   [_this repo blocks]
   (p/do!
    (.ensure_init sqlite-db)
    (.upsert_blocks sqlite-db repo blocks)))

  (fetchAllPages
   [_this repo]
   (p/do!
    (.ensure_init sqlite-db)
    (.fetch_all_pages sqlite-db repo)))

  ;; fetch all blocks, return block id and page id
  (fetchAllBlocks
   [_this repo]
   (p/do!
    (.ensure_init sqlite-db)
    (.fetch_all_blocks sqlite-db repo)))

  (fetchRecentJournals
   [_this repo]
   (p/do!
    (.ensure_init sqlite-db)
    (.fetch_recent_journals sqlite-db repo)))

  (fetchInitData
   [_this repo]
   (p/do!
    (.ensure_init sqlite-db)
    (.fetch_init_data sqlite-db repo)))

  (fetchBlocksExcluding
   [_this repo excluding-uuids]
   (p/do!
    (.ensure_init sqlite-db)
    (.fetch_blocks_excluding sqlite-db repo excluding-uuids))))

(defn init
  "web worker entry"
  []
  (let [^js obj (SQLiteDB.)]
    (Comlink/expose obj)))
