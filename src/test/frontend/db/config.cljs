(ns frontend.db.config
  (:require [frontend.db.conn :as conn]
            [frontend.state :as state]))

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
    (conn/remove-db! current-repo)
    (destroy-db!)
    (conn/start! nil current-repo)))
