(ns frontend.filtering
  (:require [frontend.util :as util]
            [frontend.state :as state]
            [frontend.db :as db]))

(defn get-block-references
  [block]
  (map #(if (= (first %) "Tag") (second %) (second (:url (second %))))
       (filter #(and (some (partial = (first %)) ["Tag" "Link"])
                     (or (= (first %) "Tag")
                         (= (first (:url (second %))) "Search")))
               (:block/title block))))

(defn get-nested-block-references
  [block]
  (let [repo (state/get-current-repo)
        children (-> (db/get-block-children-unsafe repo (:block/uuid block))
                     db/sort-by-pos)
        child-refs (map get-nested-block-references children)
        block-refs (get-block-references block)]
    (flatten (concat child-refs block-refs))))

(defn matches-filter
  [references filter-state]
  (every? #(= (util/in? (first %) references) (second %)) filter-state))

(defn block-matches-filter
  [block filter-state]
  (let [repo (state/get-current-repo)
        children (-> (db/get-block-children-unsafe repo (:block/uuid block))
                     db/sort-by-pos)
        block-matches (matches-filter (get-block-references block) filter-state)
        child-matches (delay (some #(block-matches-filter % filter-state) children))]
    (or block-matches @child-matches)))

(defn filter-blocks
  [blocks filter-state]
  (filter #(block-matches-filter % filter-state) blocks))

(defn filter-ref-block
  [ref-block filter-state]
  (let [blocks-filtered (filterv #(block-matches-filter % filter-state) (val ref-block))]
    (assoc ref-block 1 blocks-filtered)))