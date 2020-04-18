(ns frontend.diff
  (:require [clj-diff.core :refer [diff]]))

;; TODO: optimization, no need to get the whole diffs
;; or implement a specific loop, notice it needs backtrack
;; for retrying.
;; (find-position "** hello _w_" "hello w")
(defn find-position
  [markup text]
  (let [diff-result (diff markup text)
        _ (when (seq (:+ diff-result))
            (prn "Something error: "
                 (:+ diff-result)))
        deleted (:- diff-result)
        text-length (count text)
        markup-length (count markup)]
    (if (seq deleted)
      (let [[last-pos & rdeleted] (reverse deleted)
            result (loop [last-pos last-pos
                          rdeleted rdeleted]
                     ;; (prn {:last-char (nth markup last-pos)
                     ;;       :last-pos last-pos
                     ;;       :markup-length markup-length
                     ;;       :text text
                     ;;       :markup markup})
                     (cond
                       (and (contains? #{" " "\n"} (nth markup last-pos))
                            (< last-pos markup-length)
                            (let [last-part (subs markup
                                                  (inc last-pos)
                                                  markup-length)
                                  last-part-count (count last-part)
                                  text-last-part (subs text (- text-length last-part-count) text-length)]
                              (= last-part text-last-part)))
                       markup-length

                       (< last-pos text-length)
                       markup-length

                       (empty? rdeleted)
                       last-pos

                       (not= (dec last-pos) (first rdeleted))
                       last-pos

                       :else
                       (recur (dec last-pos) (rest rdeleted))))]
        (dec result))
      (dec markup-length))))
