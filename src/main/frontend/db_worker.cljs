(ns frontend.db-worker
  "Worker used for browser DB implementation"
  (:require ["@logseq/sqlite" :as sqlite-db :default wasm-bindgen-init]
            ["comlink" :as Comlink]
            [promesa.core :as p]
            [shadow.cljs.modern :refer [defclass]]))

(def *inited (atom false))

#_:clj-kondo/ignore
(defclass SQLiteDB
  (extends js/Object)

  (constructor
   [this]
   (super))

  Object
  (inited
   [_this]
   (boolean @*inited))

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
   (.new_db sqlite-db repo))

  (deleteBlocks
   [_this repo uuids]
   (when (seq uuids)
     (.delete_blocks sqlite-db repo uuids)))

  (upsertBlocks
   [_this repo blocks]
   (.upsert_blocks sqlite-db repo blocks))

  (fetchAllPages
   [_this repo]
   (.fetch_all_pages sqlite-db repo))

  ;; fetch all blocks, return block id and page id
  (fetchAllBlocks
   [_this repo]
   (.fetch_all_blocks sqlite-db repo))

  (fetchRecentJournals
   [_this repo]
   (.fetch_recent_journals sqlite-db repo))

  (fetchInitData
   [_this repo]
   (.fetch_init_data sqlite-db repo))

  (fetchBlocksExcluding
   [_this repo excluding-uuids]
   (.fetch_blocks_excluding sqlite-db repo excluding-uuids)))

(defn init
  "web worker entry"
  []
  (p/let [current-url (js/URL. "/static/js/logseq_sqlite_bg.wasm" (.. js/location -href))
          ^js obj (SQLiteDB.) ;; call this
          _ (Comlink/expose obj) ;; expose as early as possible
          _ (wasm-bindgen-init current-url) ;; init wasm
          _ (.init sqlite-db)]
    (prn ::init-ok
         :has-opfs-support (.has_opfs_support sqlite-db)
         :sqlite-version (.get_version sqlite-db))
    (reset! *inited true)))
