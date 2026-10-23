(ns logseq.db-sync.worker.oauth
  "Sign in with Logseq protocol helpers.

  Third-party apps use the authorization code grant with PKCE (S256).
  A code is issued only for an approved app, and the resulting access token
  is bound to the single graph the user selects."
  (:require [clojure.string :as string]
            [promesa.core :as p]))

(def app-client-prefix "logseq_app_")
(def authorization-code-prefix "logseq_oac_")
(def refresh-token-prefix "logseq_ort_")
(def session-cookie-name "logseq_oauth_session")
(def max-apps-per-user 20)
(def max-redirect-uris 10)
(def max-text-length 500)
(def max-name-length 80)
(def max-state-length 512)
(def max-form-chars 16384)
(def too-large-form ::too-large)
(def access-token-ttl-ms (* 60 60 1000))
(def refresh-token-ttl-ms (* 365 24 60 60 1000))
(def auth-code-ttl-ms (* 5 60 1000))
(def login-session-ttl-ms (* 15 60 1000))
(def allowed-scopes #{"logseq/read" "logseq/write"})
(def app-statuses #{"pending" "approved" "rejected"})
(def ^:private client-id-pattern #"^logseq_app_[0-9a-f]{32}$")
(def ^:private code-verifier-pattern #"^[A-Za-z0-9._~-]{43,128}$")
(def ^:private code-challenge-pattern #"^[A-Za-z0-9_-]{43}$")
(def ^:private loopback-hosts #{"localhost" "127.0.0.1"})

(defn random-hex
  [size]
  (let [payload (js/Uint8Array. size)]
    (.getRandomValues js/crypto payload)
    (->> (array-seq payload)
         (map (fn [octet]
                (.padStart (.toString octet 16) 2 "0")))
         (apply str))))

(defn generate-client-id []
  (str app-client-prefix (random-hex 16)))

(defn generate-authorization-code []
  (str authorization-code-prefix (random-hex 32)))

(defn generate-refresh-token []
  (str refresh-token-prefix (random-hex 32)))

(defn generate-access-token []
  (str "logseq_oat_" (random-hex 32)))

(defn token-prefix
  [token]
  (subs token 0 (min (count token) 23)))

(defn valid-client-id?
  [value]
  (boolean (and (string? value) (re-matches client-id-pattern value))))

(defn valid-redirect-uri?
  [uri]
  (and (string? uri)
       (<= 1 (count uri) max-text-length)
       (not (re-find #"\s" uri))
       (try
         (let [url (js/URL. uri)
               protocol (.-protocol url)
               hostname (.-hostname url)]
           (and (empty? (.-username url))
                (empty? (.-password url))
                (empty? (.-hash url))
                (seq hostname)
                (or (= protocol "https:")
                    (and (= protocol "http:")
                         (contains? loopback-hosts hostname)))))
         (catch :default _
           false))))

(defn clean-name
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when (<= 1 (count trimmed) max-name-length)
        trimmed))))

(defn clean-optional-text
  "Return nil for a blank value, the trimmed text, or ::invalid."
  [value]
  (cond
    (or (nil? value) (= "" value)) nil
    (not (string? value)) ::invalid
    :else
    (let [trimmed (string/trim value)]
      (cond
        (string/blank? trimmed) nil
        (> (count trimmed) max-text-length) ::invalid
        :else trimmed))))

(defn clean-redirect-uris
  [value]
  (when (and (sequential? value) (not (string? value)))
    (let [uris (mapv (fn [uri]
                       (when (string? uri)
                         (string/trim uri)))
                     value)]
      (when (and (<= 1 (count uris) max-redirect-uris)
                 (every? valid-redirect-uri? uris)
                 (apply distinct? uris))
        uris))))

(defn parse-scope
  [value]
  (when (string? value)
    (let [parts (->> (string/split value #"\s+")
                     (remove string/blank?)
                     vec)]
      (when (and (seq parts)
                 (= (count parts) (count (set parts)))
                 (every? allowed-scopes parts))
        (string/join " " (sort parts))))))

(defn valid-state?
  [state]
  (and (string? state)
       (<= 1 (count state) max-state-length)
       (not (re-find #"[\u0000-\u001F\u007F]" state))))

(defn valid-code-verifier?
  [verifier]
  (boolean (and (string? verifier) (re-matches code-verifier-pattern verifier))))

(defn valid-code-challenge?
  [challenge]
  (boolean (and (string? challenge) (re-matches code-challenge-pattern challenge))))

(defn- bytes->base64url
  [octets]
  (let [binary (apply str (map #(js/String.fromCharCode %) (array-seq octets)))]
    (-> (js/btoa binary)
        (string/replace "+" "-")
        (string/replace "/" "_")
        (string/replace #"=+$" ""))))

(defn <sha-256
  [value]
  (p/let [payload (.encode (js/TextEncoder.) value)
          digest (.digest (.-subtle js/crypto) "SHA-256" payload)]
    (js/Uint8Array. digest)))

(defn <code-challenge
  [verifier]
  (p/let [digest (<sha-256 verifier)]
    (bytes->base64url digest)))

(defn string-param
  [params key]
  (let [value (get params key)]
    (when (string? value)
      value)))

(defn normalize-authorize
  "Validate a public authorization request against a stored app.

  Invalid client or redirect data must not redirect. Other protocol errors
  redirect back to the registered URI with error=invalid_request."
  [params app]
  (let [response-type (string-param params "response_type")
        client-id (string-param params "client_id")
        redirect-uri (string-param params "redirect_uri")
        scope (parse-scope (string-param params "scope"))
        state (string-param params "state")
        challenge (string-param params "code_challenge")
        method (string-param params "code_challenge_method")
        redirect-ok? (and app
                          (= "approved" (:status app))
                          (= client-id (:id app))
                          (valid-redirect-uri? redirect-uri)
                          (some #(= redirect-uri %) (:redirect-uris app)))
        state-for-redirect (when (valid-state? state) state)]
    (cond
      (or (nil? app) (not (valid-client-id? client-id)) (not= client-id (:id app)))
      {:error :unknown-app}

      (= "pending" (:status app))
      {:error :pending}

      (= "rejected" (:status app))
      {:error :rejected}

      (not= "approved" (:status app))
      {:error :unknown-app}

      (not redirect-ok?)
      {:error :redirect-mismatch}

      (or (not= response-type "code")
          (nil? scope)
          (not (valid-state? state))
          (not= method "S256")
          (not (valid-code-challenge? challenge)))
      {:error :invalid-request
       :redirect? true
       :redirect-uri redirect-uri
       :state state-for-redirect}

      :else
      {:client-id client-id
       :redirect-uri redirect-uri
       :scope scope
       :state state
       :code-challenge challenge
       :code-challenge-method method
       :response-type response-type})))

(defn callback-url
  [redirect-uri params]
  (let [url (js/URL. redirect-uri)]
    (doseq [[k v] params]
      (when (some? v)
        (.set (.-searchParams url) k (str v))))
    (.toString url)))

(defn authorization-error-redirect
  [{:keys [redirect-uri state]}]
  (callback-url redirect-uri
                {"error" "invalid_request"
                 "error_description" "The sign-in request is invalid."
                 "state" state}))

(defn access-denied-redirect
  [{:keys [redirect-uri state]}]
  (callback-url redirect-uri
                {"error" "access_denied"
                 "error_description" "The user denied the request."
                 "state" state}))

(defn success-redirect
  [{:keys [redirect-uri state]} code]
  (callback-url redirect-uri
                {"code" code
                 "state" state}))

(defn public-app
  [app]
  (select-keys app [:id :name :description :redirect-uris :status
                    :review-note :created-at :updated-at :reviewed-at]))

(defn cookie-value
  [header name]
  (when (and (string? header) (string? name))
    (some (fn [part]
            (let [part (string/trim part)
                  idx (string/index-of part "=")]
              (when (and idx (= name (subs part 0 idx)))
                (try
                  (js/decodeURIComponent (subs part (inc idx)))
                  (catch :default _
                    nil)))))
          (string/split header #";"))))

(defn session-cookie
  [session-id {:keys [secure? max-age]}]
  (str session-cookie-name "=" session-id
       "; HttpOnly; Path=/; SameSite=Lax; Max-Age=" max-age
       (when secure? "; Secure")))

(defn request-secure?
  [request]
  (= "https:" (.-protocol (js/URL. (.-url request)))))

(defn- params->map
  "Read a URLSearchParams value. Its entries iterator is not an array."
  [^js params]
  (js->clj (js/Object.fromEntries params)))

(defn <form-params
  [request]
  (p/let [text (.text request)]
    (if (and (string? text) (> (count text) max-form-chars))
      too-large-form
      (params->map (js/URLSearchParams. (or text ""))))))

(defn query-params
  [url]
  (params->map (.-searchParams url)))

(defn cognito-idp-endpoint
  [issuer]
  (when (string? issuer)
    (try
      (let [host (.-hostname (js/URL. issuer))]
        (when (string/starts-with? host "cognito-idp.")
          (str "https://" host "/")))
      (catch :default _
        nil))))

(defn discovery-document
  [origin]
  {"issuer" origin
   "authorization_endpoint" (str origin "/oauth/authorize")
   "token_endpoint" (str origin "/oauth/token")
   "response_types_supported" ["code"]
   "grant_types_supported" ["authorization_code" "refresh_token"]
   "code_challenge_methods_supported" ["S256"]
   "scopes_supported" ["logseq/read" "logseq/write"]
   "token_endpoint_auth_methods_supported" ["none"]})

(defn token-success
  [{:keys [access-token refresh-token expires-in scope graph-id]}]
  {"access_token" access-token
   "token_type" "Bearer"
   "expires_in" expires-in
   "refresh_token" refresh-token
   "scope" scope
   "graph_id" graph-id})

(defn form-content-type?
  [request]
  (let [content-type (.get (.-headers request) "content-type")]
    (and (string? content-type)
         (string/starts-with? (string/lower-case content-type)
                              "application/x-www-form-urlencoded"))))
