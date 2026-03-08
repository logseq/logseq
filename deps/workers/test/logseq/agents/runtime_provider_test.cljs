(ns logseq.agents.runtime-provider-test
  (:require [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.agents.runtime-provider :as runtime-provider]))

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
    (is (= "local-runner" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "LOCAL-RUNNER"})))
    (is (= "e2b" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "unknown"})))))

(deftest fill-template-test
  (testing "fills sandbox id placeholders"
    (is (= "/sandboxes/sbx-1/commands"
           (runtime-provider/fill-template "/sandboxes/{sandbox_id}/commands" "sbx-1")))
    (is (= "https://sbx-1.agent.internal"
           (runtime-provider/fill-template "https://{sandbox_id}.agent.internal" "sbx-1")))))

(deftest runtime-provider-resolution-test
  (testing "prefers runtime provider, falls back to env provider"
    (let [env #js {"AGENT_RUNTIME_PROVIDER" "local-runner"}]
      (is (= "local-runner"
             (runtime-provider/runtime-provider-kind env {:provider "local-runner"})))
      (is (= "e2b"
             (runtime-provider/runtime-provider-kind env {:provider "e2b"})))
      (is (= "local-runner"
             (runtime-provider/runtime-provider-kind env {:provider "unknown"}))))))

(deftest provider-dispatch-test
  (testing "create-provider and resolve-provider dispatch supported providers"
    (let [env #js {"AGENT_RUNTIME_PROVIDER" "e2b"}]
      (is (= "e2b"
             (runtime-provider/provider-id (runtime-provider/create-provider env "e2b"))))
      (is (= "local-runner"
             (runtime-provider/provider-id (runtime-provider/create-provider env "local-runner"))))
      (is (= "e2b"
             (runtime-provider/provider-id (runtime-provider/create-provider env "unknown"))))
      (is (= "e2b"
             (runtime-provider/provider-id (runtime-provider/resolve-provider env {:provider "e2b"}))))
      (is (= "local-runner"
             (runtime-provider/provider-id (runtime-provider/resolve-provider env {:provider "local-runner"}))))
      (is (= "e2b"
             (runtime-provider/provider-id (runtime-provider/resolve-provider env nil)))))))

(deftest runtime-terminal-supported-test
  (testing "only e2b runtime supports browser terminal"
    (is (true? (runtime-provider/runtime-terminal-supported? {:provider "e2b"})))
    (is (false? (runtime-provider/runtime-terminal-supported? {:provider "local-runner"})))))

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

(deftest repo-clone-command-test
  (testing "builds default e2b repo clone command when repo url exists"
    (let [env #js {}
          task {:project {:repo-url "https://github.com/example/repo"}}
          session-id "sess-1"]
      (is (= "mkdir -p '/home/user/workspace' && cd '/home/user/workspace' && git clone --depth 1 --single-branch --no-tags 'https://github.com/example/repo' '/home/user/workspace/repo' && chmod -R u+rw '/home/user/workspace/repo'"
             (runtime-provider/repo-clone-command env session-id task "e2b")))))

  (testing "fills e2b override repo clone command template"
    (let [env #js {"E2B_REPO_CLONE_COMMAND" "echo {repo_url} {session_id} {repo_dir}"}
          task {:project {:repo-url "https://github.com/example/repo"}}
          session-id "sess-1"]
      (is (= "echo https://github.com/example/repo sess-1 /home/user/workspace/repo"
             (runtime-provider/repo-clone-command env session-id task "e2b")))))

  (testing "returns nil when repo url missing"
    (is (nil? (runtime-provider/repo-clone-command #js {} "sess-1" {} "e2b")))))

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
