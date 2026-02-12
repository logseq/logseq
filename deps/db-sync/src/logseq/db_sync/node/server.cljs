(ns logseq.db-sync.node.server
  (:require ["http" :as http]
            ["path" :as node-path]
            ["ws" :as ws]
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
            [logseq.db-sync.worker.handler.ws :as ws-handler]
            [logseq.db-sync.worker.http :as worker-http]
            [logseq.db-sync.worker.presence :as presence]
            [promesa.core :as p]))

(logging/install!)

(defn- make-env [cfg index-db assets-bucket]
  (doto (js-obj)
    (aset "DB" index-db)
    (aset "LOGSEQ_SYNC_ASSETS" assets-bucket)
    (aset "COGNITO_ISSUER" (:cognito-issuer cfg))
    (aset "COGNITO_CLIENT_ID" (:cognito-client-id cfg))
    (aset "COGNITO_JWKS_URL" (:cognito-jwks-url cfg))))

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
         (log/error :db-sync/ws-error {:error error}))))

(defn start!
  [overrides]
  (let [cfg (config/normalize-config overrides)
        index-db (storage/open-index-db (:data-dir cfg))
        assets-bucket (assets/make-bucket (node-path/join (:data-dir cfg) "assets"))
        env (make-env cfg index-db assets-bucket)
        registry (atom {})
        deps {:config cfg
              :index-db index-db
              :assets-bucket assets-bucket}
        server (.createServer http
                              (fn [req res]
                                (-> (p/let [request (platform-node/request-from-node req {:scheme "http"})
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
             (let [request (platform-node/request-from-node req {:scheme "http"})
                   url (platform/request-url request)
                   path (.-pathname url)
                   parsed (node-routes/parse-sync-path path)
                   graph-id (:graph-id parsed)]
               (if (and graph-id (seq graph-id))
                 (p/let [allowed? (access-allowed? env graph-id request)]
                   (if allowed?
                     (.handleUpgrade wss req socket head
                                     (fn [ws-socket]
                                       (let [ctx (graph/get-or-create-graph registry deps graph-id)]
                                         (attach-ws! ctx ws-socket)
                                         (handle-ws-connection ctx env request ws-socket))))
                     (.destroy socket)))
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
                  (graph/close-graphs! registry)
                  (when-let [close (.-close index-db)]
                    (close))
                  (js/Promise.
                   (fn [resolve]
                     (.close server (fn [] (resolve nil))))))}))))
