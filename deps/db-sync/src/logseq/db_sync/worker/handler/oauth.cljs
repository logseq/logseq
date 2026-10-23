(ns logseq.db-sync.worker.handler.oauth
  "Sign in with Logseq.

  Approved apps send the browser to /oauth/authorize. The user signs in with a
  Logseq account, chooses one graph, and the app exchanges the authorization
  code for a graph-scoped access token."
  (:require [clojure.string :as string]
            [logseq.common.authorization :as authorization]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.http :as http]
            [logseq.db-sync.worker.oauth :as oauth]
            [logseq.db-sync.worker.oauth-page :as page]
            [promesa.core :as p]))

(defn route?
  [path]
  (or (= path "/.well-known/oauth-authorization-server")
      (= path "/oauth/authorize")
      (= path "/oauth/login")
      (= path "/oauth/consent")
      (= path "/oauth/token")))

(defn- token-error
  [code description]
  (common/json-response {"error" code
                         "error_description" description}
                        400))

(defn- message
  [request error]
  (let [lang (page/request-lang request)]
    (page/html-response
     (page/message-page {:lang lang
                         :title (page/t lang :document-title)
                         :message (page/t lang error)})
     (page/error-status error))))

(defn- protocol-error
  [request result]
  (if (:redirect? result)
    (page/redirect-response (oauth/authorization-error-redirect result))
    (message request (:error result))))

(defn <cognito-login
  "Exchange a Logseq username and password for verified Cognito ID-token claims.

  The password is sent only to Cognito and is not stored or returned."
  [env username password]
  (let [client-id (aget env "COGNITO_CLIENT_ID")
        endpoint (oauth/cognito-idp-endpoint (aget env "COGNITO_ISSUER"))]
    (if-not (and (string? client-id) (seq client-id) endpoint)
      (p/resolved {:error :not-configured})
      (-> (p/let [response (js/fetch endpoint
                                     #js {:method "POST"
                                          :headers #js {"content-type" "application/x-amz-json-1.1"
                                                        "x-amz-target" "AWSCognitoIdentityProviderService.InitiateAuth"}
                                          :body (js/JSON.stringify
                                                 #js {:AuthFlow "USER_PASSWORD_AUTH"
                                                      :ClientId client-id
                                                      :AuthParameters #js {:USERNAME username
                                                                           :PASSWORD password}})})
                  body (.json response)]
            (cond
              (not (.-ok response))
              {:error :invalid-credentials}

              (string? (some-> body (aget "ChallengeName")))
              {:error :unsupported-challenge}

              :else
              (let [result (aget body "AuthenticationResult")
                    id-token (when result (aget result "IdToken"))]
                (if-not (string? id-token)
                  {:error :invalid-credentials}
                  (p/let [claims (authorization/verify-jwt id-token env)]
                    (if (string? (some-> claims (aget "sub")))
                      {:claims claims}
                      {:error :invalid-credentials}))))))
          (p/catch (fn [_]
                     {:error :unavailable}))))))

(defn- <load-app
  [env client-id]
  (if-not (oauth/valid-client-id? client-id)
    (p/resolved nil)
    (index/<oauth-app-by-id (aget env "DB") client-id)))

(defn- <user-graphs
  [db user-id]
  (p/loop [cursor nil
           graphs []]
    (p/let [result (index/<semantic-graphs-list db user-id {:limit 200 :cursor cursor})
            page (:graphs result)
            combined (into graphs page)]
      (if (and (:next-cursor result) (< (count combined) 1000))
        (p/recur (:next-cursor result) combined)
        combined))))

(defn- <current-session
  [request env]
  (let [session-id (oauth/cookie-value
                    (.get (.-headers request) "cookie")
                    oauth/session-cookie-name)]
    (if-not (string? session-id)
      (p/resolved nil)
      (p/let [session (index/<oauth-session-by-id (aget env "DB") session-id)]
        (when (and session (> (:expires-at session) (common/now-ms)))
          session)))))

(defn- <authorize-get
  [request env url]
  (let [params (oauth/query-params url)]
    (p/let [app (<load-app env (oauth/string-param params "client_id"))
            normalized (oauth/normalize-authorize params app)]
      (if (:error normalized)
        (protocol-error request normalized)
        (p/let [session (<current-session request env)]
          (if-not session
            (page/html-response
             (page/login-page {:lang (page/request-lang request)
                               :app app
                               :request normalized}))
            (p/let [graphs (<user-graphs (aget env "DB") (:user-id session))]
              (page/html-response
               (page/consent-page {:lang (page/request-lang request)
                                   :app app
                                   :request normalized
                                   :graphs graphs
                                   :csrf (:csrf-token session)})
               200
               [(page/form-action-source (:redirect-uri normalized))]))))))))

