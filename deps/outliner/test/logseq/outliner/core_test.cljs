(ns logseq.outliner.core-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.melange.bridge.db.core :as ldb]
            [logseq.melange.bridge.db.test-helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.melange.bridge.common.api :as melange-common]))

(deftest test-delete-block-with-default-property
  (testing "Delete block with default property hard retracts the block subtree"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:default "test block"}}]}])
          block (db-test/find-block-by-content @conn "b1")]
      (outliner-core/delete-blocks! conn [block] {})
      (is (nil? (db-test/find-block-by-content @conn "b1"))))))

(deftest test-delete-page-with-outliner-core
  (testing "Deleting pages through outliner-core/delete-blocks detaches page position only"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1"}]}
                 {:page {:block/title "page2"}
                  :blocks [{:block/title "b3"}
                           {:block/title "b4"}]}])
          page2 (ldb/get-page @conn "page2")
          _ (d/transact! conn [{:db/id (:db/id page2)
                                :block/order "a1"
                                :block/parent (:db/id (ldb/get-page @conn "page1"))}])
          b3 (db-test/find-block-by-content @conn "b3")
          b4 (db-test/find-block-by-content @conn "b4")]
      (outliner-core/delete-blocks! conn [b3 b4 page2] {})
      (is (some? (db-test/find-block-by-content @conn "b3")))
      (is (some? (db-test/find-block-by-content @conn "b4")))
      (let [page2' (ldb/get-page @conn "page2")]
        (is (= "page2" (:block/title page2')))
        (is (nil? (:block/parent page2')))
        (is (nil? (:block/order page2')))))))

(deftest delete-blocks-hard-retracts-subtree
  (let [user-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        parent (db-test/find-block-by-content @conn "parent")]
    (d/transact! conn [{:block/uuid user-uuid
                        :block/title "Alice"}])
    (outliner-core/delete-blocks! conn [parent] {:deleted-by-uuid user-uuid})
    (let [parent' (db-test/find-block-by-content @conn "parent")
          child' (db-test/find-block-by-content @conn "child")]
      (is (nil? parent'))
      (is (nil? child')))))

(deftest delete-blocks-removes-range-comments-when-all-targets-are-deleted
  (let [now (js/Date.now)
        comments-uuid (random-uuid)
        comment-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "target 1"}
                         {:block/title "target 2"}]}])
        page (ldb/get-page @conn "page1")
        target-1 (db-test/find-block-by-content @conn "target 1")
        target-2 (db-test/find-block-by-content @conn "target 2")]
    (d/transact! conn [{:db/ident :logseq.class/Comments
                        :block/uuid (random-uuid)
                        :block/title "Comments"}
                       {:db/id -1
                        :block/uuid comments-uuid
                        :block/title "Comments"
                        :block/page (:db/id page)
                        :block/parent (:db/id page)
                        :block/order "a3"
                        :block/created-at now
                        :block/updated-at now
                        :block/tags #{:logseq.class/Comments}
                        :logseq.property.comments/blocks #{(:db/id target-1)
                                                           (:db/id target-2)}}
                       {:block/uuid comment-uuid
                        :block/title "comment"
                        :block/page (:db/id page)
                        :block/parent -1
                        :block/order "a0"
                        :block/created-at now
                        :block/updated-at now}])
    (outliner-core/delete-blocks! conn [target-1 target-2] {})
    (is (nil? (d/entity @conn [:block/uuid comments-uuid])))
    (is (nil? (d/entity @conn [:block/uuid comment-uuid])))))

(deftest delete-blocks-keeps-range-comments-when-some-targets-remain
  (let [now (js/Date.now)
        comments-uuid (random-uuid)
        comment-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "target 1"}
                         {:block/title "target 2"}]}])
        page (ldb/get-page @conn "page1")
        target-1 (db-test/find-block-by-content @conn "target 1")
        target-2 (db-test/find-block-by-content @conn "target 2")]
    (d/transact! conn [{:db/ident :logseq.class/Comments
                        :block/uuid (random-uuid)
                        :block/title "Comments"}
                       {:db/id -1
                        :block/uuid comments-uuid
                        :block/title "Comments"
                        :block/page (:db/id page)
                        :block/parent (:db/id page)
                        :block/order "a3"
                        :block/created-at now
                        :block/updated-at now
                        :block/tags #{:logseq.class/Comments}
                        :logseq.property.comments/blocks #{(:db/id target-1)
                                                           (:db/id target-2)}}
                       {:block/uuid comment-uuid
                        :block/title "comment"
                        :block/page (:db/id page)
                        :block/parent -1
                        :block/order "a0"
                        :block/created-at now
                        :block/updated-at now}])
    (outliner-core/delete-blocks! conn [target-1] {})
    (is (some? (d/entity @conn [:block/uuid comments-uuid])))
    (is (some? (d/entity @conn [:block/uuid comment-uuid])))
    (is (some? (d/entity @conn (:db/id target-2))))))

(deftest delete-blocks-rejects-built-in-entities
  (let [conn (db-test/create-conn)]
    (testing "built-in page is rejected"
      (let [recycle-page (ldb/get-page @conn melange-common/recycle-page-name)]
        (is (true? (:logseq.property/built-in? recycle-page)))
        (is (thrown-with-msg? js/Error #"Built-in nodes can't be deleted"
                              (db-test/silence-stderr (outliner-core/delete-blocks! conn [recycle-page] {}))))))

    (testing "built-in idents that are not a class or property like empty-placeholder are rejected"
      (let [placeholder (d/entity @conn :logseq.property/empty-placeholder)]
        (is (some? (:block/uuid placeholder)))
        (is (thrown-with-msg? js/Error #"Built-in nodes can't be deleted"
                              (db-test/silence-stderr (outliner-core/delete-blocks! conn [placeholder] {}))))))

    (testing "file entity is rejected"
      (let [file (->> (d/datoms @conn :avet :file/path)
                      first
                      :e
                      (d/entity @conn))]
        (is (some? (:file/path file)))
        (is (thrown-with-msg? js/Error #"Built-in nodes can't be deleted"
                              (db-test/silence-stderr (outliner-core/delete-blocks! conn [file] {}))))))

    (testing "KV entity is rejected"
      (let [kv (d/entity @conn :logseq.kv/db-type)]
        (is (some? (:db/id kv)))
        (is (thrown-with-msg? js/Error #"Built-in nodes can't be deleted"
                              (db-test/silence-stderr (outliner-core/delete-blocks! conn [kv] {}))))))))

(deftest save-block-rejects-built-in-entity
  (let [conn (db-test/create-conn)
        placeholder (d/entity @conn :logseq.property/description)]
    (is (thrown-with-msg? js/Error #"Built-in.*can't be modified"
          (db-test/silence-stderr
            (outliner-core/save-block! conn {:db/id (:db/id placeholder) :block/title "hacked"}))))))

(deftest move-blocks-rejects-built-in-entity
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "target"}]}])
        placeholder (d/entity @conn :logseq.property/description)
        target (db-test/find-block-by-content @conn "target")]
    (is (thrown-with-msg? js/Error #"Built-in.*can't be modified"
          (db-test/silence-stderr
            (outliner-core/move-blocks! conn [placeholder] target {:sibling? true}))))))

