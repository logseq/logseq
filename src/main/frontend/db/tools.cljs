(ns frontend.db.tools)

;;;; unsed

#_(defn remove-orphaned-pages!
  [repo]
  (let [all-pages (get-pages repo)
        orphaned-pages (remove nil?
                         (map (fn [page]
                                (let [name (string/lower-case page)]
                                  (if (and (empty? (get-pages-that-mentioned-page repo name))
                                           (not (journal-page? name))
                                           (empty? (get-page-blocks name))) name nil))) all-pages))
        transaction (mapv (fn [name] [:db/retractEntity (:db/id (get-page (str name)))]) orphaned-pages)]
    (transact! transaction)))