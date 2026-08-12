(ns frontend.handler.reaction-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.db.transact :as db-transact]
            [frontend.db.utils :as db-utils]
            [frontend.handler.reaction :as reaction-handler]
            [frontend.handler.user :as user-handler]
            [frontend.test.helper :as test-helper]
            [logseq.outliner.op :as outliner-op]
            [logseq.common.util :as common-util]))

(use-fixtures :each test-helper/start-and-destroy-db)

(defn- seed-reaction-target!
  []
  (let [conn (conn/get-db test-helper/test-db false)
        page-uuid (random-uuid)
        target-uuid (random-uuid)]
    (d/transact! conn [{:block/uuid page-uuid
                        :block/name "test"
                        :block/title "Test"
                        :block/tags #{:logseq.class/Page}}
                       {:block/uuid target-uuid
                        :block/title "Block"
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid page-uuid]}])
    {:conn conn
     :target-uuid target-uuid}))

(defn- with-local-outliner-ops
  [conn f]
  (with-redefs [db-transact/apply-outliner-ops
                (fn [_conn ops opts]
                  (outliner-op/apply-ops! conn ops opts))]
    (f)))

(deftest toggle-reaction-anonymous
  (testing "adds and removes reaction without user"
    (let [{:keys [conn target-uuid]} (seed-reaction-target!)]
      (with-local-outliner-ops
        conn
        (fn []
          (reaction-handler/toggle-reaction! target-uuid "+1")
          (let [block-entity (db-utils/entity @conn [:block/uuid target-uuid])
                reactions (:logseq.property.reaction/_target block-entity)]
            (is (= 1 (count reactions)))
            (is (= #{"+1"} (set (map :logseq.property.reaction/emoji-id reactions)))))
          (reaction-handler/toggle-reaction! target-uuid "+1")
          (let [block-entity (db-utils/entity @conn [:block/uuid target-uuid])]
            (is (empty? (:logseq.property.reaction/_target block-entity)))))))))

(deftest toggle-reaction-with-user
  (testing "toggles per-user reaction"
    (let [{:keys [conn target-uuid]} (seed-reaction-target!)
          user-uuid (random-uuid)]
      (let [now (common-util/time-ms)]
        (d/transact! conn [{:block/uuid user-uuid
                            :block/name "user"
                            :block/title "user"
                            :block/created-at now
                            :block/updated-at now
                            :block/tags #{:logseq.class/Page}}]))
      (with-local-outliner-ops
        conn
        (fn []
          (with-redefs [user-handler/user-uuid (fn [] (str user-uuid))]
            (reaction-handler/toggle-reaction! target-uuid "tada")
            (let [block-entity (db-utils/entity @conn [:block/uuid target-uuid])
                  reactions (:logseq.property.reaction/_target block-entity)
                  reaction (first reactions)]
              (is (= 1 (count reactions)))
              (is (= "tada" (:logseq.property.reaction/emoji-id reaction)))
              (is (= (:db/id (db-utils/entity @conn [:block/uuid user-uuid]))
                     (:db/id (:logseq.property/created-by-ref reaction)))))
            (reaction-handler/toggle-reaction! target-uuid "tada")
            (let [block-entity (db-utils/entity @conn [:block/uuid target-uuid])]
              (is (empty? (:logseq.property.reaction/_target block-entity))))))))))

(deftest toggle-reaction-invalid-emoji
  (testing "invalid emoji id does not create a reaction"
    (let [{:keys [conn target-uuid]} (seed-reaction-target!)]
      (is (false? (reaction-handler/toggle-reaction! target-uuid "not-an-emoji")))
      (let [block-entity (db-utils/entity @conn [:block/uuid target-uuid])]
        (is (empty? (:logseq.property.reaction/_target block-entity)))))))
