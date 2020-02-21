(ns backend.routes
  (:require [reitit.swagger :as swagger]
            [clj-social.core :as social]
            [backend.config :as config]
            [backend.util :as util]
            [backend.auth :as auth]
            [backend.db.user :as u]
            [ring.util.response :as resp]))

(def routes
  [["/swagger.json"
    {:get {:no-doc true
           :swagger {:info {:title "gitnotes api"
                            :description "with pedestal & reitit-http"}}
           :handler (swagger/create-swagger-handler)}}]

   ["/login"
    {:swagger {:tags ["Login"]}}

    ["/github"
     {:get {:summary "Login with github"
            :handler
            (fn [req]
              (let [{:keys [app-key app-secret redirect-uri]} (get-in config/config [:oauth :github])
                    social (social/make-social :github app-key app-secret
                                               (str redirect-uri
                                                    "?referer="
                                                    (get-in req [:headers "referer"] ""))
                                               :state (str (util/uuid))
                                               :scope "user:email")
                    url (social/getAuthorizationUrl social)]
                (prn "url: " url)
                (resp/redirect url))
              )}}]]
   ["/auth"
    {:swagger {:tags ["Authenticate"]}}

    ["/github"
     {:get {:summary "Authenticate with github"
            :handler
            (fn [{:keys [params] :as req}]
              (if (and (:code params)
                       (:state params))
                (if-let [user (auth/github params)]
                  (resp/header
                    (assoc :cookies
                           (u/generate-tokens user)
                           :status 302)
                    "Location" config/website-uri)
                  {:status 500
                   :body "Internal Error"})
                {:status 401
                 :body "Invalid request"}))}}]]
   ])
