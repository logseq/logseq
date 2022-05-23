(ns frontend.db.config
  (:require [frontend.db.conn :as conn]
            [frontend.state :as state]
            [frontend.db.persist :as db-persist]))

(defn destroy-db! [] (conn/destroy-all!))

(defn clear-current-repo []
  (let [current-repo (state/get-current-repo)]
    (db-persist/delete-graph! current-repo)
    (destroy-db!)
    (conn/start! current-repo)))
