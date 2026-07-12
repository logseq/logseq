(ns logseq.db-sync.worker.handler.assets
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [logseq.db-sync.common :as common :refer [cors-headers]]
            [logseq.db-sync.worker.http :as http]
            [promesa.core :as p]))

(def max-asset-size (* 100 1024 1024))

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

(defn <put-stream!
  "Streams `body` with a declared byte length to the R2 `bucket` without buffering it in Worker memory.

  Options:

  | key             | description |
  |-----------------|-------------|
  | `:size`         | Exact payload size in bytes |
  | `:content-type` | HTTP content type stored in R2 metadata |
  | `:checksum`     | Client-computed SHA-256 checksum |
  | `:asset-type`   | File extension stored in custom metadata |
  | `:encoding`     | Optional `base64` streaming transfer encoding |"
  [^js bucket key body {:keys [size content-type checksum asset-type encoding]}]
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
          source-body (or decoded-body body)
          {stream-body :body fixed-length-promise :pipe-promise} (fixed-length-body source-body size)
          put-promise (.put bucket key (or stream-body source-body)
                            #js {:httpMetadata #js {:contentType (or content-type "application/octet-stream")}
                                 :customMetadata #js {:checksum checksum :type asset-type}})]
      (-> (p/all (cond-> [put-promise]
                   decode-promise (conj decode-promise)
                   fixed-length-promise (conj fixed-length-promise)))
          (p/then (fn [_]
                    (http/json-response :assets/put {:ok true} 200)))
          (p/catch (fn [error]
                     (if (= "invalid base64 asset body" (.-message error))
                       (http/error-response (.-message error) 400)
                       (throw error))))))))

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

(defn- handle-get-asset
  [^js bucket key asset-type]
  (.then (.get bucket key)
         (fn [^js obj]
           (if (nil? obj)
             (http/error-response "not found" 404)
             (let [metadata (.-httpMetadata obj)
                   content-type (or (.-contentType metadata)
                                    "application/octet-stream")
                   content-encoding (.-contentEncoding metadata)
                   cache-control (.-cacheControl metadata)
                   size (parse-size (or (.-size obj)
                                        (some-> (.-body obj) .-byteLength)))
                   content-length (cond
                                    (number? size) (str size)
                                    (string? size) size
                                    :else nil)]
               (p/let [body (<body-with-known-length (.-body obj) size)
                       headers (cond-> {"content-type" content-type
                                        "x-asset-type" asset-type}
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
      (if-let [{:keys [key asset-type]} (parse-asset-path path)]
        (let [^js bucket (.-LOGSEQ_SYNC_ASSETS env)]
          (if-not bucket
            (http/error-response "missing assets bucket" 500)
            (case method
              "GET"
              (handle-get-asset bucket key asset-type)

              "PUT"
              (.then (.arrayBuffer request)
                     (fn [buf]
                       (if (> (.-byteLength buf) max-asset-size)
                         (http/error-response "asset too large" 413)
                         (.then (.put bucket
                                      key
                                      buf
                                      #js {:httpMetadata #js {:contentType (or (.get (.-headers request) "content-type")
                                                                               "application/octet-stream")}
                                           :customMetadata #js {:checksum (.get (.-headers request) "x-amz-meta-checksum")
                                                                :type asset-type}})
                                (fn [_]
                                  (http/json-response :assets/put {:ok true} 200))))))

              "DELETE"
              (.then (.delete bucket key)
                     (fn [_]
                       (http/json-response :assets/delete {:ok true} 200)))

              (http/error-response "method not allowed" 405))))
        (http/error-response "invalid asset path" 400)))))
