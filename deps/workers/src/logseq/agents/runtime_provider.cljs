(ns logseq.agents.runtime-provider
  (:require ["e2b" :as e2b]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.agents.sandbox :as sandbox]
            [logseq.agents.source-control :as source-control]
            [promesa.core :as p]))

;; -----------------------
;; helpers
;; -----------------------

(def ^:private local-host "http://localhost")
(def ^:private default-repo-base-dir "/home/user/workspace")
(def ^:private e2b-repo-base-dir "/home/user/workspace")

(defn- js-method
  [obj method]
  (let [f (when obj (aget obj method))]
    (when (fn? f) f)))

(defn- ->promise
  [v]
  (js/Promise.resolve v))

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
  #{"e2b" "local-runner"})

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

(defn- escape-shell-single [value]
  (string/replace (or value "") "'" "'\"'\"'"))

(defn- ->base64
  [value]
  (when (string? value)
    (let [payload (.encode (js/TextEncoder.) value)
          binary (apply str (map char payload))]
      (js/btoa binary))))

(defn- curl-auth-arg [token]
  (if (string? token)
    (str "-H 'authorization: Bearer " (escape-shell-single token) "'")
    ""))

(defn auth-json-write-command
  [auth-json]
  (when-let [encoded (->base64 auth-json)]
    (str "mkdir -p ~/.codex; "
         "printf \"%s\" \"" encoded "\" | base64 -d > ~/.codex/auth.json; ")))

(defn task-runtime-auth-payload
  [task]
  (let [payload (get-in task [:agent :managed-auth :runtime-auth-payload])]
    (when (map? payload)
      payload)))

(defn task-auth-json
  [task]
  (or (some-> (task-runtime-auth-payload task) :auth-json)
      (get-in task [:agent :auth-json])))

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
  (if (= "e2b" (normalize-provider provider))
    e2b-repo-base-dir
    default-repo-base-dir))

(defn- get-repo-dir
  ([session-id]
   (get-repo-dir session-id nil nil))
  ([session-id task provider]
   (if (= "e2b" (normalize-provider provider))
     (str e2b-repo-base-dir "/" (task-repo-name task))
     (let [session-id (some-> session-id str)
           base-dir (repo-base-dir provider)]
       (when (and (string? session-id) (string? base-dir))
         (str base-dir "/" (sanitize-name session-id)))))))

(defn e2b-runtime-repo-dir
  [runtime task]
  (get-repo-dir (:session-id runtime) task "e2b"))

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
      "0.3.x"))

(defn- sandbox-agent-install-command
  [^js env]
  (let [version (escape-shell-single (sandbox-agent-version env))
        install-script (str "https://releases.rivet.dev/sandbox-agent/" version "/install.sh")]
    (str "(curl -fsSL " install-script " | sh);")))

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
        snapshot-id (some-> (:snapshot-id checkpoint) str string/trim not-empty)]
    (when (and (map? checkpoint) (string? snapshot-id))
      (cond-> {:snapshot-id snapshot-id}
        (string? provider) (assoc :provider provider)))))

(defn- fill-repo-template
  [template {:keys [repo-url session-id repo-dir]}]
  (-> (or template "")
      (string/replace "{repo_url}" (or repo-url ""))
      (string/replace "{session_id}" (or session-id ""))
      (string/replace "{repo_dir}" (or repo-dir ""))))

