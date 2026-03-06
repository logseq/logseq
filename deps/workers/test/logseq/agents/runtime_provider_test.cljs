(ns logseq.agents.runtime-provider-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.agents.runtime-provider :as runtime-provider]
            [logseq.agents.sandbox :as sandbox]))

(defn- fetch-url [request]
  (cond
    (string? request) request
    (instance? js/URL request) (.toString request)
    (some? request) (.-url request)
    :else ""))

(defn- fetch-method [request init]
  (or (when (some? init) (aget init "method"))
      (when (and (some? request) (not (string? request))) (.-method request))
      "GET"))

(deftest provider-kind-test
  (testing "normalizes configured runtime provider"
    (is (= "e2b" (runtime-provider/provider-kind #js {})))
    (is (= "e2b" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "E2B"})))
    (is (= "sprites" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "SPRITES"})))
    (is (= "local-dev" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "LOCAL-DEV"})))
    (is (= "local-runner" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "LOCAL-RUNNER"})))
    (is (= "vercel" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "VERCEL"})))
    (is (= "cloudflare" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "CLOUDFLARE"})))
    (is (= "e2b" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "unknown"})))))

(deftest fill-template-test
  (testing "fills sandbox id placeholders"
    (is (= "/sandboxes/sbx-1/commands"
           (runtime-provider/fill-template "/sandboxes/{sandbox_id}/commands" "sbx-1")))
    (is (= "https://sbx-1.agent.internal"
           (runtime-provider/fill-template "https://{sandbox_id}.agent.internal" "sbx-1")))))

