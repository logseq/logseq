(ns logseq.outliner.op-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]))

(deftest toggle-reaction-op
  (testing "toggles reactions via outliner ops"
    (let [user-uuid (random-uuid)
          conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Test"}
                  :blocks [{:block/title "Block"}]}])
          now 1234]
      (ldb/transact! conn
                     [{:block/uuid user-uuid
                       :block/name "user"
                       :block/title "user"
                       :block/created-at now
                       :block/updated-at now
                       :block/tags #{:logseq.class/Page}}]
                     {})
      (let [block (db-test/find-block-by-content @conn "Block")
            target-uuid (:block/uuid block)]
        (outliner-op/apply-ops! conn
                                [[:toggle-reaction [target-uuid "+1" user-uuid]]]
                                {})
        (let [block-entity (d/entity @conn [:block/uuid target-uuid])
              reactions (:logseq.property.reaction/_target block-entity)
              reaction (first reactions)]
          (is (= 1 (count reactions)))
          (is (= "+1" (:logseq.property.reaction/emoji-id reaction)))
          (is (= (:db/id (d/entity @conn [:block/uuid user-uuid]))
                 (:db/id (:logseq.property/created-by-ref reaction)))))
        (outliner-op/apply-ops! conn
                                [[:toggle-reaction [target-uuid "+1" user-uuid]]]
                                {})
        (let [block-entity (d/entity @conn [:block/uuid target-uuid])]
          (is (empty? (:logseq.property.reaction/_target block-entity))))))))
