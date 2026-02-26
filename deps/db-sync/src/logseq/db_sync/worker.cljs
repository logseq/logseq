(ns logseq.db-sync.worker
  ;; Turn off false defclass errors
  {:clj-kondo/config {:linters {:unresolved-symbol {:level :off}}}}
  (:require ["cloudflare:workers" :refer [DurableObject]]
            [lambdaisland.glogi :as log]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.logging :as logging]
            [logseq.db-sync.sentry.worker :as sentry]
            [logseq.db-sync.worker.dispatch :as dispatch]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.handler.ws :as ws-handler]
            [logseq.db-sync.worker.presence :as presence]
            [logseq.db-sync.worker.ws :as ws]
            [promesa.core :as p]
            [shadow.cljs.modern :refer (defclass)]))

(logging/install!)

(def worker
  (sentry/wrap-handler
   #js {:fetch (fn [request env _ctx]
                 (dispatch/handle-worker-fetch request env))}))

(defclass SyncDO
  (extends DurableObject)

  (constructor [this ^js state env]
               (super state env)
               (set! (.-state this) state)
               (set! (.-env this) env)
               (set! (.-sql this) (.-sql ^js (.-storage state)))
               (set! (.-conn this) nil)
               (set! (.-schema-ready this) false)
               (let [presence (presence/presence* this)
                     sockets (.getWebSockets state)]
                 (doseq [^js ws sockets]
                   (when-let [attachment (.deserializeAttachment ws)]
                     (swap! presence assoc ws (js->clj attachment :keywordize-keys true))))
                 (.setWebSocketAutoResponse
                  state
                  (js/WebSocketRequestResponsePair. "ping" "pong"))))

  Object
  (fetch [this request]
         (->
          (p/do
            (if (common/upgrade-request? request)
              (ws-handler/handle-ws this request)
              (sync-handler/handle-http this request)))
          (p/catch (fn [error]
                     (let [message (cond
                                     (instance? ExceptionInfo error) (str (.-message error) " | " (pr-str (ex-data error)))
                                     (instance? js/Error error) (.-message error)
                                     :else (pr-str error))
                           stack (when (instance? js/Error error) (.-stack error))]
                       (common/json-response
                        {:error "DO internal error"
                         :debug-message message
                         :debug-stack stack}
                        500))))))
  (webSocketMessage [this ws message]
                    (try
                      (ws-handler/handle-ws-message! this ws message)
                      (catch :default e
                        (sentry/capture-exception! e)
                        (log/error :db-sync/ws-error e)
                        (js/console.error e)
                        (ws/send! ws {:type "error" :message "server error"}))))
  (webSocketClose [this ws _code _reason]
                  (presence/remove-presence! this ws)
                  (presence/broadcast-online-users! this))
  (webSocketError [this ws error]
                  (presence/remove-presence! this ws)
                  (presence/broadcast-online-users! this)
                  (sentry/capture-exception! error)
                  (log/error :db-sync/ws-error error)))
