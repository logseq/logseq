(ns frontend.test.helper
  "Common helper fns for tests"
  (:require [frontend.handler.repo :as repo-handler]
            [frontend.state :as state]
            [frontend.db.conn :as conn]))

(defonce test-db "test-db")

(defn start-test-db!
  []
  (conn/start! test-db))

(defn destroy-test-db!
  []
  (conn/destroy-all!))

(defn load-test-files
  "Given a collection of file maps, loads them into the current test-db.
This can be called in synchronous contexts as no async fns should be invoked"
  [files]
  (repo-handler/parse-files-and-load-to-db!
   test-db
   files
   ;; Set :refresh? to avoid creating default files in after-parse
   {:re-render? false :verbose false :refresh? true}))

(defn start-and-destroy-db
  "Sets up a db connection and current repo like fixtures/reset-datascript. It
  also seeds the db with the same default data that the app does and destroys a db
  connection when done with it."
  [f]
  ;; Set current-repo explicitly since it's not the default
  (state/set-current-repo! test-db)
  (start-test-db!)
  (f)
  (state/set-current-repo! nil)
  (destroy-test-db!))
