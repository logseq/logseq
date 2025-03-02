(ns electron.gauth
  (:require
    ["@openid/appauth/built/authorization_request" :refer [AuthorizationRequest]]
    ["@openid/appauth/built/authorization_request_handler" :refer [AuthorizationNotifier]]
    ["@openid/appauth/built/authorization_service_configuration" :refer [AuthorizationServiceConfiguration]]
    ["@openid/appauth/built/node_support/" :refer [NodeCrypto]]
    ["@openid/appauth/built/node_support/node_request_handler" :refer [NodeBasedHandler]]
    ["@openid/appauth/built/node_support/node_requestor" :refer [NodeRequestor]]
    ["@openid/appauth/built/token_request" :refer [GRANT_TYPE_AUTHORIZATION_CODE GRANT_TYPE_REFRESH_TOKEN TokenRequest]]
    ["@openid/appauth/built/token_request_handler" :refer [BaseTokenRequestHandler]]
    ["events" :as events]))

(def requestor (NodeRequestor.))

(def openIdConnectUrl "https://accounts.google.com")

(def redirectUri "http://127.0.0.1:8000")

(def auth-state-emitter (events/EventEmitter.))

(defn fetch-service-configuration
  []
  (.fetchFromIssuer AuthorizationServiceConfiguration
                    openIdConnectUrl
                    requestor))

(defn make-authorization-request
  [clientId scope configuration ^js authorization-handler]
  (if (nil? configuration)
    (js/console.log "Unknown service configuration")
    (let [extras (clj->js {:prompt "consent", :access_type "offline"})
          ;_ (when username (aset extras "login_hint" username))
          request (AuthorizationRequest. (clj->js {:client_id clientId,
                                                   :redirect_uri redirectUri,
                                                   :scope scope,
                                                   :response_type
                                                     (.-RESPONSE_TYPE_CODE
                                                       AuthorizationRequest),
                                                   :state nil,
                                                   :extras extras})
                                         (NodeCrypto.))]
      ;(.then (.toJson request) (fn [json] (js/console.log "Authorization request" json)))
      (.performAuthorizationRequest authorization-handler
                                    configuration
                                    request))))

(defn make-refresh-token-request
  [clientId clientSecret configuration code code-verifier]
  (if (nil? configuration)
    (do (js/console.log "Unknown service configuration") (js/Promise.resolve))
    (let [extras (clj->js (when code-verifier {:code_verifier code-verifier}))
          request (TokenRequest. (clj->js {:client_id clientId,
                                           :client_secret clientSecret,
                                           :redirect_uri redirectUri,
                                           :grant_type
                                             GRANT_TYPE_AUTHORIZATION_CODE,
                                           :code code,
                                           :refresh_token nil,
                                           :extras extras}))]
      ;(js/console.log "Getting refresh token" code code-verifier)
      ;(js/console.log "Getting refresh token" configuration)
      ;(js/console.log "Getting refresh token" (.toStringMap request))
      (.then (.performTokenRequest (BaseTokenRequestHandler. requestor)
                                   configuration
                                   request)
             (fn [response]
               ;(js/console.log (str "Refresh Token is " (.-refreshToken ^js response)))
               response)))))

(defn perform-with-fresh-tokens
  [clientId clientSecret configuration refresh-token access-token-response]
  (if (nil? configuration)
    (do (js/console.log "Unknown service configuration")
        (js/Promise.reject "Unknown service configuration"))
    (if (nil? refresh-token)
      (do (js/console.log "Missing refreshToken.")
          (js/Promise.resolve "Missing refreshToken."))
      (if (and access-token-response (.isValid ^js access-token-response))
        (let [access-token (.-accessToken ^js access-token-response)]
          ;(js/console.log (str "Access Token is " access-token))
          access-token)
        (let [request (TokenRequest. (clj->js {:client_id clientId,
                                               :client_secret clientSecret,
                                               :redirect_uri redirectUri,
                                               :grant_type
                                                 GRANT_TYPE_REFRESH_TOKEN,
                                               :code nil,
                                               :refresh_token refresh-token,
                                               :extras nil}))]
          (.then (.performTokenRequest (BaseTokenRequestHandler. requestor)
                                       configuration
                                       request)
                 (fn [response]
                   (let [access-token (.-accessToken ^js response)]
                     ;(js/console.log (str "Access Token is " access-token))
                     access-token))))))))

(defn init
  [clientId clientSecret scope]
  (.then
    (fetch-service-configuration)
    (fn [configuration]
      ;(js/console.log "Fetched service configuration" configuration)
      (let [notifier (AuthorizationNotifier.)
            authorization-handler (NodeBasedHandler.)]
        (.setAuthorizationListener notifier
          (fn [request response error]
            ;(js/console.log "Authorization request complete" request response error)
            (when response
              (let [code-verifier (.-code_verifier (.-internal ^js request))
                    code (.-code ^js response)]
                (.then (make-refresh-token-request
                         clientId
                         clientSecret
                         configuration
                         code
                         code-verifier)
                       (fn [access-token-response]
                         (let [refresh-token (.-refreshToken
                                               ^js access-token-response)]
                           (let [access-token (perform-with-fresh-tokens
                                                clientId
                                                clientSecret
                                                configuration
                                                refresh-token
                                                access-token-response)]
                             (.emit auth-state-emitter "on_token_response")
                             ;(js/console.log "Access Token and Refresh Token are" access-token refresh-token)
                             (js/console.log "All Done.")))))))))
        (.setAuthorizationNotifier authorization-handler notifier)
        (make-authorization-request
          clientId
          scope
          configuration
          authorization-handler)))))
