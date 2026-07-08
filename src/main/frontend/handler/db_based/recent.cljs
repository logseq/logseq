(ns frontend.handler.db-based.recent
  "Fns related to recent pages feature"
  (:require [frontend.state :as state]))

(defn add-page-to-recent!
  [db-id _click-from-recent?]
  (assert db-id (number? db-id))
  (when-not (:db/restoring? @state/state)
    (let [pages (state/get-recent-pages)]
      (when-not ((set pages) db-id)
        (let [new-pages (vec (take 15 (distinct (cons db-id pages))))]
          (state/set-recent-pages! new-pages))))))

(defn get-recent-pages
  []
  (when-let [repo (state/get-current-repo)]
    (state/<invoke-db-worker :thread-api/get-recent-pages
                             repo
                             (state/get-recent-pages))))
