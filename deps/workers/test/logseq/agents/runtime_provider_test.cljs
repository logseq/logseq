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
               original-fetch js/fetch
               calls (atom [])]
           (set! js/fetch
                 (fn [request init]
                   (-> (.text (.clone request))
                       (.then (fn [body-text]
                                (swap! calls conj {:url (fetch-url request)
                                                   :method (fetch-method request init)
                                                   :auth (.get (.-headers request) "authorization")
                                                   :cf-id (.get (.-headers request) "CF-Access-Client-Id")
                                                   :cf-secret (.get (.-headers request) "CF-Access-Client-Secret")
                                                   :body (js->clj (js/JSON.parse body-text)
                                                                  :keywordize-keys true)})
                                (let [result (case (get-in @calls [(dec (count @calls)) :body :method])
                                               "initialize" #js {:protocolVersion "0.1.0"}
                                               "session/new" #js {:sessionId "remote-local-1"}
                                               "session/set_mode" #js {}
                                               #js {:ok true})]
                                  (js/Response.
                                   (js/JSON.stringify #js {:jsonrpc "2.0"
                                                           :id (get-in @calls [(dec (count @calls)) :body :id])
                                                           :result result})
                                   #js {:status 200 :headers #js {"content-type" "application/json"}})))))))
           (-> (runtime-provider/<provision-runtime! provider "sess-local-1" task)
               (.then (fn [runtime]
                        (set! js/fetch original-fetch)
                        (is (= ["https://runner.example.com/v1/acp/sess-local-1?agent=codex"
                                "https://runner.example.com/v1/acp/sess-local-1"
                                "https://runner.example.com/v1/acp/sess-local-1"]
                               (mapv :url @calls)))
                        (is (every? #(= "POST" (:method %)) @calls))
                        (is (every? #(= "Bearer runner-token" (:auth %)) @calls))
                        (is (every? #(= "cf-access-id" (:cf-id %)) @calls))
                        (is (every? #(= "cf-access-secret" (:cf-secret %)) @calls))
                        (is (= "local-runner" (:provider runtime)))
                        (is (= "runner-1" (:runner-id runtime)))
                        (is (= "https://runner.example.com" (:base-url runtime)))
                        (is (= "sess-local-1" (:server-id runtime)))
                        (is (= "remote-local-1" (:session-id runtime)))
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

(deftest e2b-runtime-repo-dir-test
  (testing "prefers persisted runtime backup dir"
    (is (= "/home/user/workspace/agent-test"
           (runtime-provider/e2b-runtime-repo-dir
            {:backup-dir "/home/user/workspace/agent-test"
             :session-id "sess-1"}
            nil))))

  (testing "falls back to task repo dir for e2b runtimes"
    (is (= "/home/user/workspace/agent-test"
           (runtime-provider/e2b-runtime-repo-dir
            {:session-id "sess-1"}
            {:project {:repo-url "https://github.com/logseq/agent-test"}})))))
