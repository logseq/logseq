(ns frontend.utf8)
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
