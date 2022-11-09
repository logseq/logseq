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
            [cljs.core.async :as async :refer [go <!]]))

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

(defn- parse-jwt [jwt]
  (some-> jwt
          (string/split ".")
          second
          js/atob
          js/JSON.parse
          (js->clj :keywordize-keys true)))

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

(defn- user-uuid []
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

(defn- clear-tokens
  ([]
   (state/set-auth-id-token nil)
   (state/set-auth-access-token nil)
   (state/set-auth-refresh-token nil)
   (set-token-to-localstorage! "" "" ""))
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


(defn <refresh-id-token&access-token
  "Refresh id-token and access-token"
  []
  (go
    (when-let [refresh-token (state/get-auth-refresh-token)]
      (let [resp (<! (http/get (str "https://" config/API-DOMAIN "/auth_refresh_token?refresh_token=" refresh-token)
                               {:with-credentials? false}))]
        (cond
          (and (<= 400 (:status resp))
               (> 500 (:status resp)))
          ;; invalid refresh-token
          (clear-tokens)

          ;; e.g. api return 500, server internal error
          ;; we shouldn't clear tokens if they aren't expired yet
          ;; the `refresh-tokens-loop` will retry soon
          (and (not (http/unexceptional-status? (:status resp)))
               (not (-> (state/get-auth-id-token) parse-jwt expired?)))
          nil                           ; do nothing

          (not (http/unexceptional-status? (:status resp)))
          (clear-tokens true)

          :else                         ; ok
        (when (and (:id_token (:body resp)) (:access_token (:body resp)))
          (set-tokens! (:id_token (:body resp)) (:access_token (:body resp)))))))))

(defn restore-tokens-from-localstorage
  "Restore id-token, access-token, refresh-token from localstorage,
  and refresh id-token&access-token if necessary.
  return nil when tokens are not available."
  []
  (println "restore-tokens-from-localstorage")
  (let [id-token (js/localStorage.getItem "id-token")
        access-token (js/localStorage.getItem "access-token")
        refresh-token (js/localStorage.getItem "refresh-token")]
    (when refresh-token
      (set-tokens! id-token access-token refresh-token)
      (when-not (or (nil? id-token) (nil? access-token)
                    (-> id-token parse-jwt almost-expired?)
                    (-> access-token parse-jwt almost-expired?))
        (go
          ;; id-token or access-token expired
          (<! (<refresh-id-token&access-token))
          ;; refresh remote graph list by pub login event
          (when (user-uuid) (state/pub-event! [:user/login])))))))

(defn login-callback [code]
  (state/set-state! [:ui/loading? :login] true)
  (go
    (let [resp (<! (http/get (str "https://" config/API-DOMAIN "/auth_callback?code=" code)
                             {:with-credentials? false}))]
      (if (= 200 (:status resp))
        (-> resp
            :body
            (as-> $ (set-tokens! (:id_token $) (:access_token $) (:refresh_token $)))
            (#(state/pub-event! [:user/login])))
        (debug/pprint "login-callback" resp)))))

(defn logout []
  (clear-tokens)
  (state/pub-event! [:user/logout]))

(defn <ensure-id&access-token
  []
  (go
    (when (or (nil? (state/get-auth-id-token))
              (-> (state/get-auth-id-token) parse-jwt almost-expired-or-expired?))
      (debug/pprint (str "refresh tokens... " (tc/to-string (t/now))))
      (<! (<refresh-id-token&access-token))
      (when (or (nil? (state/get-auth-id-token))
                (-> (state/get-auth-id-token) parse-jwt expired?))
        (ex-info "empty or expired token and refresh failed" {})))))

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
  (contains? (state/user-groups) "beta-tester"))

(defn alpha-or-beta-user?
  []
  (or (alpha-user?) (beta-user?)))
