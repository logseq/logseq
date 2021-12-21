(ns frontend.db.config
  (:require [frontend.db.conn :as conn]
            [frontend.state :as state]
            [frontend.db.persist :as db-persist]))

(defonce test-db "test-db")

(defn start-test-db!
  []
  (conn/start! nil test-db))

(defn destroy-test-db!
  []
  (conn/destroy-all!))

(defn destroy-db! [] (conn/destroy-all!))

(defn clear-current-repo []
  (let [current-repo (state/get-current-repo)]
    (db-persist/delete-graph! current-repo)
    (destroy-db!)
    (conn/start! nil current-repo)))
