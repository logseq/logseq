(ns frontend.core-test
  (:require [frontend.state :as state]
            [frontend.db.conn :as conn]))

(defn get-current-conn
  []
  (->
    (state/get-current-repo)
    (conn/get-db false)))
