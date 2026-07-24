(ns ^:no-doc frontend.db.debug
  (:require [frontend.state :as state]))

;; shortcut for query a block with string ref
(defn qb
  [string-id]
  (state/<invoke-db-worker :thread-api/pull
                           (state/get-current-repo)
                           '[*]
                           [:block/uuid (uuid string-id)]))

(defn block-uuid-nil?
  [block]
  (->>
   (concat
    [(:block/parent block)
     (:block/page block)]
    (:block/tags block)
    (:block/alias block)
    (:block/refs block))
   (remove nil?)
   (some (fn [x]
           (and
            (vector? x)
            (= :block/uuid (first x))
            (nil? (second x)))))))

(defn get-all-blocks
  []
  (state/<invoke-db-worker :thread-api/q
                           (state/get-current-repo)
                           ['[:find [(pull ?block [*]) ...]
                              :where
                              [?block :block/uuid]]]))
