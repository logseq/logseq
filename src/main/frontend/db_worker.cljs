(ns frontend.db-worker
  "Worker used for browser DB implementation"
  (:require [promesa.core :as p]
            [datascript.storage :refer [IStorage]]
            [cljs.cache :as cache]
            [clojure.edn :as edn]
            [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            [shadow.cljs.modern :refer [defclass]]
            [datascript.transit :as dt]
            ["@logseq/sqlite-wasm" :default sqlite3InitModule]
            ["comlink" :as Comlink]))

(defonce *sqlite (atom nil))
(defonce *sqlite-db (atom nil))
(defonce *datascript-conn (atom nil))

(defn- init-sqlite-module!
  []
  (when-not @*sqlite
    (p/let [base-url (str js/self.location.protocol "//" js/self.location.host)
            sqlite-wasm-url (str base-url "/js/")
            sqlite (sqlite3InitModule (clj->js {:url sqlite-wasm-url
                                                :print js/console.log
                                                :printErr js/console.error}))]
      (reset! *sqlite sqlite))))

(defn- close-all-dbs!
  []
  )

(defn upsert-addr-content!
  "Upsert addr+data-seq"
  [data]
  (assert (some? @*sqlite-db) "sqlite db not exists")
  (let [^Object db @*sqlite-db]
    (.transaction db (fn [tx]
                       (doseq [item data]
                         (.exec tx #js {:sql "INSERT INTO kvs (addr, content) values ($addr, $content) on conflict(addr) do update set content = $content"
                                        :bind item}))))))

(defn restore-data-from-addr
  [addr]
  (assert (some? @*sqlite-db) "sqlite db not exists")
  (when-let [content (-> (.exec @*sqlite-db #js {:sql "select content from kvs where addr = ?"
                                                 :bind #js [addr]
                                                 :rowMode "array"})
                         ffirst)]
    (edn/read-string content)))

(defn new-sqlite-storage
  [_repo {:keys [threshold]
          :or {threshold 4096}}]
  (let [_cache (cache/lru-cache-factory {} :threshold threshold)]
    (reify IStorage
      (-store [_ addr+data-seq]
        (let [data (map
                    (fn [[addr data]]
                      #js {:$addr addr
                           :$content (pr-str data)})
                    addr+data-seq)]
          (upsert-addr-content! data)))

      (-restore [_ addr]
        (let [content (restore-data-from-addr addr)]
          (edn/read-string content))))))

#_:clj-kondo/ignore
(defclass SQLiteDB
  (extends js/Object)

  (constructor
   [this]
   (super))

  Object

  ;; ;; dev-only, close all db connections and db files
  ;; (unsafeDevCloseAll
  ;;  [_this]
  ;;  (.dev_close sqlite-db))

  ;; (getVersion
  ;;  [_this]
  ;;  (.get_version sqlite-db))

  ;; (supportOPFS
  ;;  [_this]
  ;;  (.has_opfs_support sqlite-db))

  (init
   [_this]
   (init-sqlite-module!)
   nil)

  (inited
   [_this]
   (some? @*sqlite))

  (listDB
   [_this]
   ;; (.list_db sqlite-db)
   #js [])

  (newDB
   [_this repo]
   ;; TODO: close all the other db connections
   (p/let [sqlite @*sqlite
           db-name repo
           pool (.installOpfsSAHPoolVfs sqlite #js {:name db-name})
           db (new (.-OpfsSAHPoolDb pool) "/logseq")
           storage (new-sqlite-storage db-name {})]
     (reset! *sqlite-db db)
     (.exec db "PRAGMA locking_mode=exclusive")
     (.exec db "create table if not exists kvs (addr INTEGER primary key, content TEXT)")
     (let [conn (or (d/restore-conn storage)
                    (d/create-conn db-schema/schema-for-db-based-graph {:storage storage}))]
       (reset! *datascript-conn conn)
       nil)))

  (transact
   [_this repo tx-data tx-meta]
   (when-let [conn @*datascript-conn]
     (try
       (let [tx-data (edn/read-string tx-data)
             tx-meta (edn/read-string tx-meta)]
         (d/transact! conn tx-data tx-meta)
         nil)
       (catch :default e
         (prn :debug :error)
         (js/console.error e)))))

  (getInitialData
   [_this repo]
   (when-let [conn @*datascript-conn]
     (let [db @conn]
       (->> (d/datoms db :eavt)
            vec
            dt/write-transit-str)))))

(defn init
  "web worker entry"
  []
  (let [^js obj (SQLiteDB.)]
    (p/let [_ (init-sqlite-module!)]
      (Comlink/expose obj))))
