(ns logseq.graph-parser.utf8
  "Utf8 utilities used by the parser")

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
   (if end
     (decode (.subarray arr start end))
     (decode (.subarray arr start)))))
