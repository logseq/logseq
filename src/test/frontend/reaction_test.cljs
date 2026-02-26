(ns frontend.reaction-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [frontend.reaction :as reaction]
            [frontend.test.helper :as test-helper :refer [load-test-files]]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(deftest summarize-usernames
  (testing "collects unique usernames per emoji"
    (load-test-files
     [{:page {:block/title "Alice"
              :build/properties {:logseq.property.user/email "alice@example.com"
                                 :logseq.property.user/name "alice"}}}
      {:page {:block/title "Bob"
              :build/properties {:logseq.property.user/email "bob@example.com"
                                 :logseq.property.user/name "bob"}}}])
    (let [alice (select-keys (test-helper/find-page-by-title "Alice") [:db/id])
          bob (select-keys (test-helper/find-page-by-title "Bob") [:db/id])
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
