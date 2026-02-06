(ns logseq.db-sync.worker.handler.sync
  (:require [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db-sync.batch :as batch]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.snapshot :as snapshot]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.worker.http :as http]
            [logseq.db-sync.worker.routes.sync :as sync-routes]
            [logseq.db-sync.worker.ws :as ws]
            [promesa.core :as p]))

(def ^:private snapshot-download-batch-size 500)
(def ^:private snapshot-cache-control "private, max-age=300")
(def ^:private snapshot-content-type "application/transit+json")
(def ^:private snapshot-content-encoding "gzip")
;; 10m
(def ^:private snapshot-multipart-part-size (* 10 1024 1024))

(defn parse-int [value]
  (when (some? value)
    (let [n (js/parseInt value 10)]
      (when-not (js/isNaN n)
        n))))

(defn- ensure-schema! [^js self]
  (when-not (true? (.-schema-ready self))
    (storage/init-schema! (.-sql self))
    (set! (.-schema-ready self) true)))

(defn- ensure-conn! [^js self]
  (ensure-schema! self)
  (when-not (.-conn self)
    (set! (.-conn self) (storage/open-conn (.-sql self)))))

(defn t-now [^js self]
  (ensure-schema! self)
  (storage/get-t (.-sql self)))

(defn- fetch-kvs-rows
  [sql after limit]
  (common/get-sql-rows
   (common/sql-exec sql
                    "select addr, content, addresses from kvs where addr > ? order by addr asc limit ?"
                    after
                    limit)))

(defn- snapshot-row->tuple [row]
  (if (array? row)
    [(aget row 0) (aget row 1) (aget row 2)]
    [(aget row "addr") (aget row "content") (aget row "addresses")]))

(defn- import-snapshot-rows!
  [sql table rows]
  (when (seq rows)
    (doseq [batch (batch/rows->insert-batches table rows nil)]
      (let [sql-str (:sql batch)
            args (:args batch)]
        (apply common/sql-exec sql sql-str args)))))

(defn- reset-import!
  [sql]
  (common/sql-exec sql "delete from kvs")
  (common/sql-exec sql "delete from tx_log")
  (common/sql-exec sql "delete from sync_meta")
  (storage/set-t! sql 0))

(defn- graph-id-from-request [request]
  (let [header-id (.get (.-headers request) "x-graph-id")
        url (js/URL. (.-url request))
        param-id (.get (.-searchParams url) "graph-id")]
    (when (seq (or header-id param-id))
      (or header-id param-id))))

(defn- snapshot-key [graph-id snapshot-id]
  (str graph-id "/" snapshot-id ".snapshot"))

(defn- snapshot-url [request graph-id snapshot-id]
  (let [url (js/URL. (.-url request))]
    (str (.-origin url) "/assets/" graph-id "/" snapshot-id ".snapshot")))

(defn- maybe-decompress-stream [stream encoding]
  (if (and (= encoding snapshot-content-encoding) (exists? js/DecompressionStream))
    (.pipeThrough stream (js/DecompressionStream. "gzip"))
    stream))

(defn- maybe-compress-stream [stream]
  (if (exists? js/CompressionStream)
    (.pipeThrough stream (js/CompressionStream. snapshot-content-encoding))
    stream))

(defn- <buffer-stream
  [stream]
  (p/let [resp (js/Response. stream)
          buf (.arrayBuffer resp)]
    buf))

(defn- ->uint8 [data]
  (cond
    (instance? js/Uint8Array data) data
    (instance? js/ArrayBuffer data) (js/Uint8Array. data)
    :else (js/Uint8Array. data)))

(defn- concat-uint8 [^js a ^js b]
  (cond
    (nil? a) b
    (nil? b) a
    :else
    (let [out (js/Uint8Array. (+ (.-byteLength a) (.-byteLength b)))]
      (.set out a 0)
      (.set out b (.-byteLength a))
      out)))

