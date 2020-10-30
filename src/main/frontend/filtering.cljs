(ns frontend.filtering
  (:require [frontend.util :as util]
            [frontend.state :as state]
            [frontend.db :as db]))

(defn get-block-references
  [block]
  (let [repo (state/get-current-repo)
        children (-> (db/get-block-children-unsafe repo (:block/uuid block))
                     db/sort-by-pos)
        blocks (conj children block)]
    (flatten (map (fn [block]
                    (map #(if (= (first %) "Tag") (second %) (second (:url (second %))))
                         (filter #(and (some (partial = (first %)) ["Tag" "Link"])
                                       (or (= (first %) "Tag")
                                           (= (first (:url (second %))) "Search")))
                                 (:block/title block)))) blocks))))

(defn get-ref-block-references
  [ref-block]
  (conj (distinct (flatten (map get-block-references (val ref-block)))) (:page/original-name (key ref-block))))

(defn matches-filter
  [references filter-state]
  (every? #(= (util/in? (first %) references) (second %)) filter-state))

(defn filter-blocks
  [blocks config]
  (filter #(matches-filter (get-block-references %) (:filter-state config)) blocks))