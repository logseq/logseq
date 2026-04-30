(ns logseq.db.sqlite.backup
  "Shared SQLite backup utilities for Node runtimes."
  (:require ["node:sqlite" :as node-sqlite]
            [clojure.string :as string]
            [goog.object :as gobj]
            [promesa.core :as p]))

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

(def ^:private DatabaseSync
  (resolve-database-sync-ctor))

(defn- resolve-sqlite-backup-fn
  []
  (or (gobj/get node-sqlite "backup")
      (some-> (gobj/get node-sqlite "default")
              (gobj/get "backup"))
      (throw (ex-info "node:sqlite backup function missing"
                      {:module-keys (js->clj (js/Object.keys node-sqlite))}))))

(def ^:private sqlite-backup-fn
  (resolve-sqlite-backup-fn))

(defn backup-connection!
  [^js db path]
  (sqlite-backup-fn db path))

(defn backup-db-file!
  [src-path dst-path]
  (let [db (new DatabaseSync src-path)]
    (-> (backup-connection! db dst-path)
        (p/finally (fn []
                     (try
                       (.close db)
                       (catch :default error
                         (when-not (string/includes? (str error) "database is not open")
                           (throw error)))))))))