(defn- snapshot-export-stream [^js self]
  (let [sql (.-sql self)
        state (volatile! {:after -1 :done? false})]
    (js/ReadableStream.
     #js {:pull (fn [controller]
                  (p/let [{:keys [after done?]} @state]
                    (if done?
                      (.close controller)
                      (let [rows (fetch-kvs-rows sql after snapshot-download-batch-size)
                            rows (mapv snapshot-row->tuple rows)
                            last-addr (if (seq rows)
                                        (apply max (map first rows))
                                        after)
                            done? (< (count rows) snapshot-download-batch-size)]
                        (when (seq rows)
                          (let [payload (snapshot/encode-rows rows)
                                framed (snapshot/frame-bytes payload)]
                            (.enqueue controller framed)))
                        (vswap! state assoc :after last-addr :done? done?)))))})))

(defn- upload-multipart!
  [^js bucket key stream opts]
  (p/let [^js upload (.createMultipartUpload bucket key opts)]
    (let [reader (.getReader stream)]
      (-> (p/loop [buffer nil
                   part-number 1
                   parts []]
            (p/let [chunk (.read reader)]
              (if (.-done chunk)
                (cond
                  (and buffer (pos? (.-byteLength buffer)))
                  (p/let [^js resp (.uploadPart upload part-number buffer)
                          parts (conj parts {:partNumber part-number :etag (.-etag resp)})]
                    (p/let [_ (.complete upload (clj->js parts))]
                      {:ok true}))

                  (seq parts)
                  (p/let [_ (.complete upload (clj->js parts))]
                    {:ok true})

                  :else
                  (p/let [_ (.abort upload)]
                    (.put bucket key (js/Uint8Array. 0) opts)))
                (let [value (.-value chunk)
                      buffer (concat-uint8 buffer (->uint8 value))]
                  (if (>= (.-byteLength buffer) snapshot-multipart-part-size)
                    (let [part (.slice buffer 0 snapshot-multipart-part-size)
                          rest-parts (.slice buffer snapshot-multipart-part-size (.-byteLength buffer))]
                      (p/let [^js resp (.uploadPart upload part-number part)
                              parts (conj parts {:partNumber part-number :etag (.-etag resp)})]
                        (p/recur rest-parts (inc part-number) parts)))
                    (p/recur buffer part-number parts))))))
          (p/catch (fn [error]
                     (.abort upload)
                     (throw error)))))))

(defn- snapshot-export-length [^js self]
  (let [sql (.-sql self)]
    (p/loop [after -1
             total 0]
      (let [rows (fetch-kvs-rows sql after snapshot-download-batch-size)]
        (if (empty? rows)
          total
          (let [rows (mapv snapshot-row->tuple rows)
                payload (snapshot/encode-rows rows)
                total (+ total 4 (.-byteLength payload))
                last-addr (apply max (map first rows))
                done? (< (count rows) snapshot-download-batch-size)]
            (if done?
              total
              (p/recur last-addr total))))))))

(defn- snapshot-export-fixed-length [^js self]
  (p/let [length (snapshot-export-length self)
          stream (snapshot-export-stream self)]
    (if (exists? js/FixedLengthStream)
      (let [^js fixed (js/FixedLengthStream. length)
            readable (.-readable fixed)
            writable (.-writable fixed)
            reader (.getReader stream)
            writer (.getWriter writable)]
        (p/let [_ (p/loop []
                    (p/let [chunk (.read reader)]
                      (if (.-done chunk)
                        (.close writer)
                        (p/let [_ (.write writer (.-value chunk))]
                          (p/recur)))))]
          readable))
      (p/let [resp (js/Response. stream)
              buf (.arrayBuffer resp)]
        buf))))

