(ns frontend.handler.user
  (:require [frontend.config :as config]
            [frontend.handler.config :as config-handler]
            [frontend.state :as state]
            [frontend.debug :as debug]
            [clojure.string :as string]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [cljs-http.client :as http]
            [lambdaisland.glogi :as log]
            [cljs.core.async :as async :refer [go go-loop <! timeout]]))

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

(defn email []
  (some->
   (state/get-auth-id-token)
   parse-jwt
   :email))

(defn user-uuid []
  (some->
   (state/get-auth-id-token)
   parse-jwt
   :sub))

(defn logged-in? []
  (boolean
   (some->
    (state/get-auth-id-token)
    parse-jwt
    expired?
    not)))

(defn- set-token-to-localstorage!
  ([id-token access-token]
   (log/info :debug "set-token-to-localstorage!")
   (js/localStorage.setItem "id-token" id-token)
   (js/localStorage.setItem "access-token" access-token))
  ([id-token access-token refresh-token]
   (log/info :debug "set-token-to-localstorage!")
   (js/localStorage.setItem "id-token" id-token)
   (js/localStorage.setItem "access-token" access-token)
   (js/localStorage.setItem "refresh-token" refresh-token)))

(defn- clear-tokens
  []
  (state/set-auth-id-token nil)
  (state/set-auth-access-token nil)
  (state/set-auth-refresh-token nil)
  (set-token-to-localstorage! "" "" ""))


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
  "refresh id-token and access-token, if refresh_token expired, clear all tokens
   return true if success, else false"
  []
  (go
    (when-let [refresh-token (state/get-auth-refresh-token)]
      (let [resp (<! (http/get (str "https://" config/API-DOMAIN "/auth_refresh_token?refresh_token=" refresh-token)
                               {:with-credentials? false}))]

        (cond
          ;; e.g. api return 500, server internal error
          ;; we shouldn't clear tokens if they aren't expired yet
          ;; the `refresh-tokens-loop` will retry soon
          (and (not (http/unexceptional-status? (:status resp)))
               (not (-> (state/get-auth-id-token) parse-jwt expired?)))
          nil                           ; do nothing

          (not (http/unexceptional-status? (:status resp)))
          (clear-tokens)

          :else                         ; ok
          (set-tokens! (:id_token (:body resp)) (:access_token (:body resp))))))))

(defn restore-tokens-from-localstorage
  "restore id-token, access-token, refresh-token from localstorage,
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



;;; refresh tokens loop
(def stop-refresh false)
(defn refresh-tokens-loop []
  (debug/pprint "start refresh-tokens-loop")
  (go-loop []
    (<! (timeout 60000))
    (when (state/get-auth-refresh-token)
      (let [id-token (state/get-auth-id-token)]
        (when (or (nil? id-token)
                  (-> id-token (parse-jwt) (almost-expired?)))
          (debug/pprint (str "refresh tokens... " (tc/to-string(t/now))))
          (<! (<refresh-id-token&access-token)))))
    (when-not stop-refresh
      (recur))))

(defn alpha-user?
  []
  (or config/dev?
      (contains? (state/user-groups) "alpha-tester")))

(comment
  (defn beta-user?
   []
   (contains? (state/user-groups) "beta-tester")))
