(ns logseq.db-sync.node.server
  (:require ["crypto" :as node-crypto]
            ["fs" :as fs]
            ["http" :as http]
            ["os" :as node-os]
            ["path" :as node-path]
            ["qrcode-terminal" :as qrcode]
            ["ws" :as ws]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
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

(defn resolve-local-token!
  "Resolve the shared-secret token for local (no-Cognito) self-hosting.
   Precedence: DB_SYNC_LOCAL_TOKEN env var; otherwise, when no Cognito issuer
   is configured, a token persisted under the data dir, generated on first
   run. Returns nil when Cognito auth is configured."
  [cfg]
  (let [env-token (some-> js/process .-env (aget "DB_SYNC_LOCAL_TOKEN") not-empty)]
    (cond
      (some? env-token)
      env-token

      (some? (:cognito-issuer cfg))
      nil

      :else
      (let [token-file (node-path/join (:data-dir cfg) "local-token")
            existing (when (fs/existsSync token-file)
                       (some-> (fs/readFileSync token-file "utf8") string/trim not-empty))]
        (or existing
            (let [token (.toString (node-crypto/randomBytes 32) "hex")]
              (fs/mkdirSync (:data-dir cfg) #js {:recursive true})
              ;; 0600 — the token file is a credential
              (fs/writeFileSync token-file token #js {:mode 384})
              token))))))

(defn- lan-ip
  "First non-internal IPv4 address, or nil."
  []
  (let [interfaces (js->clj (node-os/networkInterfaces))]
    (some (fn [[_name addrs]]
            (some (fn [addr]
                    (when (and (= "IPv4" (get addr "family"))
                               (not (get addr "internal")))
                      (get addr "address")))
                  addrs))
          interfaces)))

(defn- print-local-mode-banner!
  "Print the local-mode access token and a pairing QR code.
   The QR encodes <base>/pair#<token> — the token travels in the URL fragment
   so it is never sent to the server; the /pair page turns it into a
   logseq://sync-setup deep link."
  [cfg port]
  (let [token (:local-token cfg)
        token-file (node-path/join (:data-dir cfg) "local-token")
        pair-base (or (:base-url cfg)
                      (when-let [ip (lan-ip)]
                        (str "http://" ip ":" port)))
        pair-url (when pair-base (str pair-base "/pair#" token))]
    (println "Local sync mode: no Cognito auth configured.")
    (println (str "Access token: " token))
    (println (str "(persisted at " token-file "; set DB_SYNC_LOCAL_TOKEN to override)"))
    (when pair-url
      (println)
      (println (str "Pair a device: open " pair-url))
      (when (some-> js/process .-stdout .-isTTY)
        (println "or scan:")
        (qrcode/generate pair-url #js {:small true})))))

(defn- make-env [cfg index-db assets-bucket]
  (let [allow-unverified-jwt-claims (some-> js/process .-env (aget "DB_SYNC_ALLOW_UNVERIFIED_JWT_CLAIMS"))
        local-token (:local-token cfg)
        local-user-id (some-> js/process .-env (aget "DB_SYNC_LOCAL_USER_ID"))
        env (doto (js-obj)
              (aset "DB" index-db)
              (aset "LOGSEQ_SYNC_ASSETS" assets-bucket)
              ;; Node adapter serves snapshot transit stream without gzip to avoid
              ;; browser/adapter content-encoding mismatches during graph download.
              (aset "DB_SYNC_SNAPSHOT_STREAM_GZIP" "false")
              (aset "COGNITO_ISSUER" (:cognito-issuer cfg))
              (aset "COGNITO_CLIENT_ID" (:cognito-client-id cfg))
              (aset "COGNITO_JWKS_URL" (:cognito-jwks-url cfg)))]
    (when (some? allow-unverified-jwt-claims)
      (aset env "DB_SYNC_ALLOW_UNVERIFIED_JWT_CLAIMS" allow-unverified-jwt-claims))
    (when (some? local-token)
      (aset env "DB_SYNC_LOCAL_TOKEN" local-token))
    (when (some? local-user-id)
      (aset env "DB_SYNC_LOCAL_USER_ID" local-user-id))
    env))

(defn- request-origin-opts
  [cfg]
  (if-let [base-url (:base-url cfg)]
    (let [url (js/URL. base-url)
          protocol (.-protocol url)
          scheme (if (string/ends-with? protocol ":")
                   (subs protocol 0 (dec (count protocol)))
                   protocol)]
      {:scheme scheme
       :host (.-host url)})
    {:scheme "http"}))

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

(defn start!
  [overrides]
  (let [cfg (config/normalize-config overrides)
        local-token (resolve-local-token! cfg)
        cfg (cond-> cfg
              local-token (assoc :local-token local-token))
        request-origin (request-origin-opts cfg)
        index-db (storage/open-index-db (:data-dir cfg))
        assets-bucket (assets/make-bucket (node-path/join (:data-dir cfg) "assets"))
        registry (atom {})
        deps {:config cfg
              :index-db index-db
              :assets-bucket assets-bucket}
        env (doto (make-env cfg index-db assets-bucket)
              (aset "DB_SYNC_DELETE_GRAPH"
                    (fn [graph-id]
                      (graph/delete-graph! registry deps graph-id))))
        server (.createServer http
                              (fn [req res]
                                (-> (p/let [request (platform-node/request-from-node req request-origin)
                                            response (dispatch/handle-node-fetch {:request request
                                                                                  :env env
                                                                                  :registry registry
                                                                                  :deps deps})]
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
    (p/let [_ (index/<index-init! index-db)]
      (.on server "upgrade"
           (fn [req ^js socket head]
             (let [request (platform-node/request-from-node req request-origin)
                   url (platform/request-url request)
                   path (.-pathname url)
                   parsed (node-routes/parse-sync-path path)
                   graph-id (:graph-id parsed)]
               (if (and graph-id (seq graph-id))
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
                 (.destroy socket)))))
      (p/let [_ (js/Promise.
                 (fn [resolve]
                   (.listen server (:port cfg)
                            (fn [] (resolve nil)))))
              address (.address server)
              port (if (number? address) address (.-port address))
              base-url (or (:base-url cfg) (str "http://localhost:" port))]
        (when (:local-token cfg)
          (print-local-mode-banner! cfg port))
        {:server server
         :wss wss
         :env env
         :registry registry
         :port port
         :base-url base-url
         :stop! (fn []
                  (graph/close-graphs! registry)
                  (when-let [close (.-close index-db)]
                    (close))
                  (js/Promise.
                   (fn [resolve]
                     (.close server (fn [] (resolve nil))))))}))))
