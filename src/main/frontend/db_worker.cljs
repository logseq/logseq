(ns frontend.db-worker
  "Worker used for browser DB implementation"
  (:require ["@logseq/sqlite" :as sqlite-db :default wasm-bindgen-init]
            ["comlink" :as Comlink]
            [promesa.core :as p]
            [shadow.cljs.modern :refer [defclass]]))

(def *wasm-loaded (atom false))

#_:clj-kondo/ignore
(defclass SQLiteDB
  (extends js/Object)

  (constructor
   [this]
   (super))

  Object
  (init
   [_this]
   (p/let [wasm-url (js/URL. "/static/js/logseq_sqlite_bg.wasm" (.. js/location -href))
           _ (wasm-bindgen-init wasm-url)]
     (prn ::init-ok
          :has-opfs-support (.has_opfs_support sqlite-db)
          :sqlite-version (.get_version sqlite-db))
     (reset! *wasm-loaded true)))

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
    (.new_db sqlite-db repo)))

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