(deftest move-blocks-protects-comment-blocks
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "target"}
                         {:block/title "tagged comment"}
                         {:block/title "normal parent"
                          :build/children [{:block/title "ordinary"}]}
                         {:block/title "Comments"}]}])
        page (ldb/get-page @conn "page1")
        target (db-test/find-block-by-content @conn "target")
        tagged-comment (db-test/find-block-by-content @conn "tagged comment")
        ordinary (db-test/find-block-by-content @conn "ordinary")
        comments-area (db-test/find-block-by-content @conn "Comments")
        original-comment-parent-id (:db/id (:block/parent tagged-comment))]
    (d/transact! conn [{:db/id -1
                        :db/ident :logseq.class/Tag
                        :block/uuid (random-uuid)
                        :block/title "Tag"
                        :block/tags #{-1}}
                       {:db/ident :logseq.class/Comments
                        :block/uuid (random-uuid)
                        :block/title "Comments"
                        :block/tags #{-1}}
                       {:db/ident :logseq.class/Comment
                        :block/uuid (random-uuid)
                        :block/title "Comment"
                        :block/tags #{-1}}
                       [:db/add (:db/id comments-area) :block/tags :logseq.class/Comments]
                       [:db/add (:db/id tagged-comment) :block/tags :logseq.class/Comment]])

    (testing "#Comment blocks cannot be moved after creation"
      (outliner-core/move-blocks! conn [tagged-comment] target {:sibling? false})
      (is (= original-comment-parent-id
             (:db/id (:block/parent (d/entity @conn (:db/id tagged-comment)))))))

    (testing "#Comments blocks cannot be moved as children"
      (outliner-core/move-blocks! conn [comments-area] target {:sibling? false})
      (let [comments-area' (d/entity @conn (:db/id comments-area))]
        (is (= (:db/id page)
               (:db/id (:block/parent comments-area'))))))

    (testing "#Comments blocks can be moved as siblings"
      (outliner-core/move-blocks! conn [comments-area] target {:sibling? true})
      (let [page' (d/entity @conn (:db/id page))
            children (->> (:block/_parent page')
                          ldb/sort-by-order
                          (mapv :block/title))]
        (is (= ["target" "Comments" "tagged comment" "normal parent"] children))))

    (testing "ordinary blocks can be moved as siblings of #Comments blocks"
      (outliner-core/move-blocks! conn [ordinary] comments-area {:sibling? true})
      (let [ordinary' (d/entity @conn (:db/id ordinary))]
        (is (= (:db/id page)
               (:db/id (:block/parent ordinary'))))))

    (testing "ordinary blocks cannot be moved as children of #Comments blocks"
      (outliner-core/move-blocks! conn [ordinary] comments-area {:sibling? false})
      (is (= (:db/id page)
             (:db/id (:block/parent (d/entity @conn (:db/id ordinary)))))))

    (testing "ordinary blocks cannot be moved to #Comment blocks"
      (outliner-core/move-blocks! conn [ordinary] tagged-comment {:sibling? false})
      (is (= (:db/id page)
             (:db/id (:block/parent (d/entity @conn (:db/id ordinary)))))))))
