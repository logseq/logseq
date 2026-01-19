(ns ^:no-doc frontend.db.debug
  (:require [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.utils :as db-utils]))

;; shortcut for query a block with string ref
(defn qb
  [string-id]
  (db-utils/pull [:block/uuid (uuid string-id)]))

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
  (when-let [db (db/get-db)]
    (->> (d/datoms db :avet :block/uuid)
         (map :e)
         db/pull-many)))
