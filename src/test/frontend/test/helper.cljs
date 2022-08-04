(ns frontend.test.helper
  "Common helper fns for tests"
  (:require [frontend.handler.repo :as repo-handler]
            [frontend.db.persist :as db-persist]
            [frontend.state :as state]
            [frontend.db.conn :as conn]))

(defonce test-db "test-db")

(defn start-test-db!
  []
  (conn/start! test-db))

(defn destroy-test-db!
  []
  (conn/destroy-all!))

(defn clear-current-repo []
  (let [current-repo (state/get-current-repo)]
    (db-persist/delete-graph! current-repo)
    (destroy-test-db!)
    (conn/start! current-repo)))

(defn load-test-files [files]
  (repo-handler/parse-files-and-load-to-db! test-db files {:re-render? false :verbose false}))
