(ns logseq.db-sync.snapshot
  (:require [cognitect.transit :as transit]))

(def ^:private transit-w (transit/writer :json))
(def ^:private transit-r (transit/reader :json))
(def ^:private text-decoder (js/TextDecoder.))
(def ^:private newline-byte 10)

(defn- ->uint8
  [data]
  (cond
    (instance? js/Uint8Array data) data
    (instance? js/ArrayBuffer data) (js/Uint8Array. data)
    (string? data) (.encode (js/TextEncoder.) data)
    :else (js/Uint8Array. data)))

(defn encode-rows
  [rows]
  (->uint8 (transit/write transit-w rows)))

(defn decode-rows
  [payload]
  (transit/read transit-r (.decode text-decoder (->uint8 payload))))

(defn concat-bytes
  [^js a ^js b]
  (cond
    (nil? a) b
    (nil? b) a
    :else
    (let [out (js/Uint8Array. (+ (.-byteLength a) (.-byteLength b)))]
      (.set out a 0)
      (.set out b (.-byteLength a))
      out)))

(defn parse-framed-chunk
  [buffer chunk]
  (let [data (concat-bytes buffer chunk)
        total (.-byteLength data)]
    (loop [offset 0
           rows []]
      (if (< (- total offset) 4)
        {:rows rows
         :buffer (when (< offset total)
                   (.slice data offset total))}
        (let [view (js/DataView. (.-buffer data) offset 4)
              len (.getUint32 view 0 false)
              next-offset (+ offset 4 len)]
          (if (<= next-offset total)
            (let [payload (.slice data (+ offset 4) next-offset)
                  decoded (decode-rows payload)]
              (recur next-offset (into rows decoded)))
            {:rows rows
             :buffer (.slice data offset total)}))))))

(defn finalize-framed-buffer
  [buffer]
  (if (or (nil? buffer) (zero? (.-byteLength buffer)))
    []
    (let [{:keys [rows buffer]} (parse-framed-chunk nil buffer)]
      (if (and (seq rows) (or (nil? buffer) (zero? (.-byteLength buffer))))
        rows
        (throw (ex-info "incomplete framed buffer" {:buffer buffer :rows rows}))))))

(defn framed-length
  [rows-batches]
  (reduce (fn [total rows]
            (let [payload (encode-rows rows)]
              (+ total 4 (.-byteLength payload))))
          0
          rows-batches))

(defn- decode-transit
  [payload]
  (transit/read transit-r (.decode text-decoder (->uint8 payload))))

(defn encode-datoms-jsonl
  [datoms]
  (->uint8
   (apply str
          (map (fn [datom]
                 (str (transit/write transit-w datom) "\n"))
               datoms))))

(defn- find-newline-offset
  [^js data start total]
  (loop [offset start]
    (cond
      (>= offset total)
      nil

      (= newline-byte (aget data offset))
      offset

      :else
      (recur (inc offset)))))

(defn parse-datoms-jsonl-chunk
  [buffer chunk]
  (let [data (concat-bytes buffer chunk)
        total (.-byteLength data)]
    (loop [offset 0
           datoms []]
      (let [newline-offset (find-newline-offset data offset total)]
        (if (number? newline-offset)
          (let [line (.slice data offset newline-offset)
                next-offset (inc newline-offset)
                datoms (if (zero? (.-byteLength line))
                         datoms
                         (conj datoms (decode-transit line)))]
            (recur next-offset datoms))
          {:datoms datoms
           :buffer (when (< offset total)
                     (.slice data offset total))})))))

(defn finalize-datoms-jsonl-buffer
  [buffer]
  (if (or (nil? buffer) (zero? (.-byteLength buffer)))
    []
    (let [{:keys [datoms buffer]} (parse-datoms-jsonl-chunk nil buffer)]
      (cond-> datoms
        (and buffer (pos? (.-byteLength buffer)))
        (conj (decode-transit buffer))))))
