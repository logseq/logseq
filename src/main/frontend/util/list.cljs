(ns frontend.util.list
  "High level list operations for use in editor"
  (:require [clojure.string :as string]))

(defn- newline?
  [line]
  (or (= line "\n") (= line "\r\n")))

(defn re-order-items
  [lines start-idx]
  (loop [lines lines
         idx start-idx
         result []
         double-newlines? false]
    (let [[line & others] lines]
      (if (empty? lines)
        (->> result
             (map (fn [line] (if (newline? line) "" line)))
             (string/join "\n"))
        (let [[_ num-str] (re-find #"^(\d+){1}\." line)
              num (if num-str (parse-long num-str) nil)
              double-newlines?' (or double-newlines?
                                     (and (newline? line) (seq others) (newline? (first others))))
              [idx' result'] (if (and (not double-newlines?') num)
                               (let [idx' (inc idx)
                                     line' (string/replace-first line (str num ".") (str idx' "."))]
                                 [idx' (conj result line')])
                               [idx (conj result line)])]
          (recur others idx' result' double-newlines?'))))))
