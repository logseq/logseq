(ns logseq.db-sync.worker.handler.sync
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db-sync.batch :as batch]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.snapshot :as snapshot]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.worker.http :as http]
            [logseq.db-sync.worker.routes.sync :as sync-routes]
            [logseq.db-sync.worker.ws :as ws]
            [logseq.db.frontend.schema :as db-schema]
            [promesa.core :as p]))

(def ^:private snapshot-download-batch-size 10000)
(def ^:private snapshot-cache-control "private, max-age=300")
(def ^:private snapshot-content-type "application/x-ndjson")
(def ^:private snapshot-content-encoding "gzip")
(def ^:private snapshot-uploading-meta-key :snapshot-uploading?)
;; 10m
(def ^:private snapshot-multipart-part-size (* 10 1024 1024))

(defn parse-int [value]
  (when (some? value)
    (let [n (js/parseInt value 10)]
      (when-not (js/isNaN n)
        n))))

(defn- ensure-schema! [^js self]
  (when-not (true? (.-schema-ready self))
    (try
      (storage/init-schema! (.-sql self))
      (catch :default e
        ;; Schema may already exist. If DDL writes are rejected, probe
        ;; existing tables before deciding this is a fatal error.
        (try
          (common/sql-exec (.-sql self) "select 1 from kvs limit 1")
          (common/sql-exec (.-sql self) "select 1 from tx_log limit 1")
          (common/sql-exec (.-sql self) "select 1 from sync_meta limit 1")
          (catch :default _
            (throw e)))))
    (set! (.-schema-ready self) true)))

(defn- ensure-conn! [^js self]
  (ensure-schema! self)
  (when-not (.-conn self)
    (set! (.-conn self) (storage/open-conn (.-sql self)))))

(defn t-now [^js self]
  (ensure-schema! self)
  (storage/get-t (.-sql self)))

(defn snapshot-upload-finished? [^js self]
  (ensure-schema! self)
  (not= "true" (storage/get-meta (.-sql self) snapshot-uploading-meta-key)))

(defn <ready-for-sync?
  [^js self graph-id]
  (if-not (snapshot-upload-finished? self)
    (p/resolved false)
    (if-let [db (some-> self .-env (aget "DB"))]
      (p/let [graph-ready-for-use? (index/<graph-ready-for-use? db graph-id)]
        (not= false graph-ready-for-use?))
      (p/resolved true))))

(defn- <set-graph-ready-for-use!
  [^js self graph-id graph-ready-for-use?]
  (if-let [db (some-> self .-env (aget "DB"))]
    (p/let [result (index/<graph-ready-for-use-set! db graph-id graph-ready-for-use?)
            meta (some-> result (aget "meta"))
            rows-affected (or (some-> meta (aget "changes"))
                              (some-> meta (aget "rows_written"))
                              (some-> result (aget "changes"))
                              (some-> result (aget "rows_written")))]
      (when (or (nil? result)
                (false? (some-> result (aget "success"))))
        (throw (ex-info "failed to persist graph_ready_for_use"
                        {:type :db-sync/graph-ready-for-use-set-failed
                         :graph-id graph-id
                         :graph-ready-for-use? graph-ready-for-use?
                         :result result})))
      (when (and (number? rows-affected)
                 (<= rows-affected 0))
        (throw (ex-info "graph_ready_for_use update affected no rows"
                        {:type :db-sync/graph-ready-for-use-set-no-rows
                         :graph-id graph-id
                         :graph-ready-for-use? graph-ready-for-use?
                         :rows-affected rows-affected
                         :result result})))
      result)
    (p/rejected (ex-info "missing DB binding for graph_ready_for_use update"
                         {:type :db-sync/missing-db-binding
                          :graph-id graph-id
                          :graph-ready-for-use? graph-ready-for-use?}))))

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

(defn graph-id-from-request [request]
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
  (when-not (exists? js/CompressionStream)
    (throw (ex-info "gzip compression not supported"
                    {:type :db-sync/compression-not-supported})))
  (.pipeThrough stream (js/CompressionStream. snapshot-content-encoding)))

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

(defn- snapshot-datom->jsonl-datom
  [datom]
  {:e (:e datom)
   :a (:a datom)
   :v (:v datom)
   :tx (:tx datom)
   :added (:added datom)})

(defn- snapshot-datom-count
  [conn]
  (count (d/datoms @conn :eavt)))

