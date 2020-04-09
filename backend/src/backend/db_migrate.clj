(ns backend.db-migrate
  (:require [ragtime.jdbc :as jdbc]
            [ragtime.repl :as repl]))

;; db migrations
(defn load-config
  [db]
  {:datastore  (jdbc/sql-database db)
   :migrations (jdbc/load-resources "migrations")})

(defn migrate [db]
  (prn "db: " db)
  (repl/migrate (load-config db)))

(defn rollback [db]
  (repl/rollback (load-config db)))
