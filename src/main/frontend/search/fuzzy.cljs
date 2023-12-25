(ns frontend.search.fuzzy
  "fuzzy search"
  (:require [clojure.string :as string]
            [cljs-bean.core :as bean]
            [frontend.worker.util :as util]))

(def MAX-STRING-LENGTH 1000.0)

(defn clean-str
  [s]
  (string/replace (string/lower-case s) #"[\[ \\/_\]\(\)]+" ""))

(defn char-array
  [s]
  (bean/->js (seq s)))

;; Copied from https://gist.github.com/vaughnd/5099299
(defn str-len-distance
  ;; normalized multiplier 0-1
  ;; measures length distance between strings.
  ;; 1 = same length
  [s1 s2]
  (let [c1 (count s1)
        c2 (count s2)
        maxed (max c1 c2)
        mined (min c1 c2)]
    (double (- 1
               (/ (- maxed mined)
                  maxed)))))

(defn score
  [oquery ostr]
  (let [query (clean-str oquery)
        str (clean-str ostr)]
    (loop [q (seq (char-array query))
           s (seq (char-array str))
           mult 1
           idx MAX-STRING-LENGTH
           score 0]
      (cond
        ;; add str-len-distance to score, so strings with matches in same position get sorted by length
        ;; boost score if we have an exact match including punctuation
        (empty? q) (+ score
                      (str-len-distance query str)
                      (if (<= 0 (.indexOf ostr oquery)) MAX-STRING-LENGTH 0))
        (empty? s) 0
        :else (if (= (first q) (first s))
                  (recur (rest q)
                         (rest s)
                         (inc mult) ;; increase the multiplier as more query chars are matched
                         (dec idx) ;; decrease idx so score gets lowered the further into the string we match
                         (+ mult score)) ;; score for this match is current multiplier * idx
                  (recur q
                         (rest s)
                         1 ;; when there is no match, reset multiplier to one
                         (dec idx)
                         score))))))

(defn fuzzy-search
  [data query & {:keys [limit extract-fn]
                 :or {limit 20}}]
  (let [query (util/search-normalize query true)]
    (->> (take limit
               (sort-by :score (comp - compare)
                        (filter #(< 0 (:score %))
                                (for [item data]
                                  (let [s (str (if extract-fn (extract-fn item) item))]
                                    {:data item
                                     :score (score query (util/search-normalize s true))})))))
         (map :data))))
