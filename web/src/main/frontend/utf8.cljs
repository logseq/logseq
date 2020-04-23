(ns frontend.utf8
  (:require [goog.object :as gobj]))

(defonce encoder
  (js/TextEncoder. "utf-8"))

(defonce decoder
  (js/TextDecoder. "utf-8"))

(defn encode
  [s]
  (.encode encoder s))

(defn substring
  ([arr start]
   (->> (.subarray arr start)
        (.decode decoder)))
  ([arr start end]
   (->> (.subarray arr start end)
        (.decode decoder))))

(defn length
  [arr]
  (gobj/get arr "length"))

(defn insert!
  [s start-pos end-pos content]
  (let [arr (encode s)
        end-pos (or end-pos (length arr))]
    (str (substring arr 0 start-pos)
         content
         (substring arr end-pos))))
