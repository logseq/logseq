(ns logseq.agents.request-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.agents.request :as request]
            [logseq.sync.worker.http :as http]))

(deftest sessions-create-coerce-test
  (testing "accepts simplified sessions/create request"
    (let [body {:session-id "sess-1"
                :node-id "node-1"
                :node-title "Title"
                :content "Hello"
                :attachments ["https://example.com/a.png"]
                :runtime-provider "local-runner"
                :runner-id "runner-1"
                :project {:id "project-1"
                          :title "Demo Project"
                          :repo-url "https://github.com/example/repo"}
                :agent "codex"}
          coerced (http/coerce-http-request :sessions/create body)]
      (is (= body coerced))))
  (testing "rejects missing required fields"
    (is (nil? (http/coerce-http-request :sessions/create {:session-id "sess-1"})))))

(deftest normalize-session-create-test
  (testing "normalizes simplified request into agent task"
    (let [body {:session-id "sess-1"
                :node-id "node-1"
                :node-title "Title"
                :content "Hello"
                :attachments ["https://example.com/a.png" "https://example.com/b.png"]
                :project {:id "project-1"
                          :title "Demo Project"
                          :repo-url "https://github.com/example/repo"}
                :agent {:provider "codex"
                        :api-token "token-123"
                        :auth-json "{\"tokens\":{\"access_token\":\"abc\"}}"}
                :runtime-provider "local-runner"
                :runner-id "runner-1"
                :capabilities {:push-enabled false
                               :pr-enabled true}}
          normalized (request/normalize-session-create body)]
      (is (= {:id "sess-1"
              :source {:node-id "node-1"
                       :node-title "Title"}
              :intent {:content "Hello"
                       :attachments ["https://example.com/a.png"
                                     "https://example.com/b.png"]}
              :project {:id "project-1"
                        :title "Demo Project"
                        :repo-url "https://github.com/example/repo"}
              :agent {:provider "codex"
                      :api-token "token-123"
                      :auth-json "{\"tokens\":{\"access_token\":\"abc\"}}"}
              :runtime-provider "local-runner"
              :runner-id "runner-1"
              :capabilities {:push-enabled false
                             :pr-enabled true}}
             normalized)))))

(deftest sessions-pr-coerce-test
  (testing "accepts sessions/pr request payload"
    (let [body {:title "feat: add m14 publish"
                :body "This change enables push + optional PR."
                :commit-message "feat: summarize m14 publish changes"
                :head-branch "m14/publish"
                :base-branch "main"
                :create-pr true
                :force false}
          coerced (http/coerce-http-request :sessions/pr body)]
      (is (= body coerced))))
  (testing "accepts empty sessions/pr payload (defaults resolved in handler)"
    (is (= {} (http/coerce-http-request :sessions/pr {}))))
  (testing "rejects invalid sessions/pr payload"
    (is (nil? (http/coerce-http-request :sessions/pr {:create-pr "yes"})))
    (is (nil? (http/coerce-http-request :sessions/pr {:force "no"})))
    (is (nil? (http/coerce-http-request :sessions/pr {:commit-message 100})))
    (is (nil? (http/coerce-http-request :sessions/pr {:head-branch 42})))))

(deftest sessions-snapshot-coerce-test
  (testing "accepts empty sessions/snapshot request payload"
    (is (= {} (http/coerce-http-request :sessions/snapshot {}))))
  (testing "rejects invalid sessions/snapshot payload"
    (is (nil? (http/coerce-http-request :sessions/snapshot {:force true})))))

(deftest runners-register-coerce-test
  (testing "accepts runner register payload"
    (let [body {:runner-id "runner-1"
                :base-url "https://runner.example.com"
                :agent-token "runner-token"
                :access-client-id "client-id"
                :access-client-secret "client-secret"
                :max-sessions 2}
          coerced (http/coerce-http-request :runners/register body)]
      (is (= body coerced))))
  (testing "rejects invalid runner register payload"
    (is (nil? (http/coerce-http-request :runners/register {:runner-id "runner-1"})))
    (is (nil? (http/coerce-http-request :runners/register {:runner-id 10
                                                           :base-url "https://runner.example.com"})))
    (is (nil? (http/coerce-http-request :runners/register {:runner-id "runner-1"
                                                           :base-url "https://runner.example.com"
                                                           :max-sessions "2"})))))

(deftest runners-heartbeat-coerce-test
  (testing "accepts runner heartbeat payload"
    (let [body {:active-sessions 1}
          coerced (http/coerce-http-request :runners/heartbeat body)]
      (is (= body coerced))))
  (testing "accepts empty heartbeat payload"
    (is (= {} (http/coerce-http-request :runners/heartbeat {}))))
  (testing "rejects invalid heartbeat payload"
    (is (nil? (http/coerce-http-request :runners/heartbeat {:active-sessions "1"})))))

(deftest normalize-runner-register-test
  (testing "normalizes register payload with defaults"
    (let [normalized (request/normalize-runner-register
                      {:runner-id " runner-1 "
                       :base-url "https://runner.example.com/"
                       :agent-token " runner-token "
                       :max-sessions 0}
                      "user-1")]
      (is (= {:runner-id "runner-1"
              :user-id "user-1"
              :base-url "https://runner.example.com"
              :agent-token "runner-token"
              :max-sessions 1}
             normalized)))))
