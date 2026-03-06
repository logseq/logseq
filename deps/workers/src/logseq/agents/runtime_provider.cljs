(ns logseq.agents.runtime-provider
  (:require ["@cloudflare/sandbox" :as cf-sandbox]
            ["@vercel/sandbox" :as vercel-sandbox]
            ["e2b" :as e2b]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.agents.sandbox :as sandbox]
            [logseq.agents.source-control :as source-control]
            [logseq.sync.platform.core :as platform]
            [promesa.core :as p]))

;; -----------------------
;; helpers
;; -----------------------

(defn- env-str [^js env k]
  (let [v (aget env k)]
    (when (string? v)
      (let [t (string/trim v)]
        (when-not (string/blank? t) t)))))

(defn- parse-int [v default]
  (let [n (some-> v js/parseInt)]
    (if (and (number? n) (not (js/isNaN n))) n default)))

(defn- parse-json-safe [s]
  (try
    (js->clj (js/JSON.parse s) :keywordize-keys true)
    (catch :default _ {})))

(defn- strip-trailing-slash [s]
  (string/replace (or s "") #"/+$" ""))

(defn- normalize-provider [value]
  (when (string? value)
    (let [normalized (-> value string/trim string/lower-case)]
      (when-not (string/blank? normalized) normalized))))

(def ^:private supported-provider-kinds
  #{"e2b" "sprites" "local-dev" "local-runner" "cloudflare" "vercel"})

(defn- known-provider-kind [value]
  (let [provider (normalize-provider value)]
    (when (contains? supported-provider-kinds provider)
      provider)))

(defn provider-kind [^js env]
  (or (known-provider-kind (env-str env "AGENT_RUNTIME_PROVIDER"))
      "e2b"))

(defn runtime-provider-kind [^js env runtime]
  (or (known-provider-kind (:provider runtime))
      (provider-kind env)))

(defn fill-template [template sandbox-id]
  (string/replace (or template "") "{sandbox_id}" (or sandbox-id "")))

(defn- sanitize-name [name]
  (let [name (or name "task")
        sanitized (-> name
                      string/lower-case
                      (string/replace #"[^a-z0-9-]" "-")
                      (string/replace #"-+" "-")
                      (string/replace #"^-+" "")
                      (string/replace #"-+$" ""))]
    (if (string/blank? sanitized)
      "task"
      (subs sanitized 0 (min 63 (count sanitized))))))

(defn- get-sprite-name [^js env session-id]
  (let [prefix (or (env-str env "SPRITES_NAME_PREFIX") "logseq-task-")]
    (sanitize-name (str prefix session-id))))

(defn cloudflare-sandbox-name [^js env session-id]
  (let [prefix (or (env-str env "CLOUDFLARE_SANDBOX_NAME_PREFIX") "logseq-task-")]
    (sanitize-name (str prefix session-id))))

(defn- sprites-token [^js env]
  (or (env-str env "SPRITE_TOKEN")
      (env-str env "SPRITES_TOKEN")))

(defn- sprites-base-url [^js env]
  (or (env-str env "SPRITES_API_URL")
      "https://api.sprites.dev"))

(defn- sprites-http-url [base path]
  (str (strip-trailing-slash base) path))

(defn- build-query [pairs]
  (->> pairs
       (map (fn [[k v]]
              (str (js/encodeURIComponent (name k))
                   "="
                   (js/encodeURIComponent (str v)))))
       (string/join "&")))

(defn- token-header! [^js headers token]
  (when (string? token)
    (.set headers "Authorization" (str "Bearer " token))))

(defn- escape-shell-single [value]
  (string/replace (or value "") "'" "'\"'\"'"))

(defn- ->base64
  [value]
  (when (string? value)
    (let [payload (.encode (js/TextEncoder.) value)
          binary (apply str (map char payload))]
      (js/btoa binary))))

(defn- curl-auth-arg [token]
  ;; token may be nil in --no-token mode
  (if (string? token)
    (str "-H 'authorization: Bearer " (escape-shell-single token) "'")
    ""))

(defn- curl-json-arg [body]
  (if (some? body)
    (str "--data '" (escape-shell-single (js/JSON.stringify (clj->js body))) "'")
    ""))

(defn- sprite-local-url [port path]
  (str "http://127.0.0.1:" port path))

(def ^:private default-repo-base-dir "/workspace")
(def ^:private vercel-repo-base-dir "/vercel/sandbox")
(def ^:private cloudflare-local-host "http://localhost")
(def ^:private cloudflare-snapshot-ttl-seconds (* 30 24 60 60))

(defn clear-cloudflare-backup-cache!
  []
  nil)

(defn clear-vercel-snapshot-cache!
  []
  nil)

(defn clear-e2b-snapshot-cache!
  []
  nil)

(defn- cloudflare-agent-port [^js env]
  (parse-int (env-str env "CLOUDFLARE_SANDBOX_AGENT_PORT") 2468))

(defn- cloudflare-health-retries [^js env]
  (parse-int (env-str env "CLOUDFLARE_HEALTH_RETRIES") 30))

(defn- cloudflare-health-interval-ms [^js env]
  (parse-int (env-str env "CLOUDFLARE_HEALTH_INTERVAL_MS") 200))

(defn- js-method
  [obj method]
  (let [f (when obj (aget obj method))]
    (when (fn? f) f)))

(defn- ->promise
  [v]
  (js/Promise.resolve v))

(defn- fetch-json!
  [method url {:keys [token json-body]}]
  (let [^js h (js/Headers.)]
    (.set h "Accept" "application/json")
    (when token (token-header! h token))
    (when json-body (.set h "Content-Type" "application/json"))
    (p/let [resp (js/fetch url
                           (clj->js (cond-> {:method method :headers h}
                                      json-body (assoc :body (js/JSON.stringify (clj->js json-body))))))
            status (.-status resp)
            text (->promise (.text resp))
            data (parse-json-safe text)]
      (if (<= 200 status 299)
        data
        (throw (ex-info "sprites http error" {:status status :url url :body data}))))))

;; -----------------------
;; Sprites REST
;; -----------------------

(defn- sprites-create-or-get! [^js env name]
  (let [base (sprites-base-url env)
        token (sprites-token env)]
    (when-not (string? token)
      (throw (ex-info "missing SPRITE_TOKEN/SPRITES_TOKEN (Sprites API token)" {})))
    (p/catch
     (fetch-json! "POST" (sprites-http-url base "/v1/sprites")
                  {:token token :json-body {:name name}})
     (fn [_]
       (fetch-json! "GET" (sprites-http-url base (str "/v1/sprites/" name))
                    {:token token})))))

(defn- sprites-delete! [^js env name]
  (let [base (sprites-base-url env)
        token (sprites-token env)]
    (p/catch
     (fetch-json! "DELETE" (sprites-http-url base (str "/v1/sprites/" name))
                  {:token token})
     (fn [_] nil))))

(defn- sprites-exec-post!
  [^js env sprite-name cmd-vec]
  (let [base (sprites-base-url env)
        token (sprites-token env)
        q (build-query (map (fn [c] [:cmd c]) cmd-vec))
        url (sprites-http-url base (str "/v1/sprites/" sprite-name "/exec?" q))
        ^js headers (js/Headers.)]
    (.set headers "Accept" "application/json")
    (when token (token-header! headers token))
    (p/let [resp (js/fetch url #js {:method "POST" :headers headers})
            status (.-status resp)
            text (->promise (.text resp))
            parsed (parse-json-safe text)]
      (when-not (<= 200 status 299)
        (throw (ex-info "sprites exec failed"
                        {:status status
                         :url url
                         :body parsed
                         :raw-body text})))
      (cond
        (and (map? parsed) (seq parsed))
        parsed

        (string/blank? text)
        {}

        :else
        {:stdout text
         :stderr ""}))))

;; -----------------------
;; Worker WS upgrade to Sprites exec
;; IMPORTANT: use https URL + Upgrade headers (not wss://)
;; -----------------------

(defn- sprites-exec-upgrade-url [^js env sprite-name cmd-vec]
  (let [base (sprites-base-url env)
        q (build-query (map (fn [c] [:cmd c]) cmd-vec))]
    (sprites-http-url base (str "/v1/sprites/" sprite-name "/exec?" q))))

(defn- ws-upgrade! [^js env upgrade-url]
  (let [token (sprites-token env)]
    (when-not (string? token)
      (throw (ex-info "missing SPRITE_TOKEN/SPRITES_TOKEN (Sprites API token)" {})))
    (let [^js headers (js/Headers.)]
      (token-header! headers token)
      (.set headers "Upgrade" "websocket")
      (.set headers "Connection" "Upgrade")
      (p/let [^js resp (js/fetch upgrade-url #js {:method "GET" :headers headers})
              status (.-status resp)]
        (when-not (= 101 status)
          (p/let [body (->promise (.text resp))]
            (throw (ex-info "sprites ws upgrade failed"
                            {:status status :url upgrade-url :body body}))))
        (let [ws (.-webSocket resp)]
          (.accept ws)
          (set! (.-binaryType ws) "arraybuffer")
          ws)))))

;; -----------------------
;; REALTIME: Sprites WS stdout/stderr -> TransformStream -> SSE Response
;; -----------------------

(defn- sprites-ws->sse-response!
  "Runs cmd inside sprite and streams stdout/stderr bytes to the HTTP client as SSE.
   Uses TransformStream (reliable in Workers) instead of manual ReadableStream controllers."
  [^js env sprite-name cmd-vec]
  (p/let [ws (ws-upgrade! env (sprites-exec-upgrade-url env sprite-name cmd-vec))]
    (let [ts (js/TransformStream.)
          writer (.getWriter (.-writable ts))]

      (set! (.-onmessage ws)
            (fn [evt]
              (let [data (.-data evt)]
                (cond
                  ;; ignore JSON control messages
                  (string? data) nil

                  (instance? js/ArrayBuffer data)
                  (let [u8 (js/Uint8Array. data)
                        n (.-length u8)]
                    (when (> n 0)
                      (let [sid (.at u8 0)
                            payload (.subarray u8 1)]
                        (cond
                          ;; stdout/stderr
                          (or (= sid 1) (= sid 2))
                          ;; write ONLY bytes
                          (.write writer payload)

                          ;; exit
                          (= sid 3)
                          (do
                            (try (.close writer) (catch :default _ nil))
                            (try (.close ws 1000) (catch :default _ nil)))

                          :else nil))))

                  :else
                  (do
                    (try (.abort writer (js/Error. "unexpected ws frame type")) (catch :default _ nil))
                    (try (.close ws 1011 "bad frame") (catch :default _ nil)))))))

      (set! (.-onerror ws)
            (fn [e]
              (try (.abort writer e) (catch :default _ nil))))

      (set! (.-onclose ws)
            (fn [_]
              (try (.close writer) (catch :default _ nil))))

      (js/Response.
       (.-readable ts)
       #js {:status 200
            :headers #js {"content-type" "text/event-stream"
                          "cache-control" "no-cache"
                          "connection" "keep-alive"}}))))

;; -----------------------
;; sandbox-agent bootstrap + health + create-session
;; -----------------------

(defn auth-json-write-command
  [auth-json]
  (when-let [encoded (->base64 auth-json)]
    (str "mkdir -p ~/.codex; "
         "printf \"%s\" \"" encoded "\" | base64 -d > ~/.codex/auth.json; ")))

(def ^:private github-installation-token-env-keys
  ["GITHUB_TOKEN"
   "GH_TOKEN"
   "GITHUB_APP_INSTALLATION_TOKEN"])

(defn- assoc-github-installation-token
  [env-vars token]
  (if-not (string? token)
    env-vars
    (reduce (fn [acc k] (assoc acc k token))
            env-vars
            github-installation-token-env-keys)))

(defn- shell-export-command
  [env-vars]
  (->> env-vars
       (sort-by key)
       (keep (fn [[k v]]
               (when (and (string? k) (string? v))
                 (str "export " k "='" (escape-shell-single v) "'; "))))
       (apply str)))

(defn- github-auth-setup-command
  [token]
  (if-not (string? token)
    ""
    (let [credentials-url (str "https://x-access-token:" token "@github.com")]
      (str "git config --global credential.helper store; "
           "printf '%s\\n' '" (escape-shell-single credentials-url) "' > ~/.git-credentials; "
           "chmod 600 ~/.git-credentials; "))))

(declare task-repo-url)

(defn- task-repo-name
  [task]
  (let [repo-url (task-repo-url task)
        from-ref (some-> repo-url source-control/repo-ref :name sanitize-name)
        from-url (some-> repo-url
                         (string/replace #"/+$" "")
                         (string/split #"/")
                         last
                         (string/replace #"\.git$" "")
                         sanitize-name)]
    (or from-ref from-url "repo")))

(defn- repo-base-dir
  [provider]
  (if (= "vercel" (normalize-provider provider))
    vercel-repo-base-dir
    default-repo-base-dir))

(defn- get-repo-dir
  ([session-id]
   (get-repo-dir session-id nil nil))
  ([session-id task provider]
   (if (= "vercel" (normalize-provider provider))
     (str vercel-repo-base-dir "/" (task-repo-name task))
     (let [session-id (some-> session-id str)]
       (when (string? session-id)
         (str default-repo-base-dir "/" (sanitize-name session-id)))))))

(defn- repo-cd-command
  ([session-id]
   (repo-cd-command session-id nil nil))
  ([session-id task provider]
   (when-let [dir (get-repo-dir session-id task provider)]
     (str "cd '" (escape-shell-single dir) "'"))))

;; FIXME: sandbox-agent 2.x.x changes session routes to opencode/session
(defn- sandbox-agent-version
  [^js env]
  (or (env-str env "SANDBOX_AGENT_VERSION")
      "0.1.5"))

(defn- sandbox-agent-install-command
  [^js env]
  (let [version (escape-shell-single (sandbox-agent-version env))
        install-script (str "https://releases.rivet.dev/sandbox-agent/" version "/install.sh")]
    (str "(curl -fsSL " install-script " | sh);")))

(declare <github-installation-token-for-task!)

(defn- <sprite-bootstrap! [^js env sprite-name port task session-id]
  (p/let [github-token (<github-installation-token-for-task! env task)]
    (let [auth-json (get-in task [:agent :auth-json])
          write-auth (or (auth-json-write-command auth-json) "")
          repo-cd (or (repo-cd-command session-id) "")
          token-exports (if (string? github-token)
                          (shell-export-command (assoc-github-installation-token {} github-token))
                          "")
          github-auth-setup (github-auth-setup-command github-token)
          bootstrap (or (env-str env "SPRITES_BOOTSTRAP_COMMAND")
                        (str (sandbox-agent-install-command env)
                             token-exports
                             github-auth-setup
                             write-auth
                             (when (string? repo-cd) (str repo-cd "; "))
                             "nohup sandbox-agent server --no-token --host 0.0.0.0 --port " port
                             " --no-telemetry >/tmp/sandbox-agent.log 2>&1 &"))]
      (sprites-exec-post! env sprite-name ["bash" "-lc" bootstrap]))))

(declare sprites-exec-output)
(defn- <sprite-health! [^js env sprite-name port agent-token retries interval-ms]
  (if (<= retries 0)
    (throw (ex-info "sandbox-agent health check timed out in sprite"
                    {:sprite sprite-name :port port}))
    (let [script (str "if curl -fsS "
                      (curl-auth-arg agent-token)
                      " "
                      (sprite-local-url port "/v1/health")
                      " >/dev/null; then echo __HEALTH_OK__; else echo __HEALTH_FAIL__; fi")]
      (-> (sprites-exec-post! env sprite-name ["bash" "-lc" script])
          (p/then (fn [result]
                    (let [{:keys [stdout stderr]} (sprites-exec-output result)
                          output (str stdout "\n" stderr)]
                      (when-not (string/includes? output "__HEALTH_OK__")
                        (throw (ex-info "sprite health check failed"
                                        {:sprite sprite-name
                                         :port port
                                         :stdout stdout
                                         :stderr stderr})))
                      true)))
          (p/catch (fn [_]
                     (p/let [_ (p/delay interval-ms)]
                       (<sprite-health! env sprite-name port agent-token (dec retries) interval-ms))))))))

(defn- task-repo-url [task]
  (some-> (get-in task [:project :repo-url]) str string/trim not-empty))

(defn- unwrap-code-block
  [text]
  (when (string? text)
    (or (some->> text
                 (re-matches #"(?s)^```[^\n]*\n(.*)\n```$")
                 second
                 string/trim
                 not-empty)
        text)))

(defn- task-project-init-setup
  [task]
  (some-> (get-in task [:project :sandbox-init-setup])
          str
          unwrap-code-block
          string/trim
          not-empty))

(defn- <github-installation-token-for-task!
  [^js env task]
  (let [repo-url (task-repo-url task)]
    (if (string? repo-url)
      (-> (source-control/<installation-token! env repo-url)
          (p/catch (fn [error]
                     (log/error :agent/github-installation-token-mint-failed
                                {:repo-url repo-url
                                 :error (str error)})
                     nil)))
      (p/resolved nil))))

(defn- task-repo-branch
  [task]
  (or (some-> (get-in task [:project :base-branch]) source-control/sanitize-branch-name)
      (some-> (get-in task [:project :branch]) source-control/sanitize-branch-name)
      "main"))

(defn- repo-backup-key
  [task]
  (let [repo-url (task-repo-url task)
        branch (task-repo-branch task)]
    (when (and (string? repo-url) (string? branch))
      (let [{:keys [provider owner name]} (source-control/repo-ref repo-url)
            repo-key (if (and (string? provider)
                              (string? owner)
                              (string? name))
                       (str provider
                            "/"
                            (string/lower-case owner)
                            "/"
                            (string/lower-case name))
                       (string/lower-case repo-url))]
        (str repo-key "#" (string/lower-case branch))))))

(defn- task-sandbox-checkpoint
  [task]
  (let [checkpoint (when (map? task)
                     (:sandbox-checkpoint task))
        provider (normalize-provider (:provider checkpoint))
        snapshot-id (some-> (:snapshot-id checkpoint) str string/trim not-empty)
        backup-key (some-> (:backup-key checkpoint) str string/trim not-empty)
        backup-dir (some-> (:backup-dir checkpoint) str string/trim not-empty)]
    (when (and (map? checkpoint) (string? snapshot-id))
      (cond-> {:snapshot-id snapshot-id}
        (string? provider) (assoc :provider provider)
        (string? backup-key) (assoc :backup-key backup-key)
        (string? backup-dir) (assoc :backup-dir backup-dir)))))

(defn- sanitize-backup-name
  [value]
  (let [raw (or (some-> value str string/lower-case) "snapshot")
        sanitized (-> raw
                      ;; Keep snapshot names flat for provider compatibility.
                      (string/replace #"[^a-z0-9._-]+" "-")
                      (string/replace #"-+" "-")
                      (string/replace #"^-+" "")
                      (string/replace #"-+$" ""))]
    (if (string/blank? sanitized)
      "snapshot"
      sanitized)))

(defn- snapshot-backup-name
  [runtime task]
  (let [base (or (repo-backup-key task)
                 (some-> (:session-id runtime) str not-empty)
                 "snapshot")]
    (str (sanitize-backup-name base)
         "-"
         (js/Date.now))))

(defn- fill-repo-template
  [template {:keys [repo-url session-id repo-dir]}]
  (-> (or template "")
      (string/replace "{repo_url}" (or repo-url ""))
      (string/replace "{session_id}" (or session-id ""))
      (string/replace "{repo_dir}" (or repo-dir ""))))

(defn repo-clone-command
  ([^js env session-id task]
   (repo-clone-command env session-id task "sprites"))
  ([^js env session-id task provider]
   (let [repo-url (task-repo-url task)
         session-id (some-> session-id str)
         repo-dir (get-repo-dir session-id task provider)
         base-dir (repo-base-dir provider)
         override-key (case provider
                        "e2b" "E2B_REPO_CLONE_COMMAND"
                        "cloudflare" "CLOUDFLARE_REPO_CLONE_COMMAND"
                        "vercel" "VERCEL_REPO_CLONE_COMMAND"
                        "SPRITES_REPO_CLONE_COMMAND")
         override (env-str env override-key)]
     (when (and (string? repo-url) (string? session-id) (string? repo-dir))
       (if (string? override)
         (fill-repo-template override {:repo-url repo-url
                                       :session-id session-id
                                       :repo-dir repo-dir})
         (str "mkdir -p '" (escape-shell-single base-dir) "'"
              " && cd '" (escape-shell-single base-dir) "'"
              " && git clone --depth 1 --single-branch --no-tags '"
              (escape-shell-single repo-url) "' '" (escape-shell-single repo-dir) "'"
              " && chmod -R u+rw '" (escape-shell-single repo-dir) "'"))))))

(defn- project-init-setup-command
  ([session-id task]
   (project-init-setup-command session-id task "sprites"))
  ([session-id task provider]
   (let [setup-script (task-project-init-setup task)
         session-id (some-> session-id str)
         repo-dir (get-repo-dir session-id task provider)]
     (when (and (string? setup-script) (string? repo-dir))
       (str "set -e; cd '" (escape-shell-single repo-dir) "'; " setup-script)))))

(defn- classify-push-error
  [error]
  (let [data (ex-data error)
        {:keys [stderr stdout]} (when (map? data) data)
        message (str (or (ex-message error) "")
                     "\n"
                     (or stderr "")
                     "\n"
                     (or stdout ""))
        message (string/lower-case message)]
    (cond
      (or (string/includes? message "authentication failed")
          (string/includes? message "could not read username")
          (string/includes? message "permission denied")
          (string/includes? message "repository not found"))
      :auth

      (or (string/includes? message "src refspec")
          (string/includes? message "does not match any"))
      :no-commits

      (or (string/includes? message "non-fast-forward")
          (string/includes? message "[rejected]")
          (string/includes? message "fetch first"))
      :remote-rejected

      :else
      :unknown)))

(defn- push-command
  [{:keys [repo-dir remote-url head-branch] :as opts}]
  (let [force? (true? (:force opts))
        commit-message (or (some-> (:commit-message opts) string/trim not-empty)
                           "chore(agent): update files")
        branch (escape-shell-single head-branch)
        commit-message (escape-shell-single commit-message)
        remote (escape-shell-single remote-url)]
    (str "set -e; "
         "cd '" (escape-shell-single repo-dir) "'; "
         "git rev-parse --is-inside-work-tree >/dev/null; "
         "git checkout -B '" branch "'; "
         "git add -A; "
         "if git diff --cached --quiet; then true; else "
         "git -c user.name='Logseq Agent' -c user.email='agent@logseq.local' "
         "commit -m '" commit-message "'; "
         "fi; "
         "git push '" remote "' HEAD:refs/heads/" branch
         (when force? " --force"))))

(def ^:private bundle-head-marker "__BUNDLE_HEAD__")
(def ^:private bundle-base-marker "__BUNDLE_BASE__")
(def ^:private bundle-bytes-marker "__BUNDLE_BYTES__")
(def ^:private bundle-checksum-marker "__BUNDLE_SHA256__")
(def ^:private bundle-branch-marker "__BUNDLE_BRANCH__")
(def ^:private bundle-data-marker "__BUNDLE_DATA__")

(defn- marker-value
  [output marker]
  (some->> output
           (re-find (re-pattern (str "(?m)^" marker ":(.*)$")))
           second
           string/trim
           not-empty))

(defn- parse-int-safe
  [value]
  (let [parsed (some-> value js/parseInt)]
    (when (and (number? parsed)
               (not (js/isNaN parsed)))
      parsed)))

(defn- export-workspace-bundle-command
  [repo-dir base-branch preferred-head-branch]
  (let [repo-dir (escape-shell-single repo-dir)
        bundle-path (str "/tmp/workspace-" (random-uuid) ".bundle")
        bundle-path (escape-shell-single bundle-path)
        base-branch (or (some-> base-branch source-control/sanitize-branch-name) "main")
        preferred-head-branch (some-> preferred-head-branch source-control/sanitize-branch-name)]
    (str "set -e; "
         "cd '" repo-dir "'; "
         "git rev-parse --is-inside-work-tree >/dev/null; "
         "if ! git diff --quiet || ! git diff --cached --quiet || [ -n \"$(git ls-files --others --exclude-standard)\" ]; then "
         "git add -A; "
         "if ! git diff --cached --quiet; then "
         "git -c user.name='Logseq Agent' -c user.email='agent@logseq.local' "
         "commit -m 'chore(agent): checkpoint workspace' >/dev/null 2>&1 || true; "
         "fi; "
         "fi; "
         "current_head_branch=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true); "
         "head_branch=''; "
         (when (string? preferred-head-branch)
           (str "if git show-ref --verify --quiet 'refs/heads/"
                (escape-shell-single preferred-head-branch)
                "'; then head_branch='"
                (escape-shell-single preferred-head-branch)
                "'; fi; "))
         "if [ -z \"$head_branch\" ] && [ -n \"$current_head_branch\" ] && git show-ref --verify --quiet \"refs/heads/$current_head_branch\"; then head_branch=\"$current_head_branch\"; fi; "
         "if [ -z \"$head_branch\" ]; then head_branch='"
         (escape-shell-single base-branch)
         "'; fi; "
         "head_ref='refs/heads/'\"$head_branch\"; "
         "if git show-ref --verify --quiet \"$head_ref\"; then bundle_target=\"$head_ref\"; else bundle_target='HEAD'; fi; "
         "head_sha=$(git rev-parse \"$bundle_target\"); "
         "base_sha=$(git rev-list --max-parents=0 HEAD | tail -n 1); "
         "base_ref='refs/remotes/origin/"
         (escape-shell-single base-branch)
         "'; "
         "if git show-ref --verify --quiet \"$base_ref\"; then "
         "git bundle create '" bundle-path "' \"$bundle_target\" ^\"$base_ref\" >/dev/null; "
         "else "
         "git bundle create '" bundle-path "' \"$bundle_target\" >/dev/null; "
         "fi; "
         "byte_size=$(wc -c < '" bundle-path "' | tr -d '[:space:]'); "
         "checksum=$((sha256sum '" bundle-path "' 2>/dev/null || shasum -a 256 '" bundle-path "') | awk '{print $1}'); "
         "printf '" bundle-head-marker ":%s\\n' \"$head_sha\"; "
         "printf '" bundle-base-marker ":%s\\n' \"$base_sha\"; "
         "printf '" bundle-bytes-marker ":%s\\n' \"$byte_size\"; "
         "printf '" bundle-checksum-marker ":%s\\n' \"$checksum\"; "
         "printf '" bundle-branch-marker ":%s\\n' \"$head_branch\"; "
         "printf '" bundle-data-marker ":'; "
         "base64 < '" bundle-path "' | tr -d '\\n'; "
         "printf '\\n'; ")))

(defn- parse-exported-workspace-bundle
  [output]
  (let [head-sha (marker-value output bundle-head-marker)
        base-sha (marker-value output bundle-base-marker)
        byte-size (some-> (marker-value output bundle-bytes-marker) parse-int-safe)
        checksum (marker-value output bundle-checksum-marker)
        head-branch (some-> (marker-value output bundle-branch-marker) source-control/sanitize-branch-name)
        bundle-base64 (marker-value output bundle-data-marker)]
    (when (and (string? head-sha)
               (number? byte-size)
               (pos? byte-size)
               (string? bundle-base64))
      (cond-> {:head-sha head-sha
               :byte-size byte-size
               :bundle-base64 bundle-base64}
        (string? base-sha) (assoc :base-sha base-sha)
        (string? checksum) (assoc :checksum checksum)
        (string? head-branch) (assoc :head-branch head-branch)))))

(defn- apply-workspace-bundle-command
  [repo-dir {:keys [head-sha head-branch bundle-base64]}]
  (let [repo-dir (escape-shell-single repo-dir)
        head-sha (escape-shell-single head-sha)
        head-branch (escape-shell-single (or (source-control/sanitize-branch-name head-branch) "main"))
        bundle-base64 (escape-shell-single bundle-base64)
        bundle-id (str (random-uuid))
        base64-path (escape-shell-single (str "/tmp/workspace-" bundle-id ".bundle.b64"))
        bundle-path (escape-shell-single (str "/tmp/workspace-" bundle-id ".bundle"))]
    (str "set -e; "
         "cd '" repo-dir "'; "
         "git rev-parse --is-inside-work-tree >/dev/null; "
         "printf '%s' '" bundle-base64 "' > '" base64-path "'; "
         "base64 -d '" base64-path "' > '" bundle-path "'; "
         "git bundle verify '" bundle-path "' >/dev/null; "
         "git reset --hard >/dev/null; "
         "git clean -fd >/dev/null; "
         "git fetch '" bundle-path "' '" head-sha "' >/dev/null; "
         "git checkout -B '" head-branch "' '" head-sha "'; "
         "git reset --hard '" head-sha "' >/dev/null; "
         "git clean -fd >/dev/null; "
         "current_branch=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || true); "
         "if [ \"$current_branch\" != '" head-branch "' ]; then "
         "echo \"bundle restore branch mismatch: expected " head-branch ", got $current_branch\" >&2; "
         "exit 1; "
         "fi; "
         "current_sha=$(git rev-parse HEAD); "
         "if [ \"$current_sha\" != '" head-sha "' ]; then "
         "echo \"bundle restore commit mismatch: expected " head-sha ", got $current_sha\" >&2; "
         "exit 1; "
         "fi; "
         "rm -f '" base64-path "' '" bundle-path "'; ")))

(defn session-payload [task]
  (let [agent (or (get-in task [:agent :provider])
                  (get-in task [:agent :id])
                  (:agent task))
        agent (or (sandbox/normalize-agent-id agent) agent)]
    {:agent agent
     :agentMode (or (get-in task [:agent :mode])
                    (get-in task [:agent :agent-mode])
                    (get-in task [:agent :model])
                    "build")
     :permissionMode (or (get-in task [:agent :permission-mode])
                         (get-in task [:agent :permissionMode])
                         (if (= agent "codex")
                           "bypass"
                           "default"))}))

(defn- message-payload [message]
  {:message (:message message)})

(def ^:private sprite-http-status-marker "__HTTP_STATUS__")

(defn- parse-sprite-http-status [text]
  (when (string? text)
    (some-> (re-seq (re-pattern (str sprite-http-status-marker ":(\\d+)")) text)
            last
            second
            (parse-int 400))))

(defn- strip-sprite-http-status [text]
  (if-not (string? text)
    ""
    (string/replace text
                    (re-pattern (str "(?:\\n?" sprite-http-status-marker ":\\d+)+\\s*$"))
                    "")))

(defn- sprites-exec-output [result]
  (let [stdout (or (:stdout result)
                   (get-in result [:result :stdout])
                   (get-in result [:data :stdout])
                   (get-in result [:output :stdout]))
        stderr (or (:stderr result)
                   (get-in result [:result :stderr])
                   (get-in result [:data :stderr])
                   (get-in result [:output :stderr]))
        exit-code (or (:exitCode result)
                      (:exit-code result)
                      (get-in result [:result :exitCode])
                      (get-in result [:result :exit-code])
                      (get-in result [:data :exitCode])
                      (get-in result [:data :exit-code])
                      (get-in result [:output :exitCode])
                      (get-in result [:output :exit-code]))]
    {:stdout (cond
               (string? stdout) stdout
               (some? stdout) (str stdout)
               :else "")
     :stderr (cond
               (string? stderr) stderr
               (some? stderr) (str stderr)
               :else "")
     :exit-code (cond
                  (number? exit-code) exit-code
                  (string? exit-code) (parse-int exit-code nil)
                  :else nil)}))

(defn- <sprite-create-session! [^js env sprite-name port agent-token session-id payload]
  (let [script (str "resp=$(curl -sS -w '\\n%{http_code}' -X POST -H 'content-type: application/json' "
                    (if agent-token
                      (str (curl-auth-arg agent-token) " ")
                      "")
                    (curl-json-arg payload)
                    " "
                    (sprite-local-url port (str "/v1/sessions/" session-id)) "); "
                    "http_status=$(echo \"$resp\" | tail -n1); "
                    "body=$(echo \"$resp\" | sed '$d'); "
                    "printf \"%s\" \"$body\"; "
                    "printf \"\\n" sprite-http-status-marker ":%s\" \"$http_status\"; ")]
    (p/let [result (sprites-exec-post! env sprite-name ["bash" "-lc" script])
            {:keys [stdout stderr exit-code]} (sprites-exec-output result)
            status (or (parse-sprite-http-status stderr)
                       (parse-sprite-http-status stdout))
            parsed (parse-json-safe (strip-sprite-http-status stdout))]
      (when (or
             (not (number? status))
             (and (number? status) (not (<= 200 status 299))))
        (throw (ex-info "sandbox-agent create-session failed"
                        {:status status
                         :body parsed
                         :raw-body stdout
                         :stderr stderr})))
      (println :debug :sprite-create-session :status status :exit-code exit-code)
      (assoc parsed :session-id session-id))))

(defn- transient-create-session-error?
  [error]
  (let [{:keys [status raw-body stderr]} (ex-data error)
        msg (ex-message error)
        haystack (-> (str (or raw-body "") "\n" (or stderr "") "\n" (or msg ""))
                     string/lower-case)]
    (or (= status 0)
        (string/includes? haystack "__http_status__:000")
        (string/includes? haystack "failed to connect")
        (string/includes? haystack "could not connect")
        (string/includes? haystack "connection refused")
        (string/includes? haystack "connect(): connection refused")
        (string/includes? haystack "connection reset")
        (string/includes? haystack "timed out"))))

(defn- <sprite-create-session-with-retry!
  [^js env sprite-name port agent-token session-id payload retries interval-ms]
  (-> (<sprite-create-session! env sprite-name port agent-token session-id payload)
      (p/catch (fn [error]
                 (if (and (> retries 0) (transient-create-session-error? error))
                   (do
                     (println :debug :sprite-create-session-retry
                              {:sprite sprite-name
                               :session-id session-id
                               :retries-left retries
                               :error (ex-data error)})
                     (p/let [_ (p/delay interval-ms)]
                       (<sprite-create-session-with-retry! env
                                                           sprite-name
                                                           port
                                                           agent-token
                                                           session-id
                                                           payload
                                                           (dec retries)
                                                           interval-ms)))
                   (p/rejected error))))))

(defn- <sprite-clone-repo! [^js env sprite-name session-id task]
  (when-let [cmd (repo-clone-command env session-id task)]
    (sprites-exec-post! env sprite-name ["bash" "-lc" cmd])))

(defn- <sprite-run-project-init-setup! [^js env sprite-name session-id task]
  (when-let [cmd (project-init-setup-command session-id task)]
    (sprites-exec-post! env sprite-name ["bash" "-lc" cmd])))

;; ============================================================
;; RuntimeProvider + Providers
;; ============================================================

(defn- local-dev-base-url [^js env runtime]
  (or (:base-url runtime)
      (env-str env "SANDBOX_AGENT_URL")
      "http://127.0.0.1:2468"))

(defn- local-dev-token [^js env runtime]
  (or (:agent-token runtime)
      (env-str env "SANDBOX_AGENT_TOKEN")))

(defn- local-runner-base-url
  [task runtime]
  (or (some-> runtime :base-url strip-trailing-slash)
      (some-> task :runner :base-url strip-trailing-slash)))

(defn- local-runner-token
  [task runtime]
  (or (:agent-token runtime)
      (get-in task [:runner :agent-token])))

(defn- local-runner-headers
  [task runtime]
  (let [access-client-id (or (:access-client-id runtime)
                             (get-in task [:runner :access-client-id]))
        access-client-secret (or (:access-client-secret runtime)
                                 (get-in task [:runner :access-client-secret]))]
    (cond-> {}
      (string? access-client-id) (assoc "CF-Access-Client-Id" access-client-id)
      (string? access-client-secret) (assoc "CF-Access-Client-Secret" access-client-secret))))

(defn- e2b-api-key
  [^js env]
  (env-str env "E2B_API_KEY"))

(defn- e2b-domain
  [^js env]
  (env-str env "E2B_DOMAIN"))

(defn- e2b-template
  [^js env task runtime]
  (or (:template runtime)
      (some-> (get-in task [:runtime :template]) str string/trim not-empty)
      (env-str env "E2B_TEMPLATE")))

(defn- e2b-agent-token
  [^js env runtime]
  (or (:agent-token runtime)
      (env-str env "SANDBOX_AGENT_TOKEN")))

(defn- e2b-agent-port
  [^js env runtime]
  (or (:sandbox-port runtime)
      (parse-int (env-str env "E2B_SANDBOX_AGENT_PORT") 2468)))

(defn- e2b-health-retries
  [^js env]
  (parse-int (env-str env "E2B_HEALTH_RETRIES") 30))

(defn- e2b-health-interval-ms
  [^js env]
  (parse-int (env-str env "E2B_HEALTH_INTERVAL_MS") 300))

(defn- e2b-sandbox-timeout-ms
  [^js env]
  (parse-int (env-str env "E2B_SANDBOX_TIMEOUT_MS") (* 30 60 1000)))

(defn- e2b-api-opts
  [^js env]
  (let [api-key (e2b-api-key env)
        domain (e2b-domain env)]
    (when-not (string? api-key)
      (throw (ex-info "missing E2B_API_KEY for e2b runtime provider"
                      {:reason :missing-e2b-api-key})))
    (cond-> {:apiKey api-key}
      (string? domain) (assoc :domain domain))))

(defn e2b-sandbox-class
  []
  (let [sandbox-class (aget e2b "Sandbox")]
    (when-not sandbox-class
      (throw (ex-info "missing e2b Sandbox export"
                      {:reason :missing-e2b-sdk})))
    sandbox-class))

(defn- e2b-sandbox-id
  [sandbox]
  (or (aget sandbox "sandboxId")
      (aget sandbox "id")))

(defn- e2b-sandbox-host
  [sandbox port]
  (let [get-host (js-method sandbox "getHost")]
    (when-not (fn? get-host)
      (throw (ex-info "e2b sandbox missing getHost method"
                      {:reason :missing-e2b-get-host})))
    (.call get-host sandbox port)))

(defn <e2b-create-sandbox!
  [^js env template opts]
  (let [sandbox-class (e2b-sandbox-class)
        create (js-method sandbox-class "create")
        params (clj->js (merge (e2b-api-opts env) opts))]
    (when-not (fn? create)
      (throw (ex-info "e2b sdk missing Sandbox.create"
                      {:reason :missing-e2b-create})))
    (if (string? template)
      (->promise (.call create sandbox-class template params))
      (->promise (.call create sandbox-class params)))))

(defn <e2b-connect-sandbox!
  [^js env sandbox-id]
  (let [sandbox-class (e2b-sandbox-class)
        connect (js-method sandbox-class "connect")
        opts (clj->js (e2b-api-opts env))]
    (when-not (string? sandbox-id)
      (throw (ex-info "missing sandbox-id on runtime"
                      {:reason :missing-sandbox-id})))
    (when-not (fn? connect)
      (throw (ex-info "e2b sdk missing Sandbox.connect"
                      {:reason :missing-e2b-connect})))
    (->promise (.call connect sandbox-class sandbox-id opts))))

(defn <e2b-kill-sandbox!
  [^js env sandbox-id]
  (let [sandbox-class (e2b-sandbox-class)
        kill (js-method sandbox-class "kill")
        opts (clj->js (e2b-api-opts env))]
    (if (and (string? sandbox-id) (fn? kill))
      (->promise (.call kill sandbox-class sandbox-id opts))
      (p/resolved nil))))

(defn <e2b-run-shell!
  [sandbox command & [opts]]
  (let [commands (when sandbox (aget sandbox "commands"))
        run-command (js-method commands "run")
        params (cond-> {}
                 (string? (:cwd opts)) (assoc :cwd (:cwd opts))
                 (map? (:env opts)) (assoc :envs (:env opts))
                 (number? (:timeout-ms opts)) (assoc :timeoutMs (:timeout-ms opts))
                 (true? (:background opts)) (assoc :background true)
                 (fn? (:on-stdout opts)) (assoc :onStdout (:on-stdout opts))
                 (fn? (:on-stderr opts)) (assoc :onStderr (:on-stderr opts)))]
    (when-not (fn? run-command)
      (throw (ex-info "e2b sandbox missing commands.run"
                      {:reason :missing-e2b-run-command})))
    (if (true? (:background opts))
      (->promise (.call run-command commands command (clj->js params)))
      (p/let [result (->promise (.call run-command commands command (clj->js params)))
              stdout (or (aget result "stdout") "")
              stderr (or (aget result "stderr") "")
              exit-code (or (aget result "exitCode")
                            (aget result "exit_code"))]
        (when (and (number? exit-code) (not (zero? exit-code)))
          (throw (ex-info "e2b sandbox command failed"
                          {:reason :e2b-command-failed
                           :command command
                           :exit-code exit-code
                           :stdout stdout
                           :stderr stderr})))
        {:stdout stdout
         :stderr stderr
         :exit-code exit-code}))))

(defn- e2b-health-command
  [port agent-token]
  (str "if curl -fsS "
       (curl-auth-arg agent-token)
       " "
       cloudflare-local-host
       ":"
       port
       "/v1/health >/dev/null; then echo __HEALTH_OK__; else echo __HEALTH_FAIL__; fi"))

(defn- <e2b-health-once!
  [sandbox port agent-token]
  (-> (<e2b-run-shell! sandbox (e2b-health-command port agent-token))
      (p/then (fn [{:keys [stdout stderr]}]
                (let [output (str stdout "\n" stderr)]
                  (string/includes? output "__HEALTH_OK__"))))
      (p/catch (fn [_] false))))

(defn- <e2b-health!
  [^js env sandbox port agent-token]
  (let [retries (e2b-health-retries env)
        interval-ms (e2b-health-interval-ms env)]
    (letfn [(step [left]
              (if (<= left 0)
                (throw (ex-info "sandbox-agent health check timed out in e2b sandbox"
                                {:port port}))
                (p/let [healthy? (<e2b-health-once! sandbox port agent-token)]
                  (if healthy?
                    true
                    (p/let [_ (p/delay interval-ms)]
                      (step (dec left)))))))]
      (step retries))))

(declare normalize-agent-env-map cloudflare-env-pass-through)

(defn- <e2b-agent-env-vars!
  [^js env task]
  (let [base (reduce (fn [acc k]
                       (if-let [v (env-str env k)]
                         (assoc acc k v)
                         acc))
                     {}
                     cloudflare-env-pass-through)
        task-env (normalize-agent-env-map (get-in task [:agent :env]))
        agent-id (:agent (session-payload task))
        api-token (some-> (get-in task [:agent :api-token]) str string/trim not-empty)]
    (p/let [github-token (<github-installation-token-for-task! env task)]
      (cond-> (merge base task-env)
        (and (string? api-token) (= "codex" agent-id)) (assoc "OPENAI_API_KEY" api-token)
        (and (string? api-token) (= "claude" agent-id)) (assoc "ANTHROPIC_API_KEY" api-token)
        (string? github-token) (assoc-github-installation-token github-token)))))

(defn- e2b-create-opts
  [^js env session-id env-vars]
  (let [timeout-ms (e2b-sandbox-timeout-ms env)
        metadata (cond-> {"session-id" (or session-id "")
                          "runtime-provider" "e2b"}
                   (string? session-id) (assoc "runtime-session-id" session-id))]
    (cond-> {:timeoutMs timeout-ms
             :lifecycle {:onTimeout "pause"
                         :autoResume true}}
      (seq env-vars) (assoc :envs env-vars)
      (string? session-id) (assoc :metadata metadata))))

(defn- e2b-server-command
  [^js env task session-id port agent-token env-vars]
  (let [auth-json (get-in task [:agent :auth-json])
        write-auth (or (auth-json-write-command auth-json) "")
        repo-cd (or (repo-cd-command session-id task "e2b") "")
        token-exports (shell-export-command env-vars)
        github-auth-setup (github-auth-setup-command (get env-vars "GITHUB_TOKEN"))]
    (str (sandbox-agent-install-command env)
         token-exports
         github-auth-setup
         write-auth
         (when (string? repo-cd) (str repo-cd "; "))
         "nohup sandbox-agent server "
         (if (string? agent-token)
           (str "--token '" (escape-shell-single agent-token) "'")
           "--no-token")
         " --host 0.0.0.0 --port " port
         " --no-telemetry >/tmp/sandbox-agent.log 2>&1 &")))

(defn- <e2b-clone-repo!
  [^js env sandbox session-id task]
  (when-let [cmd (repo-clone-command env session-id task "e2b")]
    (<e2b-run-shell! sandbox cmd)))

(defn- <e2b-run-project-init-setup!
  [sandbox session-id task]
  (when-let [cmd (project-init-setup-command session-id task "e2b")]
    (<e2b-run-shell! sandbox cmd)))

(defn- <e2b-ensure-running!
  [^js env sandbox session-id task port agent-token env-vars]
  (p/let [healthy? (<e2b-health-once! sandbox port agent-token)]
    (if healthy?
      true
      (p/let [bootstrap-cmd (e2b-server-command env task session-id port agent-token env-vars)
              _ (<e2b-run-shell! sandbox bootstrap-cmd)
              _ (<e2b-health! env sandbox port agent-token)]
        true))))

(defn <e2b-create-snapshot!
  [sandbox]
  (let [create-snapshot (js-method sandbox "createSnapshot")]
    (when-not (fn? create-snapshot)
      (throw (ex-info "e2b runtime does not support snapshots"
                      {:reason :unsupported-snapshot
                       :provider "e2b"})))
    (p/let [snapshot (->promise (.call create-snapshot sandbox))
            snapshot-id (or (aget snapshot "snapshotId")
                            (aget snapshot "snapshotID"))]
      (if (string? snapshot-id)
        {:snapshot-id snapshot-id}
        (throw (ex-info "e2b snapshot create returned invalid id"
                        {:reason :invalid-snapshot-id
                         :snapshot snapshot}))))))

(defn- <e2b-create-sandbox-from-checkpoint!
  [^js env checkpoint create-opts]
  (let [snapshot-id (:snapshot-id checkpoint)]
    (if-not (string? snapshot-id)
      (p/resolved nil)
      (-> (<e2b-create-sandbox! env snapshot-id create-opts)
          (p/then (fn [sandbox]
                    (log/debug :agent/e2b-snapshot-restored
                               {:snapshot-id snapshot-id
                                :source "task-checkpoint"})
                    {:sandbox sandbox
                     :snapshot-id snapshot-id
                     :restored? true}))
          (p/catch (fn [error]
                     (log/error :agent/e2b-snapshot-restore-failed
                                {:snapshot-id snapshot-id
                                 :source "task-checkpoint"
                                 :error (str error)})
                     nil))))))

(defn- <e2b-create-sandbox-for-restore!
  [^js env template checkpoint create-opts]
  (p/let [checkpoint-restore (<e2b-create-sandbox-from-checkpoint! env checkpoint create-opts)]
    (if (map? checkpoint-restore)
      checkpoint-restore
      (p/let [sandbox (<e2b-create-sandbox! env template create-opts)]
        {:sandbox sandbox
         :snapshot-id nil
         :restored? false}))))

(defn- <e2b-runtime-base-url!
  [^js env runtime]
  (let [cached (:base-url runtime)
        port (e2b-agent-port env runtime)
        sandbox-id (:sandbox-id runtime)]
    (if (string? cached)
      (p/resolved cached)
      (p/let [sandbox (<e2b-connect-sandbox! env sandbox-id)]
        (e2b-sandbox-host sandbox port)))))

(defn- <e2b-export-workspace-bundle!
  [^js env runtime opts]
  (let [sandbox-id (:sandbox-id runtime)
        task (:task opts)
        session-id (:session-id runtime)
        repo-dir (or (:backup-dir runtime)
                     (get-repo-dir session-id task "e2b"))
        base-branch (or (some-> (get-in task [:project :base-branch]) source-control/sanitize-branch-name)
                        "main")
        head-branch (some-> (:head-branch opts) source-control/sanitize-branch-name)]
    (when-not (string? sandbox-id)
      (throw (ex-info "missing sandbox-id on runtime"
                      {:reason :missing-sandbox-id
                       :runtime runtime})))
    (when-not (string? repo-dir)
      (throw (ex-info "missing repo dir for workspace bundle export"
                      {:reason :missing-repo-dir
                       :session-id session-id})))
    (p/let [sandbox (<e2b-connect-sandbox! env sandbox-id)
            result (<e2b-run-shell! sandbox (export-workspace-bundle-command repo-dir base-branch head-branch))]
      (or (parse-exported-workspace-bundle (:stdout result))
          (throw (ex-info "invalid workspace bundle export output"
                          {:reason :invalid-bundle-export-output
                           :provider "e2b"}))))))

(defn- <e2b-apply-workspace-bundle!
  [^js env runtime opts]
  (let [sandbox-id (:sandbox-id runtime)
        task (:task opts)
        session-id (:session-id runtime)
        repo-dir (or (:backup-dir runtime)
                     (get-repo-dir session-id task "e2b"))
        head-sha (some-> (:head-sha opts) str string/trim not-empty)
        bundle-base64 (some-> (:bundle-base64 opts) str string/trim not-empty)
        head-branch (some-> (:head-branch opts) source-control/sanitize-branch-name)]
    (when-not (string? sandbox-id)
      (throw (ex-info "missing sandbox-id on runtime"
                      {:reason :missing-sandbox-id
                       :runtime runtime})))
    (when-not (string? repo-dir)
      (throw (ex-info "missing repo dir for workspace bundle apply"
                      {:reason :missing-repo-dir
                       :session-id session-id})))
    (when-not (string? head-sha)
      (throw (ex-info "missing bundle head sha"
                      {:reason :missing-bundle-head-sha
                       :provider "e2b"})))
    (when-not (string? bundle-base64)
      (throw (ex-info "missing bundle payload"
                      {:reason :missing-bundle-payload
                       :provider "e2b"})))
    (p/let [sandbox (<e2b-connect-sandbox! env sandbox-id)
            command (apply-workspace-bundle-command repo-dir
                                                    {:head-sha head-sha
                                                     :head-branch head-branch
                                                     :bundle-base64 bundle-base64})
            _ (<e2b-run-shell! sandbox command)]
      true)))

(defn- <e2b-open-terminal!
  [^js env runtime request]
  (let [session-id (:session-id runtime)]
    (when-not (string? session-id)
      (throw (ex-info "missing runtime session-id on runtime"
                      {:runtime runtime})))
    (let [agent-token (e2b-agent-token env runtime)]
      (p/let [base-url (<e2b-runtime-base-url! env runtime)
              req-url (platform/request-url request)
              terminal-url (str (sandbox/session-url base-url session-id) "/terminal" (.-search req-url))
              headers (js/Headers. (.-headers request))
              _ (when (string? agent-token)
                  (.set headers "authorization" (str "Bearer " agent-token)))
              req (js/Request. terminal-url
                               #js {:method (.-method request)
                                    :headers headers})
              resp (js/fetch req)
              status (.-status resp)]
        (if (or (= status 101) (<= 200 status 299))
          resp
          (throw (ex-info "e2b open-terminal failed"
                          {:status status
                           :session-id session-id})))))))

(defn- vercel-agent-token [^js env runtime]
  (or (:agent-token runtime)
      (env-str env "SANDBOX_AGENT_TOKEN")))

(defn- vercel-agent-port [^js env runtime]
  (or (:sandbox-port runtime)
      (parse-int (env-str env "VERCEL_SANDBOX_AGENT_PORT") 2468)))

(defn- vercel-health-retries [^js env]
  (parse-int (env-str env "VERCEL_HEALTH_RETRIES") 30))

(defn- vercel-health-interval-ms [^js env]
  (parse-int (env-str env "VERCEL_HEALTH_INTERVAL_MS") 300))

(defn- vercel-sandbox-timeout-ms [^js env]
  (parse-int (env-str env "VERCEL_SANDBOX_TIMEOUT_MS") (* 3 60 1000)))

(defn- vercel-sandbox-runtime [^js env]
  (or (env-str env "VERCEL_SANDBOX_RUNTIME")
      "node24"))

(defn- vercel-sandbox-vcpus [^js env]
  (let [v (parse-int (env-str env "VERCEL_SANDBOX_VCPUS") 0)]
    (when (pos? v) v)))

(defn- vercel-sdk-credentials [^js env]
  (let [team-id (env-str env "VERCEL_TEAM_ID")
        project-id (env-str env "VERCEL_PROJECT_ID")
        token (env-str env "VERCEL_TOKEN")
        has-explicit? (or (string? team-id) (string? project-id) (string? token))]
    (cond
      (and (string? team-id) (string? project-id) (string? token))
      {:teamId team-id
       :projectId project-id
       :token token}

      has-explicit?
      (throw (ex-info "missing VERCEL_TEAM_ID/VERCEL_PROJECT_ID/VERCEL_TOKEN for vercel runtime provider"
                      {:reason :missing-vercel-credentials
                       :team-id? (boolean (string? team-id))
                       :project-id? (boolean (string? project-id))
                       :token? (boolean (string? token))}))

      :else
      (throw (ex-info "missing vercel sdk credentials"
                      {:reason :missing-vercel-credentials
                       :required ["VERCEL_TEAM_ID" "VERCEL_PROJECT_ID" "VERCEL_TOKEN"]})))))

(defn- cloudflare-sandbox-namespace [^js env]
  (let [sandbox-ns (aget env "Sandbox")]
    (when-not sandbox-ns
      (throw (ex-info "missing Sandbox binding for cloudflare runtime provider" {})))
    sandbox-ns))

(defn- cloudflare-sandbox [^js env sandbox-id]
  (let [^js sandbox-ns (cloudflare-sandbox-namespace env)
        get-sandbox (js-method cf-sandbox "getSandbox")]
    (when-not (fn? get-sandbox)
      (throw (ex-info "cloudflare sandbox sdk missing getSandbox method" {})))
    (let [sandbox (.call get-sandbox cf-sandbox sandbox-ns sandbox-id
                         #js {:sleepAfter "10m"})]
      (when-not sandbox
        (throw (ex-info "failed to get cloudflare sandbox"
                        {:sandbox-id sandbox-id})))
      sandbox)))

(defn- cloudflare-health-command [port agent-token]
  (str "curl -fsS "
       (curl-auth-arg agent-token)
       " "
       cloudflare-local-host
       ":"
       port
       "/v1/health >/dev/null"))

(defn- <cloudflare-exec! [sandbox cmd]
  (if (js-method sandbox "exec")
    (->promise (.exec sandbox cmd))
    (throw (ex-info "cloudflare sandbox missing exec method" {}))))

(declare cloudflare-exec-output)

(defn- <cloudflare-export-workspace-bundle!
  [^js env runtime opts]
  (let [sandbox-id (:sandbox-id runtime)
        task (:task opts)
        session-id (:session-id runtime)
        repo-dir (or (:backup-dir runtime)
                     (get-repo-dir session-id task "cloudflare"))
        base-branch (or (some-> (get-in task [:project :base-branch]) source-control/sanitize-branch-name)
                        "main")
        head-branch (some-> (:head-branch opts) source-control/sanitize-branch-name)]
    (when-not (string? sandbox-id)
      (throw (ex-info "missing sandbox-id on runtime"
                      {:reason :missing-sandbox-id
                       :runtime runtime})))
    (when-not (string? repo-dir)
      (throw (ex-info "missing repo dir for workspace bundle export"
                      {:reason :missing-repo-dir
                       :session-id session-id})))
    (let [sandbox (cloudflare-sandbox env sandbox-id)]
      (p/let [result (<cloudflare-exec! sandbox (export-workspace-bundle-command repo-dir base-branch head-branch))
              {:keys [stdout]} (cloudflare-exec-output result)]
        (or (parse-exported-workspace-bundle stdout)
            (throw (ex-info "invalid workspace bundle export output"
                            {:reason :invalid-bundle-export-output
                             :provider "cloudflare"})))))))

(defn- <cloudflare-apply-workspace-bundle!
  [^js env runtime opts]
  (let [sandbox-id (:sandbox-id runtime)
        task (:task opts)
        session-id (:session-id runtime)
        repo-dir (or (:backup-dir runtime)
                     (get-repo-dir session-id task "cloudflare"))
        head-sha (some-> (:head-sha opts) str string/trim not-empty)
        bundle-base64 (some-> (:bundle-base64 opts) str string/trim not-empty)
        head-branch (some-> (:head-branch opts) source-control/sanitize-branch-name)]
    (when-not (string? sandbox-id)
      (throw (ex-info "missing sandbox-id on runtime"
                      {:reason :missing-sandbox-id
                       :runtime runtime})))
    (when-not (string? repo-dir)
      (throw (ex-info "missing repo dir for workspace bundle apply"
                      {:reason :missing-repo-dir
                       :session-id session-id})))
    (when-not (string? head-sha)
      (throw (ex-info "missing bundle head sha"
                      {:reason :missing-bundle-head-sha
                       :provider "cloudflare"})))
    (when-not (string? bundle-base64)
      (throw (ex-info "missing bundle payload"
                      {:reason :missing-bundle-payload
                       :provider "cloudflare"})))
    (let [sandbox (cloudflare-sandbox env sandbox-id)]
      (p/let [_ (<cloudflare-exec! sandbox
                                   (apply-workspace-bundle-command repo-dir
                                                                   {:head-sha head-sha
                                                                    :head-branch head-branch
                                                                    :bundle-base64 bundle-base64}))]
        true))))

(defn- cloudflare-exec-output
  [result]
  {:stdout (or (aget result "stdout") "")
   :stderr (or (aget result "stderr") "")
   :exit-code (or (aget result "exitCode")
                  (aget result "exit_code"))
   :success (let [success (aget result "success")]
              (if (boolean? success) success true))})

(defn- <cloudflare-health-once! [sandbox port agent-token]
  (-> (js/Promise.resolve (<cloudflare-exec! sandbox (cloudflare-health-command port agent-token)))
      (.then (fn [result]
               (let [success (when result (aget result "success"))]
                 (if (boolean? success)
                   success
                   true))))
      (.catch (fn [_] false))))

(defn- <cloudflare-health! [sandbox port agent-token retries interval-ms]
  (log/debug :agent/cloudflare-health-check
             {:port port
              :retries retries
              :interval-ms interval-ms
              :token? (boolean (string? agent-token))})
  (if (<= retries 0)
    (throw (ex-info "sandbox-agent health check timed out in cloudflare sandbox"
                    {:port port}))
    (p/let [healthy? (<cloudflare-health-once! sandbox port agent-token)]
      (if healthy?
        true
        (p/let [_ (p/delay interval-ms)]
          (<cloudflare-health! sandbox port agent-token (dec retries) interval-ms))))))

(defn- normalize-agent-env-map [env-map]
  (if-not (map? env-map)
    {}
    (reduce-kv (fn [acc k v]
                 (if (and (some? k) (string? v))
                   (assoc acc (name k) v)
                   acc))
               {}
               env-map)))

(def ^:private cloudflare-env-pass-through
  ["OPENAI_API_KEY"
   "ANTHROPIC_API_KEY"
   "OPENAI_BASE_URL"
   "ANTHROPIC_BASE_URL"])

(defn- <cloudflare-agent-env-vars! [^js env task]
  (let [base (reduce (fn [acc k]
                       (if-let [v (env-str env k)]
                         (assoc acc k v)
                         acc))
                     {}
                     cloudflare-env-pass-through)
        task-env (normalize-agent-env-map (get-in task [:agent :env]))
        agent-id (:agent (session-payload task))
        api-token (some-> (get-in task [:agent :api-token]) str string/trim not-empty)]
    (p/let [github-token (<github-installation-token-for-task! env task)]
      (cond-> (merge base task-env)
        (and (string? api-token) (= "codex" agent-id)) (assoc "OPENAI_API_KEY" api-token)
        (and (string? api-token) (= "claude" agent-id)) (assoc "ANTHROPIC_API_KEY" api-token)
        (string? github-token) (assoc-github-installation-token github-token)))))

(defn- cloudflare-server-command [^js env task port agent-token]
  (let [auth-json (get-in task [:agent :auth-json])
        write-auth (or (auth-json-write-command auth-json) "")
        override (env-str env "CLOUDFLARE_BOOTSTRAP_COMMAND")]
    (or override
        (str (sandbox-agent-install-command env)
             write-auth
             "sandbox-agent server "
             (if (string? agent-token)
               (str "--token '" (escape-shell-single agent-token) "'")
               "--no-token")
             " --host 0.0.0.0 --port " port
             " --no-telemetry"))))

(defn- <cloudflare-set-env-vars! [^js sandbox env-vars]
  (cond
    (empty? env-vars)
    (p/resolved nil)

    (js-method sandbox "setEnvVars")
    (->promise (.setEnvVars sandbox (clj->js env-vars)))

    :else
    (p/resolved nil)))

(defn- <cloudflare-start-server! [^js env ^js sandbox task port agent-token]
  (let [command (cloudflare-server-command env task port agent-token)]
    (if (js-method sandbox "startProcess")
      (->promise (.startProcess sandbox command))
      (->promise (<cloudflare-exec! sandbox (str "nohup " command " >/tmp/sandbox-agent.log 2>&1 &"))))))

(defn- cloudflare-fetch-port-candidates [port]
  (->> [port 2468 8000]
       (filter number?)
       (distinct)
       (vec)))

(defn- error-message [error]
  (let [msg (when error (aget error "message"))]
    (if (string? msg) msg (str error))))

(defn- cloudflare-backup-config-error?
  [error]
  (let [message (-> (str (or (ex-message error) "")
                         "\n"
                         (error-message error))
                    string/lower-case)]
    (or (string/includes? message "invalidbackupconfigerror")
        (string/includes? message "backup not configured")
        (string/includes? message "backup_bucket")
        (string/includes? message "presigned url credentials")
        (string/includes? message "missing env vars")
        (string/includes? message "cf-r2-error header")
        (string/includes? message "response.statuscode = 500"))))

(defn- cloudflare-backup-config-message
  [error]
  (let [raw (or (some-> error ex-message str string/trim not-empty)
                (some-> (error-message error) str string/trim not-empty)
                (str error))
        lower-raw (string/lower-case raw)
        sanitized (-> raw
                      (string/replace #"(?i)^error:\s*" "")
                      (string/replace #"(?i)^invalidbackupconfigerror:\s*" "")
                      string/trim)]
    (cond
      (or (string/includes? lower-raw "cf-r2-error header")
          (string/includes? lower-raw "response.statuscode = 500"))
      (str "snapshot upload succeeded but backup verification through BACKUP_BUCKET failed in local dev. "
           "Ensure the R2 binding uses remote=true and run both workers with remote mode "
           "(e.g. `wrangler dev --remote` for sync and agents).")

      (string/blank? sanitized)
      "snapshot backup is not configured. Configure BACKUP_BUCKET and backup credentials in wrangler.agents.toml."

      :else
      sanitized)))

(defn- cloudflare-port-error?
  [error]
  (let [m (-> (error-message error) string/lower-case)]
    (or (string/includes? m "container port not found")
        (string/includes? m "connection refused")
        (string/includes? m "error proxying request to container"))))

(defn- <cloudflare-container-fetch! [^js sandbox request port]
  (if-not (js-method sandbox "containerFetch")
    (throw (ex-info "cloudflare sandbox missing containerFetch method" {}))
    (let [ports (cloudflare-fetch-port-candidates port)]
      (letfn [(step [idx last-error]
                (if (>= idx (count ports))
                  (if last-error
                    (throw last-error)
                    (throw (ex-info "cloudflare containerFetch failed: no candidate ports"
                                    {:requested-port port})))
                  (let [candidate (nth ports idx)]
                    (p/catch
                     (->promise (.containerFetch sandbox request candidate))
                     (fn [error]
                       (if (and (cloudflare-port-error? error)
                                (< (inc idx) (count ports)))
                         (step (inc idx) error)
                         (throw error)))))))]
        (step 0 nil)))))

(defn- <cloudflare-json-request!
  [sandbox port method path {:keys [token json-body]}]
  (let [^js headers (js/Headers.)
        _ (.set headers "accept" "application/json")
        _ (when json-body (.set headers "content-type" "application/json"))
        _ (when token (.set headers "authorization" (str "Bearer " token)))
        request (js/Request. (str cloudflare-local-host path)
                             (clj->js (cond-> {:method method :headers headers}
                                        json-body
                                        (assoc :body (js/JSON.stringify (clj->js json-body))))))]
    (p/let [resp (<cloudflare-container-fetch! sandbox request port)
            status (.-status resp)
            raw (->promise (.text resp))
            parsed (parse-json-safe raw)]
      (if (<= 200 status 299)
        parsed
        (throw (ex-info "cloudflare sandbox request failed"
                        {:status status
                         :path path
                         :body parsed
                         :raw-body raw}))))))

(defn- <cloudflare-events-stream-request!
  [sandbox port token session-id]
  (let [^js headers (js/Headers.)
        _ (.set headers "accept" "text/event-stream")
        _ (when token (.set headers "authorization" (str "Bearer " token)))
        request (js/Request. (str cloudflare-local-host
                                  "/v1/sessions/"
                                  session-id
                                  "/events/sse")
                             #js {:method "GET"
                                  :headers headers})]
    (p/let [resp (<cloudflare-container-fetch! sandbox request port)
            status (.-status resp)]
      (if (<= 200 status 299)
        resp
        (throw (ex-info "cloudflare sandbox open-events-stream failed"
                        {:status status
                         :session-id session-id}))))))

(defn- <cloudflare-send-message! [sandbox port token session-id message]
  (<cloudflare-json-request! sandbox
                             port
                             "POST"
                             (str "/v1/sessions/" session-id "/messages")
                             {:token token
                              :json-body (message-payload message)}))

(defn- <cloudflare-restore-backup!
  [^js sandbox _backup-key target-dir {:keys [backup-id]}]
  (let [backup-id (some-> backup-id str string/trim not-empty)
        restore-backup (js-method sandbox "restoreBackup")]
    (cond
      (or (not (string? target-dir))
          (not (string? backup-id)))
      (p/resolved false)

      (not (fn? restore-backup))
      (p/resolved false)

      :else
      (let [backup #js {:id backup-id
                        :dir target-dir}]
        (-> (->promise (.restoreBackup sandbox backup))
            (p/then (fn [_]
                      (log/debug :agent/cloudflare-backup-restored
                                 {:backup-id backup-id
                                  :dir target-dir})
                      true))
            (p/catch (fn [error]
                       (log/error :agent/cloudflare-backup-restore-failed
                                  {:backup-id backup-id
                                   :dir target-dir
                                   :error (str error)})
                       false)))))))

(defn- <cloudflare-create-backup!
  [^js sandbox source-dir backup-name]
  (let [create-backup (js-method sandbox "createBackup")]
    (cond
      (not (string? source-dir))
      (p/rejected (ex-info "invalid snapshot source dir"
                           {:reason :invalid-snapshot-source-dir
                            :source-dir source-dir}))

      (not (fn? create-backup))
      (p/rejected (ex-info "cloudflare runtime does not support snapshots"
                           {:reason :unsupported-snapshot
                            :provider "cloudflare"}))

      :else
      (p/catch
       ;; Use direct method invocation instead of Function#call to avoid
       ;; serializing the sandbox proxy receiver across RPC boundaries.
       (p/let [backup (->promise (.createBackup sandbox (clj->js {:dir source-dir
                                                                  :name backup-name
                                                                  :ttl cloudflare-snapshot-ttl-seconds})))
               backup-id (aget backup "id")]
         (if (string? backup-id)
           (do
             (log/debug :agent/cloudflare-snapshot-created
                        {:snapshot-id backup-id
                         :name backup-name
                         :dir source-dir
                         :ttl-seconds cloudflare-snapshot-ttl-seconds})
             {:snapshot-id backup-id
              :name backup-name
              :dir source-dir})
           (throw (ex-info "cloudflare snapshot create returned invalid id"
                           {:reason :invalid-snapshot-id
                            :backup backup}))))
       (fn [error]
         (log/error :agent/cloudflare-snapshot-create-failed
                    {:name backup-name
                     :dir source-dir
                     :error (str error)})
         (if (cloudflare-backup-config-error? error)
           (p/rejected
            (ex-info (cloudflare-backup-config-message error)
                     {:reason :unsupported-snapshot
                      :provider "cloudflare"
                      :raw-error (str error)}))
           (p/rejected error)))))))

(defn- <cloudflare-clone-repo! [^js env sandbox session-id task]
  (when-let [cmd (repo-clone-command env session-id task "cloudflare")]
    (<cloudflare-exec! sandbox cmd)))

(defn- <cloudflare-run-project-init-setup! [sandbox session-id task]
  (when-let [cmd (project-init-setup-command session-id task)]
    (<cloudflare-exec! sandbox cmd)))

(defn- start-cloudflare-project-init-setup-background!
  [sandbox session-id task sandbox-id]
  (js/setTimeout
   (fn []
     (when-let [setup-promise (<cloudflare-run-project-init-setup! sandbox session-id task)]
       (-> setup-promise
           (p/catch (fn [error]
                      (log/error :agent/cloudflare-project-init-setup-failed
                                 {:session-id session-id
                                  :sandbox-id sandbox-id
                                  :error (str error)}))))))
   0)
  nil)

(defn- <cloudflare-setup-github-auth! [sandbox github-token]
  (if-not (string? github-token)
    (p/resolved nil)
    (<cloudflare-exec! sandbox (github-auth-setup-command github-token))))

(defn- <cloudflare-ensure-running! [^js env sandbox task port agent-token]
  (p/let [env-vars (<cloudflare-agent-env-vars! env task)
          _ (<cloudflare-set-env-vars! sandbox env-vars)
          _ (<cloudflare-setup-github-auth! sandbox (get env-vars "GITHUB_TOKEN"))
          healthy? (->promise (<cloudflare-health-once! sandbox port agent-token))]
    (if healthy?
      true
      (p/let [_ (<cloudflare-start-server! env sandbox task port agent-token)
              _ (<cloudflare-health! sandbox
                                     port
                                     agent-token
                                     (cloudflare-health-retries env)
                                     (cloudflare-health-interval-ms env))]
        (log/debug :agent/cloudflare-ready {:port port})
        true))))

(defn- <cloudflare-create-session! [sandbox port agent-token session-id payload]
  (p/let [response (<cloudflare-json-request! sandbox
                                              port
                                              "POST"
                                              (str "/v1/sessions/" session-id)
                                              {:token agent-token
                                               :json-body payload})]
    (assoc response :session-id session-id)))

(defn- <cloudflare-terminate-session! [sandbox port agent-token session-id]
  (<cloudflare-json-request! sandbox
                             port
                             "POST"
                             (str "/v1/sessions/" session-id "/terminate")
                             {:token agent-token}))

(defn- <cloudflare-destroy-sandbox! [^js sandbox]
  (->promise (.destroy sandbox)))

(defn- <cloudflare-open-terminal!
  [^js env runtime request {:keys [cols rows]}]
  (let [sandbox-id (:sandbox-id runtime)
        session-id (:session-id runtime)]
    (when-not (string? sandbox-id)
      (throw (ex-info "missing sandbox-id on runtime" {:runtime runtime})))
    (when-not (string? session-id)
      (throw (ex-info "missing runtime session-id on runtime" {:runtime runtime})))
    (let [sandbox (cloudflare-sandbox env sandbox-id)
          get-session (js-method sandbox "getSession")]
      (when-not (fn? get-session)
        (throw (ex-info "cloudflare sandbox missing getSession method"
                        {:reason :unsupported-terminal
                         :sandbox-id sandbox-id})))
      (p/let [session (->promise (.call get-session sandbox session-id))]
        (when-not session
          (throw (ex-info "cloudflare sandbox session not found"
                          {:sandbox-id sandbox-id
                           :session-id session-id})))
        (let [terminal (js-method session "terminal")
              opts (cond-> {}
                     (number? cols) (assoc :cols cols)
                     (number? rows) (assoc :rows rows))]
          (when-not (fn? terminal)
            (throw (ex-info "cloudflare sandbox session missing terminal method"
                            {:reason :unsupported-terminal
                             :sandbox-id sandbox-id
                             :session-id session-id})))
          (->promise (.call terminal session request (clj->js opts))))))))

(defn vercel-sandbox-class
  []
  (let [sandbox-class (aget vercel-sandbox "Sandbox")]
    (when-not sandbox-class
      (throw (ex-info "missing @vercel/sandbox Sandbox export"
                      {:reason :missing-vercel-sdk})))
    sandbox-class))

(defn- vercel-create-params
  [^js env source]
  (let [port (vercel-agent-port env nil)
        timeout-ms (vercel-sandbox-timeout-ms env)
        runtime (vercel-sandbox-runtime env)
        vcpus (vercel-sandbox-vcpus env)
        creds (vercel-sdk-credentials env)]
    (cond-> (merge creds
                   {:ports [port]
                    :timeout timeout-ms
                    :runtime runtime}
                   (when (map? source)
                     {:source source}))
      (number? vcpus) (assoc :resources {:vcpus vcpus}))))

(defn <vercel-create-sandbox!
  [^js env source]
  (let [sandbox-class (vercel-sandbox-class)
        create (js-method sandbox-class "create")]
    (when-not (fn? create)
      (throw (ex-info "vercel sdk missing Sandbox.create" {:reason :missing-vercel-create})))
    (->promise (.call create sandbox-class (clj->js (vercel-create-params env source))))))

(defn <vercel-get-sandbox!
  [^js env sandbox-id]
  (let [sandbox-class (vercel-sandbox-class)
        get-sandbox (js-method sandbox-class "get")]
    (when-not (string? sandbox-id)
      (throw (ex-info "missing sandbox-id on runtime"
                      {:reason :missing-sandbox-id})))
    (when-not (fn? get-sandbox)
      (throw (ex-info "vercel sdk missing Sandbox.get" {:reason :missing-vercel-get})))
    (->promise (.call get-sandbox sandbox-class
                      (clj->js (assoc (vercel-sdk-credentials env)
                                      :sandboxId sandbox-id))))))

(defn vercel-sandbox-domain
  [sandbox port]
  (let [domain (js-method sandbox "domain")]
    (when-not (fn? domain)
      (throw (ex-info "vercel sandbox missing domain method"
                      {:reason :missing-vercel-domain})))
    (.call domain sandbox port)))

(defn <vercel-stop-sandbox!
  [sandbox]
  (let [stop (js-method sandbox "stop")]
    (if (fn? stop)
      (->promise (.call stop sandbox #js {:blocking false}))
      (p/resolved nil))))

(defn- <vercel-command-output!
  [command]
  (let [stdout-fn (js-method command "stdout")
        stderr-fn (js-method command "stderr")]
    (p/let [stdout (if (fn? stdout-fn)
                     (->promise (.call stdout-fn command))
                     "")
            stderr (if (fn? stderr-fn)
                     (->promise (.call stderr-fn command))
                     "")]
      {:stdout (or stdout "")
       :stderr (or stderr "")
       :exit-code (aget command "exitCode")})))

(defn <vercel-run-shell!
  [sandbox command & [opts]]
  (let [run-command (js-method sandbox "runCommand")
        params (cond-> {:cmd "bash"
                        :args ["-lc" command]}
                 (map? (:env opts)) (assoc :env (:env opts))
                 (true? (:detached opts)) (assoc :detached true))]
    (when-not (fn? run-command)
      (throw (ex-info "vercel sandbox missing runCommand method"
                      {:reason :missing-vercel-run-command})))
    (if (true? (:detached opts))
      (->promise (.call run-command sandbox (clj->js params)))
      (p/let [result (->promise (.call run-command sandbox (clj->js params)))
              {:keys [stdout stderr exit-code]} (<vercel-command-output! result)]
        (when (and (number? exit-code) (not (zero? exit-code)))
          (throw (ex-info "vercel sandbox command failed"
                          {:reason :vercel-command-failed
                           :command command
                           :exit-code exit-code
                           :stdout stdout
                           :stderr stderr})))
        {:stdout stdout
         :stderr stderr
         :exit-code exit-code}))))

(defn- <vercel-export-workspace-bundle!
  [^js env runtime opts]
  (let [sandbox-id (:sandbox-id runtime)
        task (:task opts)
        session-id (:session-id runtime)
        repo-dir (or (:backup-dir runtime)
                     (get-repo-dir session-id task "vercel"))
        base-branch (or (some-> (get-in task [:project :base-branch]) source-control/sanitize-branch-name)
                        "main")
        head-branch (some-> (:head-branch opts) source-control/sanitize-branch-name)]
    (when-not (string? sandbox-id)
      (throw (ex-info "missing sandbox-id on runtime"
                      {:reason :missing-sandbox-id
                       :runtime runtime})))
    (when-not (string? repo-dir)
      (throw (ex-info "missing repo dir for workspace bundle export"
                      {:reason :missing-repo-dir
                       :session-id session-id})))
    (p/let [sandbox (<vercel-get-sandbox! env sandbox-id)
            result (<vercel-run-shell! sandbox (export-workspace-bundle-command repo-dir base-branch head-branch))]
      (or (parse-exported-workspace-bundle (:stdout result))
          (throw (ex-info "invalid workspace bundle export output"
                          {:reason :invalid-bundle-export-output
                           :provider "vercel"}))))))

(defn- <vercel-apply-workspace-bundle!
  [^js env runtime opts]
  (let [sandbox-id (:sandbox-id runtime)
        task (:task opts)
        session-id (:session-id runtime)
        repo-dir (or (:backup-dir runtime)
                     (get-repo-dir session-id task "vercel"))
        head-sha (some-> (:head-sha opts) str string/trim not-empty)
        bundle-base64 (some-> (:bundle-base64 opts) str string/trim not-empty)
        head-branch (some-> (:head-branch opts) source-control/sanitize-branch-name)]
    (when-not (string? sandbox-id)
      (throw (ex-info "missing sandbox-id on runtime"
                      {:reason :missing-sandbox-id
                       :runtime runtime})))
    (when-not (string? repo-dir)
      (throw (ex-info "missing repo dir for workspace bundle apply"
                      {:reason :missing-repo-dir
                       :session-id session-id})))
    (when-not (string? head-sha)
      (throw (ex-info "missing bundle head sha"
                      {:reason :missing-bundle-head-sha
                       :provider "vercel"})))
    (when-not (string? bundle-base64)
      (throw (ex-info "missing bundle payload"
                      {:reason :missing-bundle-payload
                       :provider "vercel"})))
    (p/let [sandbox (<vercel-get-sandbox! env sandbox-id)
            command (apply-workspace-bundle-command repo-dir
                                                    {:head-sha head-sha
                                                     :head-branch head-branch
                                                     :bundle-base64 bundle-base64})
            _ (prn :debug :apply-bundle-command command)
            _ (<vercel-run-shell! sandbox
                                  command)]
      true)))

(defn- vercel-health-command [port agent-token]
  (str "if curl -fsS "
       (curl-auth-arg agent-token)
       " "
       cloudflare-local-host
       ":"
       port
       "/v1/health >/dev/null; then echo __HEALTH_OK__; else echo __HEALTH_FAIL__; fi"))

(defn- <vercel-health-once! [sandbox port agent-token]
  (-> (<vercel-run-shell! sandbox (vercel-health-command port agent-token))
      (p/then (fn [{:keys [stdout stderr]}]
                (let [output (str stdout "\n" stderr)]
                  (string/includes? output "__HEALTH_OK__"))))
      (p/catch (fn [_] false))))

(defn- <vercel-health!
  [^js env sandbox port agent-token]
  (let [retries (vercel-health-retries env)
        interval-ms (vercel-health-interval-ms env)]
    (letfn [(step [left]
              (if (<= left 0)
                (throw (ex-info "sandbox-agent health check timed out in vercel sandbox"
                                {:port port}))
                (p/let [healthy? (<vercel-health-once! sandbox port agent-token)]
                  (if healthy?
                    true
                    (p/let [_ (p/delay interval-ms)]
                      (step (dec left)))))))]
      (step retries))))

(defn- <vercel-agent-env-vars!
  [^js env task]
  (let [base (reduce (fn [acc k]
                       (if-let [v (env-str env k)]
                         (assoc acc k v)
                         acc))
                     {}
                     cloudflare-env-pass-through)
        task-env (normalize-agent-env-map (get-in task [:agent :env]))
        agent-id (:agent (session-payload task))
        api-token (some-> (get-in task [:agent :api-token]) str string/trim not-empty)]
    (p/let [github-token (<github-installation-token-for-task! env task)]
      (cond-> (merge base task-env)
        (and (string? api-token) (= "codex" agent-id)) (assoc "OPENAI_API_KEY" api-token)
        (and (string? api-token) (= "claude" agent-id)) (assoc "ANTHROPIC_API_KEY" api-token)
        (string? github-token) (assoc-github-installation-token github-token)))))

(defn- vercel-server-command
  [^js env task session-id port agent-token env-vars]
  (let [auth-json (get-in task [:agent :auth-json])
        write-auth (or (auth-json-write-command auth-json) "")
        repo-cd (or (repo-cd-command session-id task "vercel") "")
        token-exports (shell-export-command env-vars)
        github-auth-setup (github-auth-setup-command (get env-vars "GITHUB_TOKEN"))]
    (str (sandbox-agent-install-command env)
         token-exports
         github-auth-setup
         write-auth
         (when (string? repo-cd) (str repo-cd "; "))
         "nohup sandbox-agent server "
         (if (string? agent-token)
           (str "--token '" (escape-shell-single agent-token) "'")
           "--no-token")
         " --host 0.0.0.0 --port " port
         " --no-telemetry >/tmp/sandbox-agent.log 2>&1 &")))

(defn- <vercel-clone-repo!
  [^js env sandbox session-id task]
  (when-let [cmd (repo-clone-command env session-id task "vercel")]
    (<vercel-run-shell! sandbox cmd)))

(defn- <vercel-run-project-init-setup!
  [sandbox session-id task]
  (when-let [cmd (project-init-setup-command session-id task "vercel")]
    (<vercel-run-shell! sandbox cmd)))

(defn- start-vercel-project-init-setup-background!
  [sandbox session-id task sandbox-id]
  (js/setTimeout
   (fn []
     (when-let [setup-promise (<vercel-run-project-init-setup! sandbox session-id task)]
       (-> setup-promise
           (p/catch (fn [error]
                      (log/error :agent/vercel-project-init-setup-failed
                                 {:session-id session-id
                                  :sandbox-id sandbox-id
                                  :error (str error)}))))))
   0)
  nil)

(defn- <vercel-ensure-running!
  [^js env sandbox session-id task port agent-token]
  (p/let [env-vars (<vercel-agent-env-vars! env task)
          bootstrap-cmd (vercel-server-command env task session-id port agent-token env-vars)
          _ (<vercel-run-shell! sandbox bootstrap-cmd)
          _ (<vercel-health! env sandbox port agent-token)]
    true))

(defn- <vercel-create-sandbox-from-checkpoint!
  [^js env checkpoint]
  (let [snapshot-id (:snapshot-id checkpoint)
        snapshot-dir (:backup-dir checkpoint)]
    (if-not (string? snapshot-id)
      (p/resolved nil)
      (-> (<vercel-create-sandbox! env {:type "snapshot"
                                        :snapshotId snapshot-id})
          (p/then (fn [sandbox]
                    (log/debug :agent/vercel-snapshot-restored
                               {:snapshot-id snapshot-id
                                :source "task-checkpoint"})
                    {:sandbox sandbox
                     :snapshot-id snapshot-id
                     :snapshot-dir snapshot-dir
                     :restored? true}))
          (p/catch (fn [error]
                     (log/error :agent/vercel-snapshot-restore-failed
                                {:snapshot-id snapshot-id
                                 :source "task-checkpoint"
                                 :error (str error)})
                     nil))))))

(defn- <vercel-create-sandbox-for-restore!
  [^js env checkpoint]
  (p/let [checkpoint-restore (<vercel-create-sandbox-from-checkpoint! env checkpoint)]
    (if (map? checkpoint-restore)
      checkpoint-restore
      (p/let [sandbox (<vercel-create-sandbox! env nil)]
        {:sandbox sandbox
         :snapshot-dir nil
         :restored? false}))))

(defn- <vercel-runtime-base-url!
  [^js env runtime]
  (let [cached (:base-url runtime)
        port (vercel-agent-port env runtime)
        sandbox-id (:sandbox-id runtime)]
    (if (string? cached)
      (p/resolved cached)
      (p/let [sandbox (<vercel-get-sandbox! env sandbox-id)]
        (vercel-sandbox-domain sandbox port)))))

(defn- <vercel-restore-repo-dir!
  [sandbox snapshot-dir repo-dir]
  (cond
    (not (string? repo-dir))
    (p/resolved nil)

    (or (not (string? snapshot-dir))
        (= snapshot-dir repo-dir))
    (p/resolved nil)

    :else
    (let [command (str "set -e; "
                       "if [ -d '" (escape-shell-single snapshot-dir) "' ]; then "
                       "rm -rf '" (escape-shell-single repo-dir) "'; "
                       "cp -a '" (escape-shell-single snapshot-dir) "' '" (escape-shell-single repo-dir) "'; "
                       "fi")]
      (prn :debug :<vercel-restore-repo-dir! :command command)
      (<vercel-run-shell! sandbox command))))

(defn- vercel-snapshot-expiration-ms
  []
  (* cloudflare-snapshot-ttl-seconds 1000))

(defn <vercel-create-snapshot!
  [sandbox source-dir snapshot-name]
  (let [snapshot-fn (js-method sandbox "snapshot")]
    (cond
      (not (string? source-dir))
      (p/rejected (ex-info "invalid snapshot source dir"
                           {:reason :invalid-snapshot-source-dir
                            :source-dir source-dir}))

      (not (fn? snapshot-fn))
      (p/rejected (ex-info "vercel runtime does not support snapshots"
                           {:reason :unsupported-snapshot
                            :provider "vercel"}))

      :else
      (-> (->promise (.call snapshot-fn sandbox
                            (clj->js {:expiration (vercel-snapshot-expiration-ms)})))
          (p/then (fn [snapshot]
                    (let [snapshot-id (aget snapshot "snapshotId")]
                      (if (string? snapshot-id)
                        {:snapshot-id snapshot-id
                         :name snapshot-name
                         :dir source-dir}
                        (throw (ex-info "vercel snapshot create returned invalid id"
                                        {:reason :invalid-snapshot-id
                                         :snapshot snapshot}))))))
          (p/catch (fn [error]
                     (p/rejected
                      (ex-info (or (some-> error ex-message str string/trim not-empty)
                                   "vercel snapshot create failed")
                               {:reason :unsupported-snapshot
                                :provider "vercel"
                                :raw-error (str error)}))))))))

(defprotocol RuntimeProvider
  (<provision-runtime! [this session-id task])
  (<open-events-stream! [this runtime])
  (<send-message! [this runtime message])
  (<open-terminal! [this runtime request opts])
  (<snapshot-runtime! [this runtime opts])
  (<export-workspace-bundle! [this runtime opts])
  (<apply-workspace-bundle! [this runtime opts])
  (<push-branch! [this runtime opts])
  (<terminate-runtime! [this runtime]))

(defrecord SpritesProvider [env]
  RuntimeProvider

  (<provision-runtime! [_ session-id task]
    (let [name (get-sprite-name env session-id)
          port (parse-int (env-str env "SPRITES_SANDBOX_AGENT_PORT") 2468)
          agent-token (env-str env "SANDBOX_AGENT_TOKEN") ;; may be nil if --no-token
          health-retries (parse-int (env-str env "SPRITES_HEALTH_RETRIES") 120)
          health-interval-ms (parse-int (env-str env "SPRITES_HEALTH_INTERVAL_MS") 500)
          create-session-retries (parse-int (env-str env "SPRITES_CREATE_SESSION_RETRIES") 20)
          create-session-interval-ms (parse-int (env-str env "SPRITES_CREATE_SESSION_INTERVAL_MS") 250)]
      (p/let [_ (sprites-create-or-get! env name)
              _ (<sprite-clone-repo! env name session-id task)
              _ (<sprite-bootstrap! env name port task session-id)
              _ (<sprite-health! env name port agent-token health-retries health-interval-ms)
              _ (<sprite-run-project-init-setup! env name session-id task)
              payload (session-payload task)
              response (<sprite-create-session-with-retry! env
                                                           name
                                                           port
                                                           agent-token
                                                           session-id
                                                           payload
                                                           create-session-retries
                                                           create-session-interval-ms)]
        {:provider "sprites"
         :sprite-name name
         :sandbox-port port
         :agent-token agent-token
         :session-id (:session-id response)})))

  ;; REALTIME events endpoint:
  ;; We stream stdout bytes of `curl -N ... text/event-stream` run inside sprite.
  (<open-events-stream! [_ runtime]
    (let [name (:sprite-name runtime)
          port (or (:sandbox-port runtime)
                   (parse-int (env-str env "SPRITES_SANDBOX_AGENT_PORT") 2468))
          agent-token (or (:agent-token runtime)
                          (env-str env "SANDBOX_AGENT_TOKEN"))]
      (when-not (string? name)
        (throw (ex-info "missing sprite-name on runtime" {:runtime runtime})))

      (let [script (str "curl -sS -N -X GET "
                        "-H 'accept: text/event-stream' "
                        (curl-auth-arg agent-token)
                        " "
                        (sprite-local-url port (str "/v1/sessions/" (:session-id runtime) "/events/sse")))]
        (sprites-ws->sse-response! env name ["bash" "-lc" script]))))

  (<send-message! [_ runtime message]
    (let [name (:sprite-name runtime)
          port (or (:sandbox-port runtime)
                   (parse-int (env-str env "SPRITES_SANDBOX_AGENT_PORT") 2468))
          agent-token (or (:agent-token runtime)
                          (env-str env "SANDBOX_AGENT_TOKEN"))]
      (when-not (string? name)
        (throw (ex-info "missing sprite-name on runtime" {:runtime runtime})))
      (let [payload-arg (curl-json-arg (message-payload message))
            auth-arg (curl-auth-arg agent-token)
            messages-url (sprite-local-url port (str "/v1/sessions/" (:session-id runtime) "/messages"))
            script (str "curl -fsS -X POST "
                        "-H 'content-type: application/json' "
                        auth-arg
                        " "
                        payload-arg
                        " "
                        messages-url
                        " >/dev/null")]
        (js/console.log "[agent:sprites-send-message]" script)
        (p/let [_ (sprites-exec-post! env name ["bash" "-lc" script])]
          true))))

  (<open-terminal! [_ _runtime _request _opts]
    (p/rejected
     (ex-info "sprites runtime provider does not support browser terminal"
              {:reason :unsupported-terminal
               :provider "sprites"})))

  (<snapshot-runtime! [_ _runtime _opts]
    (p/rejected
     (ex-info "sprites runtime provider does not support snapshots"
              {:reason :unsupported-snapshot
               :provider "sprites"})))

  (<export-workspace-bundle! [_ _runtime _opts]
    (p/rejected
     (ex-info "sprites runtime provider does not support workspace bundle export"
              {:reason :unsupported-workspace-bundle
               :provider "sprites"})))

  (<apply-workspace-bundle! [_ _runtime _opts]
    (p/rejected
     (ex-info "sprites runtime provider does not support workspace bundle restore"
              {:reason :unsupported-workspace-bundle
               :provider "sprites"})))

  (<push-branch! [_ runtime opts]
    (let [name (:sprite-name runtime)
          session-id (:session-id opts)
          repo-url (:repo-url opts)
          head-branch (:head-branch opts)
          force? (true? (:force opts))
          repo-dir (get-repo-dir session-id)
          remote-url (or (source-control/push-remote-url repo-url (:push-token opts))
                         repo-url)]
      (when-not (string? name)
        (throw (ex-info "missing sprite-name on runtime" {:runtime runtime})))
      (when-not (string? repo-dir)
        (throw (ex-info "missing repo dir for push"
                        {:reason :missing-repo-dir
                         :session-id session-id})))
      (when-not (string? remote-url)
        (throw (ex-info "missing remote url for push"
                        {:reason :missing-remote-url
                         :repo-url repo-url})))
      (when-not (string? head-branch)
        (throw (ex-info "missing head branch for push"
                        {:reason :missing-branch})))
      (let [script (push-command {:repo-dir repo-dir
                                  :remote-url remote-url
                                  :head-branch head-branch
                                  :commit-message (:commit-message opts)
                                  :force force?})]

        (-> (p/let [result (sprites-exec-post! env name ["bash" "-lc" script])
                    {:keys [stdout stderr exit-code]} (sprites-exec-output result)]
              (when (and (number? exit-code) (not (zero? exit-code)))
                (throw (ex-info "git push failed"
                                {:reason :git-exit
                                 :stdout stdout
                                 :stderr stderr
                                 :exit-code exit-code})))
              {:head-branch head-branch
               :repo-url repo-url
               :force force?
               :remote "origin"})
            (p/catch (fn [error]
                       (p/rejected
                        (if-let [data (ex-data error)]
                          (ex-info (ex-message error)
                                   (assoc data
                                          :provider "sprites"
                                          :reason (or (:reason data)
                                                      (classify-push-error error))))
                          (ex-info "git push failed"
                                   {:provider "sprites"
                                    :reason (classify-push-error error)
                                    :error (str error)})))))))))

  (<terminate-runtime! [_ runtime]
    (if-not (string? (:sprite-name runtime))
      (p/resolved nil)
      (sprites-delete! env (:sprite-name runtime)))))

(defrecord LocalDevProvider [env]
  RuntimeProvider

  (<provision-runtime! [_ session-id task]
    (let [base-url (local-dev-base-url env nil)
          agent-token (env-str env "SANDBOX_AGENT_TOKEN")
          payload (session-payload task)]
      (p/let [response (sandbox/<create-session base-url agent-token session-id payload)]
        {:provider "local-dev"
         :base-url base-url
         :agent-token agent-token
         :session-id (:session-id response)})))

  (<open-events-stream! [_ runtime]
    (let [base-url (local-dev-base-url env runtime)
          agent-token (local-dev-token env runtime)]
      (sandbox/<open-events-stream base-url agent-token (:session-id runtime))))

  (<send-message! [_ runtime message]
    (let [base-url (local-dev-base-url env runtime)
          agent-token (local-dev-token env runtime)]
      (sandbox/<send-message base-url agent-token (:session-id runtime) message)))

  (<open-terminal! [_ _runtime _request _opts]
    (p/rejected
     (ex-info "local-dev runtime provider does not support browser terminal"
              {:reason :unsupported-terminal
               :provider "local-dev"})))

  (<snapshot-runtime! [_ _runtime _opts]
    (p/rejected
     (ex-info "local-dev runtime provider does not support snapshots"
              {:reason :unsupported-snapshot
               :provider "local-dev"})))

  (<export-workspace-bundle! [_ _runtime _opts]
    (p/rejected
     (ex-info "local-dev runtime provider does not support workspace bundle export"
              {:reason :unsupported-workspace-bundle
               :provider "local-dev"})))

  (<apply-workspace-bundle! [_ _runtime _opts]
    (p/rejected
     (ex-info "local-dev runtime provider does not support workspace bundle restore"
              {:reason :unsupported-workspace-bundle
               :provider "local-dev"})))

  (<push-branch! [_ _runtime _opts]
    (p/rejected
     (ex-info "local-dev runtime provider does not support managed git push"
              {:reason :unsupported
               :provider "local-dev"})))

  (<terminate-runtime! [_ runtime]
    (let [base-url (local-dev-base-url env runtime)
          agent-token (local-dev-token env runtime)
          session-id (:session-id runtime)]
      (if-not (string? session-id)
        (p/resolved nil)
        (p/catch
         (sandbox/<terminate-session base-url agent-token session-id)
         (fn [_] nil))))))

(defrecord LocalRunnerProvider [env]
  RuntimeProvider

  (<provision-runtime! [_ session-id task]
    (let [base-url (local-runner-base-url task nil)
          runner-id (get-in task [:runner :runner-id])
          agent-token (local-runner-token task nil)
          headers (local-runner-headers task nil)
          payload (session-payload task)]
      (when-not (string? base-url)
        (throw (ex-info "local runner base url is required"
                        {:reason :missing-local-runner-base-url
                         :session-id session-id
                         :runner-id runner-id})))
      (p/let [response (sandbox/<create-session base-url
                                                agent-token
                                                session-id
                                                payload
                                                {:headers headers})]
        {:provider "local-runner"
         :runner-id runner-id
         :base-url base-url
         :agent-token agent-token
         :access-client-id (get headers "CF-Access-Client-Id")
         :access-client-secret (get headers "CF-Access-Client-Secret")
         :session-id (:session-id response)})))

  (<open-events-stream! [_ runtime]
    (let [base-url (local-runner-base-url nil runtime)
          agent-token (local-runner-token nil runtime)
          headers (local-runner-headers nil runtime)]
      (when-not (string? base-url)
        (throw (ex-info "local runner base url is required"
                        {:reason :missing-local-runner-base-url
                         :runtime runtime})))
      (sandbox/<open-events-stream base-url
                                   agent-token
                                   (:session-id runtime)
                                   {:headers headers})))

  (<send-message! [_ runtime message]
    (let [base-url (local-runner-base-url nil runtime)
          agent-token (local-runner-token nil runtime)
          headers (local-runner-headers nil runtime)]
      (when-not (string? base-url)
        (throw (ex-info "local runner base url is required"
                        {:reason :missing-local-runner-base-url
                         :runtime runtime})))
      (sandbox/<send-message base-url
                             agent-token
                             (:session-id runtime)
                             message
                             {:headers headers})))

  (<open-terminal! [_ _runtime _request _opts]
    (p/rejected
     (ex-info "local-runner runtime provider does not support browser terminal"
              {:reason :unsupported-terminal
               :provider "local-runner"})))

  (<snapshot-runtime! [_ _runtime _opts]
    (p/rejected
     (ex-info "local-runner runtime provider does not support snapshots"
              {:reason :unsupported-snapshot
               :provider "local-runner"})))

  (<export-workspace-bundle! [_ _runtime _opts]
    (p/rejected
     (ex-info "local-runner runtime provider does not support workspace bundle export"
              {:reason :unsupported-workspace-bundle
               :provider "local-runner"})))

  (<apply-workspace-bundle! [_ _runtime _opts]
    (p/rejected
     (ex-info "local-runner runtime provider does not support workspace bundle restore"
              {:reason :unsupported-workspace-bundle
               :provider "local-runner"})))

  (<push-branch! [_ _runtime _opts]
    (p/rejected
     (ex-info "local-runner runtime provider does not support managed git push"
              {:reason :unsupported
               :provider "local-runner"})))

  (<terminate-runtime! [_ runtime]
    (let [base-url (local-runner-base-url nil runtime)
          agent-token (local-runner-token nil runtime)
          headers (local-runner-headers nil runtime)
          session-id (:session-id runtime)]
      (if-not (string? session-id)
        (p/resolved nil)
        (if-not (string? base-url)
          (p/resolved nil)
          (p/catch
           (sandbox/<terminate-session base-url
                                       agent-token
                                       session-id
                                       {:headers headers})
           (fn [_] nil)))))))

(defrecord E2BProvider [env]
  RuntimeProvider

  (<provision-runtime! [_ session-id task]
    (let [agent-token (e2b-agent-token env nil)
          port (e2b-agent-port env nil)
          payload (session-payload task)
          repo-dir (get-repo-dir session-id task "e2b")
          checkpoint (task-sandbox-checkpoint task)
          backup-key (or (:backup-key checkpoint)
                         (repo-backup-key task))
          template (e2b-template env task nil)]
      (p/let [env-vars (<e2b-agent-env-vars! env task)
              create-opts (e2b-create-opts env session-id env-vars)
              {:keys [sandbox snapshot-id restored?]} (<e2b-create-sandbox-for-restore! env
                                                                                        template
                                                                                        checkpoint
                                                                                        create-opts)
              _ (<e2b-ensure-running! env sandbox session-id task port agent-token env-vars)
              _ (when-not restored?
                  (p/catch
                   (<e2b-clone-repo! env sandbox session-id task)
                   (fn [error]
                     (log/error :agent/e2b-repo-clone-failed
                                {:session-id session-id
                                 :error (str error)})
                     nil)))
              _ (p/catch
                 (<e2b-run-project-init-setup! sandbox session-id task)
                 (fn [error]
                   (log/error :agent/e2b-project-init-setup-failed
                              {:session-id session-id
                               :error (str error)})
                   nil))
              base-url (e2b-sandbox-host sandbox port)
              response (sandbox/<create-session base-url agent-token session-id payload)
              sandbox-id (e2b-sandbox-id sandbox)]
        (when-not (string? sandbox-id)
          (throw (ex-info "e2b sandbox missing sandboxId"
                          {:reason :missing-sandbox-id})))
        {:provider "e2b"
         :sandbox-id sandbox-id
         :sandbox-name sandbox-id
         :sandbox-port port
         :base-url base-url
         :agent-token agent-token
         :session-id (:session-id response)
         :backup-key backup-key
         :backup-dir repo-dir
         :template template
         :snapshot-id snapshot-id})))

  (<open-events-stream! [_ runtime]
    (let [agent-token (e2b-agent-token env runtime)]
      (p/let [base-url (<e2b-runtime-base-url! env runtime)]
        (sandbox/<open-events-stream base-url agent-token (:session-id runtime)))))

  (<send-message! [_ runtime message]
    (let [agent-token (e2b-agent-token env runtime)]
      (p/let [base-url (<e2b-runtime-base-url! env runtime)]
        (sandbox/<send-message base-url agent-token (:session-id runtime) message))))

  (<open-terminal! [_ runtime request _opts]
    (<e2b-open-terminal! env runtime request))

  (<snapshot-runtime! [_ runtime opts]
    (let [session-id (:session-id runtime)
          sandbox-id (:sandbox-id runtime)
          backup-dir (or (:backup-dir runtime)
                         (get-repo-dir session-id (:task opts) "e2b"))
          task (:task opts)
          backup-key (repo-backup-key task)]
      (when-not (string? sandbox-id)
        (throw (ex-info "missing sandbox-id on runtime"
                        {:reason :missing-sandbox-id
                         :runtime runtime})))
      (p/let [sandbox (<e2b-connect-sandbox! env sandbox-id)
              result (<e2b-create-snapshot! sandbox)]
        (cond-> result
          (string? backup-key) (assoc :backup-key backup-key)
          (string? backup-dir) (assoc :backup-dir backup-dir)
          :always (assoc :provider "e2b")))))

  (<export-workspace-bundle! [_ runtime opts]
    (<e2b-export-workspace-bundle! env runtime opts))

  (<apply-workspace-bundle! [_ runtime opts]
    (<e2b-apply-workspace-bundle! env runtime opts))

  (<push-branch! [_ runtime opts]
    (let [sandbox-id (:sandbox-id runtime)
          session-id (:session-id opts)
          repo-url (:repo-url opts)
          head-branch (:head-branch opts)
          force? (true? (:force opts))
          repo-dir (or (:backup-dir runtime)
                       (get-repo-dir session-id (:task opts) "e2b"))
          remote-url (or (source-control/push-remote-url repo-url (:push-token opts))
                         repo-url)]
      (when-not (string? sandbox-id)
        (throw (ex-info "missing sandbox-id on runtime" {:runtime runtime})))
      (when-not (string? repo-dir)
        (throw (ex-info "missing repo dir for push"
                        {:reason :missing-repo-dir
                         :session-id session-id})))
      (when-not (string? remote-url)
        (throw (ex-info "missing remote url for push"
                        {:reason :missing-remote-url
                         :repo-url repo-url})))
      (when-not (string? head-branch)
        (throw (ex-info "missing head branch for push"
                        {:reason :missing-branch})))
      (let [script (push-command {:repo-dir repo-dir
                                  :remote-url remote-url
                                  :head-branch head-branch
                                  :commit-message (:commit-message opts)
                                  :force force?})
            env-vars (assoc-github-installation-token {}
                                                      (some-> (:push-token opts) str string/trim not-empty))
            run-opts (when (seq env-vars)
                       {:env env-vars})]
        (-> (p/let [sandbox (<e2b-connect-sandbox! env sandbox-id)
                    _ (<e2b-run-shell! sandbox script run-opts)]
              {:head-branch head-branch
               :repo-url repo-url
               :force force?
               :remote "origin"})
            (p/catch (fn [error]
                       (p/rejected
                        (if-let [data (ex-data error)]
                          (ex-info (ex-message error)
                                   (assoc data
                                          :provider "e2b"
                                          :reason (or (:reason data)
                                                      (classify-push-error error))))
                          (ex-info "git push failed"
                                   {:provider "e2b"
                                    :reason (classify-push-error error)
                                    :error (str error)})))))))))

  (<terminate-runtime! [_ runtime]
    (let [sandbox-id (:sandbox-id runtime)]
      (if-not (string? sandbox-id)
        (p/resolved nil)
        (p/catch
         (<e2b-kill-sandbox! env sandbox-id)
         (fn [_] nil))))))

(defrecord VercelProvider [env]
  RuntimeProvider

  (<provision-runtime! [_ session-id task]
    (let [agent-token (vercel-agent-token env nil)
          port (vercel-agent-port env nil)
          payload (session-payload task)
          repo-dir (get-repo-dir session-id task "vercel")
          checkpoint (task-sandbox-checkpoint task)
          backup-key (or (:backup-key checkpoint)
                         (repo-backup-key task))]
      (p/let [{:keys [sandbox snapshot-id snapshot-dir restored?] :as result} (<vercel-create-sandbox-for-restore! env checkpoint)
              _ (prn :debug :vercel-create-sandbox-result result)
              _ (<vercel-ensure-running! env sandbox session-id task port agent-token)
              _ (when restored?
                  (<vercel-restore-repo-dir! sandbox snapshot-dir repo-dir))
              _ (when-not restored?
                  (p/catch
                   (<vercel-clone-repo! env sandbox session-id task)
                   (fn [error]
                     (log/error :agent/vercel-repo-clone-failed
                                {:session-id session-id
                                 :error (str error)})
                     nil)))
              base-url (vercel-sandbox-domain sandbox port)
              response (sandbox/<create-session base-url agent-token session-id payload)
              sandbox-id (aget sandbox "sandboxId")]
        ;; (start-vercel-project-init-setup-background! sandbox session-id task sandbox-id)
        {:provider "vercel"
         :sandbox-id sandbox-id
         :sandbox-name sandbox-id
         :sandbox-port port
         :base-url base-url
         :agent-token agent-token
         :session-id (:session-id response)
         :backup-key backup-key
         :backup-dir repo-dir
         :snapshot-id snapshot-id})))

  (<open-events-stream! [_ runtime]
    (let [agent-token (vercel-agent-token env runtime)]
      (p/let [base-url (<vercel-runtime-base-url! env runtime)]
        (sandbox/<open-events-stream base-url agent-token (:session-id runtime)))))

  (<send-message! [_ runtime message]
    (let [agent-token (vercel-agent-token env runtime)]
      (p/let [base-url (<vercel-runtime-base-url! env runtime)]
        (sandbox/<send-message base-url agent-token (:session-id runtime) message))))

  (<open-terminal! [_ _runtime _request _opts]
    (p/rejected
     (ex-info "vercel runtime provider does not support browser terminal"
              {:reason :unsupported-terminal
               :provider "vercel"})))

  (<snapshot-runtime! [_ runtime opts]
    (let [session-id (:session-id runtime)
          sandbox-id (:sandbox-id runtime)
          backup-dir (or (:backup-dir runtime)
                         (get-repo-dir session-id (:task opts) "vercel"))
          task (:task opts)
          backup-key (repo-backup-key task)
          snapshot-name (snapshot-backup-name runtime task)]
      (when-not (string? sandbox-id)
        (throw (ex-info "missing sandbox-id on runtime"
                        {:reason :missing-sandbox-id
                         :runtime runtime})))
      (p/let [sandbox (<vercel-get-sandbox! env sandbox-id)
              result (<vercel-create-snapshot! sandbox backup-dir snapshot-name)]
        (cond-> result
          (string? backup-key) (assoc :backup-key backup-key)
          (string? backup-dir) (assoc :backup-dir backup-dir)
          :always (assoc :provider "vercel")))))

  (<export-workspace-bundle! [_ runtime opts]
    (<vercel-export-workspace-bundle! env runtime opts))

  (<apply-workspace-bundle! [_ runtime opts]
    (<vercel-apply-workspace-bundle! env runtime opts))

  (<push-branch! [_ runtime opts]
    (let [sandbox-id (:sandbox-id runtime)
          session-id (:session-id opts)
          repo-url (:repo-url opts)
          head-branch (:head-branch opts)
          force? (true? (:force opts))
          repo-dir (or (:backup-dir runtime)
                       (get-repo-dir session-id (:task opts) "vercel"))
          remote-url (or (source-control/push-remote-url repo-url (:push-token opts))
                         repo-url)]
      (when-not (string? sandbox-id)
        (throw (ex-info "missing sandbox-id on runtime" {:runtime runtime})))
      (when-not (string? repo-dir)
        (throw (ex-info "missing repo dir for push"
                        {:reason :missing-repo-dir
                         :session-id session-id})))
      (when-not (string? remote-url)
        (throw (ex-info "missing remote url for push"
                        {:reason :missing-remote-url
                         :repo-url repo-url})))
      (when-not (string? head-branch)
        (throw (ex-info "missing head branch for push"
                        {:reason :missing-branch})))
      (let [script (push-command {:repo-dir repo-dir
                                  :remote-url remote-url
                                  :head-branch head-branch
                                  :commit-message (:commit-message opts)
                                  :force force?})
            env-vars (assoc-github-installation-token {}
                                                      (some-> (:push-token opts) str string/trim not-empty))
            run-opts (when (seq env-vars)
                       {:env env-vars})]
        (-> (p/let [sandbox (<vercel-get-sandbox! env sandbox-id)
                    _ (<vercel-run-shell! sandbox script run-opts)]
              {:head-branch head-branch
               :repo-url repo-url
               :force force?
               :remote "origin"})
            (p/catch (fn [error]
                       (p/rejected
                        (if-let [data (ex-data error)]
                          (ex-info (ex-message error)
                                   (assoc data
                                          :provider "vercel"
                                          :reason (or (:reason data)
                                                      (classify-push-error error))))
                          (ex-info "git push failed"
                                   {:provider "vercel"
                                    :reason (classify-push-error error)
                                    :error (str error)})))))))))

  (<terminate-runtime! [_ runtime]
    (let [sandbox-id (:sandbox-id runtime)]
      (if-not (string? sandbox-id)
        (p/resolved nil)
        (p/catch
         (p/let [sandbox (<vercel-get-sandbox! env sandbox-id)]
           (<vercel-stop-sandbox! sandbox)
           nil)
         (fn [_] nil))))))

(defrecord CloudflareProvider [env]
  RuntimeProvider

  (<provision-runtime! [_ session-id task]
    (let [sandbox-id (cloudflare-sandbox-name env session-id)
          sandbox (cloudflare-sandbox env sandbox-id)
          port (cloudflare-agent-port env)
          agent-token (env-str env "SANDBOX_AGENT_TOKEN")
          payload (session-payload task)
          repo-dir (get-repo-dir session-id)
          checkpoint (task-sandbox-checkpoint task)
          backup-key (or (:backup-key checkpoint)
                         (repo-backup-key task))
          checkpoint-backup-id (when (= "cloudflare" (:provider checkpoint))
                                 (:snapshot-id checkpoint))]
      (log/debug :agent/cloudflare-provision-start
                 {:session-id session-id
                  :sandbox-id sandbox-id
                  :port port
                  :token? (boolean (string? agent-token))
                  :backup-key backup-key
                  :repo-dir repo-dir})
      (p/let [_ (<cloudflare-ensure-running! env sandbox task port agent-token)
              restored? (<cloudflare-restore-backup! sandbox
                                                     backup-key
                                                     repo-dir
                                                     {:backup-id checkpoint-backup-id})
              _ (when-not restored?
                  (<cloudflare-clone-repo! env sandbox session-id task))
              response (<cloudflare-create-session! sandbox port agent-token session-id payload)]
        (start-cloudflare-project-init-setup-background! sandbox session-id task sandbox-id)
        (log/debug :agent/cloudflare-provisioned
                   {:session-id session-id
                    :sandbox-id sandbox-id
                    :runtime-session-id (:session-id response)})
        {:provider "cloudflare"
         :sandbox-id sandbox-id
         :sandbox-name sandbox-id
         :sandbox-port port
         :agent-token agent-token
         :session-id (:session-id response)
         :backup-key backup-key
         :backup-dir repo-dir})))

  (<open-events-stream! [_ runtime]
    (let [sandbox-id (:sandbox-id runtime)
          session-id (:session-id runtime)
          port (or (:sandbox-port runtime) (cloudflare-agent-port env))
          agent-token (or (:agent-token runtime)
                          (env-str env "SANDBOX_AGENT_TOKEN"))]
      (log/debug :agent/cloudflare-open-events-stream
                 {:session-id session-id
                  :sandbox-id sandbox-id
                  :port port
                  :token? (boolean (string? agent-token))})
      (when-not (string? sandbox-id)
        (throw (ex-info "missing sandbox-id on runtime" {:runtime runtime})))
      (when-not (string? session-id)
        (throw (ex-info "missing runtime session-id on runtime" {:runtime runtime})))
      (let [sandbox (cloudflare-sandbox env sandbox-id)]
        (<cloudflare-events-stream-request! sandbox port agent-token session-id))))

  (<send-message! [_ runtime message]
    (let [sandbox-id (:sandbox-id runtime)
          session-id (:session-id runtime)
          port (or (:sandbox-port runtime) (cloudflare-agent-port env))
          agent-token (or (:agent-token runtime)
                          (env-str env "SANDBOX_AGENT_TOKEN"))]
      (log/debug :agent/cloudflare-send-message-request
                 {:session-id session-id
                  :sandbox-id sandbox-id
                  :port port
                  :token? (boolean (string? agent-token))
                  :message-len (count (or (:message message) ""))})
      (when-not (string? sandbox-id)
        (throw (ex-info "missing sandbox-id on runtime" {:runtime runtime})))
      (when-not (string? session-id)
        (throw (ex-info "missing runtime session-id on runtime" {:runtime runtime})))
      (let [sandbox (cloudflare-sandbox env sandbox-id)]
        (<cloudflare-send-message! sandbox port agent-token session-id message))))

  (<open-terminal! [_ runtime request opts]
    (<cloudflare-open-terminal! env runtime request opts))

  (<snapshot-runtime! [_ runtime opts]
    (let [sandbox-id (:sandbox-id runtime)
          session-id (:session-id runtime)
          backup-dir (or (:backup-dir runtime)
                         (get-repo-dir session-id))
          task (:task opts)
          backup-key (repo-backup-key task)
          backup-name (snapshot-backup-name runtime task)]
      (when-not (string? sandbox-id)
        (throw (ex-info "missing sandbox-id on runtime"
                        {:reason :missing-sandbox-id
                         :runtime runtime})))
      (let [sandbox (cloudflare-sandbox env sandbox-id)]
        (p/let [result (<cloudflare-create-backup! sandbox backup-dir backup-name)
                _snapshot-id (:snapshot-id result)]
          (cond-> result
            (string? backup-key) (assoc :backup-key backup-key)
            (string? backup-dir) (assoc :backup-dir backup-dir)
            :always (assoc :provider "cloudflare"))))))

  (<export-workspace-bundle! [_ runtime opts]
    (<cloudflare-export-workspace-bundle! env runtime opts))

  (<apply-workspace-bundle! [_ runtime opts]
    (<cloudflare-apply-workspace-bundle! env runtime opts))

  (<push-branch! [_ runtime opts]
    (let [sandbox-id (:sandbox-id runtime)
          session-id (:session-id opts)
          repo-url (:repo-url opts)
          head-branch (:head-branch opts)
          force? (true? (:force opts))
          port (or (:sandbox-port runtime) (cloudflare-agent-port env))
          repo-dir (get-repo-dir session-id)
          remote-url (or (source-control/push-remote-url repo-url (:push-token opts))
                         repo-url)]
      (when-not (string? sandbox-id)
        (throw (ex-info "missing sandbox-id on runtime" {:runtime runtime})))
      (when-not (string? repo-dir)
        (throw (ex-info "missing repo dir for push"
                        {:reason :missing-repo-dir
                         :session-id session-id})))
      (when-not (string? remote-url)
        (throw (ex-info "missing remote url for push"
                        {:reason :missing-remote-url
                         :repo-url repo-url})))
      (when-not (string? head-branch)
        (throw (ex-info "missing head branch for push"
                        {:reason :missing-branch})))
      (let [sandbox (cloudflare-sandbox env sandbox-id)
            script (push-command {:repo-dir repo-dir
                                  :remote-url remote-url
                                  :head-branch head-branch
                                  :commit-message (:commit-message opts)
                                  :force force?})]
        (-> (p/let [result (<cloudflare-exec! sandbox script)
                    {:keys [stdout stderr exit-code success]} (cloudflare-exec-output result)]
              (when (or (false? success)
                        (and (number? exit-code) (not (zero? exit-code))))
                (throw (ex-info "git push failed"
                                {:reason :git-exit
                                 :stdout stdout
                                 :stderr stderr
                                 :exit-code exit-code})))
              {:head-branch head-branch
               :repo-url repo-url
               :force force?
               :remote "origin"
               :sandbox-port port})
            (p/catch (fn [error]
                       (p/rejected
                        (if-let [data (ex-data error)]
                          (ex-info (ex-message error)
                                   (assoc data
                                          :provider "cloudflare"
                                          :reason (or (:reason data)
                                                      (classify-push-error error))))
                          (ex-info "git push failed"
                                   {:provider "cloudflare"
                                    :reason (classify-push-error error)
                                    :error (str error)})))))))))

  (<terminate-runtime! [_ runtime]
    (let [sandbox-id (:sandbox-id runtime)
          session-id (:session-id runtime)]
      (log/debug :agent/cloudflare-terminate
                 {:session-id session-id
                  :sandbox-id sandbox-id})
      (if-not (string? sandbox-id)
        (p/resolved nil)
        (let [sandbox (cloudflare-sandbox env sandbox-id)
              port (or (:sandbox-port runtime) (cloudflare-agent-port env))
              agent-token (or (:agent-token runtime)
                              (env-str env "SANDBOX_AGENT_TOKEN"))]
          (p/catch
           (p/let [_ (when (string? session-id)
                       (p/catch
                        (<cloudflare-terminate-session! sandbox port agent-token session-id)
                        (fn [_] nil)))
                   result (<cloudflare-destroy-sandbox! sandbox)]
             (log/info ::destroy-sandbox-result result)
             nil)
           (fn [_] nil)))))))

(defn provider-id [provider]
  (cond
    (instance? E2BProvider provider) "e2b"
    (instance? SpritesProvider provider) "sprites"
    (instance? LocalDevProvider provider) "local-dev"
    (instance? LocalRunnerProvider provider) "local-runner"
    (instance? VercelProvider provider) "vercel"
    (instance? CloudflareProvider provider) "cloudflare"
    :else nil))

(defn create-provider [^js env kind]
  (log/debug :agent/runtime-provider-selected
             {:requested kind
              :resolved (known-provider-kind kind)})
  (case (known-provider-kind kind)
    "e2b" (->E2BProvider env)
    "local-dev" (->LocalDevProvider env)
    "local-runner" (->LocalRunnerProvider env)
    "vercel" (->VercelProvider env)
    "cloudflare" (->CloudflareProvider env)
    (->E2BProvider env)))

(defn resolve-provider
  [^js env runtime]
  (create-provider env (runtime-provider-kind env runtime)))

(defn runtime-terminal-supported?
  [runtime]
  (let [provider (known-provider-kind (:provider runtime))]
    (or (= "cloudflare" provider)
        (= "e2b" provider))))
