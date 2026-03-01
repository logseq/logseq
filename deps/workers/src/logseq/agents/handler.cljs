(ns logseq.agents.handler
  (:require [lambdaisland.glogi :as log]
            [logseq.agents.request :as agent-request]
            [logseq.agents.routes :as routes]
            [logseq.sync.common :as common]
            [logseq.sync.platform.core :as platform]
            [logseq.sync.worker.auth :as auth]
            [logseq.sync.worker.http :as http]
            [promesa.core :as p]))

(defn- session-namespace [^js env]
  (.-LOGSEQ_AGENT_SESSION_DO env))

(defn- session-stub [^js env session-id]
  (when-let [^js namespace (session-namespace env)]
    (let [do-id (.idFromName namespace session-id)]
      (.get namespace do-id))))

(defn- base-headers [request claims]
  (let [headers (js/Headers.)
        token (.get (.-headers request) "authorization")
        user-id (aget claims "sub")
        email (aget claims "email")
        username (aget claims "username")
        idempotency-key (.get (.-headers request) "idempotency-key")]
    (.set headers "content-type" "application/json")
    (when (string? token)
      (.set headers "authorization" token))
    (when (string? user-id)
      (.set headers "x-user-id" user-id))
    (when (string? email)
      (.set headers "x-user-email" email))
    (when (string? username)
      (.set headers "x-user-username" username))
    (when (string? idempotency-key)
      (.set headers "idempotency-key" idempotency-key))
    headers))

(defn- forward-request [^js stub url method headers body]
  (let [init (cond-> {:method method :headers headers}
               (some? body)
               (assoc :body body))]
    (.fetch stub (platform/request url (clj->js init)))))

(defn- forward-websocket-request [^js stub request url claims]
  (let [headers (js/Headers. (.-headers request))
        user-id (aget claims "sub")
        email (aget claims "email")
        username (aget claims "username")]
    (when (string? user-id)
      (.set headers "x-user-id" user-id))
    (when (string? email)
      (.set headers "x-user-email" email))
    (when (string? username)
      (.set headers "x-user-username" username))
    (let [forwarded-request (js/Request. url
                                         #js {:method (.-method request)
                                              :headers headers})]
      (.fetch stub forwarded-request))))

(defn- handle-create [{:keys [env request url claims]}]
  (.then (common/read-json request)
         (fn [result]
           (if (nil? result)
             (http/bad-request "missing body")
             (let [body (js->clj result :keywordize-keys true)
                   body (http/coerce-http-request :sessions/create body)
                   session-id (:session-id body)]
               (cond
                 (nil? body)
                 (http/bad-request "invalid body")

                 (not (string? session-id))
                 (http/bad-request "invalid session id")

                 :else
                 (if-let [^js stub (session-stub env session-id)]
                   (let [headers (base-headers request claims)
                         _ (.set headers "x-stream-base" (.-origin url))
                         task (agent-request/normalize-session-create body)
                         body-json (js/JSON.stringify (clj->js task))
                         do-url (str (.-origin url) "/__session__/init")]
                     (forward-request stub do-url "POST" headers body-json))
                   (http/error-response "server error" 500))))))))

(defn- handle-get [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) "/__session__/status")]
          (forward-request stub do-url "GET" headers nil))
        (http/error-response "server error" 500)))))

(defn- handle-messages [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (.then (common/read-json request)
             (fn [result]
               (if (nil? result)
                 (http/bad-request "missing body")
                 (let [body (js->clj result :keywordize-keys true)
                       body (http/coerce-http-request :sessions/message body)]
                   (cond
                     (nil? body)
                     (http/bad-request "invalid body")

                     :else
                     (if-let [^js stub (session-stub env session-id)]
                       (let [headers (base-headers request claims)
                             body-json (js/JSON.stringify (clj->js body))
                             do-url (str (.-origin url) "/__session__/messages")]
                         (forward-request stub do-url "POST" headers body-json))
                       (http/error-response "server error" 500))))))))))

(defn- handle-cancel [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) "/__session__/cancel")]
          (forward-request stub do-url "POST" headers nil))
        (http/error-response "server error" 500)))))

(defn- handle-control [{:keys [env request url claims route]} control-path]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) control-path)]
          (forward-request stub do-url "POST" headers nil))
        (http/error-response "server error" 500)))))

(defn- handle-stream [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) "/__session__/stream")]
          (forward-request stub do-url "GET" headers nil))
        (http/error-response "server error" 500)))))

(defn- handle-terminal [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [do-url (str (.-origin url) "/__session__/terminal" (.-search url))]
          (forward-websocket-request stub request do-url claims))
        (http/error-response "server error" 500)))))

(defn- handle-events [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) "/__session__/events" (.-search url))]
          (forward-request stub do-url "GET" headers nil))
        (http/error-response "server error" 500)))))

(defn- handle-branches [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) "/__session__/branches" (.-search url))]
          (forward-request stub do-url "GET" headers nil))
        (http/error-response "server error" 500)))))

(defn- handle-pr [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (.then (common/read-json request)
             (fn [result]
               (let [raw-body (if (nil? result)
                                {}
                                (js->clj result :keywordize-keys true))
                     body (http/coerce-http-request :sessions/pr raw-body)]
                 (if (nil? body)
                   (http/bad-request "invalid body")
                   (if-let [^js stub (session-stub env session-id)]
                     (let [headers (base-headers request claims)
                           body-json (js/JSON.stringify (clj->js body))
                           do-url (str (.-origin url) "/__session__/pr")]
                       (forward-request stub do-url "POST" headers body-json))
                     (http/error-response "server error" 500)))))))))

(defn- handle-snapshot [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) "/__session__/snapshot")]
          (forward-request stub do-url "POST" headers nil))
        (http/error-response "server error" 500)))))

(defn handle [{:keys [route] :as ctx}]
  (case (:handler route)
    :sessions/create (handle-create ctx)
    :sessions/get (handle-get ctx)
    :sessions/messages (handle-messages ctx)
    :sessions/pause (handle-control ctx "/__session__/pause")
    :sessions/resume (handle-control ctx "/__session__/resume")
    :sessions/interrupt (handle-control ctx "/__session__/interrupt")
    :sessions/cancel (handle-cancel ctx)
    :sessions/pr (handle-pr ctx)
    :sessions/snapshot (handle-snapshot ctx)
    :sessions/terminal (handle-terminal ctx)
    :sessions/events (handle-events ctx)
    :sessions/branches (handle-branches ctx)
    :sessions/stream (handle-stream ctx)
    (http/not-found)))

(defn handle-fetch [^js self request]
  (let [env (.-env self)
        url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (.catch
     (js/Promise.resolve
      (try
        (cond
          (contains? #{"OPTIONS" "HEAD"} method)
          (common/options-response)

          :else
          (p/let [claims (auth/auth-claims request env)
                  route (routes/match-route method path)
                  response (cond
                             (nil? claims)
                             (http/unauthorized)

                             route
                             (handle {:env env
                                      :request request
                                      :url url
                                      :claims claims
                                      :route route})

                             :else
                             (http/not-found))]
            response))
        (catch :default error
          (log/error :agent/session-handler-error error)
          (http/error-response "server error" 500))))
     (fn [error]
       (log/error :agent/session-handler-error error)
       (http/error-response "server error" 500)))))
