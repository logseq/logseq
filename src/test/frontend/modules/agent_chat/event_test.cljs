(ns frontend.modules.agent-chat.event-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.modules.agent-chat.event :as event]))

(deftest event-item-id-prefers-snake-case-and-ignores-legacy-key-shapes-test
  (testing "uses item_id from item payload when present"
    (is (= "itm-1"
           (event/event-item-id {:event-id "evt-1"}
                                {:item_id "itm-p"}
                                {:item_id "itm-1"}))))
  (testing "falls back to event-id when only legacy key shapes exist"
    (is (= "evt-1"
           (event/event-item-id {:event-id "evt-1"}
                                {:item-id "legacy-item"}
                                {:item-id "legacy-item"})))))

(deftest tool-call-id-accepts-only-canonical-runtime-fields-test
  (testing "reads tool_call_id"
    (is (= "call-1"
           (event/tool-call-id {:tool_call_id "call-1"}))))
  (testing "reads native_item_id for tool-result stream events"
    (is (= "native-call-1"
           (event/tool-call-id {:native_item_id "native-call-1"}))))
  (testing "does not read kebab/camel aliases"
    (is (nil? (event/tool-call-id {:tool-call-id "legacy-call"})))
    (is (nil? (event/tool-call-id {:toolCallId "legacy-call"})))))

(deftest tool-name-accepts-only-tool-name-test
  (testing "reads tool_name"
    (is (= "bash"
           (event/tool-name {:tool_name "bash"}))))
  (testing "does not read kebab/camel aliases"
    (is (nil? (event/tool-name {:tool-name "legacy"})))
    (is (nil? (event/tool-name {:toolName "legacy"})))))