(deftest runtime-provider-resolution-test
  (testing "prefers runtime provider, falls back to env provider"
    (let [env #js {"AGENT_RUNTIME_PROVIDER" "cloudflare"}]
      (is (= "local-dev"
             (runtime-provider/runtime-provider-kind env {:provider "local-dev"})))
      (is (= "e2b"
             (runtime-provider/runtime-provider-kind env {:provider "e2b"})))
      (is (= "sprites"
             (runtime-provider/runtime-provider-kind env {:provider "sprites"})))
      (is (= "vercel"
             (runtime-provider/runtime-provider-kind env {:provider "vercel"})))
      (is (= "cloudflare"
             (runtime-provider/runtime-provider-kind env {:provider "cloudflare"})))
      (is (= "cloudflare"
             (runtime-provider/runtime-provider-kind env {:provider "unknown"}))))))

(deftest provider-dispatch-test
  (testing "create-provider and resolve-provider dispatch supported providers"
    (let [env #js {"AGENT_RUNTIME_PROVIDER" "e2b"}]
      (is (= "e2b"
             (runtime-provider/provider-id (runtime-provider/create-provider env "e2b"))))
      (is (= "sprites"
             (runtime-provider/provider-id (runtime-provider/create-provider env "sprites"))))
      (is (= "local-dev"
             (runtime-provider/provider-id (runtime-provider/create-provider env "local-dev"))))
      (is (= "local-runner"
             (runtime-provider/provider-id (runtime-provider/create-provider env "local-runner"))))
      (is (= "vercel"
             (runtime-provider/provider-id (runtime-provider/create-provider env "vercel"))))
      (is (= "cloudflare"
             (runtime-provider/provider-id (runtime-provider/create-provider env "cloudflare"))))
      (is (= "e2b"
             (runtime-provider/provider-id (runtime-provider/create-provider env "unknown"))))
      (is (= "e2b"
             (runtime-provider/provider-id (runtime-provider/resolve-provider env {:provider "e2b"}))))
      (is (= "local-dev"
             (runtime-provider/provider-id (runtime-provider/resolve-provider env {:provider "local-dev"}))))
      (is (= "local-runner"
             (runtime-provider/provider-id (runtime-provider/resolve-provider env {:provider "local-runner"}))))
      (is (= "e2b"
             (runtime-provider/provider-id (runtime-provider/resolve-provider env nil)))))))

(deftest runtime-terminal-supported-test
  (testing "cloudflare and e2b runtimes support browser terminal"
    (is (true? (runtime-provider/runtime-terminal-supported? {:provider "cloudflare"})))
    (is (true? (runtime-provider/runtime-terminal-supported? {:provider "e2b"})))
    (is (false? (runtime-provider/runtime-terminal-supported? {:provider "vercel"})))
    (is (false? (runtime-provider/runtime-terminal-supported? {:provider "sprites"})))))

(deftest local-runner-provider-provision-test
  (async done
         (let [env #js {}
               provider (runtime-provider/create-provider env "local-runner")
               task {:agent {:provider "codex"}
                     :runner {:runner-id "runner-1"
                              :base-url "https://runner.example.com"
                              :agent-token "runner-token"
                              :access-client-id "cf-access-id"
                              :access-client-secret "cf-access-secret"}}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (is (= "https://runner.example.com/v1/sessions/sess-local-1" (fetch-url request)))
                   (is (= "POST" (fetch-method request init)))
                   (is (= "Bearer runner-token"
                          (.get (.-headers request) "authorization")))
                   (is (= "cf-access-id"
                          (.get (.-headers request) "CF-Access-Client-Id")))
                   (is (= "cf-access-secret"
                          (.get (.-headers request) "CF-Access-Client-Secret")))
                   (js/Promise.resolve
                    (js/Response.
                     (js/JSON.stringify #js {:ok true})
                     #js {:status 200 :headers #js {"content-type" "application/json"}}))))
           (-> (runtime-provider/<provision-runtime! provider "sess-local-1" task)
               (.then (fn [runtime]
                        (set! js/fetch original-fetch)
                        (is (= "local-runner" (:provider runtime)))
                        (is (= "runner-1" (:runner-id runtime)))
                        (is (= "https://runner.example.com" (:base-url runtime)))
                        (is (= "sess-local-1" (:session-id runtime)))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest cloudflare-name-test
  (testing "cloudflare sandbox names are deterministic and sanitized"
    (is (= "logseq-task-sess-1"
           (runtime-provider/cloudflare-sandbox-name #js {} "sess-1")))
    (is (= "my-prefix-task-1"
           (runtime-provider/cloudflare-sandbox-name
            #js {"CLOUDFLARE_SANDBOX_NAME_PREFIX" "My Prefix_"}
            "Task 1")))))

(deftest repo-clone-command-test
  (testing "builds default repo clone command when repo url exists"
    (let [env #js {}
          task {:project {:repo-url "https://github.com/example/repo"}}
          session-id "sess-1"]
      (is (= "mkdir -p '/workspace' && cd '/workspace' && git clone --depth 1 --single-branch --no-tags 'https://github.com/example/repo' '/workspace/sess-1' && chmod -R u+rw '/workspace/sess-1'"
             (runtime-provider/repo-clone-command env session-id task)))))

  (testing "fills override repo clone command template"
    (let [env #js {"SPRITES_REPO_CLONE_COMMAND" "echo {repo_url} {session_id} {repo_dir}"}
          task {:project {:repo-url "https://github.com/example/repo"}}
          session-id "sess-1"]
      (is (= "echo https://github.com/example/repo sess-1 /workspace/sess-1"
             (runtime-provider/repo-clone-command env session-id task)))))

  (testing "fills vercel override repo clone command template"
    (let [env #js {"VERCEL_REPO_CLONE_COMMAND" "echo vercel {repo_url} {session_id} {repo_dir}"}
          task {:project {:repo-url "https://github.com/example/repo"}}
          session-id "sess-1"]
      (is (= "echo vercel https://github.com/example/repo sess-1 /vercel/sandbox/repo"
             (runtime-provider/repo-clone-command env session-id task "vercel")))))

  (testing "uses /vercel/sandbox/<repo-name> for vercel default clone path"
    (let [env #js {}
          task {:project {:repo-url "https://github.com/logseq/logseq.git"}}
          session-id "sess-1"]
      (is (= "mkdir -p '/vercel/sandbox' && cd '/vercel/sandbox' && git clone --depth 1 --single-branch --no-tags 'https://github.com/logseq/logseq.git' '/vercel/sandbox/logseq' && chmod -R u+rw '/vercel/sandbox/logseq'"
             (runtime-provider/repo-clone-command env session-id task "vercel")))))

  (testing "returns nil when repo url missing"
    (is (nil? (runtime-provider/repo-clone-command #js {} "sess-1" {})))))

(deftest session-payload-test
  (testing "defaults codex permission mode to bypass"
    (is (= "bypass"
           (:permissionMode (runtime-provider/session-payload {:agent "codex"})))))

  (testing "keeps explicit permission mode"
    (is (= "read-only"
           (:permissionMode (runtime-provider/session-payload {:agent {:permission-mode "read-only"}}))))))

(deftest auth-json-write-command-test
  (testing "builds write command for auth.json content"
    (let [cmd (runtime-provider/auth-json-write-command "{\"token\":\"abc\"}")]
      (is (string/includes? cmd "mkdir -p ~/.codex"))
      (is (string/includes? cmd "base64 -d > ~/.codex/auth.json"))
      (is (string/includes? cmd "printf \"%s\""))))

  (testing "returns nil when auth json missing"
    (is (nil? (runtime-provider/auth-json-write-command nil)))))

(deftest local-dev-provider-provision-test
  (async done
         (let [env #js {"SANDBOX_AGENT_URL" "http://127.0.0.1:2468"
                        "SANDBOX_AGENT_TOKEN" "token-1"}
               provider (runtime-provider/create-provider env "local-dev")
               task {:agent {:provider "codex"}}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (is (= "http://127.0.0.1:2468/v1/sessions/sess-1" (fetch-url request)))
                   (is (= "POST" (fetch-method request init)))
                   (js/Promise.resolve
                    (js/Response.
                     (js/JSON.stringify #js {:ok true})
                     #js {:status 200 :headers #js {"content-type" "application/json"}}))))
           (-> (runtime-provider/<provision-runtime! provider "sess-1" task)
               (.then (fn [runtime]
                        (set! js/fetch original-fetch)
                        (is (= "local-dev" (:provider runtime)))
                        (is (= "http://127.0.0.1:2468" (:base-url runtime)))
                        (is (= "sess-1" (:session-id runtime)))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest local-dev-provider-events-stream-test
  (async done
         (let [env #js {"SANDBOX_AGENT_TOKEN" "token-1"}
               provider (runtime-provider/create-provider env "local-dev")
               runtime {:provider "local-dev"
                        :base-url "http://sandbox.local"
                        :session-id "sess-2"}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (is (= "http://sandbox.local/v1/sessions/sess-2/events/sse" (fetch-url request)))
                   (is (= "GET" (fetch-method request init)))
                   (js/Promise.resolve
                    (js/Response. "data: {\"type\":\"ok\"}\n\n"
                                  #js {:status 200
                                       :headers #js {"content-type" "text/event-stream"}}))))
           (-> (runtime-provider/<open-events-stream! provider runtime)
               (.then (fn [resp]
                        (set! js/fetch original-fetch)
                        (is (= 200 (.-status resp)))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest local-dev-provider-send-message-test
  (async done
         (let [env #js {"SANDBOX_AGENT_TOKEN" "token-1"}
               provider (runtime-provider/create-provider env "local-dev")
               runtime {:provider "local-dev"
                        :base-url "http://sandbox.local"
                        :session-id "sess-2"}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (is (= "http://sandbox.local/v1/sessions/sess-2/messages" (fetch-url request)))
                   (is (= "POST" (fetch-method request init)))
                   (js/Promise.resolve
                    (js/Response.
                     (js/JSON.stringify #js {:ok true})
                     #js {:status 200
                          :headers #js {"content-type" "application/json"}}))))
           (-> (runtime-provider/<send-message! provider runtime {:message "hello" :kind "chat"})
               (.then (fn [ok?]
                        (set! js/fetch original-fetch)
                        (is (true? ok?))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest local-dev-provider-push-branch-unsupported-test
  (async done
         (let [env #js {"SANDBOX_AGENT_URL" "http://127.0.0.1:2468"}
               provider (runtime-provider/create-provider env "local-dev")
               runtime {:provider "local-dev"
                        :base-url "http://127.0.0.1:2468"
                        :session-id "sess-push-unsupported"}]
           (-> (runtime-provider/<push-branch! provider
                                               runtime
                                               {:session-id "sess-push-unsupported"
                                                :repo-url "https://github.com/example/repo"
                                                :head-branch "feature/m14"
                                                :force false
                                                :push-token "token-1"})
               (.then (fn [_]
                        (is false "expected local-dev push to reject as unsupported")
                        (done)))
               (.catch (fn [error]
                         (let [data (ex-data error)]
                           (is (= :unsupported (:reason data)))
                           (is (= "local-dev" (:provider data))))
                         (done)))))))

(deftest vercel-provider-does-not-restore-from-in-memory-cache-test
  (async done
         (runtime-provider/clear-vercel-snapshot-cache!)
         (let [calls (atom {:clone 0
                            :sessions 0
                            :snapshots 0
                            :restores 0})
               sandboxes (atom {})
               next-id (atom 0)
               make-sandbox (fn [sandbox-id]
                              #js {:sandboxId sandbox-id
                                   :domain (fn [_port] "https://vercel-agent.local")})
               env #js {"VERCEL_TEAM_ID" "team-1"
                        "VERCEL_PROJECT_ID" "project-1"
                        "VERCEL_TOKEN" "token-vercel"}
               provider (runtime-provider/create-provider env "vercel")
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/example/repo"
                               :base-branch "main"}}]
           (with-redefs [runtime-provider/<vercel-create-sandbox!
                         (fn [_env source]
                           (let [sandbox-id (str "vercel-sbx-" (swap! next-id inc))
                                 sandbox (make-sandbox sandbox-id)]
                             (when (= "snapshot" (:type source))
                               (swap! calls update :restores inc))
                             (swap! sandboxes assoc sandbox-id sandbox)
                             (js/Promise.resolve sandbox)))
                         runtime-provider/<vercel-get-sandbox!
                         (fn [_env sandbox-id]
                           (js/Promise.resolve (get @sandboxes sandbox-id)))
                         runtime-provider/<vercel-run-shell!
                         (fn [_sandbox cmd & _]
                           (when (string/includes? cmd "git clone --depth 1 --single-branch --no-tags")
                             (swap! calls update :clone inc))
                           (js/Promise.resolve {:stdout "" :stderr "" :exit-code 0}))
                         sandbox/<create-session
                         (fn [_base-url _agent-token session-id _payload]
                           (swap! calls update :sessions inc)
                           (js/Promise.resolve {:session-id session-id}))
                         runtime-provider/<vercel-create-snapshot!
                         (fn [_sandbox _source-dir _snapshot-name]
                           (swap! calls update :snapshots inc)
                           (js/Promise.resolve {:snapshot-id "vercel-snap-1"}))]
             (-> (runtime-provider/<provision-runtime! provider "sess-vercel-1" task)
                 (.then (fn [runtime-1]
                          (is (= "vercel" (:provider runtime-1)))
                          (is (= 1 (:clone @calls)))
                          (-> (runtime-provider/<snapshot-runtime! provider runtime-1 {:task task})
                              (.then (fn [snapshot-result]
                                       (is (= "vercel-snap-1" (:snapshot-id snapshot-result)))
                                       (is (= 1 (:snapshots @calls)))
                                       (-> (runtime-provider/<provision-runtime! provider "sess-vercel-2" task)
                                           (.then (fn [runtime-2]
                                                    (is (= 2 (:clone @calls)))
                                                    (is (= 0 (:restores @calls)))
                                                    (is (= 2 (:sessions @calls)))
                                                    (is (nil? (:snapshot-id runtime-2)))
                                                    (done)))
                                           (.catch (fn [error]
                                                     (is false (str "unexpected second provision error: " error))
                                                     (done))))))
                              (.catch (fn [error]
                                        (is false (str "unexpected snapshot error: " error))
                                        (done))))))
                 (.catch (fn [error]
                           (is false (str "unexpected first provision error: " error))
                           (done))))))))

(deftest vercel-provider-restores-from-task-checkpoint-test
  (async done
         (runtime-provider/clear-vercel-snapshot-cache!)
         (let [calls (atom {:clone 0
                            :sources []})
               env #js {"VERCEL_TEAM_ID" "team-1"
                        "VERCEL_PROJECT_ID" "project-1"
                        "VERCEL_TOKEN" "token-vercel"}
               provider (runtime-provider/create-provider env "vercel")
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/example/repo"
                               :base-branch "main"}
                     :sandbox-checkpoint {:provider "vercel"
                                          :snapshot-id "persisted-snap-7"
                                          :backup-dir "/vercel/sandbox/repo"}}]
           (with-redefs [runtime-provider/<vercel-create-sandbox!
                         (fn [_env source]
                           (swap! calls update :sources conj source)
                           (js/Promise.resolve
                            #js {:sandboxId "vercel-sbx-checkpoint"
                                 :domain (fn [_port] "https://vercel-agent.local")}))
                         runtime-provider/<vercel-run-shell!
                         (fn [_sandbox cmd & _]
                           (when (string/includes? cmd "git clone --depth 1 --single-branch --no-tags")
                             (swap! calls update :clone inc))
                           (js/Promise.resolve {:stdout "" :stderr "" :exit-code 0}))
                         sandbox/<create-session
                         (fn [_base-url _agent-token session-id _payload]
                           (js/Promise.resolve {:session-id session-id}))]
             (-> (runtime-provider/<provision-runtime! provider "sess-vercel-checkpoint" task)
                 (.then (fn [runtime]
                          (is (= "vercel" (:provider runtime)))
                          (is (= "persisted-snap-7" (:snapshot-id runtime)))
                          (is (= 0 (:clone @calls)))
                          (is (= "snapshot"
                                 (get-in (first (:sources @calls)) [:type])))
                          (is (= "persisted-snap-7"
                                 (get-in (first (:sources @calls)) [:snapshotId])))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected task-checkpoint restore error: " error))
                           (done))))))))

(deftest vercel-provider-open-terminal-unsupported-test
  (async done
         (let [env #js {}
               provider (runtime-provider/create-provider env "vercel")
               runtime {:provider "vercel"
                        :base-url "https://vercel-agent.local"
                        :session-id "sess-vercel-terminal"}
               request (js/Request. "https://db-sync.local/sessions/sess-vercel-terminal/terminal"
                                    #js {:method "GET"})]
           (-> (runtime-provider/<open-terminal! provider runtime request {:cols 80 :rows 24})
               (.then (fn [_]
                        (is false "expected vercel terminal to reject as unsupported")
                        (done)))
               (.catch (fn [error]
                         (let [data (ex-data error)]
                           (is (= :unsupported-terminal (:reason data)))
                           (is (= "vercel" (:provider data))))
                         (done)))))))

(deftest vercel-provider-export-workspace-bundle-test
  (async done
         (let [captured (atom nil)
               env #js {"VERCEL_TEAM_ID" "team-1"
                        "VERCEL_PROJECT_ID" "project-1"
                        "VERCEL_TOKEN" "token-vercel"}
               provider (runtime-provider/create-provider env "vercel")
               runtime {:provider "vercel"
                        :sandbox-id "vercel-sbx-bundle"
                        :backup-dir "/vercel/sandbox/logseq"
                        :session-id "sess-vercel-bundle"}
               task {:project {:base-branch "main"}}]
           (with-redefs [runtime-provider/<vercel-get-sandbox!
                         (fn [_env _sandbox-id]
                           (js/Promise.resolve #js {:sandboxId "vercel-sbx-bundle"}))
                         runtime-provider/<vercel-run-shell!
                         (fn [_sandbox cmd & _]
                           (reset! captured cmd)
                           (js/Promise.resolve
                            {:stdout (str "__BUNDLE_HEAD__:abc123\n"
                                          "__BUNDLE_BASE__:base123\n"
                                          "__BUNDLE_BYTES__:16\n"
                                          "__BUNDLE_SHA256__:sha256-123\n"
                                          "__BUNDLE_BRANCH__:feat/m22\n"
                                          "__BUNDLE_DATA__:ZmFrZS1idW5kbGUtZGF0YQ==\n")
                             :stderr ""
                             :exit-code 0}))]
             (-> (runtime-provider/<export-workspace-bundle! provider runtime {:task task
                                                                               :head-branch "feat/preferred"})
                 (.then (fn [result]
                          (is (= "abc123" (:head-sha result)))
                          (is (= "base123" (:base-sha result)))
                          (is (= 16 (:byte-size result)))
                          (is (= "sha256-123" (:checksum result)))
                          (is (= "feat/m22" (:head-branch result)))
                          (is (= "ZmFrZS1idW5kbGUtZGF0YQ==" (:bundle-base64 result)))
                          (is (string/includes? @captured "current_head_branch=$(git symbolic-ref --quiet --short HEAD"))
                          (is (string/includes? @captured "refs/heads/feat/preferred"))
                          (is (string/includes? @captured "git bundle create"))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest vercel-provider-apply-workspace-bundle-test
  (async done
         (let [captured (atom nil)
               env #js {"VERCEL_TEAM_ID" "team-1"
                        "VERCEL_PROJECT_ID" "project-1"
                        "VERCEL_TOKEN" "token-vercel"}
               provider (runtime-provider/create-provider env "vercel")
               runtime {:provider "vercel"
                        :sandbox-id "vercel-sbx-bundle-apply"
                        :backup-dir "/vercel/sandbox/logseq"
                        :session-id "sess-vercel-bundle-apply"}]
           (with-redefs [runtime-provider/<vercel-get-sandbox!
                         (fn [_env _sandbox-id]
                           (js/Promise.resolve #js {:sandboxId "vercel-sbx-bundle-apply"}))
                         runtime-provider/<vercel-run-shell!
                         (fn [_sandbox cmd & _]
                           (reset! captured cmd)
                           (js/Promise.resolve {:stdout "" :stderr "" :exit-code 0}))]
             (-> (runtime-provider/<apply-workspace-bundle! provider
                                                            runtime
                                                            {:head-sha "abc123"
                                                             :head-branch "feat/m22"
                                                             :bundle-base64 "ZmFrZS1idW5kbGUtZGF0YQ=="})
                 (.then (fn [ok?]
                          (is (true? ok?))
                          (is (string/includes? @captured "git bundle verify"))
                          (is (string/includes? @captured "git fetch"))
                          (is (string/includes? @captured "git checkout -B 'feat/m22'"))
                          (is (string/includes? @captured "bundle restore branch mismatch"))
                          (is (string/includes? @captured "bundle restore commit mismatch"))
                          (is (string/includes? @captured "git reset --hard"))
                          (is (string/includes? @captured "git clean -fd"))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest vercel-provider-push-branch-command-test
  (async done
         (let [captured (atom nil)
               captured-opts (atom nil)
               env #js {"VERCEL_TEAM_ID" "team-1"
                        "VERCEL_PROJECT_ID" "project-1"
                        "VERCEL_TOKEN" "token-vercel"}
               provider (runtime-provider/create-provider env "vercel")
               runtime {:provider "vercel"
                        :sandbox-id "vercel-sbx-push"
                        :backup-dir "/vercel/sandbox/logseq"
                        :session-id "sess-vercel-push"}]
           (with-redefs [runtime-provider/<vercel-get-sandbox!
                         (fn [_env _sandbox-id]
                           (js/Promise.resolve #js {:sandboxId "vercel-sbx-push"}))
                         runtime-provider/<vercel-run-shell!
                         (fn [_sandbox cmd & [opts]]
                           (reset! captured cmd)
                           (reset! captured-opts opts)
                           (js/Promise.resolve {:stdout "" :stderr "" :exit-code 0}))]
             (-> (runtime-provider/<push-branch! provider
                                                 runtime
                                                 {:session-id "sess-vercel-push"
                                                  :repo-url "https://github.com/example/repo"
                                                  :head-branch "feature/m14"
                                                  :commit-message "feat: summarize PR updates"
                                                  :force true
                                                  :push-token "token-1"})
                 (.then (fn [result]
                          (is (= "feature/m14" (:head-branch result)))
                          (is (= "https://github.com/example/repo" (:repo-url result)))
                          (is (= true (:force result)))
                          (is (string/includes? @captured "cd '/vercel/sandbox/logseq'"))
                          (is (string/includes? @captured "git push"))
                          (is (string/includes? @captured "feature/m14"))
                          (is (string/includes? @captured "commit -m 'feat: summarize PR updates'"))
                          (is (string/includes? @captured "x-access-token:token-1"))
                          (is (= "token-1" (get-in @captured-opts [:env "GITHUB_TOKEN"])))
                          (is (= "token-1" (get-in @captured-opts [:env "GH_TOKEN"])))
                          (is (= "token-1" (get-in @captured-opts [:env "GITHUB_APP_INSTALLATION_TOKEN"])))
                          (done)))
                 (.catch (fn [error]
                           (is false (str "unexpected error: " error))
                           (done))))))))

(deftest vercel-provider-push-branch-classifies-error-test
  (async done
         (let [env #js {"VERCEL_TEAM_ID" "team-1"
                        "VERCEL_PROJECT_ID" "project-1"
                        "VERCEL_TOKEN" "token-vercel"}
               provider (runtime-provider/create-provider env "vercel")
               runtime {:provider "vercel"
                        :sandbox-id "vercel-sbx-push"
                        :backup-dir "/vercel/sandbox/logseq"
                        :session-id "sess-vercel-push"}]
           (with-redefs [runtime-provider/<vercel-get-sandbox!
                         (fn [_env _sandbox-id]
                           (js/Promise.resolve #js {:sandboxId "vercel-sbx-push"}))
                         runtime-provider/<vercel-run-shell!
                         (fn [_sandbox _cmd & _opts]
                           (js/Promise.reject
                            (ex-info "git failed"
                                     {:stderr "remote: permission denied"})))]
             (-> (runtime-provider/<push-branch! provider
                                                 runtime
                                                 {:session-id "sess-vercel-push"
                                                  :repo-url "https://github.com/example/repo"
                                                  :head-branch "feature/m14"})
                 (.then (fn [_]
                          (is false "expected vercel push to fail")
                          (done)))
                 (.catch (fn [error]
                           (let [data (ex-data error)]
                             (is (= "vercel" (:provider data)))
                             (is (= :auth (:reason data))))
                           (done))))))))

(deftest sprites-provider-push-branch-command-test
  (async done
         (let [captured (atom nil)
               env #js {"SPRITE_TOKEN" "sprite-token"}
               provider (runtime-provider/create-provider env "sprites")
               runtime {:provider "sprites"
                        :sprite-name "sprite-1"
                        :sandbox-port 2468
                        :session-id "sess-push"}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (let [url (fetch-url request)
                         method (fetch-method request init)]
                     (if (and (= "POST" method)
                              (string/includes? url "/v1/sprites/sprite-1/exec"))
                       (let [parsed (js/URL. url)
                             cmds (vec (.getAll (.-searchParams parsed) "cmd"))
                             script (nth cmds 2 nil)]
                         (reset! captured {:url url
                                           :method method
                                           :script script})
                         (js/Promise.resolve
                          (js/Response.
                           (js/JSON.stringify #js {:ok true})
                           #js {:status 200
                                :headers #js {"content-type" "application/json"}})))
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:error "unexpected request"})
                         #js {:status 500
                              :headers #js {"content-type" "application/json"}}))))))
           (-> (runtime-provider/<push-branch! provider
                                               runtime
                                               {:session-id "sess-push"
                                                :repo-url "https://github.com/example/repo"
                                                :head-branch "feature/m14"
                                                :commit-message "feat: summarize PR updates"
                                                :force true
                                                :push-token "token-1"})
               (.then (fn [result]
                        (set! js/fetch original-fetch)
                        (is (= "feature/m14" (:head-branch result)))
                        (is (= "https://github.com/example/repo" (:repo-url result)))
                        (is (= true (:force result)))
                        (is (string/includes? (:script @captured) "git push"))
                        (is (string/includes? (:script @captured) "feature/m14"))
                        (is (string/includes? (:script @captured) "commit -m 'feat: summarize PR updates'"))
                        (is (string/includes? (:script @captured) "x-access-token:token-1"))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest sprites-provider-send-message-test
  (async done
         (let [captured (atom nil)
               env #js {"SPRITE_TOKEN" "sprite-token"}
               provider (runtime-provider/create-provider env "sprites")
               runtime {:provider "sprites"
                        :sprite-name "sprite-1"
                        :sandbox-port 2468
                        :session-id "sess-4"}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (let [url (fetch-url request)
                         parsed (js/URL. url)
                         cmds (vec (.getAll (.-searchParams parsed) "cmd"))]
                     (reset! captured {:url url
                                       :method (fetch-method request init)
                                       :script (nth cmds 2 nil)})
                     (js/Promise.resolve
                      (js/Response.
                       (js/JSON.stringify #js {:ok true})
                       #js {:status 200 :headers #js {"content-type" "application/json"}})))))
           (-> (runtime-provider/<send-message! provider runtime {:message "hello sprites"})
               (.then (fn [ok?]
                        (set! js/fetch original-fetch)
                        (is (true? ok?))
                        (is (= "POST" (:method @captured)))
                        (is (string/includes? (:url @captured) "/v1/sprites/sprite-1/exec"))
                        (is (string/includes? (:script @captured) "/v1/sessions/sess-4/messages"))
                        (is (not (string/includes? (:script @captured) "/messages/stream")))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest sprites-provider-provision-parses-nested-exec-output-test
  (async done
         (let [env #js {"SPRITE_TOKEN" "sprite-token"}
               provider (runtime-provider/create-provider env "sprites")
               task {:agent {:provider "codex"}}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (let [url (fetch-url request)
                         method (fetch-method request init)]
                     (cond
                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites")
                            (not (string/includes? url "/exec")))
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:name "logseq-task-sess-ok"})
                         #js {:status 200 :headers #js {"content-type" "application/json"}}))

                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites/logseq-task-sess-ok/exec"))
                       (let [parsed (js/URL. url)
                             cmds (vec (.getAll (.-searchParams parsed) "cmd"))
                             script (nth cmds 2 nil)
                             create-session? (and (string? script)
                                                  (string/includes? script "/v1/sessions/sess-ok"))
                             health? (and (string? script)
                                          (string/includes? script "/v1/health"))]
                         (js/Promise.resolve
                          (js/Response.
                           (js/JSON.stringify
                            (clj->js (cond
                                       create-session?
                                       {:result {:stdout "{\"ok\":true}\n__HTTP_STATUS__:200__HTTP_STATUS__:200"
                                                 :stderr ""}}

                                       health?
                                       {:result {:stdout "__HEALTH_OK__"
                                                 :stderr ""}}

                                       :else
                                       {:result {:stdout ""
                                                 :stderr ""}})))
                           #js {:status 200 :headers #js {"content-type" "application/json"}})))

                       :else
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:error "unexpected request"})
                         #js {:status 500 :headers #js {"content-type" "application/json"}}))))))
           (-> (runtime-provider/<provision-runtime! provider "sess-ok" task)
               (.then (fn [runtime]
                        (set! js/fetch original-fetch)
                        (is (= "sess-ok" (:session-id runtime)))
                        (is (= "sprites" (:provider runtime)))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest sprites-provider-provision-retries-create-session-on-transient-connection-error-test
  (async done
         (let [calls (atom {:create-session 0})
               env #js {"SPRITE_TOKEN" "sprite-token"
                        "SPRITES_HEALTH_RETRIES" "2"
                        "SPRITES_HEALTH_INTERVAL_MS" "1"}
               provider (runtime-provider/create-provider env "sprites")
               task {:agent {:provider "codex"}}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (let [url (fetch-url request)
                         method (fetch-method request init)]
                     (cond
                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites")
                            (not (string/includes? url "/exec")))
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:name "logseq-task-sess-retry"})
                         #js {:status 200 :headers #js {"content-type" "application/json"}}))

                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites/logseq-task-sess-retry/exec"))
                       (let [parsed (js/URL. url)
                             cmds (vec (.getAll (.-searchParams parsed) "cmd"))
                             script (nth cmds 2 nil)
                             create-session? (and (string? script)
                                                  (string/includes? script "/v1/sessions/sess-retry"))
                             health? (and (string? script)
                                          (string/includes? script "/v1/health"))]
                         (cond
                           create-session?
                           (let [n (swap! calls update :create-session inc)]
                             (js/Promise.resolve
                              (js/Response.
                               (js/JSON.stringify
                                (clj->js (if (= 1 (:create-session n))
                                           {:result {:stdout "curl: (7) Failed to connect to 127.0.0.1 port 2468\n__HTTP_STATUS__:000"
                                                     :stderr ""}}
                                           {:result {:stdout "{\"ok\":true}\n__HTTP_STATUS__:200"
                                                     :stderr ""}})))
                               #js {:status 200 :headers #js {"content-type" "application/json"}})))

                           health?
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify (clj->js {:result {:stdout "__HEALTH_OK__" :stderr ""}}))
                             #js {:status 200 :headers #js {"content-type" "application/json"}}))

                           :else
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify (clj->js {:result {:stdout "" :stderr ""}}))
                             #js {:status 200 :headers #js {"content-type" "application/json"}}))))

                       :else
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:error "unexpected request"})
                         #js {:status 500 :headers #js {"content-type" "application/json"}}))))))
           (-> (runtime-provider/<provision-runtime! provider "sess-retry" task)
               (.then (fn [runtime]
                        (set! js/fetch original-fetch)
                        (is (= "sess-retry" (:session-id runtime)))
                        (is (= "sprites" (:provider runtime)))
                        (is (= 2 (:create-session @calls)))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest sprites-provider-provision-does-not-retry-create-session-on-http-400-test
  (async done
         (let [calls (atom {:create-session 0})
               env #js {"SPRITE_TOKEN" "sprite-token"
                        "SPRITES_HEALTH_RETRIES" "2"
                        "SPRITES_HEALTH_INTERVAL_MS" "1"}
               provider (runtime-provider/create-provider env "sprites")
               task {:agent {:provider "codex"}}
               original-fetch js/fetch]
           (set! js/fetch
                 (fn [request init]
                   (let [url (fetch-url request)
                         method (fetch-method request init)]
                     (cond
                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites")
                            (not (string/includes? url "/exec")))
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:name "logseq-task-sess-400"})
                         #js {:status 200 :headers #js {"content-type" "application/json"}}))

                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites/logseq-task-sess-400/exec"))
                       (let [parsed (js/URL. url)
                             cmds (vec (.getAll (.-searchParams parsed) "cmd"))
                             script (nth cmds 2 nil)
                             create-session? (and (string? script)
                                                  (string/includes? script "/v1/sessions/sess-400"))
                             health? (and (string? script)
                                          (string/includes? script "/v1/health"))]
                         (cond
                           create-session?
                           (do
                             (swap! calls update :create-session inc)
                             (js/Promise.resolve
                              (js/Response.
                               (js/JSON.stringify
                                (clj->js {:result {:stdout "{\"error\":\"bad request\"}\n__HTTP_STATUS__:400"
                                                   :stderr ""}}))
                               #js {:status 200 :headers #js {"content-type" "application/json"}})))

                           health?
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify (clj->js {:result {:stdout "__HEALTH_OK__" :stderr ""}}))
                             #js {:status 200 :headers #js {"content-type" "application/json"}}))

                           :else
                           (js/Promise.resolve
                            (js/Response.
                             (js/JSON.stringify (clj->js {:result {:stdout "" :stderr ""}}))
                             #js {:status 200 :headers #js {"content-type" "application/json"}}))))

                       :else
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:error "unexpected request"})
                         #js {:status 500 :headers #js {"content-type" "application/json"}}))))))
           (-> (runtime-provider/<provision-runtime! provider "sess-400" task)
               (.then (fn [_]
                        (set! js/fetch original-fetch)
                        (is false "expected provisioning to fail")
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is (= 1 (:create-session @calls)))
                         (is (= 400 (:status (ex-data error))))
                         (done)))))))

(deftest sprites-provider-provision-runs-project-init-setup-after-sandbox-ready-test
  (async done
         (let [scripts (atom [])
               env #js {"SPRITE_TOKEN" "sprite-token"}
               provider (runtime-provider/create-provider env "sprites")
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/example/repo"
                               :sandbox-init-setup "yarn install"}}
               original-fetch js/fetch
               find-index (fn [pred coll]
                            (first
                             (keep-indexed (fn [idx item]
                                             (when (pred item) idx))
                                           coll)))]
           (set! js/fetch
                 (fn [request init]
                   (let [url (fetch-url request)
                         method (fetch-method request init)]
                     (cond
                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites")
                            (not (string/includes? url "/exec")))
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:name "logseq-task-sess-init-sp"})
                         #js {:status 200 :headers #js {"content-type" "application/json"}}))

                       (and (= "POST" method)
                            (string/includes? url "/v1/sprites/logseq-task-sess-init-sp/exec"))
                       (let [parsed (js/URL. url)
                             cmds (vec (.getAll (.-searchParams parsed) "cmd"))
                             script (nth cmds 2 nil)
                             create-session? (and (string? script)
                                                  (string/includes? script "/v1/sessions/sess-init-sp"))
                             health? (and (string? script)
                                          (string/includes? script "/v1/health"))]
                         (when (string? script)
                           (swap! scripts conj script))
                         (js/Promise.resolve
                          (js/Response.
                           (js/JSON.stringify
                            (clj->js (cond
                                       create-session?
                                       {:result {:stdout "{\"ok\":true}\n__HTTP_STATUS__:200"
                                                 :stderr ""}}

                                       health?
                                       {:result {:stdout "__HEALTH_OK__"
                                                 :stderr ""}}

                                       :else
                                       {:result {:stdout ""
                                                 :stderr ""}})))
                           #js {:status 200 :headers #js {"content-type" "application/json"}})))

                       :else
                       (js/Promise.resolve
                        (js/Response.
                         (js/JSON.stringify #js {:error "unexpected request"})
                         #js {:status 500 :headers #js {"content-type" "application/json"}}))))))
           (-> (runtime-provider/<provision-runtime! provider "sess-init-sp" task)
               (.then (fn [runtime]
                        (set! js/fetch original-fetch)
                        (let [all-scripts @scripts
                              clone-idx (find-index #(string/includes? % "git clone --depth 1 --single-branch --no-tags")
                                                    all-scripts)
                              health-idx (find-index #(string/includes? % "/v1/health")
                                                     all-scripts)
                              setup-idx (find-index #(string/includes? % "yarn install")
                                                    all-scripts)]
                          (is (= "sprites" (:provider runtime)))
                          (is (number? clone-idx))
                          (is (number? health-idx))
                          (is (number? setup-idx))
                          (is (< clone-idx setup-idx))
                          (is (< health-idx setup-idx))
                          (is (string/includes? (nth all-scripts setup-idx) "cd '/workspace/sess-init-sp'")))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest cloudflare-provider-provision-test
  (async done
         (let [calls (atom {:health 0})
               sandbox-stub
               #js {:exec
                    (fn [cmd]
                      (if (string/includes? cmd "/v1/health")
                        (let [n (swap! calls update :health inc)]
                          (js/Promise.resolve #js {:success (>= (:health n) 2)}))
                        (js/Promise.resolve #js {:success true :stdout "" :stderr ""})))
                    :setEnvVars
                    (fn [vars]
                      (swap! calls assoc :env (js->clj vars))
                      (js/Promise.resolve nil))
                    :startProcess
                    (fn [cmd]
                      (swap! calls assoc :start cmd)
                      (js/Promise.resolve nil))
                    :containerFetch
                    (fn [req port]
                      (swap! calls assoc :create-url (.-url req) :create-port port :create-method (.-method req))
                      (js/Promise.resolve
                       (js/Response.
                        (js/JSON.stringify #js {:ok true})
                        #js {:status 200 :headers #js {"content-type" "application/json"}})))}
               sandbox-ns
               #js {:idFromName (fn [name]
                                  (swap! calls assoc :sandbox-name name)
                                  (str "id-" name))
                    :get (fn [id]
                           (swap! calls assoc :sandbox-id id)
                           sandbox-stub)}
               env #js {"Sandbox" sandbox-ns
                        "CLOUDFLARE_SANDBOX_AGENT_PORT" "8000"
                        "OPENAI_API_KEY" "sk-openai"}
               provider (runtime-provider/create-provider env "cloudflare")
               task {:agent {:provider "codex"}}]
           (-> (runtime-provider/<provision-runtime! provider "sess-1" task)
               (.then (fn [runtime]
                        (is (= "cloudflare" (:provider runtime)))
                        (is (= "logseq-task-sess-1" (:sandbox-id runtime)))
                        (is (= "sess-1" (:session-id runtime)))
                        (is (= "POST" (:create-method @calls)))
                        (is (string/includes? (:create-url @calls) "/v1/sessions/sess-1"))
                        (is (= "sk-openai" (get (:env @calls) "OPENAI_API_KEY")))
                        (is (string/includes? (:start @calls) "sandbox-agent server"))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest cloudflare-provider-provision-runs-project-init-setup-after-sandbox-ready-test
  (async done
         (let [calls (atom {:exec []})
               find-index (fn [pred coll]
                            (first
                             (keep-indexed (fn [idx item]
                                             (when (pred item) idx))
                                           coll)))
               sandbox-stub
               #js {:exec
                    (fn [cmd]
                      (swap! calls update :exec conj cmd)
                      (if (string/includes? cmd "/v1/health")
                        (js/Promise.resolve #js {:success true})
                        (js/Promise.resolve #js {:success true :stdout "" :stderr ""})))
                    :setEnvVars
                    (fn [_]
                      (js/Promise.resolve nil))
                    :startProcess
                    (fn [_]
                      (js/Promise.resolve nil))
                    :containerFetch
                    (fn [_req _port]
                      (js/Promise.resolve
                       (js/Response.
                        (js/JSON.stringify #js {:ok true})
                        #js {:status 200 :headers #js {"content-type" "application/json"}})))}
               sandbox-ns
               #js {:idFromName (fn [name] name)
                    :get (fn [_id] sandbox-stub)}
               env #js {"Sandbox" sandbox-ns
                        "CLOUDFLARE_SANDBOX_AGENT_PORT" "8000"}
               provider (runtime-provider/create-provider env "cloudflare")
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/example/repo"
                               :sandbox-init-setup "yarn install"}}]
           (-> (runtime-provider/<provision-runtime! provider "sess-init-cf" task)
               (.then (fn [runtime]
                        (let [exec-cmds (:exec @calls)
                              clone-idx (find-index #(string/includes? % "git clone --depth 1 --single-branch --no-tags")
                                                    exec-cmds)
                              health-idx (find-index #(string/includes? % "/v1/health")
                                                     exec-cmds)
                              setup-idx (find-index #(string/includes? % "yarn install")
                                                    exec-cmds)]
                          (is (= "cloudflare" (:provider runtime)))
                          (is (number? clone-idx))
                          (is (number? health-idx))
                          (is (number? setup-idx))
                          (is (< clone-idx setup-idx))
                          (is (< health-idx setup-idx))
                          (is (string/includes? (nth exec-cmds setup-idx) "cd '/workspace/sess-init-cf'")))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest cloudflare-provider-events-stream-test
  (async done
         (let [calls (atom {})
               sandbox-stub
               #js {:containerFetch
                    (fn [req port]
                      (swap! calls assoc :url (.-url req) :method (.-method req) :port port)
                      (js/Promise.resolve
                       (js/Response.
                        "data: {\"type\":\"item.delta\",\"delta\":\"ok\"}\n\n"
                        #js {:status 200 :headers #js {"content-type" "text/event-stream"}})))}
               sandbox-ns
               #js {:idFromName (fn [_] "id-sbx")
                    :get (fn [_] sandbox-stub)}
               env #js {"Sandbox" sandbox-ns}
               provider (runtime-provider/create-provider env "cloudflare")
               runtime {:provider "cloudflare"
                        :sandbox-id "sbx-1"
                        :sandbox-port 8000
                        :session-id "sess-3"}]
           (-> (runtime-provider/<open-events-stream! provider runtime)
               (.then (fn [resp]
                        (is (= 200 (.-status resp)))
                        (is (= "GET" (:method @calls)))
                        (is (string/includes? (:url @calls) "/v1/sessions/sess-3/events/sse"))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest cloudflare-provider-send-message-test
  (async done
         (let [calls (atom {})
               sandbox-stub
               #js {:containerFetch
                    (fn [req port]
                      (swap! calls assoc :url (.-url req) :method (.-method req) :port port)
                      (js/Promise.resolve
                       (js/Response.
                        (js/JSON.stringify #js {:ok true})
                        #js {:status 200 :headers #js {"content-type" "application/json"}})))}
               sandbox-ns
               #js {:idFromName (fn [_] "id-sbx")
                    :get (fn [_] sandbox-stub)}
               env #js {"Sandbox" sandbox-ns}
               provider (runtime-provider/create-provider env "cloudflare")
               runtime {:provider "cloudflare"
                        :sandbox-id "sbx-1"
                        :sandbox-port 8000
                        :session-id "sess-3"}]
           (-> (runtime-provider/<send-message! provider runtime {:message "ping" :kind "chat"})
               (.then (fn [_]
                        (is (= "POST" (:method @calls)))
                        (is (string/includes? (:url @calls) "/v1/sessions/sess-3/messages"))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest local-dev-provider-open-terminal-unsupported-test
  (async done
         (let [env #js {"SANDBOX_AGENT_URL" "http://127.0.0.1:2468"}
               provider (runtime-provider/create-provider env "local-dev")
               runtime {:provider "local-dev"
                        :base-url "http://127.0.0.1:2468"
                        :session-id "sess-terminal-unsupported"}
               request (js/Request. "http://db-sync.local/sessions/sess-terminal-unsupported/terminal"
                                    #js {:method "GET"})]
           (-> (runtime-provider/<open-terminal! provider runtime request {:cols 120 :rows 40})
               (.then (fn [_]
                        (is false "expected local-dev terminal to reject as unsupported")
                        (done)))
               (.catch (fn [error]
                         (let [data (ex-data error)]
                           (is (= :unsupported-terminal (:reason data)))
                           (is (= "local-dev" (:provider data))))
                         (done)))))))

(deftest cloudflare-provider-open-terminal-test
  (async done
         (let [calls (atom {})
               session-stub
               #js {:terminal
                    (fn [request opts]
                      (swap! calls assoc
                             :terminal-url (.-url request)
                             :terminal-method (.-method request)
                             :terminal-opts (js->clj opts :keywordize-keys true))
                      (js/Promise.resolve
                       (js/Response.
                        "ok"
                        #js {:status 200})))}
               sandbox-stub
               #js {:getSession
                    (fn [session-id]
                      (swap! calls assoc :runtime-session-id session-id)
                      (js/Promise.resolve session-stub))}
               sandbox-ns
               #js {:idFromName (fn [_] "id-sbx")
                    :get (fn [_] sandbox-stub)}
               env #js {"Sandbox" sandbox-ns}
               provider (runtime-provider/create-provider env "cloudflare")
               runtime {:provider "cloudflare"
                        :sandbox-id "sbx-1"
                        :sandbox-port 8000
                        :session-id "sess-3"}
               request (js/Request. "http://db-sync.local/sessions/sess-3/terminal"
                                    #js {:method "GET"})]
           (-> (runtime-provider/<open-terminal! provider runtime request {:cols 120 :rows 40})
               (.then (fn [resp]
                        (is (= 200 (.-status resp)))
                        (is (= "sess-3" (:runtime-session-id @calls)))
                        (is (= "GET" (:terminal-method @calls)))
                        (is (= 120 (get-in @calls [:terminal-opts :cols])))
                        (is (= 40 (get-in @calls [:terminal-opts :rows])))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest cloudflare-provider-open-terminal-missing-method-test
  (async done
         (let [session-stub #js {}
               sandbox-stub
               #js {:getSession
                    (fn [_session-id]
                      (js/Promise.resolve session-stub))}
               sandbox-ns
               #js {:idFromName (fn [_] "id-sbx")
                    :get (fn [_] sandbox-stub)}
               env #js {"Sandbox" sandbox-ns}
               provider (runtime-provider/create-provider env "cloudflare")
               runtime {:provider "cloudflare"
                        :sandbox-id "sbx-1"
                        :sandbox-port 8000
                        :session-id "sess-3"}
               request (js/Request. "http://db-sync.local/sessions/sess-3/terminal"
                                    #js {:method "GET"})]
           (-> (runtime-provider/<open-terminal! provider runtime request {:cols 120 :rows 40})
               (.then (fn [_]
                        (is false "expected cloudflare terminal to reject when session.terminal is missing")
                        (done)))
               (.catch (fn [error]
                         (let [data (ex-data error)]
                           (is (= :unsupported-terminal (:reason data)))
                           (is (= "sbx-1" (:sandbox-id data)))
                           (is (= "sess-3" (:session-id data))))
                         (done)))))))

(deftest cloudflare-provider-does-not-auto-backup-or-restore-test
  (async done
         (runtime-provider/clear-cloudflare-backup-cache!)
         (let [calls (atom {:clone 0
                            :restore 0
                            :backup 0})
               sandboxes (atom {})
               make-sandbox
               (fn [sandbox-id]
                 #js {:exec
                      (fn [cmd]
                        (cond
                          (string/includes? cmd "/v1/health")
                          (js/Promise.resolve #js {:success true})

                          (string/includes? cmd "git clone --depth 1 --single-branch --no-tags")
                          (do
                            (swap! calls update :clone inc)
                            (js/Promise.resolve #js {:success true}))

                          :else
                          (js/Promise.resolve #js {:success true :stdout "" :stderr ""})))
                      :setEnvVars (fn [_] (js/Promise.resolve nil))
                      :startProcess (fn [_] (js/Promise.resolve nil))
                      :containerFetch
                      (fn [_req _port]
                        (js/Promise.resolve
                         (js/Response.
                          (js/JSON.stringify #js {:ok true})
                          #js {:status 200 :headers #js {"content-type" "application/json"}})))
                      :createBackup
                      (fn [_opts]
                        (swap! calls update :backup inc)
                        (js/Promise.resolve #js {:id (str sandbox-id "-backup")
                                                 :dir "/workspace"}))
                      :restoreBackup
                      (fn [_backup]
                        (swap! calls update :restore inc)
                        (js/Promise.resolve #js {:success true}))
                      :delete (fn [] (js/Promise.resolve nil))})
               sandbox-ns
               #js {:idFromName (fn [name] name)
                    :get (fn [id]
                           (or (get @sandboxes id)
                               (let [sandbox (make-sandbox id)]
                                 (swap! sandboxes assoc id sandbox)
                                 sandbox)))}
               env #js {"Sandbox" sandbox-ns
                        "CLOUDFLARE_SANDBOX_AGENT_PORT" "8000"}
               provider (runtime-provider/create-provider env "cloudflare")
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/example/repo"
                               :base-branch "main"}}]
           (-> (runtime-provider/<provision-runtime! provider "sess-no-auto-bk-1" task)
               (.then (fn [runtime]
                        (is (= 1 (:clone @calls)))
                        (is (= 0 (:restore @calls)))
                        (-> (runtime-provider/<terminate-runtime! provider runtime)
                            (.then (fn [_]
                                     (is (= 0 (:backup @calls)))
                                     (is (= 0 (:restore @calls)))
                                     (done)))
                            (.catch (fn [error]
                                      (is false (str "unexpected terminate error: " error))
                                      (done))))))
               (.catch (fn [error]
                         (is false (str "unexpected provision error: " error))
                         (done)))))))

(deftest cloudflare-provider-does-not-restore-from-in-memory-cache-test
  (async done
         (runtime-provider/clear-cloudflare-backup-cache!)
         (let [calls (atom {:clone 0
                            :restore []
                            :backup 0})
               sandboxes (atom {})
               make-sandbox
               (fn [sandbox-id]
                 #js {:exec
                      (fn [cmd]
                        (cond
                          (string/includes? cmd "/v1/health")
                          (js/Promise.resolve #js {:success true})

                          (string/includes? cmd "git clone --depth 1 --single-branch --no-tags")
                          (do
                            (swap! calls update :clone inc)
                            (js/Promise.resolve #js {:success true}))

                          :else
                          (js/Promise.resolve #js {:success true :stdout "" :stderr ""})))
                      :setEnvVars (fn [_] (js/Promise.resolve nil))
                      :startProcess (fn [_] (js/Promise.resolve nil))
                      :containerFetch
                      (fn [_req _port]
                        (js/Promise.resolve
                         (js/Response.
                          (js/JSON.stringify #js {:ok true})
                          #js {:status 200 :headers #js {"content-type" "application/json"}})))
                      :createBackup
                      (fn [_opts]
                        (swap! calls update :backup inc)
                        (js/Promise.resolve #js {:id "backup-restore-1"
                                                 :dir "/workspace"}))
                      :restoreBackup
                      (fn [backup]
                        (swap! calls update :restore conj (js->clj backup :keywordize-keys true))
                        (js/Promise.resolve #js {:success true}))
                      :delete (fn [] (js/Promise.resolve nil))})
               sandbox-ns
               #js {:idFromName (fn [name] name)
                    :get (fn [id]
                           (or (get @sandboxes id)
                               (let [sandbox (make-sandbox id)]
                                 (swap! sandboxes assoc id sandbox)
                                 sandbox)))}
               env #js {"Sandbox" sandbox-ns
                        "CLOUDFLARE_SANDBOX_AGENT_PORT" "8000"}
               provider (runtime-provider/create-provider env "cloudflare")
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/example/repo"
                               :base-branch "main"}}
               runtime {:provider "cloudflare"
                        :sandbox-id "sbx-1"
                        :session-id "sess-cache"}]
           (-> (runtime-provider/<snapshot-runtime! provider runtime {:task task})
               (.then (fn [_]
                        (is (= 1 (:backup @calls)))
                        (-> (runtime-provider/<provision-runtime! provider "sess-cache-next" task)
                            (.then (fn [_next-runtime]
                                     (is (= 1 (:clone @calls)))
                                     (is (= 0 (count (:restore @calls))))
                                     (done)))
                            (.catch (fn [error]
                                      (is false (str "unexpected reprovision error: " error))
                                      (done))))))
               (.catch (fn [error]
                         (is false (str "unexpected snapshot error: " error))
                         (done)))))))

(deftest cloudflare-provider-restores-from-task-checkpoint-test
  (async done
         (runtime-provider/clear-cloudflare-backup-cache!)
         (let [calls (atom {:clone 0
                            :restore []})
               sandboxes (atom {})
               make-sandbox
               (fn [sandbox-id]
                 #js {:exec
                      (fn [cmd]
                        (cond
                          (string/includes? cmd "/v1/health")
                          (js/Promise.resolve #js {:success true})

                          (string/includes? cmd "git clone --depth 1 --single-branch --no-tags")
                          (do
                            (swap! calls update :clone inc)
                            (js/Promise.resolve #js {:success true}))

                          :else
                          (js/Promise.resolve #js {:success true :stdout "" :stderr ""})))
                      :setEnvVars (fn [_] (js/Promise.resolve nil))
                      :startProcess (fn [_] (js/Promise.resolve nil))
                      :containerFetch
                      (fn [_req _port]
                        (js/Promise.resolve
                         (js/Response.
                          (js/JSON.stringify #js {:ok true})
                          #js {:status 200 :headers #js {"content-type" "application/json"}})))
                      :restoreBackup
                      (fn [backup]
                        (swap! calls update :restore conj (js->clj backup :keywordize-keys true))
                        (js/Promise.resolve #js {:success true}))
                      :delete (fn [] (js/Promise.resolve nil))})
               sandbox-ns
               #js {:idFromName (fn [name] name)
                    :get (fn [id]
                           (or (get @sandboxes id)
                               (let [sandbox (make-sandbox id)]
                                 (swap! sandboxes assoc id sandbox)
                                 sandbox)))}
               env #js {"Sandbox" sandbox-ns
                        "CLOUDFLARE_SANDBOX_AGENT_PORT" "8000"}
               provider (runtime-provider/create-provider env "cloudflare")
               task {:agent {:provider "codex"}
                     :project {:repo-url "https://github.com/example/repo"
                               :base-branch "main"}
                     :sandbox-checkpoint {:provider "cloudflare"
                                          :snapshot-id "backup-from-task-1"}}]
           (-> (runtime-provider/<provision-runtime! provider "sess-cf-checkpoint" task)
               (.then (fn [_runtime]
                        (is (= 0 (:clone @calls)))
                        (is (= 1 (count (:restore @calls))))
                        (is (= "backup-from-task-1"
                               (get-in @calls [:restore 0 :id])))
                        (is (= "/workspace/sess-cf-checkpoint"
                               (get-in @calls [:restore 0 :dir])))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected cloudflare task-checkpoint restore error: " error))
                         (done)))))))

(deftest cloudflare-provider-snapshot-runtime-test
  (async done
         (runtime-provider/clear-cloudflare-backup-cache!)
         (let [calls (atom {})
               sandbox-stub
               #js {:createBackup
                    (fn [opts]
                      (swap! calls assoc :snapshot-opts (js->clj opts :keywordize-keys true))
                      (js/Promise.resolve #js {:id "backup-42"}))}
               sandbox-ns
               #js {:idFromName (fn [name] name)
                    :get (fn [_id] sandbox-stub)}
               env #js {"Sandbox" sandbox-ns}
               provider (runtime-provider/create-provider env "cloudflare")
               runtime {:provider "cloudflare"
                        :sandbox-id "sbx-1"
                        :session-id "sess-snapshot"}]
           (-> (runtime-provider/<snapshot-runtime! provider
                                                    runtime
                                                    {:task {:project {:repo-url "https://github.com/example/repo"
                                                                      :base-branch "main"}}})
               (.then (fn [result]
                        (is (= "backup-42" (:snapshot-id result)))
                        (is (= "/workspace/sess-snapshot" (get-in @calls [:snapshot-opts :dir])))
                        (is (= 604800 (get-in @calls [:snapshot-opts :ttl])))
                        (is (string? (get-in @calls [:snapshot-opts :name])))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected snapshot error: " error))
                         (done)))))))
