(ns logseq.db-sync.worker
  (:require ["cloudflare:workers" :refer [DurableObject]]
            [clojure.string :as string]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]
            [logseq.common.authorization :as authorization]
            [logseq.db :as ldb]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db-sync.common :as common :refer [cors-headers]]
            [logseq.db-sync.cycle :as cycle]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.worker-core :as worker-core]
            [promesa.core :as p]
            [shadow.cljs.modern :refer (defclass)]))

(glogi-console/install!)

(declare handle-assets)
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

(defn- handle-worker-fetch [request ^js env]
  (let [url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (cond
      (= path "/health")
      (common/json-response {:ok true})

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
          (common/bad-request "invalid asset path")))

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
          (common/bad-request "missing graph id")))

      :else
      (common/not-found))))

(def worker
  #js {:fetch (fn [request env _ctx]
                (handle-worker-fetch request env))})

(defn- t-now [^js self]
  (storage/get-t (.-sql self)))

(defn- send! [ws msg]
  (.send ws (protocol/encode-message msg)))

(defn- ws-open? [ws]
  (= 1 (.-readyState ws)))

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
            (js/Response. (js/JSON.stringify #js {:error "missing assets bucket"})
                          #js {:status 500 :headers (cors-headers)})
            (case method
              "GET"
              (.then (.get bucket key)
                     (fn [^js obj]
                       (if (nil? obj)
                         (js/Response. (js/JSON.stringify #js {:error "not found"})
                                       #js {:status 404 :headers (cors-headers)})
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
                         (js/Response. (js/JSON.stringify #js {:error "asset too large"})
                                       #js {:status 413 :headers (cors-headers)})
                         (.then (.put bucket
                                      key
                                      buf
                                      #js {:httpMetadata #js {:contentType (or (.get (.-headers request) "content-type")
                                                                               "application/octet-stream")}
                                           :customMetadata #js {:checksum (.get (.-headers request) "x-amz-meta-checksum")
                                                                :type asset-type}})
                                (fn [_]
                                  (js/Response. (js/JSON.stringify #js {:ok true})
                                                #js {:status 200 :headers (cors-headers)}))))))

              "DELETE"
              (.then (.delete bucket key)
                     (fn [_]
                       (js/Response. (js/JSON.stringify #js {:ok true})
                                     #js {:status 200 :headers (cors-headers)})))

              (js/Response. (js/JSON.stringify #js {:error "method not allowed"})
                            #js {:status 405 :headers (cors-headers)}))))
        (js/Response. (js/JSON.stringify #js {:error "invalid asset path"})
                      #js {:status 400 :headers (cors-headers)})))))

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
    (when (and rows (pos? (.-length rows)))
      (doseq [[addr content addresses] (array-seq rows)]
        (common/sql-exec sql
                         (str "insert into kvs (addr, content, addresses) values (?, ?, ?)"
                              " on conflict(addr) do update set content = excluded.content, addresses = excluded.addresses")
                         addr
                         content
                         addresses)))
    (set! (.-conn self) (storage/open-conn sql))))

(defn- cycle-reject-response [db tx-data {:keys [attr]}]
  {:type "tx/reject"
   :reason "cycle"
   :data (common/write-transit
          {:attr attr
           :server_values (cycle/server-values-for db tx-data attr)})})

(defn- fix-tx-data
  [db tx-data]
  (if (some (fn [[op _e a v]]
              (= [op a v] [:db/add :db/ident :logseq.class/Root]))
            tx-data) ; initial data
    tx-data
    (->> tx-data
         (worker-core/fix-missing-parent db)
         (worker-core/fix-duplicate-orders db))))

(defn- apply-tx! [^js self sender tx-data]
  (let [sql (.-sql self)
        conn (.-conn self)
        db @conn
        tx-report (d/with db tx-data)
        db' (:db-after tx-report)
        order-fixed (fix-tx-data db' tx-data)
        cycle-info (cycle/detect-cycle db' order-fixed)]
    (if cycle-info
      (do
        (prn :debug "cycle detected: " cycle-info)
        (cycle-reject-response db order-fixed cycle-info))
      (let [{:keys [tx-data db-before db-after]} (ldb/transact! conn order-fixed)
            normalized-data (db-normalize/normalize-tx-data db-after db-before tx-data)
            new-t (storage/next-t! sql)
            created-at (common/now-ms)
            tx-str (common/write-transit normalized-data)]
        (storage/append-tx! sql new-t tx-str created-at)
        (broadcast! self sender {:type "changed" :t new-t})
        new-t))))

(defn- handle-tx-batch! [^js self sender txs t-before]
  (let [current-t (t-now self)]
    (cond
      (not (number? t-before))
      {:type "tx/reject"
       :reason "invalid t_before"}

      (not= t-before current-t)
      {:type "tx/reject"
       :reason "stale"
       :t current-t}

      :else
      (let [tx-data (mapcat protocol/transit->tx txs)]
        (if (seq tx-data)
          (let [new-t (apply-tx! self sender tx-data)]
            {:type "tx/batch/ok"
             :t new-t})
          {:type "tx/reject"
           :reason "empty tx data"})))))

(defn- handle-ws-message! [^js self ^js ws raw]
  (let [message (protocol/parse-message raw)]
    (if-not (map? message)
      (send! ws {:type "error" :message "invalid message"})
      (case (:type message)
        "hello"
        (send! ws {:type "hello" :t (t-now self)})

        "ping"
        (send! ws {:type "pong"})

        "pull"
        (let [since (or (:since message) 0)]
          (send! ws (pull-response self since)))

        ;; "snapshot"
        ;; (send! ws (snapshot-response self))

        "tx/batch"
        (let [txs (:txs message)
              t-before (parse-int (:t_before message))]
          (if (and (sequential? txs) (every? string? txs))
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
                        (common/json-response {:error "server error"} 500)))
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
            (common/json-response {:ok true})

            (and (= method "GET") (= path "/pull"))
            (let [since (or (parse-int (.get (.-searchParams url) "since")) 0)]
              (common/json-response (pull-response self since)))

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
                  last-addr (if (seq rows)
                              (apply max (map (fn [row] (aget row "addr")) rows))
                              after)
                  done? (< (count rows) limit)]
              (common/json-response {:rows rows
                                     :last_addr last-addr
                                     :done done?}))

            (and (= method "DELETE") (= path "/admin/reset"))
            (do
              (common/sql-exec (.-sql self) "drop table if exists kvs")
              (common/sql-exec (.-sql self) "drop table if exists tx_log")
              (common/sql-exec (.-sql self) "drop table if exists sync_meta")
              (storage/init-schema! (.-sql self))
              (common/json-response {:ok true}))

            (and (= method "POST") (= path "/tx/batch"))
            (.then (common/read-json request)
                   (fn [result]
                     (if (nil? result)
                       (common/bad-request "missing body")
                       (let [txs (js->clj (aget result "txs"))
                             t-before (parse-int (aget result "t_before"))]
                         (if (and (sequential? txs) (every? string? txs))
                           (common/json-response (handle-tx-batch! self nil txs t-before))
                           (common/bad-request "invalid tx"))))))

            (and (= method "POST") (= path "/snapshot/import"))
            (.then (common/read-json request)
                   (fn [result]
                     (if (nil? result)
                       (common/bad-request "missing body")
                       (let [rows (aget result "rows")
                             reset? (true? (aget result "reset"))]
                         (import-snapshot! self rows reset?)
                         (common/json-response {:ok true :count (if rows (.-length rows) 0)})))))

            :else
            (common/not-found))))
      (catch :default e
        (log/error :db-sync/http-error {:error e})
        (common/json-response {:error "server error"} 500)))))

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
    (common/get-sql-rows
     (common/sql-exec sql
                      (str "select graph_id, graph_name, schema_version, created_at, updated_at "
                           "from graphs where owner_sub = ? order by updated_at desc")
                      owner-sub))
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
              (common/unauthorized)

              (and (= method "GET") (= ["graphs"] parts))
              (let [owner-sub (aget claims "sub")]
                (if (string? owner-sub)
                  (common/json-response {:graphs (index-list sql owner-sub)})
                  (common/unauthorized)))

              (and (= method "POST") (= ["graphs"] parts))
              (.then (common/read-json request)
                     (fn [result]
                       (let [graph-id (str (random-uuid))
                             graph-name (aget result "graph_name")
                             owner-sub (aget claims "sub")
                             schema-version (aget result "schema_version")]
                         (cond
                           (not (string? owner-sub))
                           (common/unauthorized)

                           (not (string? graph-name))
                           (common/bad-request "missing graph_name")

                           :else
                           (do
                             (index-upsert! sql graph-id graph-name owner-sub schema-version)
                             (common/json-response {:graph_id graph-id}))))))

              (and (= method "GET")
                   (= 3 (count parts))
                   (= "graphs" (first parts))
                   (= "access" (nth parts 2)))
              (let [graph-id (nth parts 1)
                    owner-sub (aget claims "sub")]
                (cond
                  (not (string? owner-sub))
                  (common/unauthorized)

                  (index-owns-graph? sql graph-id owner-sub)
                  (common/json-response {:ok true})

                  :else
                  (common/forbidden)))

              (and (= method "DELETE")
                   (= 2 (count parts))
                   (= "graphs" (first parts)))
              (let [graph-id (nth parts 1)
                    owner-sub (aget claims "sub")]
                (cond
                  (not (seq graph-id))
                  (common/bad-request "missing graph id")

                  (not (string? owner-sub))
                  (common/unauthorized)

                  (not (index-owns-graph? sql graph-id owner-sub))
                  (common/forbidden)

                  :else
                  (do
                    (index-delete! sql graph-id)
                    (let [^js namespace (.-LOGSEQ_SYNC_DO (.-env self))
                          do-id (.idFromName namespace graph-id)
                          stub (.get namespace do-id)
                          reset-url (str (.-origin url) "/admin/reset")]
                      (.fetch stub (js/Request. reset-url #js {:method "DELETE"})))
                    (common/json-response {:graph_id graph-id :deleted true}))))

              :else
              (common/not-found)))))
      (catch :default error
        (log/error :db-sync/index-error error)
        (common/json-response {:error "server error"} 500)))))

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
