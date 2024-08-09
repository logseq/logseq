(ns ^:no-doc frontend.db.debug
  (:require [frontend.db.utils :as db-utils]
            [frontend.db :as db]
            [datascript.core :as d]))

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
    (:block/refs block)
    (:block/path-refs block))
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
