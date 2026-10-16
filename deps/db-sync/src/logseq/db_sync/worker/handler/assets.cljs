(ns logseq.db-sync.worker.handler.assets
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [logseq.db-sync.common :as common :refer [cors-headers]]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.http :as http]
            [promesa.core :as p]))

(def max-asset-size (* 100 1024 1024))
(def max-encrypted-asset-size (* 200 1024 1024))

(def ^:private asset-type->content-type
  {"png" "image/png"
   "jpg" "image/jpeg"
   "jpeg" "image/jpeg"
   "gif" "image/gif"
   "webp" "image/webp"
   "bmp" "image/bmp"
   "svg" "image/svg+xml"
   "ico" "image/x-icon"
   "jxl" "image/jxl"
   "pdf" "application/pdf"})

(def ^:private inline-content-types
  "Content types safe to render inline from the API origin. Everything else is
  served as an attachment with `nosniff`, and SVG additionally gets a CSP
  sandbox, so stored attacker-controlled HTML or script cannot execute on the
  sync origin."
  #{"image/png" "image/jpeg" "image/gif" "image/webp" "image/bmp"
    "image/x-icon" "image/jxl" "image/svg+xml" "application/pdf"})

(defn- response-content-type [stored-content-type asset-type]
  (or (get asset-type->content-type (string/lower-case asset-type))
      stored-content-type
      "application/octet-stream"))

(defn- parse-size
  [size]
  (cond
    (number? size) size
    (string? size) (let [n (js/parseInt size 10)]
                     (when-not (js/isNaN n)
                       n))
    :else nil))

(defn- fixed-length-body
  [body size]
  (when (and (number? size)
             (exists? js/FixedLengthStream)
             (some? body)
             (fn? (.-pipeTo body)))
    (let [^js fixed (js/FixedLengthStream. size)]
      {:body (.-readable fixed)
       :pipe-promise (.pipeTo body (.-writable fixed))})))

