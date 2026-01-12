(ns logseq.db-sync.worker
  (:require ["cloudflare:workers" :refer [DurableObject]]
            [clojure.string :as string]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]
            [logseq.common.authorization :as authorization]
            [logseq.db :as ldb]
            [logseq.db-sync.common :as common :refer [cors-headers]]
            [logseq.db-sync.cycle :as cycle]
            [logseq.db-sync.malli-schema :as db-sync-schema]
            [logseq.db-sync.parent-missing :as db-sync-parent-missing]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.worker-core :as worker-core]
            [logseq.db.common.normalize :as db-normalize]
            [promesa.core :as p]
            [shadow.cljs.modern :refer (defclass)]))

(glogi-console/install!)

(defn- bearer-token [auth-header]
  (when (and (string? auth-header) (string/starts-with? auth-header "Bearer "))
    (subs auth-header 7)))

(defn- token-from-request [request]
  (js/console.dir request)
  (or (bearer-token (.get (.-headers request) "authorization"))
      (let [url (js/URL. (.-url request))]
        (.get (.-searchParams url) "token"))))

(defn- auth-claims [request env]
  (let [token (token-from-request request)]
    (if (string? token)
      (.catch (authorization/verify-jwt token env) (fn [_] nil))
      (js/Promise.resolve nil))))

(defn- index-stub [^js env]
  (let [^js namespace (.-LOGSEQ_SYNC_INDEX_DO env)
        do-id (.idFromName namespace "index")]
    (.get namespace do-id)))

(defn- graph-access-response [request env graph-id]
  (let [token (token-from-request request)
        url (js/URL. (.-url request))
        access-url (str (.-origin url) "/graphs/" graph-id "/access")
        headers (js/Headers. (.-headers request))]
    (when (string? token)
      (.set headers "authorization" (str "Bearer " token)))
    (.fetch (index-stub env)
            (js/Request. access-url #js {:method "GET" :headers headers}))))

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

(defn- t-now [^js self]
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

(defn- fail-fast [tag data]
  (log/error tag data)
  (throw (ex-info (name tag) data)))

(defn- coerce-http-request [schema-key body]
  (if-let [coercer (get db-sync-schema/http-request-coercers schema-key)]
    (let [coerced (coerce coercer body {:schema schema-key :dir :request})]
      (when-not (= coerced invalid-coerce)
        coerced))
    body))

(defn- send! [ws msg]
  (when (ws-open? ws)
    (if-let [coerced (coerce-ws-server-message msg)]
      (.send ws (protocol/encode-message coerced))
      (do
        (log/error :db-sync/ws-response-invalid {:message msg})
        (.send ws (protocol/encode-message {:type "error" :message "server error"}))))))

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

(defn- broadcast! [^js self sender msg]
  (let [clients (.getWebSockets (.-state self))]
    (doseq [ws clients]
      (when (and (not= ws sender) (ws-open? ws))
        (send! ws msg)))))

(defn- parse-int [value]
  (when (some? value)
    (let [n (js/parseInt value 10)]
      (when-not (js/isNaN n)
        n))))

(defn- entity-title
  [db entity-ref]
  (let [ent (cond
              (vector? entity-ref) (d/entity db entity-ref)
              (number? entity-ref) (d/entity db entity-ref)
              (keyword? entity-ref) (d/entity db [:db/ident entity-ref])
              :else nil)]
    (when ent
      {:uuid (some-> (:block/uuid ent) str)
       :title (or (:block/title ent)
                  (:block/name ent))})))

(def ^:private max-asset-size (* 100 1024 1024))
(def ^:private snapshot-rows-default-limit 500)
(def ^:private snapshot-rows-max-limit 2000)

(defn- fetch-kvs-rows
  [sql after limit]
  (common/get-sql-rows
   (common/sql-exec sql
                    "select addr, content, addresses from kvs where addr > ? order by addr asc limit ?"
                    after
                    limit)))

(defn- snapshot-row->map [row]
  (if (array? row)
    {:addr (aget row 0)
     :content (aget row 1)
     :addresses (aget row 2)}
    {:addr (aget row "addr")
     :content (aget row "content")
     :addresses (aget row "addresses")}))

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
                         (let [content-type (or (.-contentType (.-httpMetadata obj))
                                                "application/octet-stream")]
                           (js/Response. (.-body obj)
                                         #js {:status 200
                                              :headers (js/Object.assign
                                                        #js {"content-type" content-type
                                                             "x-asset-type" asset-type}
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
      (.fetch (index-stub env) request)

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
            new-url (str (.-origin url) tail (.-search url))]
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
                    (let [rewritten (js/Request. new-url request)]
                      (.fetch stub rewritten))))
                access-resp)))
          (bad-request "missing graph id")))

      :else
      (not-found))))

