(ns logseq.worker-sync.worker
  (:require ["cloudflare:workers" :refer [DurableObject]]
            [clojure.string :as string]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.worker-sync.common :as common]
            [logseq.worker-sync.cycle :as cycle]
            [logseq.worker-sync.protocol :as protocol]
            [logseq.worker-sync.storage :as storage]
            [logseq.worker-sync.worker-core :as worker-core]
            [shadow.cljs.modern :refer (defclass)]))

(glogi-console/install!)

(defn- handle-worker-fetch [request ^js env]
  (let [url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (cond
      (= method "OPTIONS")
      (common/options-response)

      (= path "/health")
      (common/json-response {:ok true})

      (or (= path "/graphs")
          (string/starts-with? path "/graphs/"))
      (let [^js namespace (.-LOGSEQ_SYNC_INDEX_DO env)
            do-id (.idFromName namespace "index")
            stub (.get namespace do-id)]
        (.fetch stub request))

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
          (let [^js namespace (.-LOGSEQ_SYNC_DO env)
                do-id (.idFromName namespace graph-id)
                stub (.get namespace do-id)]
            (if (common/upgrade-request? request)
              (.fetch stub request)
              (let [rewritten (js/Request. new-url request)]
                (.fetch stub rewritten))))
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

(defn- pull-response [^js self since]
  (let [sql (.-sql self)
        txs (storage/fetch-tx-since sql since)]
    {:type "pull/ok"
     :t (t-now self)
     :txs txs}))

;; FIXME: memory limit
(defn- snapshot-response [^js self]
  (let [conn (.-conn self)
        db @conn
        datoms (protocol/datoms->wire (d/datoms db :eavt))]
    {:type "snapshot/ok"
     :t (t-now self)
     :datoms (common/write-transit datoms)}))

(defn- cycle-reject-response [db tx-data {:keys [attr]}]
  {:type "tx/reject"
   :reason "cycle"
   :data (common/write-transit
          {:attr attr
           :server_values (cycle/server-values-for db tx-data attr)})})

(defn- lookup-id?
  [v]
  (and (vector? v)
       (= 2 (count v))
       (= (first v) :block/uuid)
       (uuid? (second v))))

(defn- tempid->lookup-map [tx-data]
  (reduce
   (fn [acc [op e a v]]
     (if (and (= :db/add op) (= :block/uuid a) (uuid? v))
       (assoc acc e [:block/uuid v])
       acc))
   {}
   tx-data))

(defn- replace-tempids [tx-data]
  (let [m (tempid->lookup-map tx-data)]
    (mapv
     (fn [[op e a v]]
       (let [e' (get m e e)
             v' (if (lookup-id? v) v (get m v v))]
         [op e' a v']))
     tx-data)))

(defn- normalize-tx-data
  [db-after db-before tx-data]
  (->> tx-data
       (map
        (fn [[e a v _t added]]
          (let [e' (if-let [entity (d/entity db-before e)]
                     (if-let [id (:block/uuid entity)]
                       [:block/uuid id]
                       (:db/ident entity))
                     (- e))
                v' (if (and (integer? v)
                            (or (= :db.type/ref (:db/valueType (d/entity db-after a)))
                                (= :db.type/ref (:db/valueType (d/entity db-before a)))))
                     (if-let [entity (d/entity db-before v)]
                       (if-let [id (:block/uuid entity)]
                         [:block/uuid id]
                         (:db/ident entity))
                       (- v))
                     v)]
            (if added
              [:db/add e' a v']
              [:db/retract e' a v']))))))

(defn- de-normalize-tx-data
  [db tx-data]
  (keep
   (fn [[op e a v]]
     (let [e' (if (lookup-id? e)
                (:db/id (d/entity db e))
                e)
           v' (if (lookup-id? v)
                (:db/id (d/entity db v))
                v)]
       (when (and e' v')
         [op e' a v'])))
   tx-data))

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
        resolved (de-normalize-tx-data db tx-data)
        tx-report (d/with db resolved)
        db' (:db-after tx-report)
        order-fixed (fix-tx-data db' resolved)
        cycle-info (cycle/detect-cycle db' order-fixed)]
    (if cycle-info
      (do
        (prn :debug "cycle detected: " cycle-info)
        (cycle-reject-response db order-fixed cycle-info))
      (let [{:keys [tx-data db-before db-after]} (ldb/transact! conn order-fixed)
            normalized-data (normalize-tx-data db-after db-before tx-data)
            new-t (storage/next-t! sql)
            created-at (common/now-ms)
            tx-str (common/write-transit normalized-data)]
        (storage/append-tx! sql new-t tx-str created-at)
        (broadcast! self sender {:type "changed" :t new-t})
        {:type "tx/ok"
         :t new-t}))))

(defn- handle-tx! [^js self sender tx-data t-before]
  (let [current-t (t-now self)]
    (if (and (number? t-before) (not= t-before current-t))
      {:type "tx/reject"
       :reason "stale"
       :t current-t}
      (apply-tx! self sender tx-data))))

