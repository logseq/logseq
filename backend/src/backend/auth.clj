(ns backend.auth
  (:require [taoensso.timbre :as timbre]
            [clj-social.core :as social]
            [backend.config :as config]
            [backend.util :as util]
            [backend.db.user :as u]
            [backend.db.token :as token]
            [backend.cookie :as cookie]
            [clojure.java.jdbc :as j]))

(defn github [data]
  (let [{:keys [app-key app-secret redirect-uri]} (get-in config/config [:oauth :github])
        instance (social/make-social :github app-key app-secret redirect-uri
                                     :state (str (util/uuid))
                                     :scope "user:email,repo")
        access-token (social/getAccessToken instance (:code data))
        info (social/getUserInfo instance access-token)
        oauth-type "github"
        oauth-id (str (:id info))
        access-token (.getAccessToken access-token)]
    (toucan.db/transaction
      (if-let [token (token/get oauth-type oauth-id)]
        ;; user already exists
        (do
          (token/update (:id token) access-token)
          (let [token (assoc token :token access-token)]
           (some-> (u/get (:user_id token))
                   (assoc :token token))))
        (when-let [user (u/insert {:name (:login info)
                                   :email (:email info)})]
          (let [token (token/create {:user_id (:id user)
                                     :oauth_type oauth-type
                                     :oauth_id oauth-id
                                     :oauth_token access-token})]
            (assoc user :token token)))))))
