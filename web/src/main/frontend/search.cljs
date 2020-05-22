(ns frontend.search
  (:require [frontend.db :as db]
            [frontend.state :as state]
            [medley.core :as medley]
            [frontend.util :as util]))

;; TODO: optimization, maybe something like elasticsearch?
;; blocks search
;; TODO: fuzzy search

(defn search
  ([q]
   (search q 5))
  ([q limit]
   (db/get-matched-headings (re-pattern (str "(?i)" q)) limit)))

(defn page-search
  ([q]
   (page-search q 2))
  ([q limit]
   (let [pages (db/get-pages (state/get-current-repo))]
     (some->>
      (filter (fn [page]
                (re-find (re-pattern (str "(?i)" q))
                         page))
              pages)
      (take limit)))))
