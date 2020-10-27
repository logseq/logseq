(ns frontend.diff
  (:require [clojure.string :as string]
            ["diff" :as jsdiff]
            [goog.object :as gobj]
            [cljs-bean.core :as bean]))

(defn diff
  [s1 s2]
  (-> ((gobj/get jsdiff "diffLines") s1 s2)
      bean/->clj))

;; (find-position "** hello _w_" "hello w")
(defn find-position
  [markup text]
  (cond
    (<= (count markup) (count text))
    (dec (count markup))

    :else
    (try
      (let [markup (string/lower-case markup)
            text (-> (string/replace text #"\s+" "")
                     (string/lower-case))
            v1 (vec markup)
            v2 (vec text)]
        (loop [v1-chars v1
               v2-chars v2
               v1-idx 0
               v2-idx 0]
          (cond
            (empty? v2-chars)
            (dec v1-idx)

            :else
            (if (= (nth v1 v1-idx)
                   (nth v2 v2-idx))
              (recur (rest v1-chars)
                     (rest v2-chars)
                     (inc v1-idx)
                     (inc v2-idx))
              (recur (rest v1-chars)
                     v2-chars
                     (inc v1-idx)
                     v2-idx)))))
      (catch js/Error e
        (prn "diff error: " e)
        (dec (count markup))))))
