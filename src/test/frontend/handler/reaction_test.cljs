(ns frontend.handler.reaction-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [frontend.db :as db]
            [frontend.handler.reaction :as reaction-handler]
            [frontend.handler.user :as user-handler]
            [frontend.reaction :as reaction]
            [frontend.test.helper :as test-helper]
            [logseq.common.util :as common-util]))

(use-fixtures :each test-helper/start-and-destroy-db)

(deftest toggle-reaction-anonymous
  (testing "adds and removes reaction without user"
    (test-helper/load-test-files
     [{:page {:block/title "Test"}
       :blocks [{:block/title "Block"}]}])
    (let [block (test-helper/find-block-by-content "Block")
          target-uuid (:block/uuid block)]
      (reaction-handler/toggle-reaction! target-uuid "+1")
      (let [block-entity (db/entity [:block/uuid target-uuid])
            reactions (:logseq.property.reaction/_target block-entity)]
        (is (= 1 (count reactions)))
        (is (= #{"+1"} (set (map :logseq.property.reaction/emoji-id reactions)))))
      (reaction-handler/toggle-reaction! target-uuid "+1")
      (let [block-entity (db/entity [:block/uuid target-uuid])]
        (is (empty? (:logseq.property.reaction/_target block-entity)))))))

(deftest toggle-reaction-with-user
  (testing "toggles per-user reaction"
    (test-helper/load-test-files
     [{:page {:block/title "Test"}
       :blocks [{:block/title "Block"}]}])
    (let [block (test-helper/find-block-by-content "Block")
          target-uuid (:block/uuid block)
          user-uuid (random-uuid)
          repo test-helper/test-db]
      (let [now (common-util/time-ms)]
        (db/transact!
         repo
         [{:block/uuid user-uuid
           :block/name "user"
           :block/title "user"
           :block/created-at now
           :block/updated-at now
           :block/tags #{:logseq.class/Page}}]))
      (with-redefs [user-handler/user-uuid (fn [] (str user-uuid))]
        (reaction-handler/toggle-reaction! target-uuid "tada")
        (let [block-entity (db/entity [:block/uuid target-uuid])
              reactions (:logseq.property.reaction/_target block-entity)
              reaction (first reactions)]
          (is (= 1 (count reactions)))
          (is (= "tada" (:logseq.property.reaction/emoji-id reaction)))
          (is (= (:db/id (db/entity [:block/uuid user-uuid]))
                 (:db/id (:logseq.property/created-by-ref reaction)))))
        (reaction-handler/toggle-reaction! target-uuid "tada")
        (let [block-entity (db/entity [:block/uuid target-uuid])]
          (is (empty? (:logseq.property.reaction/_target block-entity))))))))

(deftest toggle-reaction-invalid-emoji
  (testing "invalid emoji id does not create a reaction"
    (test-helper/load-test-files
     [{:page {:block/title "Test"}
       :blocks [{:block/title "Block"}]}])
    (let [block (test-helper/find-block-by-content "Block")
          target-uuid (:block/uuid block)]
      (is (false? (reaction-handler/toggle-reaction! target-uuid "not-an-emoji")))
      (let [block-entity (db/entity [:block/uuid target-uuid])]
        (is (empty? (:logseq.property.reaction/_target block-entity)))))))