(def worker
  #js {:fetch (fn [request env _ctx]
                (handle-worker-fetch request env))})

(defn- pull-response [^js self since]
  (let [sql (.-sql self)
        txs (storage/fetch-tx-since sql since)]
    {:type "pull/ok"
     :t (t-now self)
     :txs txs}))

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
    (storage/init-schema! sql)
    (when reset?
      (common/sql-exec sql "delete from kvs")
      (common/sql-exec sql "delete from tx_log")
      (common/sql-exec sql "delete from sync_meta")
      (storage/init-schema! sql)
      (storage/set-t! sql 0))
    (when (seq rows)
      (doseq [[addr content addresses] rows]
        (common/sql-exec sql
                         (str "insert into kvs (addr, content, addresses) values (?, ?, ?)"
                              " on conflict(addr) do update set content = excluded.content, addresses = excluded.addresses")
                         addr
                         content
                         addresses)))
    (set! (.-conn self) (storage/open-conn sql))))

(defn- cycle-reject-response [db tx-data {:keys [attr entity]}]
  (let [server-values (cycle/server-values-for db tx-data attr)]
    (log/info :db-sync/cycle-reject
              {:attr attr
               :entity entity
               :entity-title (entity-title db entity)
               :server-values (count server-values)
               :tx-count (count tx-data)})
    {:type "tx/reject"
     :reason "cycle"
     :data (common/write-transit
            {:attr attr
             :server_values server-values})}))

(defn- missing-parent-reject-response [db datoms]
  (log/info :db-sync/missing-parent-reject
            {:datoms datoms})
  {:type "tx/reject"
   :reason "missing-parent"
   :data (common/write-transit
          {:eids (map (fn [d] (let [block (d/entity db (:e d))]
                                [:block/uuid (:block/uuid block)])) datoms)})})

