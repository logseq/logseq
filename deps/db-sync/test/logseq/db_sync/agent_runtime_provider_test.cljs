(ns logseq.db-sync.agent-runtime-provider-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.db-sync.worker.agent.runtime-provider :as runtime-provider]))

(deftest provider-kind-test
  (testing "normalizes configured runtime provider"
    (is (= "sprites" (runtime-provider/provider-kind #js {})))
    (is (= "sprites" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "SPRITES"})))
    (is (= "local-dev" (runtime-provider/provider-kind #js {"AGENT_RUNTIME_PROVIDER" "LOCAL-DEV"})))))

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
      (is (= "sprites"
             (runtime-provider/runtime-provider-kind env {:provider "sprites"})))
      (is (= "cloudflare"
             (runtime-provider/runtime-provider-kind env {:provider "cloudflare"}))))))

(deftest repo-clone-command-test
  (testing "builds default repo clone command when repo url exists"
    (let [env #js {}
          task {:project {:repo-url "https://github.com/example/repo"}}
          session-id "sess-1"]
      (is (= "mkdir -p /workspace && cd /workspace && git clone 'https://github.com/example/repo' '/workspace/sess-1' && chmod -R u+rw '/workspace/sess-1'"
             (runtime-provider/repo-clone-command env session-id task)))))

  (testing "fills override repo clone command template"
    (let [env #js {"SPRITES_REPO_CLONE_COMMAND" "echo {repo_url} {session_id} {repo_dir}"}
          task {:project {:repo-url "https://github.com/example/repo"}}
          session-id "sess-1"]
      (is (= "echo https://github.com/example/repo sess-1 /workspace/sess-1"
             (runtime-provider/repo-clone-command env session-id task)))))

  (testing "returns nil when repo url missing"
    (is (nil? (runtime-provider/repo-clone-command #js {} "sess-1" {})))))

(deftest session-payload-test
  (testing "defaults permission mode to default"
    (is (= "default"
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
