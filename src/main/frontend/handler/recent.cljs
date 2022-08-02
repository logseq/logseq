(ns frontend.handler.recent
  (:require [frontend.db :as db]))

(defn add-page-to-recent!
  [repo page]
  (let [pages (or (db/get-key-value repo :recent/pages)
                  '())]
    (when-not ((set pages) page)
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
