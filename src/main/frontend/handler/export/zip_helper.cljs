(ns frontend.handler.export.zip-helper
  "zipper helpers used in opml&html exporting"
  (:require [clojure.zip :as z]))

(defn goto-last
  [loc]
  (let [loc* (z/next loc)]
    (if (z/end? loc*)
      loc
      (recur loc*))))

(defn get-level
  [loc]
  (count (z/path loc)))

(defn goto-level
  [loc level]
  (let [current-level (get-level loc)]
    (assert (<= level (inc current-level))
            (print-str :level level :current-level current-level))
    (let [diff (- level current-level)
          up-or-down (if (pos? diff) z/down z/up)
          diff* (abs diff)]
      (loop [loc loc count* diff*]
        (if (zero? count*)
          loc
          (recur (up-or-down loc) (dec count*)))))))
