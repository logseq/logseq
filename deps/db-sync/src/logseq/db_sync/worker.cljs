(ns logseq.db-sync.worker
  (:require ["cloudflare:workers" :refer [DurableObject]]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]
            [logseq.common.authorization :as authorization]
            [logseq.db :as ldb]
            [logseq.db-sync.batch :as batch]
            [logseq.db-sync.common :as common :refer [cors-headers]]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.malli-schema :as db-sync-schema]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.snapshot :as snapshot]
            [logseq.db-sync.storage :as storage]
            [promesa.core :as p]
            [shadow.cljs.modern :refer (defclass)]))

(glogi-console/install!)

(defn- bearer-token [auth-header]
  (when (and (string? auth-header) (string/starts-with? auth-header "Bearer "))
    (subs auth-header 7)))

(defn- token-from-request [request]
  (or (bearer-token (.get (.-headers request) "authorization"))
      (let [url (js/URL. (.-url request))]
        (.get (.-searchParams url) "token"))))

(defn- decode-jwt-part [part]
  (let [pad (if (pos? (mod (count part) 4))
              (apply str (repeat (- 4 (mod (count part) 4)) "="))
              "")
        base64 (-> (str part pad)
                   (string/replace "-" "+")
                   (string/replace "_" "/"))
        raw (js/atob base64)]
    (js/JSON.parse raw)))

