(ns frontend.handler.db-based.recent
  "Fns related to recent pages feature"
  (:require [frontend.db :as db]
            [frontend.state :as state]
            [logseq.db :as ldb]))

(defn add-page-to-recent!
  [db-id click-from-recent?]
  (assert db-id (number? db-id))
  (when-not (:db/restoring? @state/state)
    (when-let [page (db/entity db-id)]
      (when-not (ldb/hidden? page)
        (let [pages (state/get-recent-pages)]
          (when (or (and click-from-recent? (not ((set pages) db-id)))
                    (not click-from-recent?))
            (let [new-pages (vec (take 15 (distinct (cons db-id pages))))]
              (state/set-recent-pages! new-pages))))))))

(defn get-recent-pages
  []
  (->> (state/get-recent-pages)
       (distinct)
       (take 20)
       (keep db/entity)
       (filter db/page?)
       (remove ldb/hidden?)))
