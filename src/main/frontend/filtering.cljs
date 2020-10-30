(ns frontend.filtering
  (:require [frontend.util :as util]))

(defn get-block-references
  [block]
  (let [references
        (map #(if (= (first %) "Tag") (second %) (second (:url (second %))))
             (filter #(and (some (partial = (first %)) ["Tag" "Link"])
                           (or (= (first %) "Tag")
                               (= (first (:url (second %))) "Search")))
                     (:block/title block)))
        page-name (:page/original-name (:block/page block))]
    (conj references page-name)))

(defn get-ref-block-references
  [ref-block]
  (distinct (flatten (map get-block-references (val ref-block)))))

(defn matches-filter
  [references filter-state]
  (every? #(= (util/in? (first %) references) (second %)) filter-state))