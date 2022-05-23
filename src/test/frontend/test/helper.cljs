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

(defn load-test-files [files]
  (repo-handler/parse-files-and-load-to-db! test-db files {:re-render? false}))