(defn repo-clone-command
  ([^js env session-id task]
   (repo-clone-command env session-id task "e2b"))
  ([^js env session-id task provider]
   (let [repo-url (task-repo-url task)
         session-id (some-> session-id str)
         repo-dir (get-repo-dir session-id task provider)
         base-dir (repo-base-dir provider)
         override-key (case provider
                        "e2b" "E2B_REPO_CLONE_COMMAND"
                        nil)
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
   (project-init-setup-command session-id task "e2b"))
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

(defn- task-graph-id
  [task]
  (some-> (get-in task [:project :graph-id]) str string/trim not-empty))

(defn- project-docker-file
  [task]
  (some-> (get-in task [:project :docker-file]) str string/trim not-empty))

(defn- e2b-template-name
  [task]
  (when-let [graph-id (task-graph-id task)]
    (sanitize-name (str graph-id "-" (task-repo-name task)))))

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
  (parse-int (env-str env "E2B_SANDBOX_TIMEOUT_MS") (* 10 60 1000)))

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

(defn- e2b-command-error-data
  [command error]
  (let [stdout (or (some-> error (aget "stdout")) "")
        stderr (or (some-> error (aget "stderr")) "")
        exit-code (or (some-> error (aget "exitCode"))
                      (some-> error (aget "exit_code")))
        name (some-> error (aget "name"))
        message (or (some-> error (aget "message"))
                    (str error))]
    (cond-> {:reason :e2b-command-failed
             :command command
             :message message
             :stdout stdout
             :stderr stderr}
      (string? name) (assoc :error-name name)
      (number? exit-code) (assoc :exit-code exit-code))))

(defn- e2b-sandbox-host
  [sandbox port]
  (let [get-host (js-method sandbox "getHost")]
    (when-not (fn? get-host)
      (throw (ex-info "e2b sandbox missing getHost method"
                      {:reason :missing-e2b-get-host})))
    (sandbox/normalize-base-url (.call get-host sandbox port))))

(declare <e2b-build-template! <e2b-resolve-template!)

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

(defn- <e2b-create-sandbox-with-template!
  [^js env task create-opts]
  (p/let [template (<e2b-resolve-template! env task nil)]
    (-> (<e2b-create-sandbox! env template create-opts)
        (p/then (fn [sandbox]
                  {:sandbox sandbox
                   :template template})))))

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

(defn <e2b-pause-sandbox!
  [^js env sandbox-id]
  (let [sandbox-class (e2b-sandbox-class)
        pause (js-method sandbox-class "pause")
        opts (clj->js (e2b-api-opts env))]
    (if (and (string? sandbox-id) (fn? pause))
      (->promise (.call pause sandbox-class sandbox-id opts))
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
      (p/let [result (-> (.call run-command commands command (clj->js params))
                         ->promise
                         (p/catch (fn [error]
                                    (throw (ex-info "e2b sandbox command failed"
                                                    (e2b-command-error-data command error)
                                                    error)))))
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
       local-host
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

(def ^:private env-pass-through
  ["OPENAI_API_KEY"
   "ANTHROPIC_API_KEY"
   "OPENAI_BASE_URL"
   "ANTHROPIC_BASE_URL"])

(defn- normalize-agent-env-map [env-map]
  (if-not (map? env-map)
    {}
    (reduce-kv (fn [acc k v]
                 (if (and (some? k) (string? v))
                   (assoc acc (name k) v)
                   acc))
               {}
               env-map)))

(defn- <e2b-agent-env-vars!
  [^js env task]
  (let [base (reduce (fn [acc k]
                       (if-let [v (env-str env k)]
                         (assoc acc k v)
                         acc))
                     {}
                     env-pass-through)
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
             :autoPause true
             :autoResume true
             ;; TODO: is there onPause
             ;; :lifecycle {:onTimeout "pause"}
             }
      (seq env-vars) (assoc :envs env-vars)
      (string? session-id) (assoc :metadata metadata))))

(defn- e2b-template-fn
  []
  (aget e2b "Template"))

(defn- <e2b-template-exists!
  [^js env template-name]
  (let [template-fn (e2b-template-fn)
        exists (js-method template-fn "exists")]
    (when-not (fn? template-fn)
      (throw (ex-info "e2b sdk missing Template"
                      {:reason :missing-e2b-template-sdk})))
    (when-not (fn? exists)
      (throw (ex-info "e2b sdk missing Template.exists"
                      {:reason :missing-e2b-template-exists})))
    (-> (->promise (.call exists template-fn template-name (clj->js (e2b-api-opts env))))
        (p/then true?))))

(defn- <e2b-build-template!
  [^js env task docker-file & [{:keys [force?]}]]
  (let [template-fn (e2b-template-fn)
        build (js-method template-fn "build")
        wait-for-timeout (aget e2b "waitForTimeout")
        default-build-logger (aget e2b "defaultBuildLogger")
        template-name (e2b-template-name task)]
    (when-not (fn? template-fn)
      (throw (ex-info "e2b sdk missing Template"
                      {:reason :missing-e2b-template-sdk})))
    (when-not (fn? build)
      (throw (ex-info "e2b sdk missing Template.build"
                      {:reason :missing-e2b-template-build})))
    (when-not (string? template-name)
      (throw (ex-info "missing graph-scoped e2b template name"
                      {:reason :missing-e2b-template-name})))
    (p/let [template-exists? (if force?
                               (p/resolved false)
                               (<e2b-template-exists! env template-name))]
      (if template-exists?
        template-name
        (p/let [template-builder-fn (some-> (template-fn) (js-method "fromDockerfile"))
                template-builder (when (fn? template-builder-fn)
                                   (.call template-builder-fn (template-fn) docker-file))
                set-start-cmd (js-method template-builder "setStartCmd")
                template-builder (if (and (some? template-builder)
                                          (fn? set-start-cmd)
                                          (fn? wait-for-timeout))
                                   (.call set-start-cmd
                                          template-builder
                                          "bash -lc 'while true; do sleep 3600; done'"
                                          (.call wait-for-timeout nil 5000))
                                   template-builder)
                build-opts (cond-> (merge (e2b-api-opts env)
                                          {:cpuCount 1
                                           :memoryMB 2048
                                           :skipCache false})
                             (fn? default-build-logger)
                             (assoc :onBuildLogs (.call default-build-logger nil)))]
          (when-not (some? template-builder)
            (throw (ex-info "e2b sdk missing Template().fromDockerfile"
                            {:reason :missing-e2b-from-dockerfile})))
          (p/let [_build-info (->promise (.call build
                                                template-fn
                                                template-builder
                                                template-name
                                                (clj->js build-opts)))]
            template-name))))))

(defn- <e2b-resolve-template!
  [^js env task runtime]
  (if (project-docker-file task)
    (<e2b-build-template! env task (project-docker-file task))
    (p/resolved (e2b-template env task runtime))))

(defn- e2b-server-command
  [^js env task session-id port agent-token env-vars]
  (let [auth-json (task-auth-json task)
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

(defn- <e2b-runtime-base-url!
  [^js env runtime]
  (let [cached (:base-url runtime)
        port (e2b-agent-port env runtime)
        sandbox-id (:sandbox-id runtime)]
    (if (string? sandbox-id)
      (p/let [sandbox (<e2b-connect-sandbox! env sandbox-id)]
        (e2b-sandbox-host sandbox port))
      (p/resolved (sandbox/normalize-base-url cached)))))

(defn- <e2b-open-terminal!
  [^js env runtime request {:keys [cols rows]}]
  (let [sandbox-id (:sandbox-id runtime)
        session-id (:session-id runtime)
        cwd "/home/user/workspace"]
    (prn :debug :cwd cwd)
    (when-not (string? sandbox-id)
      (throw (ex-info "missing sandbox-id on runtime" {:runtime runtime})))
    (when-not (string? session-id)
      (throw (ex-info "missing runtime session-id on runtime"
                      {:runtime runtime})))
    (when-not (= "websocket"
                 (some-> request .-headers (.get "Upgrade") str string/lower-case))
      (throw (ex-info "e2b terminal requires websocket upgrade"
                      {:reason :unsupported-terminal
                       :session-id session-id})))
    (p/let [sandbox (<e2b-connect-sandbox! env sandbox-id)]
      (let [pty (some-> sandbox (aget "pty"))
            create-pty (js-method pty "create")]
        (when-not (fn? create-pty)
          (throw (ex-info "e2b sandbox missing pty.create"
                          {:reason :unsupported-terminal
                           :sandbox-id sandbox-id
                           :session-id session-id})))
        (let [pair (js/WebSocketPair.)
              client (aget pair 0)
              server (aget pair 1)]
          (.accept server)
          (set! (.-binaryType server) "arraybuffer")
          (-> (->promise
               (.call create-pty pty
                      (clj->js (cond-> {:cols (or cols 120)
                                        :rows (or rows 40)
                                        :timeoutMs 0
                                        :cwd cwd
                                        :onData (fn [payload]
                                                  (.send server payload))}
                                 (number? cols) (assoc :cols cols)
                                 (number? rows) (assoc :rows rows)))))
              (p/then
               (fn [handle]
                 (let [pid (aget handle "pid")
                       send-input (js-method pty "sendInput")
                       resize (js-method pty "resize")
                       text-encoder (js/TextEncoder.)
                       input-buffer* (atom "")
                       flush-timer* (atom nil)
                       input-chain* (atom (p/resolved nil))
                       enqueue-input-bytes! (fn [input-payload]
                                              (when (and (number? pid) (fn? send-input))
                                                (swap! input-chain*
                                                       (fn [chain]
                                                         (-> chain
                                                             (p/catch (fn [_] nil))
                                                             (p/then
                                                              (fn [_]
                                                                (-> (->promise (.call send-input pty pid input-payload))
                                                                    (p/catch (fn [_] nil))))))))
                                                nil))
                       flush-input! (fn []
                                      (when-let [timer @flush-timer*]
                                        (js/clearTimeout timer)
                                        (reset! flush-timer* nil))
                                      (let [buffer @input-buffer*]
                                        (reset! input-buffer* "")
                                        (when (seq buffer)
                                          (enqueue-input-bytes! (.encode text-encoder buffer)))))
                       enqueue-input! (fn [input-text]
                                        (when (string? input-text)
                                          (swap! input-buffer* str input-text)
                                          (when-not @flush-timer*
                                            (reset! flush-timer*
                                                    (js/setTimeout flush-input! 10))))
                                        nil)]
                   (.addEventListener
                    server
                    "message"
                    (fn [event]
                      (let [payload (.-data event)]
                        (cond
                          (string? payload)
                          (let [parsed (parse-json-safe payload)]
                            (cond
                              (= "resize" (:type parsed))
                              (do
                                (flush-input!)
                                (when (and (number? pid) (fn? resize))
                                  (-> (->promise (.call resize pty pid
                                                        (clj->js {:cols (:cols parsed)
                                                                  :rows (:rows parsed)})))
                                      (p/catch (fn [_] nil)))))

                              (= "input" (:type parsed))
                              (let [input (or (:data parsed) "")]
                                (enqueue-input! input))

                              :else
                              (enqueue-input! payload))))

                        (instance? js/ArrayBuffer payload)
                        (enqueue-input-bytes! (js/Uint8Array. payload))

                        (instance? js/Uint8Array payload)
                        (enqueue-input-bytes! payload)

                        :else nil))))
                 (.addEventListener server
                                    "close"
                                    (fn []
                                      (when-let [kill-handle (js-method handle "kill")]
                                        (-> (->promise (.call kill-handle handle))
                                            (p/catch (fn [_] nil))))))
                 (.addEventListener server
                                    "error"
                                    (fn [_]
                                      (when-let [kill-handle (js-method handle "kill")]
                                        (-> (->promise (.call kill-handle handle))
                                            (p/catch (fn [_] nil))))))
                 (.send server (js/JSON.stringify #js {:type "ready"}))
                 (js/Response. nil #js {:status 101
                                        :webSocket client})))
              (p/catch
               (fn [error]
                 (try
                   (.close server 1011 "terminal init failed")
                   (catch :default _ nil))
                 (throw error)))))))))

(defprotocol RuntimeProvider
  (<provision-runtime! [this session-id task])
  (<open-events-stream! [this runtime])
  (<send-message! [this runtime message])
  (<open-terminal! [this runtime request opts])
  (<snapshot-runtime! [this runtime opts])
  (<push-branch! [this runtime opts])
  (<terminate-runtime! [this runtime]))

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
                                                {:headers headers
                                                 :cwd (get-repo-dir session-id task "local-runner")})]
        {:provider "local-runner"
         :runner-id runner-id
         :base-url base-url
         :agent-token agent-token
         :access-client-id (get headers "CF-Access-Client-Id")
         :access-client-secret (get headers "CF-Access-Client-Secret")
         :server-id (:server-id response)
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
                                   (or (:server-id runtime) (:session-id runtime))
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
                             (or (:server-id runtime) (:session-id runtime))
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
                                       (or (:server-id runtime) session-id)
                                       {:headers headers})
           (fn [_] nil)))))))

(defrecord E2BProvider [env]
  RuntimeProvider

  (<provision-runtime! [_ session-id task]
    (let [agent-token (e2b-agent-token env nil)
          port (e2b-agent-port env nil)
          payload (session-payload task)]
      (p/let [env-vars (<e2b-agent-env-vars! env task)
              create-opts (e2b-create-opts env session-id env-vars)
              {:keys [sandbox template]}
              (p/let [{:keys [sandbox template]} (<e2b-create-sandbox-with-template! env task create-opts)]
                {:sandbox sandbox
                 :template template})
              _ (<e2b-ensure-running! env sandbox session-id task port agent-token env-vars)
              _ (when-not template
                  (p/catch
                   (<e2b-clone-repo! env sandbox session-id task)
                   (fn [error]
                     (log/error :agent/e2b-repo-clone-failed
                                {:session-id session-id
                                 :error (str error)
                                 :error-data (ex-data error)})
                     nil)))
              base-url (e2b-sandbox-host sandbox port)
              response (sandbox/<create-session base-url
                                                agent-token
                                                session-id
                                                payload
                                                {:cwd (e2b-runtime-repo-dir {:session-id session-id} task)})
              sandbox-id (e2b-sandbox-id sandbox)]
        (when-not (string? sandbox-id)
          (throw (ex-info "e2b sandbox missing sandboxId"
                          {:reason :missing-sandbox-id})))
        {:provider "e2b"
         :sandbox-id sandbox-id
         :sandbox-name sandbox-id
         :sandbox-port port
         :backup-dir (e2b-runtime-repo-dir {:session-id session-id} task)
         :base-url base-url
         :agent-token agent-token
         :server-id (:server-id response)
         :session-id (:session-id response)
         :template template})))

  (<open-events-stream! [_ runtime]
    (let [agent-token (e2b-agent-token env runtime)]
      (p/let [base-url (<e2b-runtime-base-url! env runtime)]
        (sandbox/<open-events-stream base-url
                                     agent-token
                                     (or (:server-id runtime) (:session-id runtime))))))

  (<send-message! [_ runtime message]
    (let [agent-token (e2b-agent-token env runtime)]
      (p/let [base-url (<e2b-runtime-base-url! env runtime)]
        (sandbox/<send-message base-url
                               agent-token
                               (or (:server-id runtime) (:session-id runtime))
                               (:session-id runtime)
                               message))))

  (<open-terminal! [_ runtime request opts]
    (<e2b-open-terminal! env runtime request opts))

  (<snapshot-runtime! [_ runtime opts]
    (let [session-id (:session-id runtime)
          sandbox-id (:sandbox-id runtime)
          backup-dir (e2b-runtime-repo-dir runtime (:task opts))
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

  (<push-branch! [_ runtime opts]
    (let [sandbox-id (:sandbox-id runtime)
          session-id (:session-id opts)
          repo-url (:repo-url opts)
          head-branch (:head-branch opts)
          force? (true? (:force opts))
          repo-dir (e2b-runtime-repo-dir runtime (:task opts))
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
         (<e2b-pause-sandbox! env sandbox-id)
         (fn [_] nil))))))

(defn provider-id [provider]
  (cond
    (instance? E2BProvider provider) "e2b"
    (instance? LocalRunnerProvider provider) "local-runner"
    :else nil))

(defn create-provider [^js env kind]
  (log/debug :agent/runtime-provider-selected
             {:requested kind
              :resolved (known-provider-kind kind)})
  (case (known-provider-kind kind)
    "e2b" (->E2BProvider env)
    "local-runner" (->LocalRunnerProvider env)
    (->E2BProvider env)))

(defn resolve-provider
  [^js env runtime]
  (create-provider env (runtime-provider-kind env runtime)))

(defn runtime-terminal-supported?
  [runtime]
  (let [provider (known-provider-kind (:provider runtime))]
    (= "e2b" provider)))
