(ns frontend.handler.recent
  "Fns related to recent pages feature"
  (:require [frontend.handler.db-based.recent :as db-based]))

(defn add-page-to-recent!
  [db-id click-from-recent?]
  (when db-id
    (db-based/add-page-to-recent! db-id click-from-recent?)))

(defn get-recent-pages
  []
  (db-based/get-recent-pages))
