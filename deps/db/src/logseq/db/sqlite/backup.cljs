(ns logseq.db.sqlite.backup
  "Shared SQLite backup utilities for Node runtimes."
  (:require ["node:fs" :as fs]
            ["node:sqlite" :as node-sqlite]
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
  (try
    (-> (sqlite-backup-fn db path)
        (p/catch (fn [error]
                   (remove-file-if-exists! path)
                   (throw error))))
    (catch :default error
      (remove-file-if-exists! path)
      (p/rejected error))))

(defn backup-db-file!
  ([src-path dst-path]
   (let [DatabaseSync (resolve-database-sync-ctor)
         db (new DatabaseSync src-path)]
     (-> (backup-connection! db dst-path)
         (p/finally (fn []
                      (try
                        (.close db)
                        (catch :default error
                          (when-not (string/includes? (str error) "database is not open")
                            (throw error)))))))))
  ([db _src-path dst-path]
   (backup-connection! db dst-path)))
