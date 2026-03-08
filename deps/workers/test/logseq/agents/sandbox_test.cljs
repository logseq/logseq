(ns logseq.agents.sandbox-test
  (:require [cljs.test :refer [async deftest is testing]]
            [logseq.agents.sandbox :as sandbox]))

(deftest normalize-base-url-test
  (testing "normalizes sandbox base urls"
    (is (= "https://sandbox.example" (sandbox/normalize-base-url "https://sandbox.example")))
    (is (= "https://sandbox.example" (sandbox/normalize-base-url "https://sandbox.example/")))
    (is (= "http://localhost:8787" (sandbox/normalize-base-url "http://localhost:8787//")))
    (is (= "https://2468-sbx.e2b.app" (sandbox/normalize-base-url "2468-sbx.e2b.app")))
    (is (= "https://2468-sbx.e2b.app" (sandbox/normalize-base-url " 2468-sbx.e2b.app/ ")))
    (is (= "http://localhost:8787" (sandbox/normalize-base-url "localhost:8787")))))

(deftest session-endpoint-test
  (testing "builds sandbox session endpoints"
    (let [base "https://sandbox.example"
          session-id "sess-1"]
      (is (= "https://sandbox.example/v1/sessions"
             (sandbox/sessions-base-url base)))
      (is (= "https://sandbox.example/v1/sessions/sess-1"
             (sandbox/session-url base session-id)))
      (is (= "https://sandbox.example/v1/sessions/sess-1/messages"
             (sandbox/messages-url base session-id)))
      (is (= "https://sandbox.example/v1/sessions/sess-1/events/sse"
             (sandbox/events-sse-url base session-id)))
      (is (= "https://sandbox.example/v1/sessions/sess-1/messages/stream"
             (sandbox/messages-stream-url base session-id))))))

(deftest snapshot-endpoint-test
  (testing "builds sandbox snapshot and exec endpoints"
    (let [base "https://sandbox.example"]
      (is (= "https://sandbox.example/v1/commands/exec"
             (sandbox/exec-command-url base)))
      (is (= "https://sandbox.example/v1/snapshots"
             (sandbox/snapshots-base-url base)))
      (is (= "https://sandbox.example/v1/snapshots/snap-1"
             (sandbox/snapshot-url base "snap-1")))
      (is (= "https://sandbox.example/v1/snapshots/snap-1/restore"
             (sandbox/snapshot-restore-url base "snap-1"))))))

(deftest normalize-agent-id-test
  (testing "normalizes known sandbox-agent aliases"
    (is (= "claude" (sandbox/normalize-agent-id "claude-code")))
    (is (= "claude" (sandbox/normalize-agent-id "CLAUDE_CODE")))
    (is (= "codex" (sandbox/normalize-agent-id "chatgpt")))
    (is (= "opencode" (sandbox/normalize-agent-id "open-code")))
    (is (= "codex" (sandbox/normalize-agent-id "codex")))
    (is (nil? (sandbox/normalize-agent-id "   ")))))

(deftest create-session-payload-test
  (async done
         (let [original-fetch js/fetch
               payloads (atom [])]
           (set! js/fetch
                 (fn [request]
                   (-> (.text (.clone request))
                       (.then (fn [body-text]
                                (swap! payloads conj (js->clj (js/JSON.parse body-text)
                                                              :keywordize-keys true))
                                (js/Response.
                                 (js/JSON.stringify #js {:ok true})
                                 #js {:status 200
                                      :headers #js {"content-type" "application/json"}}))))))
           (-> (sandbox/<create-session "https://sandbox.example" "token" "sess-1"
                                        {:agent "codex"
                                         :agentMode "build"
                                         :permissionMode "bypass"})
               (.then (fn [_]
                        (sandbox/<create-session "https://sandbox.example" "token" "sess-2"
                                                 {:agent "codex"
                                                  :agent-mode "build"
                                                  :permission-mode "read-only"})))
               (.then (fn [_]
                        (set! js/fetch original-fetch)
                        (is (= "bypass" (get-in @payloads [0 :permissionMode])))
                        (is (= "build" (get-in @payloads [0 :agentMode])))
                        (is (= "read-only" (get-in @payloads [1 :permissionMode])))
                        (is (= "build" (get-in @payloads [1 :agentMode])))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (throw error)))))))
