(ns frontend.components.agent-chat-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.components.agent-chat :as agent-chat]))

(deftest message->chat-message-uses-content-string-when-parts-missing-test
  (testing "falls back to legacy :content when :parts is missing"
    (let [message {:id "m-1"
                   :role "assistant"
                   :content "Hello from content"}
          result (#'agent-chat/message->chat-message message)]
      (is (= {:id "m-1"
              :role "assistant"
              :parts [{:type "text" :text "Hello from content"}]}
             result)))))

(deftest message->chat-message-uses-content-string-when-text-part-empty-test
  (testing "uses :content when existing text part is blank"
    (let [message {:id "m-2"
                   :role "assistant"
                   :content "Hello from fallback content"
                   :parts [{:type "text" :text "   "}]}
          result (#'agent-chat/message->chat-message message)]
      (is (= {:id "m-2"
              :role "assistant"
              :parts [{:type "text" :text "Hello from fallback content"}]}
             result)))))

(deftest message->chat-message-keeps-non-text-parts-test
  (testing "preserves non-text parts even when there is no textual content"
    (let [message {:id "m-3"
                   :role "assistant"
                   :parts [{:type "source-url"
                            :title "Doc"
                            :url "https://example.com"}]}
          result (#'agent-chat/message->chat-message message)]
      (is (= {:id "m-3"
              :role "assistant"
              :parts [{:type "source-url"
                       :title "Doc"
                       :url "https://example.com"}]}
             result)))))

(deftest message->chat-message-returns-nil-for-empty-message-test
  (testing "drops messages with no renderable content"
    (let [message {:id "m-4"
                   :role "assistant"
                   :parts [{:type "text" :text "   "}]}
          result (#'agent-chat/message->chat-message message)]
      (is (nil? result)))))

(deftest session->messages-keeps-reasoning-and-tool-parts-from-item-content-test
  (testing "maps item.content parts to AI element friendly message parts"
    (let [session {:events [{:type "item.completed"
                             :ts 1100
                             :data {:item_id "itm-1"
                                    :item {:item_id "itm-1"
                                           :kind "message"
                                           :role "assistant"
                                           :content [{:type "reasoning"
                                                      :text "inspect repo"}
                                                     {:type "tool_call"
                                                      :tool_call_id "call-1"
                                                      :tool_name "bash"
                                                      :arguments "{\"cmd\":\"ls\"}"}
                                                     {:type "tool_result"
                                                      :tool_call_id "call-1"
                                                      :output {:stdout "ok"}}
                                                     {:type "text"
                                                      :text "Done."}]}}}]}
          messages (#'agent-chat/session->messages session {:block/uuid "b1"})]
      (is (= [{:id "itm-1"
               :role "assistant"
               :parts [{:type "reasoning"
                        :text "inspect repo"}
                       {:type "tool-input-available"
                        :toolCallId "call-1"
                        :toolName "bash"
                        :input {:cmd "ls"}}
                       {:type "tool-output-available"
                        :toolCallId "call-1"
                        :output {:stdout "ok"}}
                       {:type "text"
                        :text "Done."}]}]
             messages)))))

(deftest session->messages-streaming-tool-result-events-to-tool-parts-test
  (testing "maps tool_result started/delta events to tool input/output parts"
    (let [session {:events [{:type "item.started"
                             :ts 1100
                             :data {:item {:item_id "itm-6"
                                           :native_item_id "call_BAmVsnQdKewfsophB4x7PTLI"
                                           :kind "tool_result"
                                           :role "tool"
                                           :content [{:type "json"
                                                      :json {:command "/bin/bash -lc ls"
                                                             :cwd "/workspace"
                                                             :status "InProgress"}}]}}}
                            {:type "item.delta"
                             :ts 1110
                             :data {:item_id "itm-6"
                                    :native_item_id "call_BAmVsnQdKewfsophB4x7PTLI"
                                    :delta "AGENTS.md\n"}}]}
          messages (#'agent-chat/session->messages session {:block/uuid "b2"})
          first-message (first messages)
          output-part (some #(when (= "tool-output-available" (:type %)) %) (:parts first-message))]
      (is (= "assistant" (:role first-message)))
      (is (= "call_BAmVsnQdKewfsophB4x7PTLI"
             (:toolCallId (some #(when (= "tool-input-available" (:type %)) %) (:parts first-message)))))
      (is (string/includes? (or (:output output-part) "") "AGENTS.md"))
      (is (not-any? #(= "text" (:type %)) (:parts first-message))))))

(deftest session->messages-unwraps-nested-runtime-envelope-test
  (testing "reads runtime payload from nested event data wrappers"
    (let [session {:events [{:event-id "evt_15"
                             :session-id "sess-1"
                             :type "item.completed"
                             :ts 1100
                             :data {:raw nil
                                    :time "2026-02-07T12:21:16.561277098Z"
                                    :session_id "sess-1"
                                    :type "item.completed"
                                    :source "agent"
                                    :data {:item {:item_id "itm_3"
                                                  :kind "message"
                                                  :role "assistant"
                                                  :content [{:type "reasoning"
                                                             :text "**Inspecting repo structure**"}]
                                                  :status "completed"}}}}]}
          messages (#'agent-chat/session->messages session {:block/uuid "b3"})]
      (is (= [{:id "itm_3"
               :role "assistant"
               :parts [{:type "reasoning"
                        :text "**Inspecting repo structure**"}]}]
             messages)))))

(deftest session->messages-includes-turn-completed-status-errors-test
  (testing "extracts status detail error message from turn.completed events"
    (let [session {:events [{:type "item.completed"
                             :ts 1100
                             :data {:item_id "itm-9"
                                    :item {:item_id "itm-9"
                                           :kind "status"
                                           :role "system"
                                           :content [{:type "status"
                                                      :label "turn.completed"
                                                      :detail "{\"error\":{\"codexErrorInfo\":\"unauthorized\",\"message\":\"Your access token could not be refreshed because your refresh token was already used. Please log out and sign in again.\"},\"status\":\"failed\"}"}]}}}]}
          messages (#'agent-chat/session->messages session {:block/uuid "b4"})]
      (is (= [{:id "itm-9"
               :role "assistant"
               :parts [{:type "text"
                        :text "Your access token could not be refreshed because your refresh token was already used. Please log out and sign in again."}]}]
             messages)))))

(deftest session->messages-includes-acp-agent-message-chunks-test
  (testing "maps ACP agent.runtime session/update message chunks into assistant text"
    (let [session {:events [{:type "agent.runtime"
                             :ts 1100
                             :data {:method "session/update"
                                    :session-id "runtime-1"
                                    :update {:sessionUpdate "agent_message_chunk"
                                             :content {:type "text"
                                                       :text "Received"}}}}
                            {:type "agent.runtime"
                             :ts 1110
                             :data {:method "session/update"
                                    :session-id "runtime-1"
                                    :update {:sessionUpdate "agent_message_chunk"
                                             :content {:type "text"
                                                       :text " test"}}}}]}
          messages (#'agent-chat/session->messages session {:block/uuid "b5"})]
      (is (= [{:id "runtime-1"
               :role "assistant"
               :parts [{:type "text"
                        :text "Received test"}]}]
             messages)))))

(deftest session->messages-ignores-non-chat-acp-runtime-events-test
  (testing "does not render ACP setup/config events as chat messages"
    (let [session {:events [{:type "agent.runtime"
                             :ts 1100
                             :data {:id 1
                                    :jsonrpc "2.0"
                                    :result {:protocolVersion 1}}}
                            {:type "agent.runtime"
                             :ts 1110
                             :data {:method "session/update"
                                    :session-id "runtime-1"
                                    :update {:sessionUpdate "config_option_update"
                                             :configOptions [{:id "mode"
                                                              :currentValue "auto"}]}}}
                            {:type "agent.runtime"
                             :ts 1120
                             :data {:method "session/update"
                                    :session-id "runtime-1"
                                    :update {:sessionUpdate "usage_update"
                                             :used 42}}}]}
          messages (#'agent-chat/session->messages session {:block/uuid "b6"})]
      (is (= [] messages)))))

(deftest session->messages-splits-acp-turns-by-end-turn-result-test
  (testing "separates assistant replies across ACP turns in the same runtime session"
    (let [session {:events [{:type "audit.log"
                             :ts 1000
                             :data {:event "user-message"
                                    :kind "user"
                                    :by "u1"
                                    :message "first"}}
                            {:type "agent.runtime"
                             :ts 1100
                             :data {:method "session/update"
                                    :session-id "runtime-1"
                                    :update {:sessionUpdate "agent_message_chunk"
                                             :content {:type "text"
                                                       :text "First"}}}}
                            {:type "agent.runtime"
                             :ts 1110
                             :session-id "do-session-1"
                             :data {:id 4
                                    :jsonrpc "2.0"
                                    :result {:stopReason "end_turn"}}}
                            {:type "audit.log"
                             :ts 1200
                             :data {:event "user-message"
                                    :kind "user"
                                    :by "u1"
                                    :message "second"}}
                            {:type "agent.runtime"
                             :ts 1300
                             :data {:method "session/update"
                                    :session-id "runtime-1"
                                    :update {:sessionUpdate "agent_message_chunk"
                                             :content {:type "text"
                                                       :text "Second"}}}}
                            {:type "agent.runtime"
                             :ts 1310
                             :session-id "do-session-1"
                             :data {:id 5
                                    :jsonrpc "2.0"
                                    :result {:stopReason "end_turn"}}}]}
          messages (#'agent-chat/session->messages session {:block/uuid "b7"})]
      (is (= [{:id "task-b7"
               :role "user"
               :parts [{:type "text" :text "first"}]}
              {:id "runtime-1-turn-1"
               :role "assistant"
               :parts [{:type "text" :text "First"}]}
              {:id "runtime-1-turn-2"
               :role "assistant"
               :parts [{:type "text" :text "Second"}]}]
             messages)))))

(deftest session-messages-need-sync-detects-content-growth-without-clobbering-optimistic-ui-test
  (testing "session updates with richer content should sync even when count is unchanged"
    (let [f (some-> (resolve 'frontend.components.agent-chat/session-messages-need-sync?)
                    deref)
          session-messages [{:id "assistant-1"
                             :role "assistant"
                             :parts [{:type "text"
                                      :text "full response text"}]}]
          ui-messages [{:id "assistant-1"
                        :role "assistant"
                        :parts [{:type "text"
                                 :text "full"}]}]]
      (is (fn? f))
      (when (fn? f)
        (is (true? (f session-messages ui-messages))))))
  (testing "session lag should not overwrite optimistic UI-only user messages"
    (let [f (some-> (resolve 'frontend.components.agent-chat/session-messages-need-sync?)
                    deref)
          session-messages [{:id "assistant-1"
                             :role "assistant"
                             :parts [{:type "text"
                                      :text "assistant reply"}]}]
          ui-messages [{:id "assistant-1"
                        :role "assistant"
                        :parts [{:type "text"
                                 :text "assistant reply"}]}
                       {:id "user-pending-1"
                        :role "user"
                        :parts [{:type "text"
                                 :text "queued message"}]}]]
      (is (fn? f))
      (when (fn? f)
        (is (false? (f session-messages ui-messages)))))))
