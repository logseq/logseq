(ns frontend.handler.recent
  "Fns related to recent pages feature"
  (:require [frontend.handler.db-based.recent :as db-based]
            [frontend.handler.file-based.recent :as file-based]
            [frontend.config :as config]
            [frontend.state :as state]))

(defn add-page-to-recent!
  [repo page click-from-recent?]
  (if (config/db-based-graph? repo)
    (db-based/add-page-to-recent! repo page click-from-recent?)
    (file-based/add-page-to-recent! repo page click-from-recent?)))

(defn get-recent-pages
  []
  (let [repo (state/get-current-repo)]
    (if (config/db-based-graph? repo)
      (db-based/get-recent-pages)
      (file-based/get-recent-pages))))
