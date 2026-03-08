(ns logseq.cli.auth
  "CLI auth helpers for persisted login state."
  (:require [clojure.string :as string]
            [logseq.cli.transport :as transport]
            [logseq.common.cognito-config :as cognito-config]
            [promesa.core :as p]
            ["child_process" :as child-process]
            ["crypto" :as crypto]
            ["fs" :as fs]
            ["http" :as http]
            ["os" :as os]
            ["path" :as node-path]))

(def ^:private default-login-timeout-ms 300000)
(def ^:private default-logout-timeout-ms 120000)
(def ^:private redirect-path "/auth/callback")
(def ^:private logout-complete-path "/logout-complete")
(def ^:private callback-host "localhost")
(def ^:private callback-port 8765)
(def ^:private auth-provider "cognito")
(def ^:private default-scope "email openid phone")
(def ^:private token-endpoint-path "/oauth2/token")
(def ^:private authorize-endpoint-path "/oauth2/authorize")
(def ^:private logout-endpoint-path "/logout")

(defn default-auth-path
  []
  (node-path/join (.homedir os) "logseq" "auth.json"))

(defn auth-path
  [{custom-auth-path :auth-path}]
  (or custom-auth-path (default-auth-path)))

(defn- ensure-auth-dir!
  [path]
  (let [dir (node-path/dirname path)]
    (when (and (seq dir) (not (fs/existsSync dir)))
      (.mkdirSync fs dir #js {:recursive true}))))

(defn- try-chmod!
  [path]
  (try
    (.chmodSync fs path 384)
    (catch :default _
      nil)))

(defn- parse-json
  [text]
  (js->clj (js/JSON.parse text) :keywordize-keys true))

(defn- login-url
  []
  (js/URL. cognito-config/LOGIN-URL))

(defn- oauth-client-id
  []
  cognito-config/CLI-COGNITO-CLIENT-ID)

(defn- oauth-scope
  []
  (or (.get (.-searchParams (login-url)) "scope")
      cognito-config/OAUTH-SCOPE
      default-scope))

(defn- oauth-domain
  []
  cognito-config/OAUTH-DOMAIN)

(defn- logout-complete-uri
  []
  (str "http://" callback-host ":" callback-port logout-complete-path))

(defn- token-endpoint
  []
  (str "https://" (oauth-domain) token-endpoint-path))

(defn- authorize-endpoint
  []
  (str "https://" (oauth-domain) authorize-endpoint-path))

(defn- logout-endpoint
  []
  (str "https://" (oauth-domain) logout-endpoint-path))

(defn- build-logout-url
  []
  (let [params (doto (js/URLSearchParams.)
                 (.set "client_id" (oauth-client-id))
                 (.set "logout_uri" (logout-complete-uri)))]
    (str (logout-endpoint) "?" (.toString params))))

(defn- parse-jwt
  [jwt]
  (when (seq jwt)
    (try
      (let [parts (string/split jwt #"\.")
            payload (second parts)]
        (when (seq payload)
          (-> (js/Buffer.from payload "base64url")
              (.toString "utf8")
              parse-json)))
      (catch :default _
        nil))))

(defn write-auth-file!
  [opts auth-data]
  (let [path (auth-path opts)
        payload (js/JSON.stringify (clj->js auth-data) nil 2)]
    (ensure-auth-dir! path)
    (.writeFileSync fs path payload "utf8")
    (try-chmod! path)
    auth-data))

(defn read-auth-file
  [opts]
  (let [path (auth-path opts)]
    (when (fs/existsSync path)
      (try
        (-> (fs/readFileSync path)
            (.toString "utf8")
            parse-json)
        (catch :default e
          (throw (ex-info "invalid auth file"
                          {:code :invalid-auth-file
                           :auth-path path}
                          e)))))))

(defn delete-auth-file!
  [opts]
  (let [path (auth-path opts)]
    (when (fs/existsSync path)
      (.unlinkSync fs path))
    nil))

(declare start-logout-complete-server! open-browser!)

(defn logout!
  [opts]
  (let [path (auth-path opts)
        existed? (fs/existsSync path)
        logout-url (build-logout-url)]
    (delete-auth-file! opts)
    (-> (p/let [callback-server (start-logout-complete-server! opts)]
          (-> (p/let [open-result (open-browser! logout-url)
                      logout-completed? (if (:opened? open-result)
                                          (-> ((:wait! callback-server))
                                              (p/then (constantly true))
                                              (p/catch (fn [_]
                                                         false)))
                                          false)]
                {:auth-path path
                 :deleted? existed?
                 :logout-url logout-url
                 :opened? (:opened? open-result)
                 :logout-completed? logout-completed?})
              (p/finally (fn []
                           ((:stop! callback-server))))))
        (p/catch (fn [_]
                   {:auth-path path
                    :deleted? existed?
                    :logout-url logout-url
                    :opened? false
                    :logout-completed? false})))))

(defn expired-auth?
  [{:keys [expires-at]}]
  (or (not (number? expires-at))
      (<= expires-at (js/Date.now))))

(defn- random-base64url
  [size]
  (.toString (.randomBytes crypto size) "base64url"))

(defn- code-challenge
  [code-verifier]
  (-> (.createHash crypto "sha256")
      (.update code-verifier)
      (.digest "base64url")))

(defn build-authorize-url
  [{:keys [redirect-uri state pkce-challenge]}]
  (let [params (doto (js/URLSearchParams.)
                 (.set "response_type" "code")
                 (.set "client_id" (oauth-client-id))
                 (.set "scope" (oauth-scope))
                 (.set "redirect_uri" redirect-uri)
                 (.set "state" state)
                 (.set "code_challenge" pkce-challenge)
                 (.set "code_challenge_method" "S256"))]
    (str (authorize-endpoint) "?" (.toString params))))

(defn- stop-server!
  [server]
  (if (some? server)
    (p/create (fn [resolve _reject]
                (.close server (fn []
                                 (resolve true)))))
    (p/resolved true)))

(defn start-login-callback-server!
  [{:keys [state login-timeout-ms]}]
  (p/create
   (fn [resolve reject]
     (let [callback-handlers (atom nil)
           settled? (atom false)
           callback-promise (p/create (fn [resolve' reject']
                                        (reset! callback-handlers {:resolve resolve'
                                                                   :reject reject'})))
           finish! (fn [kind payload]
                     (when-not @settled?
                       (reset! settled? true)
                       (when-let [{:keys [resolve reject]} @callback-handlers]
                         ((if (= kind :resolve) resolve reject) payload))))
           server (.createServer http
                                 (fn [^js req ^js res]
                                   (let [url (js/URL. (str "http://" callback-host (.-url req)))
                                         pathname (.-pathname url)
                                         params (.-searchParams url)
                                         code (.get params "code")
                                         callback-state (.get params "state")
                                         error-code (.get params "error")]
                                     (cond
                                       (not= redirect-path pathname)
                                       (do
                                         (.writeHead res 404 #js {"Content-Type" "text/plain; charset=utf-8"})
                                         (.end res "Not found"))

                                       (seq error-code)
                                       (do
                                         (.writeHead res 400 #js {"Content-Type" "text/plain; charset=utf-8"})
                                         (.end res "Login failed. You can return to the CLI.")
                                         (finish! :reject (ex-info "login callback returned oauth error"
                                                                   {:code :login-callback-error
                                                                    :oauth-error error-code})))

                                       (not= state callback-state)
                                       (do
                                         (.writeHead res 400 #js {"Content-Type" "text/plain; charset=utf-8"})
                                         (.end res "Login failed due to state mismatch. Return to the CLI and retry.")
                                         (finish! :reject (ex-info "login callback state mismatch"
                                                                   {:code :invalid-callback-state})))

                                       (not (seq code))
                                       (do
                                         (.writeHead res 400 #js {"Content-Type" "text/plain; charset=utf-8"})
                                         (.end res "Login failed because the callback did not include a code.")
                                         (finish! :reject (ex-info "missing authorization code"
                                                                   {:code :missing-callback-code})))

                                       :else
                                       (do
                                         (.writeHead res 200 #js {"Content-Type" "text/plain; charset=utf-8"})
                                         (.end res "Login successful. You can return to the CLI.")
                                         (finish! :resolve {:code code}))))))
           timeout-id (js/setTimeout (fn []
                                       (finish! :reject (ex-info "login callback timed out"
                                                                 {:code :login-timeout})))
                                     (or login-timeout-ms default-login-timeout-ms))]
       (.on server "error" (fn [error]
                              (js/clearTimeout timeout-id)
                              (reject (ex-info "failed to start login callback server"
                                               {:code :login-callback-server-start-failed}
                                               error))))
       (.listen server callback-port callback-host
                (fn []
                  (let [address (.address server)
                        port (.-port address)
                        redirect-uri (str "http://" callback-host ":" port redirect-path)]
                    (resolve {:port port
                              :redirect-uri redirect-uri
                              :wait! (fn []
                                       (-> callback-promise
                                           (p/finally (fn []
                                                        (js/clearTimeout timeout-id)))))
                              :stop! (fn []
                                       (js/clearTimeout timeout-id)
                                       (stop-server! server))}))))))))

(defn start-logout-complete-server!
  [{:keys [logout-timeout-ms]}]
  (p/create
   (fn [resolve reject]
     (let [settled? (atom false)
           callback-handlers (atom nil)
           callback-promise (p/create (fn [resolve' reject']
                                        (reset! callback-handlers {:resolve resolve'
                                                                   :reject reject'})))
           finish! (fn [kind payload]
                     (when-not @settled?
                       (reset! settled? true)
                       (when-let [{:keys [resolve reject]} @callback-handlers]
                         ((if (= kind :resolve) resolve reject) payload))))
           server (.createServer http
                                 (fn [^js req ^js res]
                                   (let [url (js/URL. (str "http://" callback-host (.-url req)))
                                         pathname (.-pathname url)]
                                     (if (= logout-complete-path pathname)
                                       (do
                                         (.writeHead res 200 #js {"Content-Type" "text/plain; charset=utf-8"})
                                         (.end res "Logout successful. You can return to the CLI.")
                                         (finish! :resolve true))
                                       (do
                                         (.writeHead res 404 #js {"Content-Type" "text/plain; charset=utf-8"})
                                         (.end res "Not found"))))))
           timeout-id (js/setTimeout (fn []
                                       (finish! :reject (ex-info "logout callback timed out"
                                                                 {:code :logout-timeout})))
                                     (or logout-timeout-ms default-logout-timeout-ms))]
       (.on server "error" (fn [error]
                              (js/clearTimeout timeout-id)
                              (reject (ex-info "failed to start logout callback server"
                                               {:code :logout-callback-server-start-failed}
                                               error))))
       (.listen server callback-port callback-host
                (fn []
                  (resolve {:logout-uri (logout-complete-uri)
                            :wait! (fn []
                                     (-> callback-promise
                                         (p/finally (fn []
                                                      (js/clearTimeout timeout-id)))))
                            :stop! (fn []
                                     (js/clearTimeout timeout-id)
                                     (stop-server! server))})))))))

(defn open-browser!
  [url]
  (let [platform (.-platform js/process)
        [command args] (case platform
                         "darwin" ["open" [url]]
                         "linux" ["xdg-open" [url]]
                         "win32" ["cmd" ["/c" "start" "" url]]
                         [nil nil])]
    (if-not (seq command)
      (p/resolved {:opened? false})
      (p/create
       (fn [resolve _reject]
         (try
           (let [child (.spawn child-process command (clj->js args)
                               #js {:detached true
                                    :stdio "ignore"
                                    :shell false})]
             (.unref child)
             (resolve {:opened? true
                       :command command}))
           (catch :default e
             (resolve {:opened? false
                       :command command
                       :error (or (.-message e) (str e))}))))))))

(defn- oauth-token-request!
  [params]
  (let [search-params (js/URLSearchParams.)]
    (.set search-params "client_id" (oauth-client-id))
    (doseq [[k v] params]
      (.set search-params k (str v)))
    (let [body (.toString search-params)]
      (-> (transport/request {:method "POST"
                              :url (token-endpoint)
                              :headers {"Content-Type" "application/x-www-form-urlencoded"
                                        "Accept" "application/json"}
                              :body body
                              :timeout-ms 10000})
          (p/then (fn [{:keys [body]}]
                    (parse-json body)))))))

(defn- token-body->auth-data
  [token-body current-auth]
  (let [id-token (:id_token token-body)
        claims (parse-jwt id-token)
        refresh-token (or (:refresh_token token-body)
                          (:refresh-token current-auth))]
    {:provider auth-provider
     :id-token id-token
     :access-token (:access_token token-body)
     :refresh-token refresh-token
     :expires-at (some-> (:exp claims) (* 1000))
     :sub (:sub claims)
     :email (:email claims)
     :updated-at (js/Date.now)}))

(defn exchange-code-for-auth!
  [_opts {:keys [code redirect-uri code-verifier]}]
  (-> (oauth-token-request! {"grant_type" "authorization_code"
                             "code" code
                             "redirect_uri" redirect-uri
                             "code_verifier" code-verifier})
      (p/then (fn [token-body]
                (token-body->auth-data token-body nil)))
      (p/catch (fn [error]
                 (let [data (ex-data error)]
                   (p/rejected
                    (ex-info "authorization code exchange failed"
                             (merge {:code :auth-code-exchange-failed}
                                    (when data {:context data}))
                             error)))))))

(defn refresh-auth!
  [opts auth-data]
  (let [refresh-token (:refresh-token auth-data)]
    (if (seq refresh-token)
      (-> (oauth-token-request! {"grant_type" "refresh_token"
                                 "refresh_token" refresh-token})
          (p/then (fn [token-body]
                    (token-body->auth-data token-body auth-data)))
          (p/catch (fn [error]
                     (let [data (ex-data error)
                           parsed-body (try
                                         (some-> (:body data) parse-json)
                                         (catch :default _
                                           nil))]
                       (if (= "invalid_grant" (:error parsed-body))
                         (p/rejected
                          (ex-info "refresh token is invalid"
                                   {:code :missing-auth
                                    :hint "Run logseq login first."
                                    :auth-path (auth-path opts)}
                                   error))
                         (p/rejected
                          (ex-info "auth refresh failed"
                                   {:code :auth-refresh-failed
                                    :hint "Run logseq login first."
                                    :auth-path (auth-path opts)
                                    :context data}
                                   error)))))))
      (p/rejected (ex-info "missing refresh token"
                           {:code :missing-auth
                            :hint "Run logseq login first."
                            :auth-path (auth-path opts)})))))

(defn login!
  [opts]
  (let [state (or (:state opts) (random-base64url 24))
        code-verifier (or (:code-verifier opts) (random-base64url 48))
        authorize-payload {:state state
                           :pkce-challenge (code-challenge code-verifier)}]
    (p/let [callback-server (start-login-callback-server! (merge opts {:state state}))
            redirect-uri (:redirect-uri callback-server)
            authorize-url (build-authorize-url (assoc authorize-payload :redirect-uri redirect-uri))]
      (-> (p/let [open-result (open-browser! authorize-url)
                  callback-result ((:wait! callback-server))
                  auth-data (exchange-code-for-auth! opts {:code (:code callback-result)
                                                           :redirect-uri redirect-uri
                                                           :code-verifier code-verifier})
                  _ (write-auth-file! opts auth-data)]
            {:auth-path (auth-path opts)
             :authorize-url authorize-url
             :opened? (:opened? open-result)
             :email (:email auth-data)
             :sub (:sub auth-data)
             :updated-at (:updated-at auth-data)})
          (p/finally (fn []
                       ((:stop! callback-server))))))))

(defn resolve-auth-token!
  [opts]
  (if-let [current-auth (read-auth-file opts)]
    (if (expired-auth? current-auth)
      (p/let [refreshed-auth (refresh-auth! opts current-auth)
              next-auth (merge current-auth refreshed-auth)]
        (write-auth-file! opts next-auth)
        (:id-token next-auth))
      (p/resolved (:id-token current-auth)))
    (p/rejected (ex-info "missing auth"
                         {:code :missing-auth
                          :hint "Run logseq login first."
                          :auth-path (auth-path opts)}))))
