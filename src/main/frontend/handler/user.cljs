(ns frontend.handler.user
  "Provides user related handler fns like login and logout"
  (:require-macros [frontend.handler.user])
  (:require [cljs-http.client :as http]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.core.async :as async :refer [<! go timeout]]
            [clojure.set :as set]
            [clojure.string :as string]
            [frontend.common.missionary :as c.m]
            [frontend.config :as config]
            [frontend.debug :as debug]
            [frontend.flows :as flows]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [goog.crypt :as crypt]
            [goog.crypt.Hmac]
            [goog.crypt.Sha256]
            [goog.crypt.base64 :as base64]
            [missionary.core :as m]))

;;; userinfo, token, login/logout, ...

(defn- decode-username
  [username]
  (let [arr (new js/Uint8Array (count username))]
    (doseq [i (range (count username))]
      (aset arr i (.charCodeAt username i)))
    (.decode (new js/TextDecoder "utf-8") arr)))

(defn parse-jwt [jwt]
  (some-> jwt
          (string/split ".")
          second
          (#(base64/decodeString % true))
          js/JSON.parse
          (js->clj :keywordize-keys true)
          (update :cognito:username decode-username)))

(defn- parse-jwt-safe
  [jwt]
  (try
    (parse-jwt jwt)
    (catch :default _
      nil)))

(defn- expired? [parsed-jwt]
  (some->
   (* 1000 (:exp parsed-jwt))
   tc/from-long
   (t/before? (t/now))))

(defn- almost-expired?
  "return true when jwt will expire after 1h"
  [parsed-jwt]
  (some->
   (* 1000 (:exp parsed-jwt))
   tc/from-long
   (t/before? (-> 1 t/hours t/from-now))))

(defn- almost-expired-or-expired?
  [parsed-jwt]
  (or (almost-expired? parsed-jwt)
      (expired? parsed-jwt)))

(defn email []
  (some->
   (state/get-auth-id-token)
   parse-jwt
   :email))

(defn username []
  (some->
   (state/get-auth-id-token)
   parse-jwt
   :cognito:username))

(defn user-uuid []
  (some->
   (state/get-auth-id-token)
   parse-jwt
   :sub))

(defn logged-in? []
  (let [token (state/get-auth-refresh-token)]
    (when (string? token)
      (not (string/blank? token)))))

(defn- set-token-to-localstorage!
  ([id-token access-token]
   (prn :debug "set-token-to-localstorage!")
   (js/localStorage.setItem "id-token" id-token)
   (js/localStorage.setItem "access-token" access-token))
  ([id-token access-token refresh-token]
   (prn :debug "set-token-to-localstorage!")
   (js/localStorage.setItem "id-token" id-token)
   (js/localStorage.setItem "access-token" access-token)
   (js/localStorage.setItem "refresh-token" refresh-token)))

(defn- clear-cognito-tokens!
  "Clear tokens for cognito's localstorage, prefix is 'CognitoIdentityServiceProvider'"
  []
  (let [prefix "CognitoIdentityServiceProvider."]
    (doseq [key (js/Object.keys js/localStorage)]
      (when (string/starts-with? key prefix)
        (js/localStorage.removeItem key)))))

(defn auto-fill-refresh-token-from-cognito!
  []
  (let [prefix "CognitoIdentityServiceProvider."
        refresh-token-key (some #(when (string/starts-with? % prefix)
                                   (when (string/ends-with? % "refreshToken")
                                     %))
                                (js/Object.keys js/localStorage))]
    (when refresh-token-key
      (let [refresh-token (js/localStorage.getItem refresh-token-key)]
        (when (and refresh-token (not= refresh-token "undefined"))
          (state/set-auth-refresh-token refresh-token)
          (js/localStorage.setItem "refresh-token" refresh-token))))))

(defn- clear-tokens
  ([]
   (state/set-auth-id-token nil)
   (state/set-auth-access-token nil)
   (state/set-auth-refresh-token nil)
   (set-token-to-localstorage! "" "" "")
   (clear-cognito-tokens!))
  ([except-refresh-token?]
   (state/set-auth-id-token nil)
   (state/set-auth-access-token nil)
   (when-not except-refresh-token?
     (state/set-auth-refresh-token nil))
   (if except-refresh-token?
     (set-token-to-localstorage! "" "")
     (set-token-to-localstorage! "" "" ""))))

