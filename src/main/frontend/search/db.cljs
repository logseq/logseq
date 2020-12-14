(ns frontend.search.db
  (:refer-clojure :exclude [empty?]))

(defonce indices (atom nil))

(defn empty?
  [repo]
  (nil? (get @indices repo)))
