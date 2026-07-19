(ns frontend.reaction-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.reaction :as reaction]))

(deftest summarize-usernames
  (testing "collects unique usernames per emoji"
    (let [alice {:db/id 1 :block/title "Alice"}
          bob {:db/id 2 :block/title "Bob"}
          reactions [{:logseq.property.reaction/emoji-id "+1"
                      :logseq.property/created-by-ref alice}
                     {:logseq.property.reaction/emoji-id "+1"
                      :logseq.property/created-by-ref bob}
                     {:logseq.property.reaction/emoji-id "+1"
                      :logseq.property/created-by-ref alice}]
          summary (reaction/summarize reactions nil)
          item (first summary)]
      (is (= "+1" (:emoji-id item)))
      (is (= ["Alice" "Bob"] (:usernames item)))
      (is (= 3 (:count item))))))

(deftest summarize-identifies-current-user-by-uuid
  (let [current-user-uuid (random-uuid)
        reactions [{:logseq.property.reaction/emoji-id "+1"
                    :logseq.property/created-by-ref
                    {:db/id 42
                     :block/uuid current-user-uuid
                     :block/title "Current user"}}]
        summary (reaction/summarize reactions current-user-uuid)]
    (is (true? (:reacted-by-me? (first summary)))
        "Reaction payloads should identify the current user without another DB lookup.")))
