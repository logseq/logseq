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
