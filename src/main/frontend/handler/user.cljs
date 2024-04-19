(ns frontend.handler.user
  "Provides user related handler fns like login and logout"
  (:require-macros [frontend.handler.user])
  (:require [frontend.config :as config]
            [frontend.handler.config :as config-handler]
            [frontend.state :as state]
            [frontend.debug :as debug]
            [clojure.string :as string]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [cljs-http.client :as http]
            [cljs.core.async :as async :refer [go <!]]
            [goog.crypt.Sha256]
            [goog.crypt.Hmac]
            [goog.crypt :as crypt]
            [frontend.handler.notification :as notification]))

(defn set-preferred-format!
  [format]
  (when format
    (config-handler/set-config! :preferred-format format)
    (state/set-preferred-format! format)))

(defn set-preferred-workflow!
  [workflow]
  (when workflow
    (config-handler/set-config! :preferred-workflow workflow)
    (state/set-preferred-workflow! workflow)))

;;; userinfo, token, login/logout, ...

(defn- decode-username
  [username]
  (let [arr (new js/Uint8Array (count username))]
    (doseq [i (range (count username))]
      (aset arr i (.charCodeAt username i)))
    (.decode (new js/TextDecoder "utf-8") arr)))

(defn- parse-jwt [jwt]
  (some-> jwt
          (string/split ".")
          second
          (#(.decodeString ^js crypt/base64 % true))
          js/JSON.parse
          (js->clj :keywordize-keys true)
          (update :cognito:username decode-username)))

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
  (some? (state/get-auth-refresh-token)))

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
   (set-token-to-localstorage! id-token access-token))
  ([id-token access-token refresh-token]
   (state/set-auth-id-token id-token)
   (state/set-auth-access-token access-token)
   (state/set-auth-refresh-token refresh-token)
   (set-token-to-localstorage! id-token access-token refresh-token)))

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
  (let [refresh-token (js/localStorage.getItem "refresh-token")]
    (when refresh-token
      (go
        (<! (<refresh-id-token&access-token))
        ;; refresh remote graph list by pub login event
        (when (user-uuid) (state/pub-event! [:user/fetch-info-and-graphs]))))))

(defn has-refresh-token?
  "Has refresh-token"
  []
  (boolean (js/localStorage.getItem "refresh-token")))

(defn login-callback
  [session]
  (set-tokens!
   (:jwtToken (:idToken session))
   (:jwtToken (:accessToken session))
   (:token (:refreshToken session)))
  (state/pub-event! [:user/fetch-info-and-graphs]))

(defn ^:export login-with-username-password-e2e
  [username password client-id client-secret]
  (let [text-encoder (new js/TextEncoder)
        key          (.encode text-encoder client-secret)
        hasher       (new crypt/Sha256)
        hmacer       (new crypt/Hmac hasher key)
        secret-hash  (.encodeByteArray ^js crypt/base64 (.getHmac hmacer (str username client-id)))
        payload      {"AuthParameters" {"USERNAME"    username,
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
  (state/pub-event! [:user/logout]))

(defn upgrade []
  (let [base-upgrade-url "https://logseqdemo.lemonsqueezy.com/checkout/buy/13e194b5-c927-41a8-af58-ed1a36d6000d"
        user-uuid (user-uuid)
        url (cond-> base-upgrade-url
              user-uuid (str "?checkout[custom][user_uuid]=" (name user-uuid)))]
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

(defn <user-uuid
  []
  (go
    (if-some [exp (<! (<ensure-id&access-token))]
      exp
      (user-uuid))))

;;; user groups

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
