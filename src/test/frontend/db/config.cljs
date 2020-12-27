(ns frontend.db.config
  (:require [frontend.db.conn :as conn]))

(defonce test-db "test-db")

(defn start-test-db!
  []
  (conn/start! nil test-db))

(defn destroy-test-db!
  []
  (conn/destroy-all!))
