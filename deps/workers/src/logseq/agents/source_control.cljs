(ns logseq.agents.source-control
  (:require [clojure.string :as string]
            [promesa.core :as p]))

(defn- non-empty-str
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when-not (string/blank? trimmed)
        trimmed))))

(defn- strip-git-suffix
  [repo-name]
  (when-let [repo-name (non-empty-str repo-name)]
    (string/replace repo-name #"\.git$" "")))

(defn- github-https-ref
  [repo-url]
  (when-let [[_ owner repo]
             (some->> repo-url
                      non-empty-str
                      (re-matches #"^https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$"))]
    {:provider "github"
     :owner owner
     :name (strip-git-suffix repo)}))

(defn- github-ssh-ref
  [repo-url]
  (when-let [[_ owner repo]
             (some->> repo-url
                      non-empty-str
                      (re-matches #"^git@github\.com:([^/]+)/([^/]+?)(?:\.git)?$"))]
    {:provider "github"
     :owner owner
     :name (strip-git-suffix repo)}))

(defn- github-ssh-url-ref
  [repo-url]
  (when-let [[_ owner repo]
             (some->> repo-url
                      non-empty-str
                      (re-matches #"^ssh://git@github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$"))]
    {:provider "github"
     :owner owner
     :name (strip-git-suffix repo)}))

(defn repo-ref
  [repo-url]
  (let [repo-url (non-empty-str repo-url)]
    (some->> [(github-https-ref repo-url)
              (github-ssh-ref repo-url)
              (github-ssh-url-ref repo-url)]
             (remove nil?)
             first)))

(defn sanitize-branch-name
  [branch]
  (let [branch (non-empty-str branch)]
    (when (and branch
               (not= branch "HEAD")
               (not (string/starts-with? branch "/"))
               (not (string/ends-with? branch "/"))
               (not (string/starts-with? branch "."))
               (not (string/ends-with? branch "."))
               (not (string/includes? branch " "))
               (not (string/includes? branch ".."))
               (not (string/includes? branch "@{"))
               (not (re-find #"[~^:?*\[\]\\]" branch)))
      branch)))

(defn resolve-head-branch
  [requested fallback]
  (or (sanitize-branch-name requested)
      (sanitize-branch-name fallback)))

(defn manual-pr-url
  [repo-url head-branch base-branch]
  (when-let [{:keys [provider owner name]} (repo-ref repo-url)]
    (case provider
      "github"
      (str "https://github.com/"
           owner
           "/"
           name
           "/pull/new/"
           (js/encodeURIComponent (or base-branch "main"))
           "..."
           (js/encodeURIComponent (or head-branch "")))
      nil)))

(defn- api-base-url
  [^js env]
  (or (some-> (aget env "GITHUB_API_BASE") non-empty-str)
      "https://api.github.com"))

(defn- user-agent
  [^js env]
  (or (some-> (aget env "GITHUB_USER_AGENT") non-empty-str)
      "logseq-worker/1.0"))

(def ^:private github-api-version "2022-11-28")
(def ^:private token-refresh-skew-ms 60000)
(defonce ^:private installation-token-cache (atom {}))

(defn- now-ms []
  (.now js/Date))

(defn- parse-int-safe
  [value]
  (let [num (some-> value js/parseInt)]
    (when (and (number? num)
               (not (js/isNaN num)))
      num)))

(defn- parse-time-ms
  [value]
  (let [ms (some-> value js/Date.parse)]
    (when (and (number? ms)
               (not (js/isNaN ms)))
      ms)))

(defn- base64url
  [value]
  (-> (or value "")
      (string/replace #"\+" "-")
      (string/replace #"/" "_")
      (string/replace #"=+$" "")))

(defn- uint8->base64url
  [payload]
  (base64url (js/btoa (apply str (map char payload)))))

(defn- text->base64url
  [text]
  (-> (.encode (js/TextEncoder.) (or text ""))
      uint8->base64url))

(defn- json->base64url
  [payload]
  (text->base64url (js/JSON.stringify (clj->js payload))))

(defn- github-app-id
  [^js env]
  (some-> (aget env "GITHUB_APP_ID") non-empty-str))

(defn- github-app-installation-id
  [^js env]
  (some-> (aget env "GITHUB_APP_INSTALLATION_ID")
          non-empty-str
          parse-int-safe))

(defn- github-app-private-key
  [^js env]
  (some-> (aget env "GITHUB_APP_PRIVATE_KEY")
          non-empty-str
          (string/replace #"\\n" "\n")))

(defn- github-app-slug
  [^js env]
  (or (some-> (aget env "GITHUB_APP_SLUG") non-empty-str)
      (some-> (aget env "GITHUB_APP_NAME") non-empty-str)))

(defn- node-subtle
  []
  (let [require-fn (aget js/globalThis "require")]
    (when (fn? require-fn)
      (let [crypto-module (.call require-fn nil "node:crypto")
            webcrypto (when crypto-module
                        (aget crypto-module "webcrypto"))]
        (when webcrypto
          (aget webcrypto "subtle"))))))

(defn- subtle-crypto
  []
  (or (some-> (aget js/globalThis "crypto")
              .-subtle)
      (node-subtle)))

(defn- pem->array-buffer
  [pem]
  (let [body (-> (or pem "")
                 (string/replace #"-+BEGIN[^-]+-+" "")
                 (string/replace #"-+END[^-]+-+" "")
                 (string/replace #"\s+" ""))
        binary (js/atob body)
        length (.-length binary)
        payload (js/Uint8Array. length)]
    (dotimes [idx length]
      (aset payload idx (.charCodeAt binary idx)))
    (.-buffer payload)))

(defn- <import-private-key!
  [private-key]
  (if-let [subtle (subtle-crypto)]
    (.importKey subtle
                "pkcs8"
                (pem->array-buffer private-key)
                #js {:name "RSASSA-PKCS1-v1_5"
                     :hash #js {:name "SHA-256"}}
                false
                #js ["sign"])
    (p/rejected (ex-info "webcrypto subtle unavailable"
                         {:reason :crypto-unavailable}))))

(defn- <github-app-jwt!
  [^js env]
  (let [app-id-raw (github-app-id env)
        app-id (or (parse-int-safe app-id-raw) app-id-raw)
        private-key (github-app-private-key env)]
    (cond
      (nil? app-id)
      (p/rejected (ex-info "missing GITHUB_APP_ID"
                           {:reason :missing-github-app-auth}))

      (not (string? private-key))
      (p/rejected (ex-info "missing GITHUB_APP_PRIVATE_KEY"
                           {:reason :missing-github-app-auth}))

      :else
      (let [issued-at (js/Math.floor (/ (now-ms) 1000))
            header (json->base64url {:alg "RS256"
                                     :typ "JWT"})
            claims (json->base64url {:iat (- issued-at 60)
                                     :exp (+ issued-at 540)
                                     :iss app-id})
            unsigned-token (str header "." claims)
            encoded-token (.encode (js/TextEncoder.) unsigned-token)]
        (p/let [private-key-obj (<import-private-key! private-key)
                subtle (subtle-crypto)
                signature (.sign subtle
                                 #js {:name "RSASSA-PKCS1-v1_5"}
                                 private-key-obj
                                 encoded-token)
                signature-token (-> (js/Uint8Array. signature)
                                    uint8->base64url)]
          (str unsigned-token "." signature-token))))))

(defn- request-headers
  [^js env {:keys [token content-type]}]
  (let [headers (js/Headers.)]
    (.set headers "accept" "application/vnd.github+json")
    (.set headers "user-agent" (user-agent env))
    (.set headers "x-github-api-version" github-api-version)
    (when-let [auth-token (non-empty-str token)]
      (.set headers "authorization" (str "Bearer " auth-token)))
    (when-let [value (non-empty-str content-type)]
      (.set headers "content-type" value))
    headers))

(defn- parse-json-safe
  [text]
  (if-not (string? text)
    {}
    (try
      (js->clj (js/JSON.parse text) :keywordize-keys true)
      (catch :default _
        {}))))

(def ^:private github-debug-response-headers
  ["content-type"
   "www-authenticate"
   "x-github-sso"
   "x-oauth-scopes"
   "x-accepted-oauth-scopes"
   "x-ratelimit-limit"
   "x-ratelimit-remaining"
   "x-ratelimit-reset"
   "retry-after"])

(defn- select-response-headers
  [^js resp]
  (reduce (fn [acc header-name]
            (let [value (.get (.-headers resp) header-name)]
              (if (string? value)
                (assoc acc header-name value)
                acc)))
          {}
          github-debug-response-headers))

(defn- fetch-json-safe!
  [url request]
  (p/let [resp (js/fetch url request)
          status (.-status resp)
          text (.text resp)
          payload (parse-json-safe text)
          response-headers (select-response-headers resp)]
    {:status status
     :ok? (<= 200 status 299)
     :payload payload
     :raw-body text
     :response-headers response-headers}))

(defn- token-cache-key
  [^js env repo-url installation-id]
  (str (api-base-url env) "|" (or installation-id repo-url)))

(defn- cached-installation-token
  [cache-key]
  (let [{:keys [token expires-at-ms]} (get @installation-token-cache cache-key)]
    (when (and (string? token)
               (number? expires-at-ms)
               (> (- expires-at-ms (now-ms)) token-refresh-skew-ms))
      token)))

(defn- <resolve-installation-id!
  [^js env app-jwt repo-url]
  (if-let [installation-id (github-app-installation-id env)]
    (p/resolved installation-id)
    (if-let [{:keys [provider owner name]} (repo-ref repo-url)]
      (if-not (= "github" provider)
        (p/rejected (ex-info "unsupported scm provider"
                             {:reason :unsupported-provider
                              :provider provider}))
        (let [url (str (api-base-url env) "/repos/" owner "/" name "/installation")
              headers (request-headers env {:token app-jwt})]
          (p/let [{:keys [ok? status payload raw-body response-headers]}
                  (fetch-json-safe! url #js {:method "GET" :headers headers})
                  installation-id (some-> (:id payload) parse-int-safe)]
            (if (and ok? (number? installation-id))
              installation-id
              (p/rejected (ex-info "resolve installation failed"
                                   {:reason :installation-resolution-failed
                                    :status status
                                    :body payload
                                    :raw-body raw-body
                                    :response-headers response-headers}))))))
      (p/rejected (ex-info "invalid repo url"
                           {:reason :invalid-repo-url
                            :repo-url repo-url})))))

(defn <installation-token!
  [^js env repo-url]
  (if-not (map? (repo-ref repo-url))
    (p/rejected (ex-info "invalid repo url"
                         {:reason :invalid-repo-url
                          :repo-url repo-url}))
    (let [configured-installation-id (github-app-installation-id env)
          initial-cache-key (token-cache-key env repo-url configured-installation-id)
          cached-token (cached-installation-token initial-cache-key)]
      (if (string? cached-token)
        (p/resolved cached-token)
        (p/let [app-jwt (<github-app-jwt! env)
                installation-id (<resolve-installation-id! env app-jwt repo-url)
                cache-key (token-cache-key env repo-url installation-id)
                cached-token (cached-installation-token cache-key)]
          (if (string? cached-token)
            cached-token
            (let [url (str (api-base-url env) "/app/installations/" installation-id "/access_tokens")
                  headers (request-headers env {:token app-jwt
                                                :content-type "application/json"})]
              (p/let [{:keys [ok? status payload raw-body response-headers]}
                      (fetch-json-safe! url
                                        #js {:method "POST"
                                             :headers headers
                                             :body "{}"})
                      token (:token payload)
                      expires-at-ms (some-> (:expires_at payload) parse-time-ms)]
                (if (and ok?
                         (string? token)
                         (number? expires-at-ms))
                  (do
                    (swap! installation-token-cache
                           assoc
                           cache-key
                           {:token token
                            :expires-at-ms expires-at-ms})
                    token)
                  (p/rejected (ex-info "create installation token failed"
                                       {:reason :token-mint-failed
                                        :status status
                                        :body payload
                                        :raw-body raw-body
                                        :response-headers response-headers})))))))))))

(defn app-install-url
  [^js env repo-url]
  (when-let [{:keys [provider]} (repo-ref repo-url)]
    (when (= "github" provider)
      (some-> (github-app-slug env)
              (#(str "https://github.com/apps/" % "/installations/new"))))))

(defn <repo-installation-status!
  [^js env repo-url]
  (if-let [{:keys [provider owner name]} (repo-ref repo-url)]
    (if-not (= "github" provider)
      (p/resolved {:provider provider
                   :installed? true
                   :check-required? false})
      (p/let [app-jwt (<github-app-jwt! env)
              url (str (api-base-url env) "/repos/" owner "/" name "/installation")
              headers (request-headers env {:token app-jwt})
              {:keys [ok? status payload raw-body response-headers]}
              (fetch-json-safe! url #js {:method "GET" :headers headers})
              installation-id (some-> (:id payload) parse-int-safe)]
        (cond
          (and ok? (number? installation-id))
          {:provider provider
           :installed? true
           :check-required? true
           :installation-id installation-id}

          (= status 404)
          {:provider provider
           :installed? false
           :check-required? true
           :reason :not-installed
           :install-url (app-install-url env repo-url)}

          :else
          (p/rejected (ex-info "check github app installation failed"
                               {:reason :installation-check-failed
                                :status status
                                :body payload
                                :raw-body raw-body
                                :response-headers response-headers})))))
    (p/resolved {:provider nil
                 :installed? true
                 :check-required? false})))

(defn pr-token
  [_env]
  nil)

(defn push-token
  [_env]
  nil)

(defn <pr-token!
  [^js env repo-url]
  (<installation-token! env repo-url))

(defn <push-token!
  [^js env repo-url]
  (<installation-token! env repo-url))

(defn push-remote-url
  [repo-url token]
  (when-let [{:keys [provider owner name]} (repo-ref repo-url)]
    (when (and (= "github" provider)
               (string? token))
      (str "https://x-access-token:"
           (js/encodeURIComponent token)
           "@github.com/"
           owner
           "/"
           name
           ".git"))))

(defn <default-branch!
  [^js env token repo-url]
  (if-let [{:keys [provider owner name]} (repo-ref repo-url)]
    (if-not (= "github" provider)
      (p/resolved nil)
      (let [url (str (api-base-url env) "/repos/" owner "/" name)
            headers (request-headers env {:token token})]
        (p/let [resp (js/fetch url #js {:method "GET" :headers headers})
                status (.-status resp)
                text (.text resp)
                payload (parse-json-safe text)]
          (if (<= 200 status 299)
            (some-> (:default_branch payload) non-empty-str)
            nil))))
    (p/resolved nil)))

(defn <list-branches!
  [^js env token repo-url]
  (if-let [{:keys [provider owner name]} (repo-ref repo-url)]
    (if-not (= "github" provider)
      (p/resolved [])
      (let [url (str (api-base-url env) "/repos/" owner "/" name "/branches?per_page=100")
            headers (request-headers env {:token token})]
        (p/let [resp (js/fetch url #js {:method "GET" :headers headers})
                status (.-status resp)
                text (.text resp)
                payload (parse-json-safe text)]
          (if (<= 200 status 299)
            (->> (if (sequential? payload) payload [])
                 (keep (fn [item]
                         (when (map? item)
                           (some-> (:name item) sanitize-branch-name))))
                 distinct
                 vec)
            []))))
    (p/resolved [])))

(defn <create-pull-request!
  [^js env token repo-url {:keys [title body head-branch base-branch draft]}]
  (cond
    (not (string? token))
    (p/rejected (ex-info "missing github app installation token" {:reason :missing-token}))

    (not (string? title))
    (p/rejected (ex-info "missing pull request title" {:reason :invalid-request}))

    (not (string? body))
    (p/rejected (ex-info "missing pull request body" {:reason :invalid-request}))

    :else
    (if-let [{:keys [provider owner name]} (repo-ref repo-url)]
      (if-not (= "github" provider)
        (p/rejected (ex-info "unsupported scm provider" {:reason :unsupported-provider
                                                         :provider provider}))
        (let [url (str (api-base-url env) "/repos/" owner "/" name "/pulls")
              payload (cond-> {:title title
                               :body body
                               :head (or head-branch "")
                               :base (or base-branch "main")}
                        (true? draft) (assoc :draft true))
              headers (request-headers env {:token token
                                            :content-type "application/json"})]
          (p/let [resp (js/fetch url #js {:method "POST"
                                          :headers headers
                                          :body (js/JSON.stringify (clj->js payload))})
                  status (.-status resp)
                  text (.text resp)
                  parsed (parse-json-safe text)
                  response-headers (select-response-headers resp)]
            (if (<= 200 status 299)
              {:id (:number parsed)
               :url (:html_url parsed)
               :state (cond
                        (true? (:draft parsed)) "draft"
                        (= "closed" (:state parsed)) "closed"
                        :else "open")
               :head-branch (or (get-in parsed [:head :ref]) head-branch)
               :base-branch (or (get-in parsed [:base :ref]) base-branch)}
              (p/rejected (ex-info "create pull request failed"
                                   {:reason :api-error
                                    :status status
                                    :body parsed
                                    :raw-body text
                                    :response-headers response-headers}))))))
      (p/rejected (ex-info "invalid repo url" {:reason :invalid-repo-url
                                               :repo-url repo-url})))))

(defn <find-open-pull-request!
  [^js env token repo-url {:keys [head-branch base-branch]}]
  (if-not (and (string? token) (string? head-branch))
    (p/resolved nil)
    (if-let [{:keys [provider owner name]} (repo-ref repo-url)]
      (if-not (= "github" provider)
        (p/resolved nil)
        (let [query (cond-> (str "state=open&head="
                                 (js/encodeURIComponent (str owner ":" head-branch)))
                      (string? base-branch)
                      (str "&base=" (js/encodeURIComponent base-branch)))
              url (str (api-base-url env) "/repos/" owner "/" name "/pulls?" query)
              headers (request-headers env {:token token})]
          (p/let [resp (js/fetch url #js {:method "GET" :headers headers})
                  status (.-status resp)
                  text (.text resp)
                  parsed (parse-json-safe text)]
            (if (and (<= 200 status 299) (sequential? parsed))
              (let [pr-record (first parsed)]
                (when (map? pr-record)
                  {:id (:number pr-record)
                   :url (:html_url pr-record)
                   :state (cond
                            (true? (:draft pr-record)) "draft"
                            (= "closed" (:state pr-record)) "closed"
                            :else "open")
                   :head-branch (or (get-in pr-record [:head :ref]) head-branch)
                   :base-branch (or (get-in pr-record [:base :ref]) base-branch)}))
              nil))))
      (p/resolved nil))))