(defn- set-tokens!
  ([id-token access-token]
   (state/set-auth-id-token id-token)
   (state/set-auth-access-token access-token)
   (set-token-to-localstorage! id-token access-token)
   (some->> (parse-jwt (state/get-auth-id-token))
            (reset! flows/*current-login-user)))
  ([id-token access-token refresh-token]
   (state/set-auth-id-token id-token)
   (state/set-auth-access-token access-token)
   (state/set-auth-refresh-token refresh-token)
   (set-token-to-localstorage! id-token access-token refresh-token)
   (some->> (parse-jwt (state/get-auth-id-token))
            (reset! flows/*current-login-user))))

(defn- <refresh-tokens
  "return refreshed id-token, access-token"
  [refresh-token]
  (http/post (str "https://" config/OAUTH-DOMAIN "/oauth2/token")
             {:form-params {:grant_type "refresh_token"
                            :client_id config/COGNITO-CLIENT-ID
                            :refresh_token refresh-token}}))

(defn <refresh-id-token&access-token
  "Refresh id-token and access-token"
  []
  (go
    (when-let [refresh-token (state/get-auth-refresh-token)]
      (let [resp (<! (<refresh-tokens refresh-token))]
        (cond
          (and (<= 400 (:status resp))
               (> 500 (:status resp)))
          ;; invalid refresh-token
          (let [invalid-grant? (and (= 400 (:status resp))
                                    (= (:error (:body resp)) "invalid_grant"))]
            (prn :debug :refresh-token-failed
                 :status (:status resp))
            (when invalid-grant?
              (clear-tokens)))

          ;; e.g. api return 500, server internal error
          ;; we shouldn't clear tokens if they aren't expired yet
          ;; the `refresh-tokens-loop` will retry soon
          (and (not (http/unexceptional-status? (:status resp)))
               (not (-> (state/get-auth-id-token) parse-jwt expired?)))
          (do
            (prn :debug :refresh-token-failed
                 :status (:status resp)
                 :body (:body resp)
                 :error-code (:error-code resp)
                 :error-text (:error-text resp))
            nil)                           ; do nothing

          (not (http/unexceptional-status? (:status resp)))
          (notification/show! "exceptional status when refresh-token" :warning true)

          :else                         ; ok
          (when (and (:id_token (:body resp)) (:access_token (:body resp)))
            (set-tokens! (:id_token (:body resp)) (:access_token (:body resp)))))))))

(defn restore-tokens-from-localstorage
  "Refresh id-token&access-token, pull latest repos, returns nil when tokens are not available."
  []
  (println "restore-tokens-from-localstorage")
  (let [refresh-token (js/localStorage.getItem "refresh-token")
        id-token (js/localStorage.getItem "id-token")
        access-token (js/localStorage.getItem "access-token")
        restored-from-cache?
        (boolean
         (when (and (string? refresh-token) (not (string/blank? refresh-token))
                    (string? id-token) (not (string/blank? id-token))
                    (string? access-token) (not (string/blank? access-token)))
           (when-let [parsed (parse-jwt-safe id-token)]
             (when-not (expired? parsed)
               (set-tokens! id-token access-token refresh-token)
               true))))
        should-refresh?
        (and (string? refresh-token)
             (not (string/blank? refresh-token))
             (or (not restored-from-cache?)
                 (some-> (state/get-auth-id-token)
                         parse-jwt-safe
                         almost-expired?)))]
    (when restored-from-cache?
      ;; Publish login event immediately so sync can start without waiting token refresh request.
      (state/pub-event! [:user/fetch-info-and-graphs]))
    (when should-refresh?
      (go
        (<! (<refresh-id-token&access-token))
        ;; If tokens were not restored from cache, this is the first chance to continue login flow.
        (when (and (not restored-from-cache?) (user-uuid))
          (state/pub-event! [:user/fetch-info-and-graphs]))))))

(defn login-callback
  [session]
  (set-tokens!
   (:jwtToken (:idToken session))
   (:jwtToken (:accessToken session))
   (:token (:refreshToken session)))
  (auto-fill-refresh-token-from-cognito!)
  (state/pub-event! [:user/fetch-info-and-graphs]))

(defn ^:export login-with-username-password-e2e
  [username' password client-id client-secret]
  (let [text-encoder (new js/TextEncoder)
        key          (.encode text-encoder client-secret)
        hasher       (new crypt/Sha256)
        hmacer       (new crypt/Hmac hasher key)
        secret-hash  (base64/encodeByteArray (.getHmac hmacer (str username' client-id)))
        payload      {"AuthParameters" {"USERNAME"    username',
                                        "PASSWORD"    password,
                                        "SECRET_HASH" secret-hash}
                      "AuthFlow"       "USER_PASSWORD_AUTH",
                      "ClientId"       client-id}
        headers      {"X-Amz-Target" "AWSCognitoIdentityProviderService.InitiateAuth",
                      "Content-Type" "application/x-amz-json-1.1"}]
    (go
      (let [resp (<! (http/post config/COGNITO-IDP {:headers headers
                                                    :body    (js/JSON.stringify (clj->js payload))}))]
        (assert (= 200 (:status resp)))
        (let [body          (js->clj (js/JSON.parse (:body resp)))
              access-token  (get-in body ["AuthenticationResult" "AccessToken"])
              id-token      (get-in body ["AuthenticationResult" "IdToken"])
              refresh-token (get-in body ["AuthenticationResult" "RefreshToken"])]
          (set-tokens! id-token access-token refresh-token)
          (state/pub-event! [:user/fetch-info-and-graphs])
          {:id-token id-token :access-token access-token :refresh-token refresh-token})))))

(defn logout []
  (clear-tokens)
  (state/clear-user-info!)
  (state/pub-event! [:user/logout])
  (reset! flows/*current-login-user :logout))

(defn upgrade []
  (let [base-upgrade-url "https://logseqdemo.lemonsqueezy.com/checkout/buy/13e194b5-c927-41a8-af58-ed1a36d6000d"
        user-uuid' (user-uuid)
        url (cond-> base-upgrade-url
              user-uuid' (str "?checkout[custom][user_uuid]=" (name user-uuid')))]
    (println " ~~~ LEMON: " url " ~~~ ")
    (js/window.open url)))
  ; (js/window.open
  ;   "https://logseqdemo.lemonsqueezy.com/checkout/buy/13e194b5-c927-41a8-af58-ed1a36d6000d"))

(defn <ensure-id&access-token
  []
  (let [id-token (state/get-auth-id-token)]
    (go
      (when (or (nil? id-token)
                (-> id-token parse-jwt almost-expired-or-expired?))
        (debug/pprint (str "refresh tokens... " (tc/to-string (t/now))))
        (<! (<refresh-id-token&access-token))
        (when (or (nil? (state/get-auth-id-token))
                  (-> (state/get-auth-id-token) parse-jwt expired?))
          (ex-info "empty or expired token and refresh failed" {:anom :expired-token}))))))

(def task--ensure-id&access-token
  (m/sp
    (let [id-token (state/get-auth-id-token)]
      (when (or (nil? id-token)
                (-> id-token parse-jwt almost-expired-or-expired?))
        (prn (str "refresh tokens... " (tc/to-string (t/now))))
        (c.m/<? (<refresh-id-token&access-token))
        (when (or (nil? (state/get-auth-id-token))
                  (-> (state/get-auth-id-token) parse-jwt expired?))
          (throw (ex-info "empty or expired token and refresh failed" {:type :expired-token})))))))

;;; user groups

(defn rtc-group?
  []
  (boolean (seq (set/intersection (state/user-groups) #{"team" "rtc_2025_07_10"}))))

(defn alpha-user?
  []
  (or config/dev?
      (contains? (state/user-groups) "alpha-tester")))

(defn beta-user?
  []
  (or config/dev?
      (contains? (state/user-groups) "beta-tester")))

(defn alpha-or-beta-user?
  []
  (or (alpha-user?) (beta-user?)))

(defn get-user-type
  [repo]
  (-> (some #(when (= repo (:url %)) %) (:rtc/graphs @state/state))
      :graph<->user-user-type))

(defn manager?
  [repo]
  (= (get-user-type repo) "manager"))

;; TODO: Remove if still unused
#_(defn member?
    [repo]
    (= (get-user-type repo) "member"))

(defn new-task--upload-user-avatar
  [avatar-str]
  (m/sp
    (when-let [token (state/get-auth-id-token)]
      (let [{:keys [status body] :as resp}
            (c.m/<?
             (http/post
              (str "https://" config/API-DOMAIN "/logseq/get_presigned_user_avatar_put_url")
              {:oauth-token token
               :with-credentials? false}))]
        (when-not (http/unexceptional-status? status)
          (throw (ex-info "failed to get presigned url" {:resp resp})))
        (let [presigned-url (:presigned-url body)
              {:keys [status]} (c.m/<? (http/put presigned-url {:body avatar-str :with-credentials? false}))]
          (when-not (http/unexceptional-status? status)
            (throw (ex-info "failed to upload avatar" {:resp resp}))))))))

(defn- guard-ex
  [x]
  (when (instance? ExceptionInfo x) x))

(defn- get-json-body [body]
  (or (and (not (string? body)) body)
      (when (string/blank? body) nil)
      (try (js->clj (js/JSON.parse body) :keywordize-keys true)
           (catch :default e
             (prn :invalid-json body)
             e))))

(defn- get-resp-json-body [resp]
  (-> resp (:body) (get-json-body)))

(defn- <request-once [api-name body token]
  (go
    (let [resp (http/post (str "https://" config/API-DOMAIN "/file-sync/" api-name)
                          {:oauth-token token
                           :body (js/JSON.stringify (clj->js body))
                           :with-credentials? false})]
      {:resp (<! resp)
       :api-name api-name
       :body body})))

(defn- <request*
  "max retry count is 5.
  *stop: volatile var, stop retry-request when it's true,
          and return :stop"
  ([api-name body token] (<request* api-name body token 0))
  ([api-name body token retry-count]
   (go
     (let [resp (<! (<request-once api-name body token))]
       (if (and
            (= 401 (get-in resp [:resp :status]))
            (= "Unauthorized" (:message (get-json-body (get-in resp [:resp :body])))))
         (if (> retry-count 5)
           (throw (js/Error. :file-sync-request))
           (do (println "will retry after" (min 60000 (* 1000 retry-count)) "ms")
               (<! (timeout (min 60000 (* 1000 retry-count))))
               (<! (<request* api-name body token (inc retry-count)))))
         (:resp resp))))))

(defn <request [api-name & args]
  (apply <request* api-name args))

(defn storage-exceed-limit?
  [exp]
  (some->> (ex-data exp)
           :err
           ((juxt :status (comp :message :body)))
           ((fn [[status msg]] (and (= 403 status) (= msg "storage-limit"))))))

(defn graph-count-exceed-limit?
  [exp]
  (some->> (ex-data exp)
           :err
           ((juxt :status (comp :message :body)))
           ((fn [[status msg]] (and (= 403 status) (= msg "graph-count-exceed-limit"))))))

(defn- fire-file-sync-storage-exceed-limit-event!
  [exp]
  (when (storage-exceed-limit? exp)
    (state/pub-event! [:rtc/storage-exceed-limit])
    true))

(defn- fire-file-sync-graph-count-exceed-limit-event!
  [exp]
  (when (graph-count-exceed-limit? exp)
    (state/pub-event! [:rtc/graph-count-exceed-limit])
    true))

(defprotocol IToken
  (<get-token [this]))

(deftype RemoteAPI [*stopped?]
  Object

  (<request [this api-name body]
    (go
      (let [token-or-exp (<! (<get-token this))]
        (or (guard-ex token-or-exp)
            (let [resp (<! (<request api-name body token-or-exp *stopped?))]
              (if (http/unexceptional-status? (:status resp))
                (get-resp-json-body resp)
                (let [exp (ex-info "request failed"
                                   {:err          resp
                                    :body         (:body resp)
                                    :api-name     api-name
                                    :request-body body})]
                  (fire-file-sync-storage-exceed-limit-event! exp)
                  (fire-file-sync-graph-count-exceed-limit-event! exp)
                  exp)))))))

  IToken
  (<get-token [_this]
    (frontend.handler.user/<wrap-ensure-id&access-token
     (state/get-auth-id-token))))

(defprotocol IRemoteAPI
  (<user-info [this] "user info"))

(extend-type RemoteAPI
  IRemoteAPI
  (<user-info [this]
    (frontend.handler.user/<wrap-ensure-id&access-token
     (<! (.<request this "user_info" {})))))

(def remoteapi (->RemoteAPI nil))

(comment
  ;; We probably need this for some new features later
  (defonce feature-matrix {:file-sync :beta})

  (defn feature-available?
    [feature]
    (or config/dev?
        (when (logged-in?)
          (case (feature feature-matrix)
            :beta (alpha-or-beta-user?)
            :alpha (alpha-user?)
            false)))))