(declare import-snapshot!)
(defn- import-snapshot-stream! [^js self stream reset?]
  (let [reader (.getReader stream)
        reset-pending? (volatile! reset?)
        total-count (volatile! 0)]
    (p/let [buffer nil]
      (p/catch
       (p/loop [buffer buffer]
         (p/let [chunk (.read reader)]
           (if (.-done chunk)
             (let [rows (snapshot/finalize-framed-buffer buffer)
                   rows-count (count rows)
                   reset? (and @reset-pending? true)]
               (when (or reset? (seq rows))
                 (import-snapshot! self rows reset?)
                 (vreset! reset-pending? false))
               (vswap! total-count + rows-count)
               @total-count)
             (let [value (.-value chunk)
                   {:keys [rows buffer]} (snapshot/parse-framed-chunk buffer value)
                   rows-count (count rows)
                   reset? (and @reset-pending? (seq rows))]
               (when (seq rows)
                 (import-snapshot! self rows (true? reset?))
                 (vreset! reset-pending? false))
               (vswap! total-count + rows-count)
               (p/recur buffer)))))
       (fn [error]
         (throw error))))))

(defn pull-response [^js self since]
  (let [sql (.-sql self)
        txs (storage/fetch-tx-since sql since)
        response {:type "pull/ok"
                  :t (t-now self)
                  :txs txs}]
    response))

(defn- import-snapshot! [^js self rows reset?]
  (let [sql (.-sql self)]
    (ensure-schema! self)
    (when reset?
      (reset-import! sql))
    (import-snapshot-rows! sql "kvs" rows)))

(defn- apply-tx! [^js self sender txs]
  (let [sql (.-sql self)]
    (ensure-conn! self)
    (let [conn (.-conn self)
          tx-data (protocol/transit->tx txs)]
      (ldb/transact! conn tx-data {:op :apply-client-tx})
      (let [new-t (storage/get-t sql)]
        ;; FIXME: no need to broadcast if client tx is less than remote tx
        (ws/broadcast! self sender {:type "changed" :t new-t})
        new-t))))

(defn handle-tx-batch! [^js self sender txs t-before]
  (let [current-t (t-now self)]
    (cond
      (or (not (number? t-before)) (neg? t-before))
      {:type "tx/reject"
       :reason "invalid t-before"}

      (not= t-before current-t)
      {:type "tx/reject"
       :reason "stale"
       :t current-t}

      :else
      (if txs
        (try
          (let [new-t (apply-tx! self sender txs)]
            (if (and (map? new-t) (= "tx/reject" (:type new-t)))
              new-t
              {:type "tx/batch/ok"
               :t new-t}))
          (catch :default e
            (log/error :db-sync/transact-failed e)
            {:type "tx/reject"
             :reason "db transact failed"
             :t current-t}))
        {:type "tx/reject"
         :reason "empty tx data"}))))

