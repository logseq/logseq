(ns logseq.melange.bridge.db.sqlite.backup
  "Shared SQLite backup utilities for Node runtimes."
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            ["node:fs" :as fs]
            ["node:sqlite" :as node-sqlite]
            [clojure.string :as string]
            [goog.object :as gobj]))

(def ^:private sqlite-lifecycle-api (.-SqliteLifecycle melange-db))

(defn- resolve-database-sync-ctor
  []
  (or (gobj/get node-sqlite "DatabaseSync")
      (some-> (gobj/get node-sqlite "default")
              (gobj/get "DatabaseSync"))
      (let [default-export (gobj/get node-sqlite "default")]
        (when (fn? default-export)
          default-export))
      (throw (ex-info "node:sqlite DatabaseSync constructor missing"
                      {:module-keys (js->clj (js/Object.keys node-sqlite))}))))

(defn- resolve-sqlite-backup-fn
  []
  (or (gobj/get node-sqlite "backup")
      (some-> (gobj/get node-sqlite "default")
              (gobj/get "backup"))
      (throw (ex-info "node:sqlite backup function missing"
                      {:module-keys (js->clj (js/Object.keys node-sqlite))}))))

(def ^:private sqlite-backup-fn
  (resolve-sqlite-backup-fn))

(defn- remove-file-if-exists!
  [path]
  (fs/rmSync path #js {:force true}))

(defn backup-connection!
  [^js db path]
  ((.-backupConnection sqlite-lifecycle-api)
   sqlite-backup-fn remove-file-if-exists! db path))

(defn- close-database!
  [^js db]
  (try
    (.close db)
    (catch :default error
      (when-not (string/includes? (str error) "database is not open")
        (throw error)))))

(defn backup-db-file!
  ([src-path dst-path]
   (let [DatabaseSync (resolve-database-sync-ctor)]
     ((.-backupFile sqlite-lifecycle-api)
      (fn [path] (new DatabaseSync path))
      sqlite-backup-fn
      remove-file-if-exists!
      close-database!
      src-path
      dst-path)))
  ([db _src-path dst-path]
   (backup-connection! db dst-path)))
