(ns logseq.db-sync.node.server
  (:require ["http" :as http]
            ["path" :as node-path]
            ["ws" :as ws]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.db-sync.bots-access :as bots-access]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.logging :as logging]
            [logseq.db-sync.node.assets :as assets]
            [logseq.db-sync.node.config :as config]
            [logseq.db-sync.node.dispatch :as dispatch]
            [logseq.db-sync.node.graph :as graph]
            [logseq.db-sync.node.routes :as node-routes]
            [logseq.db-sync.node.storage :as storage]
            [logseq.db-sync.platform.core :as platform]
            [logseq.db-sync.platform.node :as platform-node]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.handler.ws :as ws-handler]
            [logseq.db-sync.worker.http :as worker-http]
            [logseq.db-sync.worker.presence :as presence]
            [promesa.core :as p]))

(logging/install!)

(defn- make-env [cfg index-db assets-bucket]
  (let [allow-unverified-jwt-claims (some-> js/process .-env (aget "DB_SYNC_ALLOW_UNVERIFIED_JWT_CLAIMS"))
        admin-token (some-> js/process .-env (aget "DB_SYNC_ADMIN_TOKEN"))
        env (doto (js-obj)
              (aset "DB" index-db)
              (aset "LOGSEQ_SYNC_ASSETS" assets-bucket)
              (aset "ASSET_LINK_SECRET" (:asset-link-secret cfg))
              ;; Node adapter serves snapshot transit stream without gzip to avoid
              ;; browser/adapter content-encoding mismatches during graph download.
              (aset "DB_SYNC_SNAPSHOT_STREAM_GZIP" "false")
              (aset "COGNITO_ISSUER" (:cognito-issuer cfg))
              (aset "COGNITO_CLIENT_ID" (:cognito-client-id cfg))
              (aset "COGNITO_JWKS_URL" (:cognito-jwks-url cfg)))]
    (when (some? allow-unverified-jwt-claims)
      (aset env "DB_SYNC_ALLOW_UNVERIFIED_JWT_CLAIMS" allow-unverified-jwt-claims))
    (when (seq admin-token)
      (aset env "DB_SYNC_ADMIN_TOKEN" admin-token))
    env))

(defn- request-origin-opts
  "Origin embedded in URLs returned to clients.

  `DB_SYNC_BASE_URL` wins when it is set. Otherwise leave scheme and host unset
  so the request keeps the Host header and `X-Forwarded-Proto`. Forcing `http`
  here makes snapshot download return an http URL, which the secure desktop
  context cannot fetch."
  [cfg]
  (if-let [base-url (:base-url cfg)]
    (let [url (js/URL. base-url)
          protocol (.-protocol url)
          scheme (if (string/ends-with? protocol ":")
                   (subs protocol 0 (dec (count protocol)))
                   protocol)]
      {:scheme scheme
       :host (.-host url)})
    {}))

(defn- access-allowed?
  [env graph-id request]
  (p/let [claims (auth/auth-claims request env)
          user-id (when claims (aget claims "sub"))
          db (aget env "DB")]
    (if (string? user-id)
      (index/<user-has-access-to-graph? db graph-id user-id)
      false)))

(defn- attach-ws! [^js ctx ^js socket]
  (let [state (.-state ctx)]
    (when-let [add-ws (.-addWebSocket state)]
      (add-ws socket))
    (set! (.-serializeAttachment socket) (fn [_] nil))
    (set! (.-deserializeAttachment socket) (fn [] nil))))

(defn- detach-ws! [^js ctx ^js socket]
  (let [state (.-state ctx)]
    (when-let [remove-ws (.-removeWebSocket state)]
      (remove-ws socket))))

(defn- reject-ws-upgrade!
  [^js socket status reason]
  (.write socket
          (str "HTTP/1.1 " status " Conflict\r\n"
               "Connection: close\r\n"
               "Content-Type: application/json\r\n\r\n"
               "{\"error\":\"" reason "\"}"))
  (.destroy socket))

