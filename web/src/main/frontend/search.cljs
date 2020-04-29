(ns frontend.search
  (:require [frontend.db :as db]
            [frontend.state :as state]
            [medley.core :as medley]
            [frontend.util :as util]))

;; TODO: optimization, maybe something like elasticsearch?
(defn search
  ([q]
   (search q 5))
  ([q limit]
   (let [headings (db/get-all-headings)]
     (some->>
      (filter (fn [{:heading/keys [content]}]
                (re-find (re-pattern (str "(?i)" q))
                         content))
              headings)
      (take limit)))))
