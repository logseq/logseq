(ns logseq.worker-sync.worker
  (:require ["cloudflare:workers" :refer [DurableObject]]
            [clojure.string :as string]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.worker-sync.common :as common]
            [logseq.worker-sync.cycle :as cycle]
            [logseq.worker-sync.protocol :as protocol]
            [logseq.worker-sync.storage :as storage]
            [shadow.cljs.modern :refer (defclass)]))

(defn- handle-worker-fetch [request ^js env]
  (let [url (js/URL. (.-url request))
        path (.-pathname url)]
    (cond
      (= path "/health")
      (common/json-response {:ok true})

      (string/starts-with? path "/sync/")
      (let [prefix (count "/sync/")
            rest-path (subs path prefix)
            slash-idx (string/index-of rest-path "/")
            graph-id (if (neg? slash-idx) rest-path (subs rest-path 0 slash-idx))
            tail (if (neg? slash-idx) "/" (subs rest-path slash-idx))
            new-url (str (.-origin url) tail (.-search url))]
        (if (seq graph-id)
          (let [^js namespace (.-LOGSEQ_SYNC_DO env)
                do-id (.idFromName namespace graph-id)
                stub (.get namespace do-id)
                rewritten (js/Request. new-url request)]
            (.fetch stub rewritten))
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
   :attr (name attr)
   :server_values (common/write-transit (cycle/server-values-for db tx-data attr))})

(defn- handle-tx! [^js self tx-data t-before]
  (let [sql (.-sql self)
        conn (.-conn self)
        current-t (t-now self)]
    (cond
      (and (number? t-before) (not= t-before current-t))
      {:type "tx/reject"
       :reason "stale"
       :t current-t}

      :else
      (let [db @conn
            cycle-info (cycle/detect-cycle db tx-data)]
        (if cycle-info
          (cycle-reject-response db tx-data cycle-info)
          (let [_ (ldb/transact! conn tx-data)
                new-t (storage/next-t! sql)
                created-at (common/now-ms)
                tx-str (common/write-transit tx-data)]
            (storage/append-tx! sql new-t tx-str created-at)
            {:type "tx/ok"
             :t new-t}))))))

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
            (send! ws (handle-tx! self tx-data t-before))
            (send! ws {:type "tx/reject" :reason "invalid tx"})))

        (send! ws {:type "error" :message "unknown type"})))))

(defn- handle-ws [^js self request]
  (let [pair (js/WebSocketPair.)
        client (aget pair 0)
        server (aget pair 1)]
    (.accept server)
    (set! (.-onmessage server)
          (fn [event]
            (try
              (handle-ws-message! self server (.-data event))
              (catch :default e
                (log/error :worker-sync/ws-error {:error e})
                (send! server {:type "error" :message "server error"})))))
    (set! (.-onclose server)
          (fn [_]
            (log/info :worker-sync/ws-closed true)))
    (js/Response. nil #js {:status 101 :webSocket client})))

(defn- handle-http [^js self request]
  (let [url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (cond
      (and (= method "GET") (= path "/health"))
      (common/json-response {:ok true})

      (and (= method "GET") (= path "/pull"))
      (let [since (or (parse-int (.get (.-searchParams url) "since")) 0)]
        (common/json-response (pull-response self since)))

      (and (= method "GET") (= path "/snapshot"))
      (common/json-response (snapshot-response self))

      (and (= method "POST") (= path "/tx"))
      (.then (common/read-json request)
             (fn [result]
               (if (nil? result)
                 (common/bad-request "missing body")
                 (let [tx-data (protocol/transit->tx (aget result "tx"))
                       t-before (parse-int (aget result "t_before"))]
                   (if (sequential? tx-data)
                     (common/json-response (handle-tx! self tx-data t-before))
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
           (handle-http this request))))