(defn- <login
  [request env]
  (if-not (oauth/form-content-type? request)
    (message request :invalid-request)
    (p/let [params (oauth/<form-params request)]
      (if (= params oauth/too-large-form)
        (message request :invalid-request)
        (p/let [app (<load-app env (oauth/string-param params "client_id"))
                normalized (oauth/normalize-authorize params app)
                username (when-let [raw (oauth/string-param params "username")]
                           (let [trimmed (string/trim raw)]
                             (when-not (string/blank? trimmed)
                               trimmed)))
                password (oauth/string-param params "password")]
          (cond
            (:error normalized)
            (protocol-error request normalized)

            (or (not (string? username))
                (string/blank? username)
                (not (string? password))
                (string/blank? password))
            (page/html-response
             (page/login-page {:lang (page/request-lang request)
                               :app app
                               :request normalized
                               :error :invalid-credentials})
             401)

            :else
            (p/let [login (<cognito-login env username password)]
              (if-let [claims (:claims login)]
                (let [now (common/now-ms)
                      session {:id (oauth/random-hex 32)
                               :user-id (aget claims "sub")
                               :email (aget claims "email")
                               :username (or (aget claims "cognito:username") username)
                               :csrf-token (oauth/random-hex 32)
                               :created-at now
                               :expires-at (+ now oauth/login-session-ttl-ms)}
                      location (oauth/callback-url
                                (str (.-origin (js/URL. (.-url request))) "/oauth/authorize")
                                (select-keys params ["response_type" "client_id" "redirect_uri"
                                                     "scope" "state" "code_challenge"
                                                     "code_challenge_method"]))]
                  (p/let [_ (index/<oauth-session-insert! (aget env "DB") session)]
                    (page/redirect-response
                     location
                     (oauth/session-cookie (:id session)
                                           {:secure? (oauth/request-secure? request)
                                            :max-age (quot oauth/login-session-ttl-ms 1000)}))))
                (if (= :invalid-credentials (:error login))
                  (page/html-response
                   (page/login-page {:lang (page/request-lang request)
                                     :app app
                                     :request normalized
                                     :error :invalid-credentials})
                   401)
                  (message request (:error login)))))))))))

(defn- <consent
  [request env]
  (if-not (oauth/form-content-type? request)
    (message request :invalid-request)
    (p/let [params (oauth/<form-params request)
            session (<current-session request env)]
      (cond
        (= params oauth/too-large-form)
        (message request :invalid-request)

        (nil? session)
        (message request :sign-in-required)

        (not= (:csrf-token session) (oauth/string-param params "csrf"))
        (message request :csrf)

        :else
        (p/let [app (<load-app env (oauth/string-param params "client_id"))
                normalized (oauth/normalize-authorize params app)
                decision (oauth/string-param params "decision")]
          (cond
            (:error normalized)
            (protocol-error request normalized)

            (= decision "deny")
            (page/redirect-response (oauth/access-denied-redirect normalized))

            (not= decision "approve")
            (protocol-error request (assoc normalized
                                           :error :invalid-request
                                           :redirect? true))

            :else
            (p/let [graph-id (oauth/string-param params "graph_id")
                    graph (when (string? graph-id)
                            (index/<semantic-graph-get
                             (aget env "DB") (:user-id session) graph-id))]
              (if-not graph
                (message request :graph-forbidden)
                (let [now (common/now-ms)
                      code (oauth/generate-authorization-code)]
                  (p/let [code-hash (auth/<sha-256-hex code)
                          _ (index/<oauth-code-insert!
                             (aget env "DB")
                             {:code-hash code-hash
                              :app-id (:id app)
                              :user-id (:user-id session)
                              :graph-id graph-id
                              :redirect-uri (:redirect-uri normalized)
                              :scope (:scope normalized)
                              :code-challenge (:code-challenge normalized)
                              :expires-at (+ now oauth/auth-code-ttl-ms)
                              :created-at now})]
                    (page/redirect-response (oauth/success-redirect normalized code))))))))))))

