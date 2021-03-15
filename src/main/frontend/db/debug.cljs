(ns frontend.db.debug
  (:require [medley.core :as medley]
            [frontend.db.utils :as db-utils]))

;; shortcut for query a block with string ref
(defn qb
  [string-id]
  (db-utils/pull [:block/uuid (medley/uuid string-id)]))

(comment
  (defn debug!
    []
    (let [repos (->> (get-in @state/state [:me :repos])
                     (map :url))]
      (mapv (fn [repo]
              {:repo/current (state/get-current-repo)
               :repo repo
               :git/cloned? (cloned? repo)
               :git/status (get-key-value repo :git/status)
               :git/error (get-key-value repo :git/error)})
            repos)))

  ;; filtered blocks

  (def page-and-aliases #{22})
  (def excluded-pages #{59})
  (def include-pages #{106})
  (def page-linked-blocks
    (->
     (d/q
      '[:find (pull ?b [:block/uuid
                        :block/title
                        {:block/children ...}])
        :in $ ?pages
        :where
        [?b :block/refs ?ref-page]
        [(contains? ?pages ?ref-page)]]
      (get-conn)
      page-and-aliases)
     flatten))

  (def page-linked-blocks-include-filter
    (if (seq include-pages)
      (filter (fn [{:block/keys [ref-pages]}]
                (some include-pages (map :db/id ref-pages)))
              page-linked-blocks)
      page-linked-blocks))

  (def page-linked-blocks-exclude-filter
    (if (seq excluded-pages)
      (remove (fn [{:block/keys [ref-pages]}]
                (some excluded-pages (map :db/id ref-pages)))
              page-linked-blocks-include-filter)
      page-linked-blocks-include-filter)))