(defn- apply-tx! [^js self sender txs]
  (let [sql (.-sql self)
        conn (.-conn self)]
    (when-not conn
      (fail-fast :db-sync/missing-db {:op :apply-tx}))
    (let [tx-data (protocol/transit->tx txs)
          db @conn
          tx-report (d/with db tx-data)
          db' (:db-after tx-report)
          missing-parent-datoms (db-sync-parent-missing/get-missing-parent-datoms tx-report)]
      (if (seq missing-parent-datoms)
        (missing-parent-reject-response db' missing-parent-datoms)
        ;; TODO: move fix order to client to keep worker thin
        (let [order-fixed (worker-core/fix-duplicate-orders db' tx-data)
              cycle-info (cycle/detect-cycle db' order-fixed)]
          (if cycle-info
            (cycle-reject-response db order-fixed cycle-info)
            (do
              (ldb/transact! conn order-fixed)
              (let [new-t (storage/get-t sql)]
              ;; FIXME: no need to broadcast if client tx is less than remote tx
                (broadcast! self sender {:type "changed" :t new-t})
                new-t))))))))

(defn- handle-tx-batch! [^js self sender txs t-before]
  (let [current-t (t-now self)]
    (cond
      (or (not (number? t-before)) (neg? t-before))
      {:type "tx/reject"
       :reason "invalid t_before"}

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
              t-before (parse-int (:t_before message))]
          (if (string? txs)
            (send! ws (handle-tx-batch! self ws txs t-before))
            (send! ws {:type "tx/reject" :reason "invalid tx"})))

        (send! ws {:type "error" :message "unknown type"})))))

(defn- handle-ws [^js self request]
  (let [pair (js/WebSocketPair.)
        client (aget pair 0)
        server (aget pair 1)]
    (.acceptWebSocket (.-state self) server)
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

            (and (= method "GET") (= path "/snapshot/rows"))
            (let [after (or (parse-int (.get (.-searchParams url) "after")) -1)
                  limit (or (parse-int (.get (.-searchParams url) "limit"))
                            snapshot-rows-default-limit)
                  limit (-> limit
                            (max 1)
                            (min snapshot-rows-max-limit))
                  rows (fetch-kvs-rows (.-sql self) after limit)
                  rows (mapv snapshot-row->map rows)
                  last-addr (if (seq rows)
                              (apply max (map :addr rows))
                              after)
                  done? (< (count rows) limit)]
              (json-response :sync/snapshot-rows {:rows rows
                                                  :last_addr last-addr
                                                  :done done?}))

            (and (= method "DELETE") (= path "/admin/reset"))
            (do
              (common/sql-exec (.-sql self) "drop table if exists kvs")
              (common/sql-exec (.-sql self) "drop table if exists tx_log")
              (common/sql-exec (.-sql self) "drop table if exists sync_meta")
              (storage/init-schema! (.-sql self))
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
                           (let [{:keys [txs t_before]} body
                                 t-before (parse-int t_before)]
                             (if (string? txs)
                               (json-response :sync/tx-batch (handle-tx-batch! self nil txs t-before))
                               (bad-request "invalid tx"))))))))

            (and (= method "POST") (= path "/snapshot/import"))
            (.then (common/read-json request)
                   (fn [result]
                     (if (nil? result)
                       (bad-request "missing body")
                       (let [body (js->clj result :keywordize-keys true)
                             body (coerce-http-request :sync/snapshot-import body)]
                         (if (nil? body)
                           (bad-request "invalid body")
                           (let [{:keys [rows reset]} body]
                             (import-snapshot! self rows reset)
                             (json-response :sync/snapshot-import {:ok true
                                                                   :count (count rows)})))))))

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
               (set! (.-conn this) (storage/open-conn (.-sql this))))

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
  (webSocketClose [_this _ws _code _reason]
                  (log/info :db-sync/ws-closed true))
  (webSocketError [_this _ws error]
                  (log/error :db-sync/ws-error {:error error})))

(defn- index-init! [sql]
  (common/sql-exec sql
                   (str "create table if not exists graphs ("
                        "graph_id TEXT primary key,"
                        "graph_name TEXT,"
                        "owner_sub TEXT,"
                        "schema_version TEXT,"
                        "created_at INTEGER,"
                        "updated_at INTEGER"
                        ");"))
  (try
    (common/sql-exec sql "alter table graphs add column owner_sub TEXT")
    (catch :default _ nil)))

(defn- index-list [sql owner-sub]
  (if (string? owner-sub)
    (let [rows (common/get-sql-rows
                (common/sql-exec sql
                                 (str "select graph_id, graph_name, schema_version, created_at, updated_at "
                                      "from graphs where owner_sub = ? order by updated_at desc")
                                 owner-sub))]
      (mapv (fn [row]
              {:graph_id (aget row "graph_id")
               :graph_name (aget row "graph_name")
               :schema_version (aget row "schema_version")
               :created_at (aget row "created_at")
               :updated_at (aget row "updated_at")})
            rows))
    []))

(defn- index-upsert! [sql graph-id graph-name owner-sub schema-version]
  (let [now (common/now-ms)]
    (common/sql-exec sql
                     (str "insert into graphs (graph_id, graph_name, owner_sub, schema_version, created_at, updated_at) "
                          "values (?, ?, ?, ?, ?, ?) "
                          "on conflict(graph_id) do update set "
                          "graph_name = excluded.graph_name, "
                          "owner_sub = excluded.owner_sub, "
                          "schema_version = excluded.schema_version, "
                          "updated_at = excluded.updated_at")
                     graph-id
                     graph-name
                     owner-sub
                     schema-version
                     now
                     now)))