(defn- unsafe-jwt-claims [token]
  (try
    (when (string? token)
      (let [parts (string/split token #"\.")]
        (when (= 3 (count parts))
          (decode-jwt-part (nth parts 1)))))
    (catch :default _
      nil)))

(defn- auth-claims [request env]
  (let [token (token-from-request request)]
    (if (string? token)
      (.catch (authorization/verify-jwt token env) (fn [_] nil))
      (js/Promise.resolve nil))))

(declare handle-index-fetch)

(defn- graph-access-response [request env graph-id]
  (let [token (token-from-request request)
        url (js/URL. (.-url request))
        access-url (str (.-origin url) "/graphs/" graph-id "/access")
        headers (js/Headers. (.-headers request))
        index-self #js {:env env :d1 (aget env "DB")}]
    (when (string? token)
      (.set headers "authorization" (str "Bearer " token)))
    (handle-index-fetch index-self (js/Request. access-url #js {:method "GET" :headers headers}))))

(defn- parse-asset-path [path]
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

(defn- ensure-schema! [^js self]
  (when-not (true? (.-schema-ready self))
    (storage/init-schema! (.-sql self))
    (set! (.-schema-ready self) true)))

(defn- ensure-conn! [^js self]
  (ensure-schema! self)
  (when-not (.-conn self)
    (set! (.-conn self) (storage/open-conn (.-sql self)))))

(defn- t-now [^js self]
  (ensure-schema! self)
  (storage/get-t (.-sql self)))

(defn- ws-open? [ws]
  (= 1 (.-readyState ws)))

(def ^:private invalid-coerce ::invalid-coerce)

(defn- coerce
  [coercer value context]
  (try
    (coercer value)
    (catch :default e
      (log/error :db-sync/malli-coerce-failed (merge context {:error e :value value}))
      invalid-coerce)))

(defn- coerce-ws-client-message [message]
  (when message
    (let [coerced (coerce db-sync-schema/ws-client-message-coercer message {:schema :ws/client})]
      (when-not (= coerced invalid-coerce)
        coerced))))

(defn- coerce-ws-server-message [message]
  (when message
    (let [coerced (coerce db-sync-schema/ws-server-message-coercer message {:schema :ws/server})]
      (when-not (= coerced invalid-coerce)
        coerced))))

(defn- send! [ws msg]
  (when (ws-open? ws)
    (if-let [coerced (coerce-ws-server-message msg)]
      (.send ws (protocol/encode-message coerced))
      (do
        (log/error :db-sync/ws-response-invalid {:message msg})
        (.send ws (protocol/encode-message {:type "error" :message "server error"}))))))

(defn- broadcast! [^js self sender msg]
  (let [clients (.getWebSockets (.-state self))]
    (doseq [ws clients]
      (when (and (not= ws sender) (ws-open? ws))
        (send! ws msg)))))

(defn- claims->user
  [claims]
  (when claims
    (let [user-id (aget claims "sub")
          email (aget claims "email")
          username (or (aget claims "preferred_username")
                       (aget claims "cognito:username")
                       (aget claims "username"))
          name (aget claims "name")]
      (when (string? user-id)
        (cond-> {:user-id user-id}
          (string? email) (assoc :email email)
          (string? username) (assoc :username username)
          (string? name) (assoc :name name))))))

(defn- presence*
  [^js self]
  (or (.-presence self)
      (set! (.-presence self) (atom {}))))

(defn- online-users
  [^js self]
  (vec (distinct (vals @(presence* self)))))

(defn- broadcast-online-users!
  [^js self]
  (broadcast! self nil {:type "online-users" :online-users (online-users self)}))

(defn- add-presence!
  [^js self ^js ws user]
  (swap! (presence* self) assoc ws user)
  (.serializeAttachment ws (clj->js user)))

(defn- update-presence!
  [^js self ^js ws {:keys [editing-block-uuid] :as updates}]
  (swap! (presence* self)
         (fn [presence]
           (if-let [user (get presence ws)]
             (let [user' (if (contains? updates :editing-block-uuid)
                           (if (and (string? editing-block-uuid)
                                    (not (string/blank? editing-block-uuid)))
                             (assoc user :editing-block-uuid editing-block-uuid)
                             (dissoc user :editing-block-uuid))
                           user)]
               (.serializeAttachment ws (clj->js user'))
               (assoc presence ws user'))
             presence))))

(defn- remove-presence!
  [^js self ^js ws]
  (swap! (presence* self) dissoc ws))

(defn- fail-fast [tag data]
  (log/error tag data)
  (throw (ex-info (name tag) data)))

(defn- coerce-http-request [schema-key body]
  (if-let [coercer (get db-sync-schema/http-request-coercers schema-key)]
    (let [coerced (coerce coercer body {:schema schema-key :dir :request})]
      (when-not (= coerced invalid-coerce)
        coerced))
    body))

(defn- json-response
  ([schema-key data] (json-response schema-key data 200))
  ([schema-key data status]
   (if-let [coercer (get db-sync-schema/http-response-coercers schema-key)]
     (let [coerced (coerce coercer data {:schema schema-key :dir :response})]
       (if (= coerced invalid-coerce)
         (common/json-response {:error "server error"} 500)
         (common/json-response coerced status)))
     (common/json-response data status))))

(defn- error-response [message status]
  (json-response :error {:error message} status))

(defn- bad-request [message]
  (error-response message 400))

(defn- unauthorized []
  (error-response "unauthorized" 401))

(defn- forbidden []
  (error-response "forbidden" 403))

(defn- not-found []
  (error-response "not found" 404))

(defn- parse-int [value]
  (when (some? value)
    (let [n (js/parseInt value 10)]
      (when-not (js/isNaN n)
        n))))

(def ^:private max-asset-size (* 100 1024 1024))
(def ^:private snapshot-download-batch-size 500)
(def ^:private snapshot-cache-control "private, max-age=300")
(def ^:private snapshot-content-type "application/transit+json")
(def ^:private snapshot-content-encoding "gzip")
;; 10m
(def ^:private snapshot-multipart-part-size (* 10 1024 1024))

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

(defn- maybe-compress-stream [stream]
  (if (exists? js/CompressionStream)
    (.pipeThrough stream (js/CompressionStream. "gzip"))
    stream))

(defn- maybe-decompress-stream [stream encoding]
  (if (and (= encoding snapshot-content-encoding) (exists? js/DecompressionStream))
    (.pipeThrough stream (js/DecompressionStream. "gzip"))
    stream))

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

(defn- handle-assets [request ^js env]
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
            (error-response "missing assets bucket" 500)
            (case method
              "GET"
              (.then (.get bucket key)
                     (fn [^js obj]
                       (if (nil? obj)
                         (error-response "not found" 404)
                         (let [metadata (.-httpMetadata obj)
                               content-type (or (.-contentType metadata)
                                                "application/octet-stream")
                               content-encoding (.-contentEncoding metadata)
                               cache-control (.-cacheControl metadata)
                               headers (cond-> {"content-type" content-type
                                                "x-asset-type" asset-type}
                                         (and (string? content-encoding)
                                              (not= content-encoding "null")
                                              (pos? (.-length content-encoding)))
                                         (assoc "content-encoding" content-encoding)
                                         (and (string? cache-control)
                                              (pos? (.-length cache-control)))
                                         (assoc "cache-control" cache-control)
                                         true
                                         (bean/->js))]
                           (js/Response. (.-body obj)
                                         #js {:status 200
                                              :headers (js/Object.assign
                                                        headers
                                                        (cors-headers))})))))

              "PUT"
              (.then (.arrayBuffer request)
                     (fn [buf]
                       (if (> (.-byteLength buf) max-asset-size)
                         (error-response "asset too large" 413)
                         (.then (.put bucket
                                      key
                                      buf
                                      #js {:httpMetadata #js {:contentType (or (.get (.-headers request) "content-type")
                                                                               "application/octet-stream")}
                                           :customMetadata #js {:checksum (.get (.-headers request) "x-amz-meta-checksum")
                                                                :type asset-type}})
                                (fn [_]
                                  (json-response :assets/put {:ok true} 200))))))

              "DELETE"
              (.then (.delete bucket key)
                     (fn [_]
                       (json-response :assets/delete {:ok true} 200)))

              (error-response "method not allowed" 405))))
        (error-response "invalid asset path" 400)))))

(defn- handle-worker-fetch [request ^js env]
  (let [url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (cond
      (= path "/health")
      (json-response :worker/health {:ok true})

      (or (= path "/graphs")
          (string/starts-with? path "/graphs/"))
      (handle-index-fetch #js {:env env :d1 (aget env "DB")} request)

      (string/starts-with? path "/e2ee")
      (handle-index-fetch #js {:env env :d1 (aget env "DB")} request)

      (string/starts-with? path "/assets/")
      (if (= method "OPTIONS")
        (handle-assets request env)
        (if-let [{:keys [graph-id]} (parse-asset-path path)]
          (p/let [access-resp (graph-access-response request env graph-id)]
            (if (.-ok access-resp)
              (handle-assets request env)
              access-resp))
          (bad-request "invalid asset path")))

      (= method "OPTIONS")
      (common/options-response)

      (string/starts-with? path "/sync/")
      (let [prefix (count "/sync/")
            rest-path (subs path prefix)
            rest-path (if (string/starts-with? rest-path "/")
                        (subs rest-path 1)
                        rest-path)
            slash-idx (or (string/index-of rest-path "/") -1)
            graph-id (if (neg? slash-idx) rest-path (subs rest-path 0 slash-idx))
            tail (if (neg? slash-idx)
                   "/"
                   (subs rest-path slash-idx))
            new-url (js/URL. (str (.-origin url) tail (.-search url)))]
        (if (seq graph-id)
          (if (= method "OPTIONS")
            (common/options-response)
            (p/let [access-resp (graph-access-response request env graph-id)]
              (if (.-ok access-resp)
                (let [^js namespace (.-LOGSEQ_SYNC_DO env)
                      do-id (.idFromName namespace graph-id)
                      stub (.get namespace do-id)]
                  (if (common/upgrade-request? request)
                    (.fetch stub request)
                    (do
                      (.set (.-searchParams new-url) "graph-id" graph-id)
                      (let [rewritten (js/Request. (.toString new-url) request)]
                        (.fetch stub rewritten)))))
                access-resp)))
          (bad-request "missing graph id")))

      :else
      (not-found))))

(def worker
  #js {:fetch (fn [request env _ctx]
                (handle-worker-fetch request env))})

(defn- pull-response [^js self since]
  (let [sql (.-sql self)
        txs (storage/fetch-tx-since sql since)
        response {:type "pull/ok"
                  :t (t-now self)
                  :txs txs}]
    response))

;; FIXME: memory limit, should re-download graph using sqlite table rows
;; (defn- snapshot-response [^js self]
;;   (let [conn (.-conn self)
;;         db @conn
;;         datoms (protocol/datoms->wire (d/datoms db :eavt))]
;;     {:type "snapshot/ok"
;;      :t (t-now self)
;;      :datoms (common/write-transit datoms)}))

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
        (broadcast! self sender {:type "changed" :t new-t})
        new-t))))

