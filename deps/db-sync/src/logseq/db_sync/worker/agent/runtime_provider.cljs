(ns logseq.db-sync.worker.agent.runtime-provider
  (:require [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.db-sync.worker.agent.sandbox :as sandbox]
            [logseq.db-sync.worker.agent.source-control :as source-control]
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
  #{"sprites" "local-dev" "cloudflare"})

(defn- known-provider-kind [value]
  (let [provider (normalize-provider value)]
    (when (contains? supported-provider-kinds provider)
      provider)))

(defn provider-kind [^js env]
  (or (known-provider-kind (env-str env "AGENT_RUNTIME_PROVIDER"))
      "sprites"))

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
(def ^:private cloudflare-local-host "http://localhost")

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

(defn- get-repo-dir [session-id]
  (let [session-id (some-> session-id str)]
    (when (string? session-id)
      (str default-repo-base-dir "/" (sanitize-name session-id)))))

(defn- repo-cd-command
  [session-id]
  (when-let [dir (get-repo-dir session-id)]
    (str "cd '" (escape-shell-single dir) "'")))

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

(defn- <sprite-bootstrap! [^js env sprite-name port task session-id]
  (let [auth-json (get-in task [:agent :auth-json])
        write-auth (or (auth-json-write-command auth-json) "")
        repo-cd (or (repo-cd-command session-id) "")
        bootstrap (or (env-str env "SPRITES_BOOTSTRAP_COMMAND")
                      (str (sandbox-agent-install-command env)
                           write-auth
                           (when (string? repo-cd) (str repo-cd "; "))
                           "nohup sandbox-agent server --no-token --host 0.0.0.0 --port " port
                           " --no-telemetry >/tmp/sandbox-agent.log 2>&1 &"))]
    (sprites-exec-post! env sprite-name ["bash" "-lc" bootstrap])))

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
         repo-dir (get-repo-dir session-id)
         override-key (if (= "cloudflare" provider)
                        "CLOUDFLARE_REPO_CLONE_COMMAND"
                        "SPRITES_REPO_CLONE_COMMAND")
         override (env-str env override-key)]
     (when (and (string? repo-url) (string? session-id) (string? repo-dir))
       (if (string? override)
         (fill-repo-template override {:repo-url repo-url
                                       :session-id session-id
                                       :repo-dir repo-dir})
         (str "mkdir -p " default-repo-base-dir
              " && cd " default-repo-base-dir
              " && git clone --depth 1 --single-branch --no-tags '"
              (escape-shell-single repo-url) "' '" (escape-shell-single repo-dir) "'"
              " && chmod -R u+rw '" (escape-shell-single repo-dir) "'"))))))

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

(defn- cloudflare-sandbox-namespace [^js env]
  (let [sandbox-ns (aget env "Sandbox")]
    (when-not sandbox-ns
      (throw (ex-info "missing Sandbox binding for cloudflare runtime provider" {})))
    sandbox-ns))

