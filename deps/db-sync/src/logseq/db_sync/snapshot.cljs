(ns logseq.db-sync.snapshot
  (:require [cognitect.transit :as transit]))

(def ^:private transit-w (transit/writer :json))
(def ^:private transit-r (transit/reader :json))
(def ^:private text-decoder (js/TextDecoder.))

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

(defn frame-bytes
  [^js payload]
  (let [len (.-byteLength payload)
        out (js/Uint8Array. (+ 4 len))
        view (js/DataView. (.-buffer out))]
    (.setUint32 view 0 len false)
    (.set out payload 4)
    out))

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