(defn- handle-ws-connection
  [ctx env request ^js socket]
  (p/let [claims (auth/auth-claims request env)
          user (presence/claims->user claims)]
    (when user
      (presence/add-presence! ctx socket user))
    (presence/broadcast-online-users! ctx))
  (.on socket "message"
       (fn [data]
         (let [text (if (string? data) data (.toString data))]
           (try
             (ws-handler/handle-ws-message! ctx socket text)
             (catch :default e
               (log/error :db-sync/ws-error e)
               (.send socket (js/JSON.stringify #js {:type "error" :message "server error"})))))))
  (.on socket "close"
       (fn []
         (presence/remove-presence! ctx socket)
         (presence/broadcast-online-users! ctx)
         (detach-ws! ctx socket)))
  (.on socket "error"
       (fn [error]
         (presence/remove-presence! ctx socket)
         (presence/broadcast-online-users! ctx)
         (detach-ws! ctx socket)
         (log/error :db-sync/ws-error error))))

(defn- local-do-namespace
  "Durable Object namespace stand-in that forwards to the local graph context."
  [registry deps]
  #js {:idFromName (fn [graph-id] graph-id)
       :get (fn [_do-id]
              #js {:fetch (fn [request]
                            (let [url (platform/request-url request)
                                  graph-id (.get (.-searchParams url) "graph-id")]
                              (sync-handler/handle-http
                               (graph/get-or-create-graph registry deps graph-id)
                               request)))})})

(defn- unlimited-limiter []
  #js {:limit (fn [_opts] (p/resolved #js {:success true}))})

(defn- open-bot-service [index-db publish]
  (when (seq (some-> js/process .-env (aget "LOGSEQ_BOTS_DATABASE_URL")))
    (let [module-path (node-path/join js/__dirname ".." "bots" "index.cjs")
          service (js/require module-path)]
      (.createBotService service (.-env js/process)
                         (doto (bots-access/graph-access index-db)
                           (aset "publish" publish))))))

(defn- open-account-events [index-db registry deps]
  (let [module-path (node-path/join js/__dirname ".." "account_events_node.cjs")
        service (js/require module-path)
        access (bots-access/graph-access index-db)]
    (.createAccountEvents service
                          #js {:hasAccess (aget access "hasGraphAccess")
                               :graphContext #(graph/get-or-create-graph registry deps %)
                               :relayReady ws-handler/<relay-ready?
                               :relayFrame ws-handler/relay-frame!})))

(defn- dispatch-request [request env registry deps bots]
  (let [path (.-pathname (platform/request-url request))]
    (cond
      (= path "/events") (js/Response. nil #js {:status 426})
      (and bots (or (= path "/bots") (string/starts-with? path "/bots/")))
      (p/let [^js service bots]
        (if (string/starts-with? path "/bots/runner/")
          (.handleRunner service request)
          (p/let [owner (bots-access/<subject request env)]
            (if owner
              (.handle service owner request)
              (worker-http/error-response "unauthorized" 401)))))
      :else (dispatch/handle-node-fetch {:request request :env env :registry registry :deps deps}))))

(defn start!
  [overrides]
  (let [cfg (config/normalize-config overrides)
        _ (logging/set-root-level! (:log-level cfg))
        request-origin (request-origin-opts cfg)
        index-db (storage/open-index-db (:data-dir cfg))
        assets-bucket (assets/make-bucket (node-path/join (:data-dir cfg) "assets"))
        registry (atom {})
        deps {:config cfg
              :index-db index-db
              :assets-bucket assets-bucket}
        events (open-account-events index-db registry deps)
        bots (open-bot-service index-db (aget events "publish"))
        env (doto (make-env cfg index-db assets-bucket)
              (aset "DB_SYNC_DELETE_GRAPH"
                    (fn [graph-id]
                      (graph/delete-graph! registry deps graph-id)))
              (aset "LOGSEQ_SYNC_DO" (local-do-namespace registry deps))
              (aset "SEMANTIC_READ_RATE_LIMITER" (unlimited-limiter))
              (aset "SEMANTIC_WRITE_RATE_LIMITER" (unlimited-limiter)))
        server (.createServer http
                              (fn [req res]
                                (-> (p/let [request (platform-node/request-from-node req request-origin)
                                            response (dispatch-request request env registry deps bots)]
                                      (platform-node/send-response! res response))
                                    (p/catch
                                     (fn [e]
                                       (log/error :db-sync/node-request-failed {:error e})
                                       (js/console.error ":db-sync/node-request-failed" e)
                                       (platform-node/send-response! res (worker-http/error-response "server error" 500)))))))
        WSS (or (.-WebSocketServer ws) (.-Server ws))
        ^js wss (new WSS #js {:noServer true})]
    (.on server "error" (fn [error] (log/error :db-sync/node-server-error {:error error})))
    (.on wss "error" (fn [error] (log/error :db-sync/node-ws-error {:error error})))
    (p/let [_ bots
            _ (index/<index-init! index-db)]
      (.on server "upgrade"
           (fn [req ^js socket head]
             (let [request (platform-node/request-from-node req request-origin)
                   url (platform/request-url request)
                   path (.-pathname url)
                   parsed (node-routes/parse-sync-path path)
                   graph-id (:graph-id parsed)]
               (cond
                 (= path "/events")
                 (p/let [identity (when (string/starts-with? (or (.get (.-headers request) "authorization") "") "Bearer ")
                                    (bots-access/<identity request env))]
                   (if identity
                     (.handleUpgrade wss req socket head
                                     (fn [ws-socket] (.attach events ws-socket identity)))
                     (reject-ws-upgrade! socket 401 "unauthorized")))

                 (and graph-id (seq graph-id))
                 (p/let [allowed? (access-allowed? env graph-id request)]
                   (if allowed?
                     (let [ctx (graph/get-or-create-graph registry deps graph-id)]
                       (p/let [ready-for-sync? (sync-handler/<ready-for-sync? ctx graph-id)]
                         (if ready-for-sync?
                           (.handleUpgrade wss req socket head
                                           (fn [ws-socket]
                                             (attach-ws! ctx ws-socket)
                                             (handle-ws-connection ctx env request ws-socket)))
                           (reject-ws-upgrade! socket 409 "graph not ready"))))
                     (.destroy socket)))
                 :else
                 (.destroy socket)))))
      (p/let [_ (js/Promise.
                 (fn [resolve]
                   (.listen server (:port cfg)
                            (fn [] (resolve nil)))))
              address (.address server)
              port (if (number? address) address (.-port address))
              base-url (or (:base-url cfg) (str "http://localhost:" port))]
        {:server server
         :wss wss
         :env env
         :registry registry
         :port port
         :base-url base-url
         :stop! (fn []
                  (.close events)
                  (graph/close-graphs! registry)
                  (when-let [close (.-close index-db)]
                    (close))
                  (when bots (p/then bots (fn [service] (.close service))))
                  (js/Promise.
                   (fn [resolve]
                     (.close server (fn [] (resolve nil))))))}))))
