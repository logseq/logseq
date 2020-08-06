(ns frontend.handler.user
  (:require [frontend.util :as util :refer-macros [profile]]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.config :as config]
            [frontend.storage :as storage]
            [promesa.core :as p]
            [goog.object :as gobj]
            [frontend.handler.repo :as repo-handler]
            [frontend.encrypt :as encrypt]
            [frontend.handler.notification :as notification])
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
    (state/set-preferred-format! format)
    (when (:name (:me @state/state))
      (util/post (str config/api "set_preferred_format")
                 {:preferred_format (name format)}
                 (fn [_result]
                   (notification/show! "Format set successfully!" :success))
                 (fn [_e])))))

(defn set-github-token!
  ([token]
   (set-github-token! token true))
  ([token update-server-object-key?]
   (state/set-github-token! token)
   (let [object-key (get-in @state/state [:me :encrypt_object_key])]
     (p/let [key (if object-key
                   (encrypt/get-key-from-object-key object-key)
                   (encrypt/generate-key))
             encrypted (encrypt/encrypt key token)
             object-key (or object-key
                            (encrypt/base64-key key))]
       (state/set-encrypt-token! encrypted)
       (when update-server-object-key?
         (util/post (str config/api "encrypt_object_key")
                    {:object-key object-key}
                    (fn []
                      (let [me (:me @state/state)]
                        (when (:repos me)
                          (repo-handler/clone-and-pull-repos me))))
                    (fn [_e])))))))

(defn- clear-store!
  []
  (p/let [_ (.clear db/localforage-instance)
          dbs (js/window.indexedDB.databases)]
    (doseq [db dbs]
      (js/window.indexedDB.deleteDatabase (gobj/get db "name")))))

(defn sign-out!
  [e]
  (->
   (do
     ;; remember to not to remove the encrypted token
     (storage/set :git/current-repo config/local-repo)
     (storage/remove :git/clone-repo)
     (storage/remove "git-changed-files")
     (clear-store!))
   (p/catch (fn [e]
              (println "sign out error: ")
              (js/console.dir e)))
   (p/finally (fn []
                (set! (.-href js/window.location) "/logout")))))
