(ns ^:no-doc frontend.db.debug
  (:require [frontend.db.utils :as db-utils]
            [frontend.db :as db]
            [datascript.core :as d]
            [frontend.util :as util]))

;; shortcut for query a block with string ref
(defn qb
  [string-id]
  (db-utils/pull [:block/uuid (uuid string-id)]))

(defn check-left-id-conflicts
  []
  (let [db (db/get-db)
        blocks (->> (d/datoms db :avet :block/uuid)
                    (map :v)
                    (map (fn [id]
                           (let [e (db-utils/entity [:block/uuid id])]
                             (if (:block/name e)
                               nil
                               {:block/left (:db/id (:block/left e))
                                :block/parent (:db/id (:block/parent e))}))))
                    (remove nil?))
        count-1 (count blocks)
        count-2 (count (distinct blocks))]
    (assert (= count-1 count-2) (util/format "Blocks count: %d, repeated blocks count: %d"
                                             count-1
                                             (- count-1 count-2)))))

(defn block-uuid-nil?
  [block]
  (->>
   (concat
    [(:block/parent block)
     (:block/left block)
     (:block/page block)
     (:block/namespace block)]
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
