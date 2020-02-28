(ns backend.interceptors
  (:require [io.pedestal.interceptor :refer [interceptor]]
            [backend.cookie :as cookie]
            [backend.jwt :as jwt]
            [backend.db.user :as u]
            [backend.util :as util]))

(def cookie-interceptor
  {:name ::cookie-authenticate
   :enter
   (fn [{:keys [request] :as context}]
     (let [tokens (cookie/get-token request)]
       (if tokens
         (let [{:keys [access-token refresh-token]} tokens]
           (if access-token
             (try
               (let [user (jwt/unsign access-token)
                     uid (some-> (:id user) util/->uuid)
                     user (u/get uid)]
                 (if (:id user)
                   (-> context
                       (assoc-in [:request :app-context :uid] uid)
                       (assoc-in [:request :app-context :user] user))
                   context))
               (catch Exception e
                 nil))
             ;; TODO: wrong cookie, early halt
             ))
         context)))})