(defn- handle-tx-batch! [^js self sender txs t-before]
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
        (let [new-t (apply-tx! self sender txs)]
          (if (and (map? new-t) (= "tx/reject" (:type new-t)))
            new-t
            {:type "tx/batch/ok"
             :t new-t}))
        {:type "tx/reject"
         :reason "empty tx data"}))))

(defn- handle-ws-message! [^js self ^js ws raw]
  (let [message (-> raw protocol/parse-message coerce-ws-client-message)]
    (if-not (map? message)
      (send! ws {:type "error" :message "invalid request"})
      (case (:type message)
        "hello"
        (send! ws {:type "hello" :t (t-now self)})

        "ping"
        (send! ws {:type "pong"})

        "presence"
        (let [editing-block-uuid (:editing-block-uuid message)]
          (update-presence! self ws {:editing-block-uuid editing-block-uuid})
          (broadcast-online-users! self))

        "pull"
        (let [raw-since (:since message)
              since (if (some? raw-since) (parse-int raw-since) 0)]
          (if (or (and (some? raw-since) (not (number? since))) (neg? since))
            (send! ws {:type "error" :message "invalid since"})
            (send! ws (pull-response self since))))

        ;; "snapshot"
        ;; (send! ws (snapshot-response self))

        "tx/batch"
        (let [txs (:txs message)
              t-before (parse-int (:t-before message))]
          (if (string? txs)
            (send! ws (handle-tx-batch! self ws txs t-before))
            (send! ws {:type "tx/reject" :reason "invalid tx"})))

        (send! ws {:type "error" :message "unknown type"})))))

