(ns user
  (:require [com.stuartsierra.component :as component]
            [clojure.tools.namespace.repl :as namespace]
            [backend.config :as config]
            [backend.db-migrate :as migrate]
            [io.pedestal.service-tools.dev :as dev]
            [clj-time
             [coerce :as tc]
             [core :as t]]
            [clojure.java.io :as io]
            [clojure.string :as string]))

(namespace/disable-reload!)
(namespace/set-refresh-dirs "src" "dev")
(defonce *system (atom nil))
(defonce *db (atom nil))

(defn migrate []
  (migrate/migrate @*db))

(defn rollback []
  (migrate/rollback @*db))

(defn stop []
  (some-> @*system (component/stop))
  (reset! *system nil))

(defn refresh []
  (let [res (namespace/refresh)]
    (when (not= res :ok)
      (throw res))
    :ok))

(defn go
  []
  (require 'backend.core)
  (dev/watch)
  (when-some [f (resolve 'backend.system/new-system)]
    (when-some [system (f config/config)]
      (when-some [system' (component/start system)]
        (reset! *system system')
        (reset! *db {:datasource (get-in @*system [:hikari :datasource])}))))
  (migrate))

(defn reset []
  (stop)
  (refresh)
  (go))

(defn get-unix-timestamp []
  (tc/to-long (t/now)))

(def date-format
  "Format for DateTime"
  "yyyyMMddHHmmss")
(def migrations-dir
  "Default migrations directory"
  "resources/migrations/")
(def ragtime-format-edn
  "EDN template for SQL migrations"
  "{:up [\"\"]\n :down [\"\"]}")

(defn migrations-dir-exist?
  "Checks if 'resources/migrations' directory exists"
  []
  (.isDirectory (io/file migrations-dir)))

(defn now
  "Gets the current DateTime"  []
  (.format (java.text.SimpleDateFormat. date-format) (new java.util.Date)))

(defn migration-file-path
  "Complete migration file path"
  [name]
  (str migrations-dir (now) "_" (string/replace name #"\s+|-+|_+" "_") ".edn"))

(defn create-migration
  "Creates a migration file with the current DateTime"
  [name]
  (let [migration-file (migration-file-path name)]
    (if-not (migrations-dir-exist?)
      (io/make-parents migration-file))
    (spit migration-file ragtime-format-edn)))

(defn reset-db
  []
  (dotimes [i 100]
    (rollback))
  (migrate))
