(ns frontend.test.helper
  "Common helper fns for tests"
  (:require [frontend.handler.repo :as repo-handler]
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