(defn- handle-tx-batch! [^js self sender txs t-before]
  (let [current-t (t-now self)]
    (if (and (number? t-before) (not= t-before current-t))
      {:type "tx/reject"
       :reason "stale"
       :t current-t}
      (loop [idx 0]
        (if (>= idx (count txs))
          (let [current-t (t-now self)]
            (broadcast! self sender {:type "changed" :t current-t})
            {:type "tx/batch/ok"
             :t current-t
             :count (count txs)})
          (let [tx-data (protocol/transit->tx (nth txs idx))]
            (if (sequential? tx-data)
              (let [result (apply-tx! self sender tx-data)]
                (if (= "tx/ok" (:type result))
                  (recur (inc idx))
                  (assoc result :index idx)))
              {:type "tx/reject"
               :reason "invalid tx"
               :index idx})))))))

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

        "snapshot"
        (send! ws (snapshot-response self))

        "tx"
        (let [tx-data (protocol/transit->tx (:tx message))
              t-before (parse-int (:t_before message))]
          (if (sequential? tx-data)
            (send! ws (handle-tx! self ws tx-data t-before))
            (send! ws {:type "tx/reject" :reason "invalid tx"})))

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
  (let [url (js/URL. (.-url request))
        raw-path (.-pathname url)
        path (strip-sync-prefix raw-path)
        method (.-method request)]
    (cond
      (= method "OPTIONS")
      (common/options-response)

      (and (= method "GET") (= path "/health"))
      (common/json-response {:ok true})

      (and (= method "GET") (= path "/pull"))
      (let [since (or (parse-int (.get (.-searchParams url) "since")) 0)]
        (common/json-response (pull-response self since)))

      (and (= method "GET") (= path "/snapshot"))
      (common/json-response (snapshot-response self))

      (and (= method "DELETE") (= path "/admin/reset"))
      (do
        (common/sql-exec (.-sql self) "drop table if exists kvs")
        (common/sql-exec (.-sql self) "drop table if exists tx_log")
        (common/sql-exec (.-sql self) "drop table if exists sync_meta")
        (storage/init-schema! (.-sql self))
        (common/json-response {:ok true}))

      (and (= method "POST") (= path "/tx"))
      (.then (common/read-json request)
             (fn [result]
               (if (nil? result)
                 (common/bad-request "missing body")
                 (let [tx-data (protocol/transit->tx (aget result "tx"))
                       t-before (parse-int (aget result "t_before"))]
                   (if (sequential? tx-data)
                     (common/json-response (handle-tx! self nil tx-data t-before))
                     (common/bad-request "invalid tx"))))))

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

      :else
      (common/not-found))))

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
                        (log/error :worker-sync/ws-error e)
                        (send! ws {:type "error" :message "server error"}))))
  (webSocketClose [_this _ws _code _reason]
                  (log/info :worker-sync/ws-closed true))
  (webSocketError [_this _ws error]
                  (log/error :worker-sync/ws-error {:error error})))

(defn- index-init! [sql]
  (common/sql-exec sql
                   (str "create table if not exists graphs ("
                        "graph_id TEXT primary key,"
                        "graph_name TEXT,"
                        "schema_version TEXT,"
                        "created_at INTEGER,"
                        "updated_at INTEGER"
                        ");")))

(defn- index-list [sql]
  (common/get-sql-rows
   (common/sql-exec sql
                    (str "select graph_id, graph_name, schema_version, created_at, updated_at "
                         "from graphs order by updated_at desc"))))

(defn- index-upsert! [sql graph-id graph-name schema-version]
  (let [now (common/now-ms)]
    (common/sql-exec sql
                     (str "insert into graphs (graph_id, graph_name, schema_version, created_at, updated_at) "
                          "values (?, ?, ?, ?, ?) "
                          "on conflict(graph_id) do update set "
                          "graph_name = excluded.graph_name, "
                          "schema_version = excluded.schema_version, "
                          "updated_at = excluded.updated_at")
                     graph-id
                     graph-name
                     schema-version
                     now
                     now)))

(defn- index-delete! [sql graph-id]
  (common/sql-exec sql "delete from graphs where graph_id = ?" graph-id))

(defn- handle-index-fetch [^js self request]
  (let [sql (.-sql self)
        url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (index-init! sql)
    (cond
      (= method "OPTIONS")
      (common/options-response)

      (and (= method "GET") (= path "/graphs"))
      (common/json-response {:graphs (index-list sql)})

      (and (= method "POST") (= path "/graphs"))
      (.then (common/read-json request)
             (fn [result]
               (let [graph-id (aget result "graph_id")
                     graph-name (aget result "graph_name")
                     schema-version (aget result "schema_version")]
                 (if (and (string? graph-id) (string? graph-name))
                   (do
                     (index-upsert! sql graph-id graph-name schema-version)
                     (common/json-response {:graph_id graph-id}))
                   (common/bad-request "missing graph_id or graph_name")))))

      (and (= method "DELETE") (string/starts-with? path "/graphs/"))
      (let [graph-id (subs path (count "/graphs/"))]
        (if (seq graph-id)
          (do
            (index-delete! sql graph-id)
            (let [^js namespace (.-LOGSEQ_SYNC_DO (.-env self))
                  do-id (.idFromName namespace graph-id)
                  stub (.get namespace do-id)
                  reset-url (str (.-origin url) "/admin/reset")]
              (.fetch stub (js/Request. reset-url #js {:method "DELETE"})))
            (common/json-response {:graph_id graph-id :deleted true}))
          (common/bad-request "missing graph id")))

      :else
      (common/not-found))))

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
