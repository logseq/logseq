(ns frontend.utf8
  (:require [goog.object :as gobj]))

(defonce encoder
  (js/TextEncoder. "utf-8"))

(defonce decoder
  (js/TextDecoder. "utf-8"))

(defn encode
  [s]
  (.encode encoder s))

(defn decode
  [arr]
  (.decode decoder arr))

(defn substring
  ([arr start]
   (decode (.subarray arr start)))
  ([arr start end]
   (decode (.subarray arr start end))))

(defn length
  [arr]
  (gobj/get arr "length"))

;; start-pos inclusive
;; end-pos exclusive
(defn insert!
  [s start-pos end-pos content]
  (let [arr (encode s)
        end-pos (or end-pos (length arr))]
    (str (substring arr 0 start-pos)
         content
         (substring arr end-pos))))

(defn delete!
  [s start-pos end-pos]
  (insert! s start-pos end-pos ""))