(defn- handle-ws [^js self request]
  (let [pair (js/WebSocketPair.)
        client (aget pair 0)
        server (aget pair 1)
        state (.-state self)]
    (.acceptWebSocket state server)
    (let [token (token-from-request request)
          claims (unsafe-jwt-claims token)
          user (claims->user claims)]
      (when user
        (add-presence! self server user))
      (broadcast-online-users! self))
    (js/Response. nil #js {:status 101 :webSocket client})))

(defn- strip-sync-prefix [path]
  (if (string/starts-with? path "/sync/")
    (let [rest-path (subs path (count "/sync/"))
          slash-idx (string/index-of rest-path "/")]
      (if (neg? slash-idx)
        "/"
        (subs rest-path slash-idx)))
    path))

(defn- handle-http [^js self request]
  (letfn [(with-cors-error [resp]
            (if (instance? js/Promise resp)
              (.catch resp
                      (fn [e]
                        (log/error :db-sync/http-error {:error e})
                        (error-response "server error" 500)))
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

            (and (= method "GET") (= path "/health"))
            (json-response :sync/health {:ok true})

            (and (= method "GET") (= path "/pull"))
            (let [raw-since (.get (.-searchParams url) "since")
                  since (if (some? raw-since) (parse-int raw-since) 0)]
              (if (or (and (some? raw-since) (not (number? since))) (neg? since))
                (bad-request "invalid since")
                (json-response :sync/pull (pull-response self since))))

            ;; (and (= method "GET") (= path "/snapshot"))
            ;; (common/json-response (snapshot-response self))

            (and (= method "GET") (= path "/snapshot/download"))
            (let [graph-id (graph-id-from-request request)
                  ^js bucket (.-LOGSEQ_SYNC_ASSETS (.-env self))]
              (cond
                (not (seq graph-id))
                (bad-request "missing graph id")

                (nil? bucket)
                (error-response "missing assets bucket" 500)

                :else
                (p/let [snapshot-id (str (random-uuid))
                        key (snapshot-key graph-id snapshot-id)
                        stream (snapshot-export-stream self)
                        multipart? (and (some? (.-createMultipartUpload bucket))
                                        (fn? (.-createMultipartUpload bucket)))
                        opts #js {:httpMetadata #js {:contentType snapshot-content-type
                                                     :contentEncoding nil
                                                     :cacheControl snapshot-cache-control}
                                  :customMetadata #js {:purpose "snapshot"
                                                       :created-at (str (common/now-ms))}}
                        _ (if multipart?
                            (upload-multipart! bucket key stream opts)
                            (p/let [body (snapshot-export-fixed-length self)]
                              (.put bucket key body opts)))
                        url (snapshot-url request graph-id snapshot-id)]
                  (json-response :sync/snapshot-download {:ok true
                                                          :key key
                                                          :url url
                                                          :content-encoding nil}))))

            (and (= method "DELETE") (= path "/admin/reset"))
            (do
              (common/sql-exec (.-sql self) "drop table if exists kvs")
              (common/sql-exec (.-sql self) "drop table if exists tx_log")
              (common/sql-exec (.-sql self) "drop table if exists sync_meta")
              (storage/init-schema! (.-sql self))
              (set! (.-schema-ready self) true)
              (set! (.-conn self) nil)
              (json-response :sync/admin-reset {:ok true}))

            (and (= method "POST") (= path "/tx/batch"))
            (.then (common/read-json request)
                   (fn [result]
                     (if (nil? result)
                       (bad-request "missing body")
                       (let [body (js->clj result :keywordize-keys true)
                             body (coerce-http-request :sync/tx-batch body)]
                         (if (nil? body)
                           (bad-request "invalid tx")
                           (let [{:keys [txs t-before]} body
                                 t-before (parse-int t-before)]
                             (if (string? txs)
                               (json-response :sync/tx-batch (handle-tx-batch! self nil txs t-before))
                               (bad-request "invalid tx"))))))))

            (and (= method "POST") (= path "/snapshot/upload"))
            (let [graph-id (graph-id-from-request request)
                  reset-param (.get (.-searchParams url) "reset")
                  reset? (if (nil? reset-param)
                           true
                           (not (contains? #{"false" "0"} reset-param)))
                  req-encoding (.get (.-headers request) "content-encoding")]
              (cond
                (not (seq graph-id))
                (bad-request "missing graph id")

                (nil? (.-body request))
                (bad-request "missing body")

                :else
                (let [stream (.-body request)
                      encoding (or req-encoding "")]
                  (if (and (= encoding snapshot-content-encoding)
                           (not (exists? js/DecompressionStream)))
                    (error-response "gzip not supported" 500)
                    (p/let [stream (maybe-decompress-stream stream encoding)
                            count (import-snapshot-stream! self stream reset?)]
                      (json-response :sync/snapshot-upload {:ok true
                                                            :count count}))))))

            :else
            (not-found))))
      (catch :default e
        (log/error :db-sync/http-error {:error e})
        (error-response "server error" 500)))))

(defclass SyncDO
  (extends DurableObject)

  (constructor [this ^js state env]
               (super state env)
               (set! (.-state this) state)
               (set! (.-env this) env)
               (set! (.-sql this) (.-sql ^js (.-storage state)))
               (set! (.-conn this) nil)
               (set! (.-schema-ready this) false)
               (let [presence (presence* this)
                     sockets (.getWebSockets state)]
                 (doseq [^js ws sockets]
                   (when-let [attachment (.deserializeAttachment ws)]
                     (swap! presence assoc ws (js->clj attachment :keywordize-keys true))))
                 (.setWebSocketAutoResponse
                  state
                  (js/WebSocketRequestResponsePair. "ping" "pong"))))

  Object
  (fetch [this request]
         (if (common/upgrade-request? request)
           (handle-ws this request)
           (handle-http this request)))
  (webSocketMessage [this ws message]
                    (try
                      (handle-ws-message! this ws message)
                      (catch :default e
                        (log/error :db-sync/ws-error e)
                        (js/console.error e)
                        (send! ws {:type "error" :message "server error"}))))
  (webSocketClose [this ws _code _reason]
                  (remove-presence! this ws)
                  (broadcast-online-users! this)
                  (log/info :db-sync/ws-closed true))
  (webSocketError [this ws error]
                  (remove-presence! this ws)
                  (broadcast-online-users! this)
                  (log/error :db-sync/ws-error {:error error})))

(defn- index-db [^js self]
  (let [db (.-d1 self)]
    (when-not db
      (log/error :db-sync/index-db-missing {:binding "DB"}))
    db))

(defn- graph-path-parts [path]
  (->> (string/split path #"/")
       (remove string/blank?)
       (vec)))

(defn- handle-index-fetch [^js self request]
  (let [db (index-db self)
        env (.-env self)
        url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)
        parts (graph-path-parts path)]
    (try
      (cond
        (contains? #{"OPTIONS" "HEAD"} method)
        (common/options-response)

        (nil? db)
        (error-response "server error" 500)

        :else
        (p/let [_ (index/<index-init! db)
                claims (auth-claims request env)
                _ (when claims
                    (index/<user-upsert! db claims))]
          (cond
            (nil? claims)
            (unauthorized)

            (and (= method "GET") (= ["graphs"] parts))
            (let [user-id (aget claims "sub")]
              (if (string? user-id)
                (p/let [graphs (index/<index-list db user-id)]
                  (json-response :graphs/list {:graphs graphs}))
                (unauthorized)))

            (and (= method "POST") (= ["graphs"] parts))
            (.then (common/read-json request)
                   (fn [result]
                     (if (nil? result)
                       (bad-request "missing body")
                       (let [body (js->clj result :keywordize-keys true)
                             body (coerce-http-request :graphs/create body)
                             graph-id (str (random-uuid))
                             user-id (aget claims "sub")]
                         (cond
                           (not (string? user-id))
                           (unauthorized)

                           (nil? body)
                           (bad-request "invalid body")

                           :else
                           (p/let [{:keys [graph-name schema-version]} body
                                   name-exists? (index/<graph-name-exists? db graph-name user-id)]
                             (if name-exists?
                               (bad-request "duplicate graph name")
                               (p/let [_ (index/<index-upsert! db graph-id graph-name user-id schema-version)
                                       _ (index/<graph-member-upsert! db graph-id user-id "manager" user-id)]
                                 (json-response :graphs/create {:graph-id graph-id})))))))))

            (and (= method "GET")
                 (= 3 (count parts))
                 (= "graphs" (first parts))
                 (= "access" (nth parts 2)))
            (let [graph-id (nth parts 1)
                  user-id (aget claims "sub")]
              (cond
                (not (string? user-id))
                (unauthorized)

                :else
                (p/let [owns? (index/<user-has-access-to-graph? db graph-id user-id)]
                  (if owns?
                    (json-response :graphs/access {:ok true})
                    (forbidden)))))

            (and (= method "GET")
                 (= 3 (count parts))
                 (= "graphs" (first parts))
                 (= "members" (nth parts 2 nil)))
            (let [graph-id (nth parts 1 nil)
                  user-id (aget claims "sub")]
              (cond
                (not (string? user-id))
                (unauthorized)

                :else
                (p/let [can-access? (index/<user-has-access-to-graph? db graph-id user-id)]
                  (if (not can-access?)
                    (forbidden)
                    (p/let [members (index/<graph-members-list db graph-id)]
                      (json-response :graph-members/list {:members members}))))))

            (and (= method "POST")
                 (= 3 (count parts))
                 (= "graphs" (first parts))
                 (= "members" (nth parts 2 nil)))
            (let [graph-id (nth parts 1 nil)
                  user-id (aget claims "sub")]
              (cond
                (not (string? user-id))
                (unauthorized)

                :else
                (.then (common/read-json request)
                       (fn [result]
                         (if (nil? result)
                           (bad-request "missing body")
                           (let [body (js->clj result :keywordize-keys true)
                                 body (coerce-http-request :graph-members/create body)
                                 member-id (:user-id body)
                                 email (:email body)
                                 role (or (:role body) "member")]
                             (cond
                               (nil? body)
                               (bad-request "invalid body")

                               (and (not (string? member-id))
                                    (not (string? email)))
                               (bad-request "invalid user")

                               :else
                               (p/let [manager? (index/<user-is-manager? db graph-id user-id)
                                       resolved-id (if (string? member-id)
                                                     (p/resolved member-id)
                                                     (index/<user-id-by-email db email))]
                                 (if (not manager?)
                                   (forbidden)
                                   (if-not (string? resolved-id)
                                     (bad-request "user not found")
                                     (p/let [_ (index/<graph-member-upsert! db graph-id resolved-id role user-id)]
                                       (json-response :graph-members/create {:ok true}))))))))))))

            (and (= method "PUT")
                 (= 4 (count parts))
                 (= "graphs" (first parts))
                 (= "members" (nth parts 2 nil)))
            (let [graph-id (nth parts 1 nil)
                  member-id (nth parts 3 nil)
                  user-id (aget claims "sub")]
              (cond
                (not (string? user-id))
                (unauthorized)

                (not (string? member-id))
                (bad-request "invalid user id")

                :else
                (.then (common/read-json request)
                       (fn [result]
                         (if (nil? result)
                           (bad-request "missing body")
                           (let [body (js->clj result :keywordize-keys true)
                                 body (coerce-http-request :graph-members/update body)
                                 role (:role body)]
                             (cond
                               (nil? body)
                               (bad-request "invalid body")

                               :else
                               (p/let [manager? (index/<user-is-manager? db graph-id user-id)]
                                 (if (not manager?)
                                   (forbidden)
                                   (p/let [_ (index/<graph-member-update-role! db graph-id member-id role)]
                                     (json-response :graph-members/update {:ok true})))))))))))

            (and (= method "DELETE")
                 (= 4 (count parts))
                 (= "graphs" (first parts))
                 (= "members" (nth parts 2 nil)))
            (let [graph-id (nth parts 1 nil)
                  member-id (nth parts 3 nil)
                  user-id (aget claims "sub")]
              (cond
                (not (string? user-id))
                (unauthorized)

                (not (string? member-id))
                (bad-request "invalid user id")

                :else
                (p/let [manager? (index/<user-is-manager? db graph-id user-id)
                        target-role (index/<graph-member-role db graph-id member-id)
                        self-leave? (and (= user-id member-id)
                                         (= "member" target-role))]
                  (cond
                    (and manager? (not= "manager" target-role))
                    (p/let [_ (index/<graph-member-delete! db graph-id member-id)]
                      (json-response :graph-members/delete {:ok true}))

                    self-leave?
                    (p/let [_ (index/<graph-member-delete! db graph-id member-id)]
                      (json-response :graph-members/delete {:ok true}))

                    :else
                    (forbidden)))))

            (and (= method "GET")
                 (= ["e2ee" "user-keys"] parts))
            (let [user-id (aget claims "sub")]
              (if (string? user-id)
                (p/let [pair (index/<user-rsa-key-pair db user-id)]
                  (json-response :e2ee/user-keys (or pair {})))
                (unauthorized)))

            (and (= method "POST")
                 (= ["e2ee" "user-keys"] parts))
            (.then (common/read-json request)
                   (fn [result]
                     (if (nil? result)
                       (bad-request "missing body")
                       (let [body (js->clj result :keywordize-keys true)
                             body (coerce-http-request :e2ee/user-keys body)
                             user-id (aget claims "sub")]
                         (cond
                           (not (string? user-id))
                           (unauthorized)

                           (nil? body)
                           (bad-request "invalid body")

                           :else
                           (let [{:keys [public-key encrypted-private-key]} body]
                             (p/let [_ (index/<user-rsa-key-pair-upsert! db user-id public-key encrypted-private-key)]
                               (json-response :e2ee/user-keys {:public-key public-key
                                                               :encrypted-private-key encrypted-private-key}))))))))

            (and (= method "GET")
                 (= ["e2ee" "user-public-key"] parts))
            (let [email (.get (.-searchParams url) "email")]
              (p/let [public-key (index/<user-rsa-public-key-by-email db email)]
                (json-response :e2ee/user-public-key
                               (cond-> {}
                                 (some? public-key)
                                 (assoc :public-key public-key)))))

            (and (= method "GET")
                 (= 4 (count parts))
                 (= "e2ee" (first parts))
                 (= "graphs" (nth parts 1))
                 (= "aes-key" (nth parts 3)))
            (let [graph-id (nth parts 2)
                  user-id (aget claims "sub")]
              (cond
                (not (string? user-id))
                (unauthorized)

                :else
                (p/let [access? (index/<user-has-access-to-graph? db graph-id user-id)]
                  (if (not access?)
                    (forbidden)
                    (p/let [encrypted-aes-key (index/<graph-encrypted-aes-key db graph-id user-id)]
                      (json-response :e2ee/graph-aes-key (cond-> {}
                                                           (some? encrypted-aes-key)
                                                           (assoc :encrypted-aes-key encrypted-aes-key))))))))

            (and (= method "POST")
                 (= 4 (count parts))
                 (= "e2ee" (first parts))
                 (= "graphs" (nth parts 1))
                 (= "aes-key" (nth parts 3)))
            (let [graph-id (nth parts 2)
                  user-id (aget claims "sub")]
              (cond
                (not (string? user-id))
                (unauthorized)

                :else
                (.then (common/read-json request)
                       (fn [result]
                         (if (nil? result)
                           (bad-request "missing body")
                           (let [body (js->clj result :keywordize-keys true)
                                 body (coerce-http-request :e2ee/graph-aes-key body)]
                             (if (nil? body)
                               (bad-request "invalid body")
                               (p/let [access? (index/<user-has-access-to-graph? db graph-id user-id)]
                                 (if (not access?)
                                   (forbidden)
                                   (let [{:keys [encrypted-aes-key]} body]
                                     (p/let [_ (index/<graph-encrypted-aes-key-upsert! db graph-id user-id encrypted-aes-key)]
                                       (json-response :e2ee/graph-aes-key {:encrypted-aes-key encrypted-aes-key}))))))))))))

            (and (= method "POST")
                 (= 4 (count parts))
                 (= "e2ee" (first parts))
                 (= "graphs" (nth parts 1))
                 (= "grant-access" (nth parts 3)))
            (let [graph-id (nth parts 2)
                  user-id (aget claims "sub")]
              (cond
                (not (string? user-id))
                (unauthorized)

                :else
                (.then (common/read-json request)
                       (fn [result]
                         (if (nil? result)
                           (bad-request "missing body")
                           (let [body (js->clj result :keywordize-keys true)
                                 body (coerce-http-request :e2ee/grant-access body)]
                             (if (nil? body)
                               (bad-request "invalid body")
                               (p/let [manager? (index/<user-is-manager? db graph-id user-id)]
                                 (if (not manager?)
                                   (forbidden)
                                   (let [entries (:target-user-email+encrypted-aes-key-coll body)
                                         missing (atom [])]
                                     (p/let [_ (p/all
                                                (map (fn [entry]
                                                       (let [email (:user/email entry)
                                                             encrypted-aes-key (:encrypted-aes-key entry)]
                                                         (p/let [target-user-id (index/<user-id-by-email db email)
                                                                 access? (and target-user-id
                                                                              (index/<user-has-access-to-graph? db graph-id target-user-id))]
                                                           (if (and target-user-id access?)
                                                             (index/<graph-encrypted-aes-key-upsert! db graph-id target-user-id encrypted-aes-key)
                                                             (swap! missing conj email)))))
                                                     entries))]
                                       (json-response :e2ee/grant-access
                                                      (cond-> {:ok true}
                                                        (seq @missing)
                                                        (assoc :missing-users @missing))))))))))))))

            (and (= method "DELETE")
                 (= 2 (count parts))
                 (= "graphs" (first parts)))
            (let [graph-id (nth parts 1 nil)
                  user-id (aget claims "sub")]
              (cond
                (not (seq graph-id))
                (bad-request "missing graph id")

                (not (string? user-id))
                (unauthorized)

                :else
                (p/let [owns? (index/<user-has-access-to-graph? db graph-id user-id)]
                  (if (not owns?)
                    (forbidden)
                    (p/let [_ (index/<index-delete! db graph-id)]
                      (let [^js namespace (.-LOGSEQ_SYNC_DO (.-env self))
                            do-id (.idFromName namespace graph-id)
                            stub (.get namespace do-id)
                            reset-url (str (.-origin url) "/admin/reset")]
                        (.fetch stub (js/Request. reset-url #js {:method "DELETE"})))
                      (json-response :graphs/delete {:graph-id graph-id :deleted true}))))))
            :else
            (not-found))))
      (catch :default error
        (log/error :db-sync/index-error error)
        (error-response "server error" 500)))))