(defn- snapshot-export-datoms
  [conn]
  (let [db @conn
        schema-version-eid (some-> (d/entity db :logseq.kv/schema-version) :db/id)
        ident-eids (into #{}
                         (map :e)
                         (d/datoms db :avet :db/ident))
        jsonl-datoms (fn [pred]
                       (sequence
                        (comp (filter pred)
                              (map snapshot-datom->jsonl-datom))
                        (d/datoms db :eavt)))]
    (concat (jsonl-datoms #(= schema-version-eid (:e %)))
            (jsonl-datoms #(and (contains? ident-eids (:e %))
                                (not= schema-version-eid (:e %))))
            (jsonl-datoms #(not (contains? ident-eids (:e %)))))))

(defn- snapshot-export-stream [^js self]
  (ensure-conn! self)
  (let [remaining (volatile! (seq (snapshot-export-datoms (.-conn self))))]
    (js/ReadableStream.
     #js {:pull (fn [controller]
                  (let [batch (vec (take snapshot-download-batch-size @remaining))]
                    (if (empty? batch)
                      (.close controller)
                      (let [remaining' (drop snapshot-download-batch-size @remaining)
                            payload (snapshot/encode-datoms-jsonl batch)]
                        (vreset! remaining (seq remaining'))
                        (.enqueue controller payload)))))})))

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
      (set! (.-conn self) nil)
      (reset-import! sql))
    (import-snapshot-rows! sql "kvs" rows)))

(defn- apply-tx! [^js self sender txs]
  (let [sql (.-sql self)]
    (ensure-conn! self)
    (let [conn (.-conn self)
          lookup-id (fn [x]
                      (when (and (vector? x)
                                 (= 2 (count x))
                                 (= :block/uuid (first x)))
                        (second x)))
          tx-data* (protocol/transit->tx txs)
          created-block-uuids (->> tx-data*
                                   (keep (fn [item]
                                           (when (and (vector? item)
                                                      (= :db/add (first item))
                                                      (>= (count item) 4)
                                                      (= :block/uuid (nth item 2)))
                                             (nth item 3))))
                                   set)
          missing-lookup-ref? (fn [x]
                                (when-let [block-uuid (lookup-id x)]
                                  (and (not (contains? created-block-uuids block-uuid))
                                       (nil? (d/entity @conn x)))))
          tx-data (remove (fn [item]
                            (when (vector? item)
                              (let [op (first item)
                                    attr (nth item 2 nil)
                                    value (when (>= (count item) 4) (nth item 3))]
                                (or (and (contains? #{:db/add :db/retract :db/retractEntity} op)
                                         (missing-lookup-ref? (second item)))
                                    (and (contains? #{:db/add :db/retract} op)
                                         (contains? db-schema/ref-type-attributes attr)
                                         (missing-lookup-ref? value))))))
                          tx-data*)]
      (ldb/transact! conn tx-data {:op :apply-client-tx})
      (let [new-t (storage/get-t sql)]
        ;; FIXME: no need to broadcast if client tx is less than remote tx
        (ws/broadcast! self sender {:type "changed" :t new-t})
        new-t))))

(defn handle-tx-batch! [^js self sender txs t-before]
  (let [current-t (t-now self)]
    (cond
      (not (snapshot-upload-finished? self))
      {:type "tx/reject"
       :reason "snapshot upload in progress"
       :t current-t}

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

(defn- handle-sync-pull
  [^js self ^js url]
  (let [raw-since (.get (.-searchParams url) "since")
        since (if (some? raw-since) (parse-int raw-since) 0)
        graph-id (.get (.-searchParams url) "graph-id")]
    (if (or (and (some? raw-since) (not (number? since))) (neg? since))
      (http/bad-request "invalid since")
      (p/let [ready-for-sync? (<ready-for-sync? self graph-id)]
        (if-not ready-for-sync?
          (http/error-response "graph not ready" 409)
          (http/json-response :sync/pull (pull-response self since)))))))

(defn- handle-sync-snapshot-stream
  [^js self request]
  (let [graph-id (graph-id-from-request request)]
    (if (not (seq graph-id))
      (http/bad-request "missing graph id")
      (let [stream (-> (snapshot-export-stream self)
                       (maybe-compress-stream))
            conn (or (.-conn self)
                     (do (ensure-conn! self) (.-conn self)))
            datom-count (snapshot-datom-count conn)]
        (js/Response. stream
                      #js {:status 200
                           :headers (js/Object.assign
                                     #js {"content-type" snapshot-content-type
                                          "content-encoding" snapshot-content-encoding}
                                     #js {"x-snapshot-datom-count" (str datom-count)}
                                     (common/cors-headers))})))))

(defn- handle-sync-snapshot-download
  [^js self request]
  (let [graph-id (graph-id-from-request request)
        ^js bucket (.-LOGSEQ_SYNC_ASSETS (.-env self))]
    (cond
      (not (seq graph-id))
      (http/bad-request "missing graph id")

      (nil? bucket)
      (http/error-response "missing assets bucket" 500)

      :else
      (p/let [ready-for-sync? (<ready-for-sync? self graph-id)]
        (if-not ready-for-sync?
          (http/error-response "graph not ready" 409)
          (p/let [snapshot-id (str (random-uuid))
                  key (snapshot-key graph-id snapshot-id)
                  stream (-> (snapshot-export-stream self)
                             (maybe-compress-stream))
                  multipart? (and (some? (.-createMultipartUpload bucket))
                                  (fn? (.-createMultipartUpload bucket)))
                  opts #js {:httpMetadata #js {:contentType snapshot-content-type
                                               :contentEncoding snapshot-content-encoding
                                               :cacheControl snapshot-cache-control}
                            :customMetadata #js {:purpose "snapshot"
                                                 :created-at (str (common/now-ms))}}
                  _ (if multipart?
                      (upload-multipart! bucket key stream opts)
                      (p/let [body (<buffer-stream stream)]
                        (.put bucket key body opts)))
                  url (snapshot-url request graph-id snapshot-id)]
            (http/json-response :sync/snapshot-download {:ok true
                                                         :key key
                                                         :url url
                                                         :content-encoding snapshot-content-encoding})))))))

(defn- handle-sync-admin-reset
  [^js self]
  (let [^js state (.-state self)
        ^js storage (.-storage state)
        delete-all (.-deleteAll storage)
        delete-alarm (.-deleteAlarm storage)]
    (doseq [^js ws (.getWebSockets state)]
      (.close ws 1000 "graph deleted"))
    (p/let [_ (when (fn? delete-alarm)
                (.deleteAlarm storage))]
      (if (fn? delete-all)
        (p/let [_ (.deleteAll storage)]
          (set! (.-schema-ready self) false)
          (set! (.-conn self) nil)
          (http/json-response :sync/admin-reset {:ok true}))
        (do
          (common/sql-exec (.-sql self) "drop table if exists kvs")
          (common/sql-exec (.-sql self) "drop table if exists tx_log")
          (common/sql-exec (.-sql self) "drop table if exists sync_meta")
          (storage/init-schema! (.-sql self))
          (set! (.-schema-ready self) true)
          (set! (.-conn self) nil)
          (http/json-response :sync/admin-reset {:ok true}))))))

(defn- handle-sync-tx-batch
  [^js self request]
  (.then (common/read-json request)
         (fn [result]
           (if (nil? result)
             (http/bad-request "missing body")
             (let [body (js->clj result :keywordize-keys true)
                   body (http/coerce-http-request :sync/tx-batch body)
                   graph-id (graph-id-from-request request)]
               (if (nil? body)
                 (http/bad-request "invalid tx")
                 (let [{:keys [txs t-before]} body
                       t-before (parse-int t-before)]
                   (if (string? txs)
                     (p/let [ready-for-sync? (<ready-for-sync? self graph-id)]
                       (if-not ready-for-sync?
                         (http/error-response "graph not ready" 409)
                         (http/json-response :sync/tx-batch (handle-tx-batch! self nil txs t-before))))
                     (http/bad-request "invalid tx")))))))))

(defn- parse-reset-param
  [value]
  (if (nil? value)
    true
    (not (contains? #{"false" "0"} value))))

(defn- parse-finished-param
  [value]
  (contains? #{"true" "1"} value))

(defn- handle-sync-snapshot-upload
  [^js self request url]
  (let [graph-id (graph-id-from-request request)
        reset-param (.get (.-searchParams url) "reset")
        reset? (parse-reset-param reset-param)
        finished-param (.get (.-searchParams url) "finished")
        finished? (parse-finished-param finished-param)
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
          (p/let [_ (ensure-schema! self)
                  _ (when reset?
                      (storage/set-meta! (.-sql self) snapshot-uploading-meta-key true))
                  _ (when reset?
                      (<set-graph-ready-for-use! self graph-id false))
                  stream (maybe-decompress-stream stream encoding)
                  count (import-snapshot-stream! self stream reset?)
                  _ (when finished?
                      (storage/set-meta! (.-sql self) snapshot-uploading-meta-key false))
                  _ (when finished?
                      (<set-graph-ready-for-use! self graph-id true))]
            (http/json-response :sync/snapshot-upload {:ok true
                                                       :count count})))))))

(defn handle [{:keys [^js self request url route]}]
  (case (:handler route)
    :sync/health
    (http/json-response :sync/health {:ok true})

    :sync/pull
    (handle-sync-pull self url)

    :sync/snapshot-stream
    (handle-sync-snapshot-stream self request)

    :sync/snapshot-download
    (handle-sync-snapshot-download self request)

    :sync/admin-reset
    (handle-sync-admin-reset self)

    :sync/tx-batch
    (handle-sync-tx-batch self request)

    :sync/snapshot-upload
    (handle-sync-snapshot-upload self request url)

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
                        (common/json-response
                         {:error "server error"
                          :debug-message (str e)
                          :debug-stack (when (instance? js/Error e) (.-stack e))}
                         500)))
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
        (common/json-response
         {:error "server error"
          :debug-message (str e)
          :debug-stack (when (instance? js/Error e) (.-stack e))}
         500)))))