(defn- <issue-tokens
  [env {:keys [app-id user-id graph-id scope]}]
  (let [now (common/now-ms)
        access-token (oauth/generate-access-token)
        refresh-token (oauth/generate-refresh-token)
        access-expires (+ now oauth/access-token-ttl-ms)
        refresh-expires (+ now oauth/refresh-token-ttl-ms)]
    (p/let [access-hash (auth/<sha-256-hex access-token)
            refresh-hash (auth/<sha-256-hex refresh-token)
            _ (index/<oauth-access-token-insert!
               (aget env "DB")
               {:id (str (random-uuid))
                :token-hash access-hash
                :token-prefix (oauth/token-prefix access-token)
                :app-id app-id
                :user-id user-id
                :graph-id graph-id
                :scope scope
                :expires-at access-expires
                :created-at now})
            _ (index/<oauth-refresh-token-insert!
               (aget env "DB")
               {:token-hash refresh-hash
                :app-id app-id
                :user-id user-id
                :graph-id graph-id
                :scope scope
                :expires-at refresh-expires
                :created-at now})]
      (common/json-response
       (oauth/token-success {:access-token access-token
                             :refresh-token refresh-token
                             :expires-in (js/Math.floor (/ (- access-expires now) 1000))
                             :scope scope
                             :graph-id graph-id})))))

(defn- <exchange-code
  [env params]
  (let [code (oauth/string-param params "code")
        client-id (oauth/string-param params "client_id")
        redirect-uri (oauth/string-param params "redirect_uri")
        verifier (oauth/string-param params "code_verifier")]
    (if-not (and (oauth/valid-client-id? client-id)
                 (string? code)
                 (oauth/valid-redirect-uri? redirect-uri)
                 (oauth/valid-code-verifier? verifier))
      (token-error "invalid_request" "The token request is invalid.")
      (p/let [code-hash (auth/<sha-256-hex code)
              row (index/<oauth-code-by-hash (aget env "DB") code-hash)
              deleted (if row
                        (index/<oauth-code-delete! (aget env "DB") code-hash)
                        (p/resolved 0))
              app (when (and row (= 1 deleted))
                    (index/<oauth-app-by-id (aget env "DB") (:app-id row)))
              challenge (when (oauth/valid-code-verifier? verifier)
                          (oauth/<code-challenge verifier))
              now (common/now-ms)]
        (if (and row
                 (= 1 deleted)
                 app
                 (= "approved" (:status app))
                 (= client-id (:app-id row))
                 (= client-id (:id app))
                 (= redirect-uri (:redirect-uri row))
                 (some #(= redirect-uri %) (:redirect-uris app))
                 (> (:expires-at row) now)
                 (= challenge (:code-challenge row)))
          (<issue-tokens env row)
          (token-error "invalid_grant" "The authorization code is invalid."))))))

(defn- <refresh
  [env params]
  (let [refresh-token (oauth/string-param params "refresh_token")
        client-id (oauth/string-param params "client_id")]
    (if-not (and (string? refresh-token)
                 (oauth/valid-client-id? client-id))
      (token-error "invalid_request" "The token request is invalid.")
      (p/let [token-hash (auth/<sha-256-hex refresh-token)
              row (index/<oauth-refresh-token-by-hash (aget env "DB") token-hash)
              now (common/now-ms)
              revoked (when (and row
                                 (nil? (:revoked-at row))
                                 (> (:expires-at row) now)
                                 (= "approved" (:app-status row))
                                 (= client-id (:app-id row)))
                       (index/<oauth-refresh-token-revoke!
                        (aget env "DB") token-hash now))]
        (if (= 1 revoked)
          (<issue-tokens env row)
          (token-error "invalid_grant" "The refresh token is invalid."))))))

(defn- <token
  [request env]
  (if-not (oauth/form-content-type? request)
    (token-error "invalid_request" "The token request is invalid.")
    (p/let [params (oauth/<form-params request)]
      (cond
        (= params oauth/too-large-form)
        (token-error "invalid_request" "The token request is invalid.")

        (= "authorization_code" (oauth/string-param params "grant_type"))
        (<exchange-code env params)

        (= "refresh_token" (oauth/string-param params "grant_type"))
        (<refresh env params)

        :else
        (token-error "unsupported_grant_type" "The grant type is not supported.")))))

(defn handle
  [request env]
  (let [url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (cond
      (= method "OPTIONS")
      (common/options-response)

      (and (= method "GET") (= path "/.well-known/oauth-authorization-server"))
      (common/json-response (oauth/discovery-document (.-origin url)))

      (and (= method "GET") (= path "/oauth/authorize"))
      (<authorize-get request env url)

      (and (= method "POST") (= path "/oauth/login"))
      (<login request env)

      (and (= method "POST") (= path "/oauth/consent"))
      (<consent request env)

      (and (= method "POST") (= path "/oauth/token"))
      (<token request env)

      :else
      (http/not-found))))