(defn- decoded-base64-chunk
  [value]
  (when-not (re-matches #"(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?" value)
    (throw (js/Error. "invalid base64 asset body")))
  (let [decoded (js/atob value)
        result (js/Uint8Array. (.-length decoded))]
    (dotimes [index (.-length decoded)]
      (aset result index (.charCodeAt decoded index)))
    result))

(defn- base64-decoded-body
  [body]
  (let [remainder (atom "")
        decoder (js/TextDecoder.)
        transform (js/TransformStream.
                   #js {:transform
                        (fn [chunk controller]
                          (let [text (string/replace
                                      (str @remainder (.decode decoder chunk #js {:stream true}))
                                      #"\s" "")
                                complete-length (* 4 (max 0 (dec (quot (count text) 4))))
                                complete (subs text 0 complete-length)]
                            (reset! remainder (subs text complete-length))
                            (when (seq complete)
                              (.enqueue controller (decoded-base64-chunk complete)))))
                        :flush
                        (fn [controller]
                          (let [tail (string/replace (str @remainder (.decode decoder)) #"\s" "")]
                            (when (seq tail)
                              (.enqueue controller (decoded-base64-chunk tail)))))})]
    {:body (.-readable transform)
     :pipe-promise (.pipeTo body (.-writable transform))}))

(defn- response-fixed-length-body
  [body size]
  (let [{stream-body :body pipe-promise :pipe-promise} (fixed-length-body body size)]
    (when pipe-promise
      ;; The response consumes the paired readable stream after this handler returns.
      (p/catch pipe-promise (fn [_] nil)))
    stream-body))

(defn- encrypted-asset-body
  "Validates the canonical Transit `[iv ciphertext]` stream without buffering the asset."
  [body size]
  (let [prefix (atom "")
        prefix-ready? (atom false)
        cipher-length (atom 0)
        max-cipher-length (* 4 (js/Math.ceil (/ (+ size 16) 3)))
        padding (atom 0)
        suffix (atom nil)
        decoder (js/TextDecoder.)
        invalid! (fn [] (throw (js/Error. "invalid encrypted asset body")))
        consume! (fn [text]
                   (if (some? @suffix)
                     (do (swap! suffix str text)
                         (when-not (contains? #{"\"" "\"]"} @suffix) (invalid!)))
                     (let [end (string/index-of text "\"")
                           data (if end (subs text 0 end) text)
                           pad (or (string/index-of data "=") (count data))]
                       (when-not (and (re-matches #"[A-Za-z0-9+/]*={0,2}" data)
                                      (or (zero? @padding) (re-matches #"={0,2}" data)))
                         (invalid!))
                       (swap! cipher-length + (count data))
                       (swap! padding + (- (count data) pad))
                       (when (or (> @padding 2) (> @cipher-length max-cipher-length))
                         (invalid!))
                       (when end
                         (reset! suffix (subs text end))
                         (when-not (contains? #{"\"" "\"]"} @suffix) (invalid!))))))
        transform (js/TransformStream.
                   #js {:transform
                        (fn [chunk controller]
                          (let [text (.decode decoder chunk)]
                            (if @prefix-ready?
                              (do (consume! text) (.enqueue controller chunk))
                              (let [text (str @prefix text)]
                                (if (< (count text) 25)
                                  (reset! prefix text)
                                  (do
                                    (when-not (re-matches #"\[\"~b[A-Za-z0-9+/]{16}\",\"~b" (subs text 0 25))
                                      (invalid!))
                                    (reset! prefix-ready? true)
                                    (reset! prefix nil)
                                    (consume! (subs text 25))
                                    (.enqueue controller (.encode (js/TextEncoder.) text))))))))
                        :flush
                        (fn [_controller]
                          (when-not (and @prefix-ready? (= "\"]" @suffix)
                                         (zero? (mod @cipher-length 4))
                                         (= (+ size 16) (- (* 3 (quot @cipher-length 4)) @padding)))
                            (invalid!)))})]
    {:body (.-readable transform)
     :pipe-promise (.pipeTo body (.-writable transform))}))

(defn <put-stream!
  "Streams `body` with a declared byte length to the R2 `bucket` without buffering it in Worker memory.

  Options:

  | key             | description |
  |-----------------|-------------|
  | `:size`         | Plaintext file size in bytes |
  | `:content-type` | HTTP content type stored in R2 metadata |
  | `:checksum`     | Client-computed SHA-256 checksum |
  | `:asset-type`   | File extension stored in custom metadata |
  | `:encoding`     | Optional `base64` streaming transfer encoding |
  | `:e2ee?`        | Require a canonical encrypted file package |"
  [^js bucket key body {:keys [size content-type checksum asset-type encoding e2ee?]}]
  (cond
    (or (not (number? size)) (neg? size))
    (p/resolved (http/error-response "invalid asset size" 400))

    (> size max-asset-size)
    (p/resolved (http/error-response "asset too large" 413))

    (nil? body)
    (p/resolved (http/error-response "missing asset body" 400))

    :else
    (let [{decoded-body :body decode-promise :pipe-promise}
          (when (= "base64" encoding) (base64-decoded-body body))
          decoded-body (or decoded-body body)
          {encrypted-body :body encrypted-promise :pipe-promise}
          (when e2ee? (encrypted-asset-body decoded-body size))
          source-body (or encrypted-body decoded-body)
          upload-size (if e2ee? (+ 27 (* 4 (js/Math.ceil (/ (+ size 16) 3)))) size)
          {stream-body :body fixed-length-promise :pipe-promise} (fixed-length-body source-body upload-size)
          put-promise (.put bucket key (or stream-body source-body)
                            #js {:httpMetadata #js {:contentType (or content-type "application/octet-stream")}
                                 :customMetadata #js {:checksum checksum :type asset-type}})]
      (-> (js/Promise.allSettled
           (to-array (cond-> [put-promise]
                       decode-promise (conj decode-promise)
                       encrypted-promise (conj encrypted-promise)
                       fixed-length-promise (conj fixed-length-promise))))
          (p/then (fn [results]
                    (if-let [failure (some #(when (= "rejected" (.-status %)) %) (array-seq results))]
                      (throw (.-reason failure))
                      (http/json-response :assets/put {:ok true} 200))))
          (p/catch (fn [error]
                     (p/let [_ (when e2ee? (.delete bucket key))]
                       (if (contains? #{"invalid base64 asset body" "invalid encrypted asset body"} (.-message error))
                         (http/error-response (.-message error) 400)
                         (throw error)))))))))

(defn- <body-with-known-length
  [body size]
  (cond
    (nil? body)
    (p/resolved nil)

    (and (number? size)
         (exists? js/FixedLengthStream)
         (fn? (some-> body .-pipeTo)))
    (p/resolved (response-fixed-length-body body size))

    ;; Some runtimes drop content-length for streamed bodies without a fixed-length wrapper.
    ;; Buffer as a fallback so clients still receive the header.
    (and (number? size)
         (fn? (some-> body .-getReader)))
    (p/let [resp (js/Response. body)
            buf (.arrayBuffer resp)]
      buf)

    :else
    (p/resolved body)))

(defn- sha-256-hex
  [buf]
  (p/let [digest (.digest (.-subtle js/crypto) "SHA-256" buf)]
    (->> (js/Uint8Array. digest)
         (js/Array.from)
         (map (fn [octet] (.padStart (.toString octet 16) 2 "0")))
         (apply str))))

(defn- <verify-checksum!
  "Checks the declared SHA-256 of a plaintext (non-E2EE) upload against the
  bytes actually stored, so one member cannot plant different bytes under a
  legitimate file's checksum."
  [buf checksum]
  (if (seq checksum)
    (p/let [hex (sha-256-hex buf)]
      (when (not= hex checksum)
        (throw (ex-info "asset checksum mismatch"
                        {:type :db-sync/asset-checksum-mismatch}))))
    (p/resolved nil)))

(defn- handle-get-asset
  [^js bucket key asset-type]
  (.then (.get bucket key)
         (fn [^js obj]
           (if (nil? obj)
             (http/error-response "not found" 404)
             (let [metadata (.-httpMetadata obj)
                   content-type (response-content-type (.-contentType metadata) asset-type)
                   content-encoding (.-contentEncoding metadata)
                   cache-control (.-cacheControl metadata)
                   lower-content-type (string/lower-case content-type)
                   inline? (contains? inline-content-types lower-content-type)
                   svg? (= "image/svg+xml" lower-content-type)
                   size (parse-size (or (.-size obj)
                                        (some-> (.-body obj) .-byteLength)))
                   content-length (cond
                                    (number? size) (str size)
                                    (string? size) size
                                    :else nil)]
               (p/let [body (<body-with-known-length (.-body obj) size)
                       headers (cond-> {"content-type" content-type
                                        "content-disposition" (str (if inline? "inline" "attachment")
                                                                   "; filename=\""
                                                                   (last (string/split key #"/")) "\"")
                                        "x-asset-type" asset-type
                                        "x-content-type-options" "nosniff"}
                                 svg?
                                 (assoc "content-security-policy" "sandbox")
                                 (and (string? content-length)
                                      (pos? (.-length content-length)))
                                 (assoc "content-length" content-length)
                                 (and (string? content-length)
                                      (pos? (.-length content-length)))
                                 (assoc "x-asset-size" content-length)
                                 (and (string? content-encoding)
                                      (not= content-encoding "null")
                                      (pos? (.-length content-encoding)))
                                 (assoc "content-encoding" content-encoding)
                                 (and (string? cache-control)
                                      (pos? (.-length cache-control)))
                                 (assoc "cache-control" cache-control)
                                 true
                                 (bean/->js))]
                 (js/Response. body
                               #js {:status 200
                                    :headers (js/Object.assign
                                              headers
                                              (cors-headers))})))))))

(defn parse-asset-path [path]
  (let [prefix "/assets/"]
    (when (string/starts-with? path prefix)
      (let [rest-path (subs path (count prefix))
            slash-idx (string/index-of rest-path "/")
            graph-id (when (and slash-idx (pos? slash-idx)) (subs rest-path 0 slash-idx))
            file (when (and slash-idx (pos? slash-idx)) (subs rest-path (inc slash-idx)))
            dot-idx (when file (string/last-index-of file "."))
            asset-uuid (when (and dot-idx (pos? dot-idx)) (subs file 0 dot-idx))
            asset-type (when (and dot-idx (pos? dot-idx)) (subs file (inc dot-idx)))]
        (when (and (seq graph-id) (seq asset-uuid) (seq asset-type))
          {:graph-id graph-id
           :asset-uuid asset-uuid
           :asset-type asset-type
           :key (str graph-id "/" asset-uuid "." asset-type)})))))

(defn handle [request ^js env]
  (let [url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (cond
      (= method "OPTIONS")
      (js/Response. nil #js {:status 204 :headers (cors-headers)})

      :else
      (if-let [{:keys [graph-id key asset-type]} (parse-asset-path path)]
        (let [^js bucket (.-LOGSEQ_SYNC_ASSETS env)]
          (if-not bucket
            (http/error-response "missing assets bucket" 500)
            (case method
              "GET"
              (handle-get-asset bucket key asset-type)

              "PUT"
              (p/let [e2ee? (index/<graph-e2ee? (.-DB env) graph-id)
                      buf (.arrayBuffer request)
                      size-limit (if e2ee? max-encrypted-asset-size max-asset-size)]
                (if (> (.-byteLength buf) size-limit)
                  (http/error-response "asset too large" 413)
                  (-> (p/let [_ (when-not e2ee?
                                 ;; On E2EE graphs the body is an encrypted package and
                                 ;; the declared checksum describes the plaintext.
                                 (<verify-checksum! buf (.get (.-headers request) "x-amz-meta-checksum")))
                          _ (.put bucket
                                  key
                                  buf
                                  #js {:httpMetadata #js {:contentType (or (.get (.-headers request) "content-type")
                                                                           "application/octet-stream")}
                                       :customMetadata #js {:checksum (.get (.-headers request) "x-amz-meta-checksum")
                                                            :type asset-type}})]
                        (http/json-response :assets/put {:ok true} 200))
                      (p/catch (fn [error]
                                 (if (= :db-sync/asset-checksum-mismatch (:type (ex-data error)))
                                   (http/bad-request "asset checksum mismatch")
                                   (throw error)))))))

              "DELETE"
              (.then (.delete bucket key)
                     (fn [_]
                       (http/json-response :assets/delete {:ok true} 200)))

              (http/error-response "method not allowed" 405))))
        (http/error-response "invalid asset path" 400)))))
