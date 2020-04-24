(ns frontend.search
  (:require [frontend.db :as db]
            [frontend.state :as state]
            [medley.core :as medley]
            [frontend.util :as util]))

;; TODO: optimization
;; get matched files/pages and highlighted content
(defn search
  [q]
  (let [contents (->> (db/get-all-files-content (state/get-current-repo))
                      (into {}))]
    (->>
     (medley/map-kv (fn [file content]
                      [file
                       (if (re-find (re-pattern (str "(?i)" q))
                                    content)
                         content)])
                    contents)
     (util/remove-nils))))