(defn handle [{:keys [^js self request url route]}]
  (case (:handler route)
    :sync/health
    (http/json-response :sync/health {:ok true})

    :sync/pull
    (let [raw-since (.get (.-searchParams url) "since")
          since (if (some? raw-since) (parse-int raw-since) 0)]
      (if (or (and (some? raw-since) (not (number? since))) (neg? since))
        (http/bad-request "invalid since")
        (http/json-response :sync/pull (pull-response self since))))

    :sync/snapshot-download
    (let [graph-id (graph-id-from-request request)
          ^js bucket (.-LOGSEQ_SYNC_ASSETS (.-env self))]
      (cond
        (not (seq graph-id))
        (http/bad-request "missing graph id")

        (nil? bucket)
        (http/error-response "missing assets bucket" 500)

        :else
        (p/let [snapshot-id (str (random-uuid))
                key (snapshot-key graph-id snapshot-id)
                use-compression? (exists? js/CompressionStream)
                content-encoding (when use-compression? snapshot-content-encoding)
                stream (snapshot-export-stream self)
                stream (if use-compression?
                         (maybe-compress-stream stream)
                         stream)
                multipart? (and (some? (.-createMultipartUpload bucket))
                                (fn? (.-createMultipartUpload bucket)))
                opts #js {:httpMetadata #js {:contentType snapshot-content-type
                                             :contentEncoding content-encoding
                                             :cacheControl snapshot-cache-control}
                          :customMetadata #js {:purpose "snapshot"
                                               :created-at (str (common/now-ms))}}
                _ (if multipart?
                    (upload-multipart! bucket key stream opts)
                    (if use-compression?
                      (p/let [body (<buffer-stream stream)]
                        (.put bucket key body opts))
                      (p/let [body (snapshot-export-fixed-length self)]
                        (.put bucket key body opts))))
                url (snapshot-url request graph-id snapshot-id)]
          (http/json-response :sync/snapshot-download {:ok true
                                                       :key key
                                                       :url url
                                                       :content-encoding content-encoding}))))

    :sync/admin-reset
    (do
      (common/sql-exec (.-sql self) "drop table if exists kvs")
      (common/sql-exec (.-sql self) "drop table if exists tx_log")
      (common/sql-exec (.-sql self) "drop table if exists sync_meta")
      (storage/init-schema! (.-sql self))
      (set! (.-schema-ready self) true)
      (set! (.-conn self) nil)
      (http/json-response :sync/admin-reset {:ok true}))

    :sync/tx-batch
    (.then (common/read-json request)
           (fn [result]
             (if (nil? result)
               (http/bad-request "missing body")
               (let [body (js->clj result :keywordize-keys true)
                     body (http/coerce-http-request :sync/tx-batch body)]
                 (if (nil? body)
                   (http/bad-request "invalid tx")
                   (let [{:keys [txs t-before]} body
                         t-before (parse-int t-before)]
                     (if (string? txs)
                       (http/json-response :sync/tx-batch (handle-tx-batch! self nil txs t-before))
                       (http/bad-request "invalid tx"))))))))

    :sync/snapshot-upload
    (let [graph-id (graph-id-from-request request)
          reset-param (.get (.-searchParams url) "reset")
          reset? (if (nil? reset-param)
                   true
                   (not (contains? #{"false" "0"} reset-param)))
          req-encoding (.get (.-headers request) "content-encoding")]
      (cond
        (not (seq graph-id))
        (http/bad-request "missing graph id")

        (nil? (.-body request))
        (http/bad-request "missing body")

        :else
        (let [stream (.-body request)
              encoding (or req-encoding "")]
          (if (and (= encoding snapshot-content-encoding)
                   (not (exists? js/DecompressionStream)))
            (http/error-response "gzip not supported" 500)
            (p/let [stream (maybe-decompress-stream stream encoding)
                    count (import-snapshot-stream! self stream reset?)]
              (http/json-response :sync/snapshot-upload {:ok true
                                                         :count count}))))))

    (http/not-found)))

(defn- strip-sync-prefix [path]
  (if (string/starts-with? path "/sync/")
    (let [rest-path (subs path (count "/sync/"))
          slash-idx (string/index-of rest-path "/")]
      (if (neg? slash-idx)
        "/"
        (subs rest-path slash-idx)))
    path))

(defn handle-http [^js self request]
  (letfn [(with-cors-error [resp]
            (if (instance? js/Promise resp)
              (.catch resp
                      (fn [e]
                        (log/error :db-sync/http-error {:error e})
                        (http/error-response "server error" 500)))
              resp))]
    (try
      (let [url (js/URL. (.-url request))
            raw-path (.-pathname url)
            path (strip-sync-prefix raw-path)
            method (.-method request)]
        (with-cors-error
          (cond
            (= method "OPTIONS")
            (common/options-response)

            :else
            (if-let [route (sync-routes/match-route method path)]
              (handle {:self self
                       :request request
                       :url url
                       :route route})
              (http/not-found)))))
      (catch :default e
        (log/error :db-sync/http-error {:error e})
        (http/error-response "server error" 500)))))
