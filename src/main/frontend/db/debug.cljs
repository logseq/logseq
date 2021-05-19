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
            repos))))
