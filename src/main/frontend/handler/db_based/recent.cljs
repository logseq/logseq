(ns frontend.handler.db-based.recent
  "Fns related to recent pages feature"
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.state :as state]
            [logseq.db :as ldb]))

(defn add-page-to-recent!
  [db-id _click-from-recent?]
  (assert db-id (number? db-id))
  (when-not (:db/restoring? @state/state)
    (when-let [page (db/entity db-id)]
      (when-not (string/blank? (:block/title page))
        (let [pages (state/get-recent-pages)]
          (when-not (or (ldb/hidden? page)
                        ((set pages) db-id))
            (let [new-pages (vec (take 15 (distinct (cons db-id pages))))]
              (state/set-recent-pages! new-pages))))))))

(defn get-recent-pages
  []
  (->> (state/get-recent-pages)
       (distinct)
       (take 20)
       (keep db/entity)
       (filter db/page?)
       (remove ldb/hidden?)
       (remove (fn [e]
                 (or (and (ldb/property? e)
                          (true? (:logseq.property/hide? e)))
                     (string/blank? (:block/title e)))))))
