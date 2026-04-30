(ns logseq.outliner.core-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.common.config :as common-config]))

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

(deftest delete-blocks-rejects-built-in-entities
  (let [conn (db-test/create-conn)]
    (testing "built-in page is rejected"
      (let [recycle-page (ldb/get-page @conn common-config/recycle-page-name)]
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