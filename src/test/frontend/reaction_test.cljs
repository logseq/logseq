(ns frontend.reaction-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.reaction :as reaction]))

(deftest summarize-usernames
  (testing "collects unique usernames per emoji"
    (let [reactions [{:logseq.property.reaction/emoji-id "+1"
                      :logseq.property/created-by-ref {:block/title "Alice"}}
                     {:logseq.property.reaction/emoji-id "+1"
                      :logseq.property/created-by-ref {:logseq.property.user/name "Bob"}}
                     {:logseq.property.reaction/emoji-id "+1"
                      :logseq.property/created-by-ref {:block/title "Alice"}}]
          summary (reaction/summarize reactions nil)
          item (first summary)]
      (is (= "+1" (:emoji-id item)))
      (is (= ["Alice" "Bob"] (:usernames item))))))
