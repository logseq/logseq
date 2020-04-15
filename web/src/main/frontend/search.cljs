(ns frontend.search
  (:require [frontend.db :as db]
            [medley.core :as medley]
            [frontend.util :as util]))

;; TODO: should be very slow!
;; get matched files/pages and highlighted content
(defn search
  [q]
  (let [contents (->> (db/get-all-files-content (db/get-current-repo))
                      (into {}))]
    (->>
     (medley/map-kv (fn [file content]
                      [file
                       (if (re-find (re-pattern (str "(?i)" q))
                                    content)
                         content
                         nil)])
                    contents)
     (util/remove-nils))))