(defn- index-delete! [sql graph-id]
  (common/sql-exec sql "delete from graphs where graph_id = ?" graph-id))

(defn- index-owns-graph? [sql graph-id owner-sub]
  (when (and (string? graph-id) (string? owner-sub))
    (let [rows (common/get-sql-rows
                (common/sql-exec sql
                                 (str "select graph_id from graphs "
                                      "where graph_id = ? and owner_sub = ?")
                                 graph-id
                                 owner-sub))]
      (seq rows))))

(defn- graph-path-parts [path]
  (->> (string/split path #"/")
       (remove string/blank?)
       (vec)))

(defn- handle-index-fetch [^js self request]
  (let [sql (.-sql self)
        env (.-env self)
        url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)
        parts (graph-path-parts path)]
    (try
      (if (contains? #{"OPTIONS" "HEAD"} method)
        (common/options-response)
        (do
          (index-init! sql)
          (p/let [claims (auth-claims request env)]
            (cond
              (nil? claims)
              (unauthorized)

              (and (= method "GET") (= ["graphs"] parts))
              (let [owner-sub (aget claims "sub")]
                (if (string? owner-sub)
                  (json-response :graphs/list {:graphs (index-list sql owner-sub)})
                  (unauthorized)))

              (and (= method "POST") (= ["graphs"] parts))
              (.then (common/read-json request)
                     (fn [result]
                       (if (nil? result)
                         (bad-request "missing body")
                         (let [body (js->clj result :keywordize-keys true)
                               body (coerce-http-request :graphs/create body)
                               graph-id (str (random-uuid))
                               owner-sub (aget claims "sub")]
                           (cond
                             (not (string? owner-sub))
                             (unauthorized)

                             (nil? body)
                             (bad-request "invalid body")

                             :else
                             (let [{:keys [graph_name schema_version]} body]
                               (index-upsert! sql graph-id graph_name owner-sub schema_version)
                               (json-response :graphs/create {:graph_id graph-id})))))))

              (and (= method "GET")
                   (= 3 (count parts))
                   (= "graphs" (first parts))
                   (= "access" (nth parts 2)))
              (let [graph-id (nth parts 1)
                    owner-sub (aget claims "sub")]
                (cond
                  (not (string? owner-sub))
                  (unauthorized)

                  (index-owns-graph? sql graph-id owner-sub)
                  (json-response :graphs/access {:ok true})

                  :else
                  (forbidden)))

              (and (= method "DELETE")
                   (= 2 (count parts))
                   (= "graphs" (first parts)))
              (let [graph-id (nth parts 1)
                    owner-sub (aget claims "sub")]
                (cond
                  (not (seq graph-id))
                  (bad-request "missing graph id")

                  (not (string? owner-sub))
                  (unauthorized)

                  (not (index-owns-graph? sql graph-id owner-sub))
                  (forbidden)

                  :else
                  (do
                    (index-delete! sql graph-id)
                    (let [^js namespace (.-LOGSEQ_SYNC_DO (.-env self))
                          do-id (.idFromName namespace graph-id)
                          stub (.get namespace do-id)
                          reset-url (str (.-origin url) "/admin/reset")]
                      (.fetch stub (js/Request. reset-url #js {:method "DELETE"})))
                    (json-response :graphs/delete {:graph_id graph-id :deleted true}))))

              :else
              (not-found)))))
      (catch :default error
        (log/error :db-sync/index-error error)
        (error-response "server error" 500)))))

(defclass SyncIndexDO
  (extends DurableObject)

  (constructor [this ^js state env]
               (super state env)
               (set! (.-state this) state)
               (set! (.-env this) env)
               (set! (.-sql this) (.-sql ^js (.-storage state))))

  Object
  (fetch [this request]
         (handle-index-fetch this request)))
