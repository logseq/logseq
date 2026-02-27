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

(defn pr-token
  [^js env]
  (some-> (aget env "GITHUB_TOKEN") non-empty-str))

(defn push-token
  [^js env]
  (some-> (aget env "GITHUB_TOKEN") non-empty-str))

(defn push-remote-url
  [repo-url token]
  (when-let [{:keys [provider owner name]} (repo-ref repo-url)]
    (when (= "github" provider)
      (if (string? token)
        (str "https://x-access-token:" (js/encodeURIComponent token) "@github.com/" owner "/" name ".git")
        (str "https://github.com/" owner "/" name ".git")))))

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

(defn <default-branch!
  [^js env token repo-url]
  (if-not (string? token)
    (p/resolved nil)
    (if-let [{:keys [provider owner name]} (repo-ref repo-url)]
      (if-not (= "github" provider)
        (p/resolved nil)
        (let [url (str (api-base-url env) "/repos/" owner "/" name)
              headers (doto (js/Headers.)
                        (.set "accept" "application/vnd.github+json")
                        (.set "authorization" (str "Bearer " token))
                        (.set "user-agent" (user-agent env))
                        (.set "x-github-api-version" "2022-11-28"))]
          (p/let [resp (js/fetch url #js {:method "GET" :headers headers})
                  status (.-status resp)
                  text (.text resp)
                  payload (parse-json-safe text)]
            (if (<= 200 status 299)
              (some-> (:default_branch payload) non-empty-str)
              nil))))
      (p/resolved nil))))

(defn <create-pull-request!
  [^js env token repo-url {:keys [title body head-branch base-branch draft]}]
  (cond
    (not (string? token))
    (p/rejected (ex-info "missing github token" {:reason :missing-token}))

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
              headers (doto (js/Headers.)
                        (.set "accept" "application/vnd.github+json")
                        (.set "content-type" "application/json")
                        (.set "authorization" (str "Bearer " token))
                        (.set "user-agent" (user-agent env))
                        (.set "x-github-api-version" "2022-11-28"))]
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
              headers (doto (js/Headers.)
                        (.set "accept" "application/vnd.github+json")
                        (.set "authorization" (str "Bearer " token))
                        (.set "user-agent" (user-agent env))
                        (.set "x-github-api-version" "2022-11-28"))]
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
