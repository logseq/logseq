(ns frontend.handler.db-based.recent
  "Fns related to recent pages feature"
  (:require [frontend.db :as db]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.handler.property.util :as pu]))

(defn add-page-to-recent!
  [page click-from-recent?]
  (when-not (:db/restoring? @state/state)
    (when-let [page-uuid (if (uuid? page)
                           nil
                           (pu/get-page-uuid page))]
      (let [pages (state/get-recent-pages)]
        (when (or (and click-from-recent? (not ((set pages) page-uuid)))
                  (not click-from-recent?))
          (let [new-pages (vec (take 15 (distinct (cons page-uuid pages))))]
            (state/set-recent-pages! new-pages)))))))

(defn get-recent-pages
  []
  (->> (state/get-recent-pages)
       (distinct)
       (map (fn [id]
              (let [e (db/entity [:block/uuid id])]
                (:block/original-name e))))
       (remove string/blank?)))
