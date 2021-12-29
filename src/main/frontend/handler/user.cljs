(ns frontend.handler.user
  (:require [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.config :as config-handler]
            [frontend.handler.notification :as notification]
            [frontend.idb :as idb]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.debug :as debug]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [clojure.string :as string]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [cljs-http.client :as http]
            [cljs.core.async :as async :refer [go go-loop <! >! chan timeout]])
  (:import [goog.format EmailAddress]))

(defn- email? [v]
  (and v
       (.isValid (EmailAddress. v))))

(defn set-email!
  [email]
  (when (email? email)
    (util/post (str config/api "email")
               {:email email}
               (fn [_result]
                 (db/transact! [{:me/email email}])
                 (swap! state/state assoc-in [:me :email] email))
               (fn [_error]
                 (notification/show! "Email already exists!"
                                     :error)))))

(defn set-cors!
  [cors-proxy]
  (util/post (str config/api "cors_proxy")
             {:cors-proxy cors-proxy}
             (fn [_result]
               (db/transact! [{:me/cors_proxy cors-proxy}])
               (swap! state/state assoc-in [:me :cors_proxy] cors-proxy))
             (fn [error]
               (notification/show! "Set cors proxy failed." :error)
               (js/console.dir error))))

(defn set-preferred-format!
  [format]
  (when format
    (config-handler/set-config! :preferred-format format)
    (state/set-preferred-format! format)
    ;; (when (:name (:me @state/state))
    ;;   (when (state/logged?)
    ;;     (util/post (str config/api "set_preferred_format")
    ;;                {:preferred_format (name format)}
    ;;                (fn [_result]
    ;;                  (notification/show! "Format set successfully!" :success))
    ;;                (fn [_e]))))
    ))

(defn set-preferred-workflow!
  [workflow]
  (when workflow
    (config-handler/set-config! :preferred-workflow workflow)
    (state/set-preferred-workflow! workflow)
    ;; (when (:name (:me @state/state))
    ;;   (util/post (str config/api "set_preferred_workflow")
    ;;              {:preferred_workflow (name workflow)}
    ;;              (fn [_result]
    ;;                (notification/show! "Workflow set successfully!" :success))
    ;;              (fn [_e])))
    ))

(defn sign-out!
  {:deprecated "-"}
  ([]
   (sign-out! true))
  ([confirm?]
   (when (or (not confirm?)
             (js/confirm "Your local notes will be completely removed after signing out. Continue?"))
     (->
      (idb/clear-local-storage-and-idb!)
      (p/catch (fn [e]
                 (println "sign out error: ")
                 (js/console.dir e)))
      (p/finally (fn []
                   (set! (.-href js/window.location) "/logout")))))))

(defn delete-account!
  []
  (p/let [_ (idb/clear-local-storage-and-idb!)]
    (util/delete (str config/api "account")
                 (fn []
                   (sign-out! false))
                 (fn [error]
                   (log/error :user/delete-account-failed error)))))



;;; userinfo, token, login/logout, ...

(def *token-updated
  "used to notify other parts that tokens updated"
  (atom false))

(defn- parse-jwt [jwt]
  (some-> jwt
          (string/split ".")
          (second)
          (js/atob)
          (js/JSON.parse)
          (js->clj :keywordize-keys true)))

(defn- expired? [parsed-jwt]
  (some->
   (* 1000 (:exp parsed-jwt))
   (tc/from-long)
   (t/before? (t/now))))

(defn- almost-expired? [parsed-jwt]
  "return true when jwt will expire after 1h"
  (some->
   (* 1000 (:exp parsed-jwt))
   (tc/from-long)
   (t/before? (-> 1 t/hours t/from-now))))

(defn email []
  (some->
   (state/get-auth-id-token)
   (parse-jwt)
   (:email)))

(defn logged? []
  (boolean
   (some->
    (state/get-auth-id-token)
    (parse-jwt)
    (expired?)
    (not))))

(defn- clear-tokens []
  (state/set-auth-id-token nil)
  (state/set-auth-access-token nil)
  (state/set-auth-refresh-token nil)
  (swap! *token-updated not))

(defn- set-tokens!
  ([id-token access-token]
   (state/set-auth-id-token id-token)
   (state/set-auth-access-token access-token)
   (swap! *token-updated not))
  ([id-token access-token refresh-token]
   (state/set-auth-id-token id-token)
   (state/set-auth-access-token access-token)
   (state/set-auth-refresh-token refresh-token)
   (swap! *token-updated not)))

(defn login-callback [code]
  (go
    (let [resp (<! (http/get (str "https://api.logseq.com/auth_callback?code=" code)))]
      (if (= 200 (:status resp))
        (-> resp
            (:body)
            (js/JSON.parse)
            (js->clj :keywordize-keys true)
            (as-> $ (set-tokens! (:id_token $) (:access_token $) (:refresh_token $))))
        (debug/pprint "login-callback" resp)))))

(defn refresh-id-token&access-token []
  "refresh id-token and access-token, if refresh_token expired, clear all tokens
   return true if success, else false"
  (when-let [refresh-token (state/get-auth-refresh-token)]
    (go
      (let [resp (<! (http/get (str "https://api.logseq.com/auth_refresh_token?refresh_token=" refresh-token)))]
        (if (= 400 (:status resp))
          ;; invalid refresh_token
          (do
            (clear-tokens)
            false)
          (do
            (->
             resp
             (as-> $ (and (http/unexceptional-status? (:status $)) $))
             (:body)
             (js/JSON.parse)
             (js->clj :keywordize-keys true)
             (as-> $ (set-tokens! (:id_token $) (:access_token $))))
            true))))))

;;; refresh tokens loop
(def stop-refresh false)
(defn refresh-tokens-loop []
  (debug/pprint "start refresh-tokens-loop")
  (go-loop []
    (<! (timeout 60000))
    (when-some [refresh-token (state/get-auth-refresh-token)]
      (let [id-token (state/get-auth-id-token)]
        (when (or (nil? id-token)
                  (-> id-token (parse-jwt) (almost-expired?)))
          (debug/pprint (str "refresh tokens... " (tc/to-string(t/now))))
          (refresh-id-token&access-token))))
    (when-not stop-refresh
      (recur))))
