(ns frontend.components.agent-chat-test
  (:require [cljs.test :refer [deftest is testing]]
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
