(ns frontend.handler.user
  (:require [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.config :as config-handler]
            [frontend.handler.notification :as notification]
            [frontend.idb :as idb]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p])
  (:import [goog.format EmailAddress]))

(defn email? [v]
  (and v
       (.isValid (EmailAddress. v))))

(defn set-email!
  [email]
  (when (email? email)
    (util/post (str config/api "email")
               {:email email}
               (fn [result]
                 (db/transact! [{:me/email email}])
                 (swap! state/state assoc-in [:me :email] email))
               (fn [error]
                 (notification/show! "Email already exists!"
                                     :error)))))

(defn set-cors!
  [cors-proxy]
  (util/post (str config/api "cors_proxy")
             {:cors-proxy cors-proxy}
             (fn [result]
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
    (when (:name (:me @state/state))
      (when (state/logged?)
        (util/post (str config/api "set_preferred_format")
                   {:preferred_format (name format)}
                   (fn [_result]
                     (notification/show! "Format set successfully!" :success))
                   (fn [_e]))))))

(defn set-preferred-workflow!
  [workflow]
  (when workflow
    (config-handler/set-config! :preferred-workflow workflow)
    (state/set-preferred-workflow! workflow)
    (when (:name (:me @state/state))
      (util/post (str config/api "set_preferred_workflow")
                 {:preferred_workflow (name workflow)}
                 (fn [_result]
                   (notification/show! "Workflow set successfully!" :success))
                 (fn [_e])))))

(defn sign-out!
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
