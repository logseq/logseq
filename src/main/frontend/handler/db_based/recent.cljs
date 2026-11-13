(ns frontend.handler.db-based.recent
  "Fns related to recent pages feature"
  (:require [frontend.state :as state]))

(def max-recent-pages
  "The maximum number of pages in Recent"
  15)

(defn add-page-to-recent!
  "Moves `db-id` to the front of the recent pages. Callers pass only pages
   that are eligible for recent pages."
  [db-id]
  (assert db-id (number? db-id))
  (when-not (:db/restoring? (state/get-state))
    (let [new-pages (vec (take max-recent-pages (distinct (cons db-id (state/get-recent-pages)))))]
      (state/set-recent-pages! new-pages))))

(defn get-recent-pages
  []
  (when-let [repo (state/get-current-repo)]
    (state/<invoke-db-worker :thread-api/get-recent-pages
                             repo
                             (state/get-recent-pages))))
