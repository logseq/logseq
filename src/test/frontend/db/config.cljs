(ns frontend.db.config
  (:require [frontend.db.conn :as conn]))

(defonce test-db "test-db")

(defn wrap-setup!
  [f]
  (conn/start! nil test-db)
  (f)
  (conn/destroy-all!))
