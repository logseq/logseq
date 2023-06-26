(ns frontend.handler.file-based.recent
  "Fns related to recent pages feature"
  (:require [frontend.db :as db]
            [frontend.util :as util]
            [clojure.string :as string]))

(defn add-page-to-recent!
  [repo page click-from-recent?]
  (let [pages (or (db/get-key-value repo :recent/pages)
                  '())]
    (when (or (and click-from-recent? (not ((set pages) page)))
              (not click-from-recent?))
      (let [new-pages (take 15 (distinct (cons page pages)))]
        (db/set-key-value repo :recent/pages new-pages)))))

(defn update-or-add-renamed-page [repo old-page-name new-page-name]
  (let [pages (or (db/get-key-value repo :recent/pages)
                  '())
        updated-pages (replace {old-page-name new-page-name} pages)
        updated-pages* (if (contains? (set updated-pages) new-page-name)
                         updated-pages
                         (cons new-page-name updated-pages))]
    (db/set-key-value repo :recent/pages updated-pages*)))

(defn get-recent-pages
  []
  (->> (db/sub-key-value :recent/pages)
       (remove string/blank?)
       (filter string?)
       (map (fn [page] {:lowercase (util/safe-page-name-sanity-lc page)
                        :page page}))
       (util/distinct-by :lowercase)
       (map :page)))
