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
  (testing "builds sandbox ACP endpoints"
    (let [base "https://sandbox.example"
          server-id "sess-1"]
      (is (= "https://sandbox.example/v1/acp/sess-1"
             (sandbox/acp-server-url base server-id))))))

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
               calls (atom [])]
           (set! js/fetch
                 (fn [request]
                   (-> (.text (.clone request))
                       (.then (fn [body-text]
                                (swap! calls conj {:url (.-url request)
                                                   :method (.-method request)
                                                   :body (js->clj (js/JSON.parse body-text)
                                                                  :keywordize-keys true)})
                                (let [method (:method (last @calls))
                                      result (case method
                                               "initialize" #js {:protocolVersion "0.1.0"}
                                               "session/new" #js {:sessionId "remote-sess-1"}
                                               "session/set_mode" #js {}
                                               #js {:ok true})]
                                  (js/Response.
                                   (js/JSON.stringify #js {:jsonrpc "2.0"
                                                           :id (get-in @calls [(dec (count @calls)) :body :id])
                                                           :result result})
                                   #js {:status 200
                                        :headers #js {"content-type" "application/json"}})))))))
           (-> (sandbox/<create-session "https://sandbox.example" "token" "sess-1"
                                        {:agent "codex"
                                         :agentMode "build"
                                         :permissionMode "bypass"}
                                        {:cwd "/workspace/sess-1"})
               (.then (fn [_]
                        (set! js/fetch original-fetch)
                        (is (= ["https://sandbox.example/v1/acp/sess-1?agent=codex"
                                "https://sandbox.example/v1/acp/sess-1"
                                "https://sandbox.example/v1/acp/sess-1"]
                               (mapv :url @calls)))
                        (is (= "initialize" (get-in @calls [0 :body :method])))
                        (is (= "session/new" (get-in @calls [1 :body :method])))
                        (is (= "/workspace/sess-1"
                               (get-in @calls [1 :body :params :cwd])))
                        (is (= [] (get-in @calls [1 :body :params :mcpServers])))
                        (is (= "session/set_mode" (get-in @calls [2 :body :method])))
                        (is (= "auto"
                               (get-in @calls [2 :body :params :modeId])))
                        (is (= "sess-1"
                               (get-in @calls [2 :body :params :sessionId])))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (throw error)))))))

(deftest send-message-uses-acp-prompt-test
  (async done
         (let [original-fetch js/fetch
               requests (atom [])]
           (set! js/fetch
                 (fn [request]
                   (-> (.text (.clone request))
                       (.then (fn [body-text]
                                (swap! requests conj {:url (.-url request)
                                                      :method (.-method request)
                                                      :body (js->clj (js/JSON.parse body-text)
                                                                     :keywordize-keys true)})
                                (js/Response.
                                 (js/JSON.stringify #js {:jsonrpc "2.0"
                                                         :id (get-in @requests [(dec (count @requests)) :body :id])
                                                         :result #js {:stopReason "end_turn"}})
                                 #js {:status 200
                                      :headers #js {"content-type" "application/json"}}))))))
           (-> (sandbox/<send-message "https://sandbox.example" "token" "srv-1" "remote-sess-1"
                                      {:message "Ship it"})
               (.then (fn [_]
                        (set! js/fetch original-fetch)
                        (is (= "https://sandbox.example/v1/acp/srv-1"
                               (get-in @requests [0 :url])))
                        (is (= "session/prompt" (get-in @requests [0 :body :method])))
                        (is (= "remote-sess-1"
                               (get-in @requests [0 :body :params :sessionId])))
                        (is (= [{:type "text" :text "Ship it"}]
                               (get-in @requests [0 :body :params :prompt])))
                        (done)))
               (.catch (fn [error]
                         (set! js/fetch original-fetch)
                         (throw error)))))))

(deftest acp-envelope-event-test
  (testing "normalizes ACP session updates into worker runtime events only"
    (is (nil? (sandbox/acp-envelope->event
               {:jsonrpc "2.0"
                :id 3
                :result {:stopReason "end_turn"}})))
    (is (nil? (sandbox/acp-envelope->event
               {:jsonrpc "2.0"
                :id 4
                :result {:stopReason "cancelled"}})))
    (is (= {:type "agent.runtime"
            :data {:method "session/update"
                   :session-id "remote-sess-1"
                   :update {:sessionUpdate "agent_message_chunk"
                            :content "hello"}}}
           (sandbox/acp-envelope->event
            {:jsonrpc "2.0"
             :method "session/update"
             :params {:sessionId "remote-sess-1"
                      :update {:sessionUpdate "agent_message_chunk"
                               :content "hello"}}})))
    (is (nil? (sandbox/acp-envelope->event
               {:jsonrpc "2.0"
                :id 1
                :result {:sessionId "remote-sess-1"}})))))