(defn- cloudflare-sandbox [^js env sandbox-id]
  (let [^js sandbox-ns (cloudflare-sandbox-namespace env)
        id-from-name (js-method sandbox-ns "idFromName")
        get-sandbox (js-method sandbox-ns "get")]
    (when-not (and id-from-name get-sandbox)
      (throw (ex-info "invalid Sandbox binding: missing idFromName/get" {})))
    (let [do-id (.idFromName sandbox-ns sandbox-id)
          sandbox (.get sandbox-ns do-id)]
      (when-not sandbox
        (throw (ex-info "failed to get cloudflare sandbox stub"
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

(defn- cloudflare-agent-env-vars [^js env task]
  (let [base (reduce (fn [acc k]
                       (if-let [v (env-str env k)]
                         (assoc acc k v)
                         acc))
                     {}
                     cloudflare-env-pass-through)
        task-env (normalize-agent-env-map (get-in task [:agent :env]))
        agent-id (:agent (session-payload task))
        api-token (some-> (get-in task [:agent :api-token]) str string/trim not-empty)]
    (cond-> (merge base task-env)
      (and (string? api-token) (= "codex" agent-id)) (assoc "OPENAI_API_KEY" api-token)
      (and (string? api-token) (= "claude" agent-id)) (assoc "ANTHROPIC_API_KEY" api-token))))

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
    (prn :debug :command command)
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
      (prn :debug :status status
           :cloudflare-local-host cloudflare-local-host)
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

(defn- <cloudflare-clone-repo! [^js env sandbox session-id task]
  (when-let [cmd (repo-clone-command env session-id task "cloudflare")]
    (<cloudflare-exec! sandbox cmd)))

(defn- <cloudflare-ensure-running! [^js env sandbox task port agent-token]
  (p/let [healthy? (->promise (<cloudflare-health-once! sandbox port agent-token))]
    (if healthy?
      true
      (p/let [env-vars (cloudflare-agent-env-vars env task)
              _ (<cloudflare-set-env-vars! sandbox env-vars)
              _ (<cloudflare-start-server! env sandbox task port agent-token)
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

(defn- <cloudflare-delete-sandbox! [^js sandbox]
  (cond
    (js-method sandbox "delete")
    (->promise (.delete sandbox))

    (js-method sandbox "remove")
    (->promise (.remove sandbox))

    (js-method sandbox "destroy")
    (->promise (.destroy sandbox))

    :else
    (p/resolved nil)))

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
      (p/let [session (->promise (.getSession sandbox session-id))]
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

(defprotocol RuntimeProvider
  (<provision-runtime! [this session-id task])
  (<open-events-stream! [this runtime])
  (<send-message! [this runtime message])
  (<open-terminal! [this runtime request opts])
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

(defrecord CloudflareProvider [env]
  RuntimeProvider

  (<provision-runtime! [_ session-id task]
    (let [sandbox-id (cloudflare-sandbox-name env session-id)
          sandbox (cloudflare-sandbox env sandbox-id)
          port (cloudflare-agent-port env)
          agent-token (env-str env "SANDBOX_AGENT_TOKEN")
          payload (session-payload task)]
      (log/debug :agent/cloudflare-provision-start
                 {:session-id session-id
                  :sandbox-id sandbox-id
                  :port port
                  :token? (boolean (string? agent-token))})
      (p/let [_ (<cloudflare-ensure-running! env sandbox task port agent-token)
              _ (<cloudflare-clone-repo! env sandbox session-id task)
              response (<cloudflare-create-session! sandbox port agent-token session-id payload)]
        (log/debug :agent/cloudflare-provisioned
                   {:session-id session-id
                    :sandbox-id sandbox-id
                    :runtime-session-id (:session-id response)})
        {:provider "cloudflare"
         :sandbox-id sandbox-id
         :sandbox-name sandbox-id
         :sandbox-port port
         :agent-token agent-token
         :session-id (:session-id response)})))

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
        (prn :debug :send-message message)
        (<cloudflare-send-message! sandbox port agent-token session-id message))))

  (<open-terminal! [_ runtime request opts]
    (<cloudflare-open-terminal! env runtime request opts))

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
                   _ (p/catch (<cloudflare-delete-sandbox! sandbox)
                              (fn [_] nil))]
             nil)
           (fn [_] nil)))))))

(defn provider-id [provider]
  (cond
    (instance? SpritesProvider provider) "sprites"
    (instance? LocalDevProvider provider) "local-dev"
    (instance? CloudflareProvider provider) "cloudflare"
    :else nil))

(defn create-provider [^js env kind]
  (log/debug :agent/runtime-provider-selected
             {:requested kind
              :resolved (known-provider-kind kind)})
  (case (known-provider-kind kind)
    "local-dev" (->LocalDevProvider env)
    "cloudflare" (->CloudflareProvider env)
    (->SpritesProvider env)))

(defn resolve-provider
  [^js env runtime]
  (create-provider env (runtime-provider-kind env runtime)))

(defn runtime-terminal-supported?
  [runtime]
  (let [provider (known-provider-kind (:provider runtime))]
    (= "cloudflare" provider)))
