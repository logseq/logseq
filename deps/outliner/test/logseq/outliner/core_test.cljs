(ns logseq.outliner.core-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(deftest test-delete-block-with-default-property
  (testing "Delete block with default property hard retracts the block subtree"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:default "test block"}}]}])
          block (db-test/find-block-by-content @conn "b1")]
      (outliner-core/delete-blocks! conn [block] {})
      (is (nil? (db-test/find-block-by-content @conn "b1"))))))

(deftest test-delete-page-with-outliner-core
  (testing "Pages shouldn't be deleted through outliner-core/delete-blocks"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1"}]}
                 {:page {:block/title "page2"}
                  :blocks [{:block/title "b3"}
                           {:block/title "b4"}]}])
          page1 (ldb/get-page @conn "page1")
          page2 (ldb/get-page @conn "page2")
          _ (d/transact! conn [{:db/id (:db/id page2)
                                :block/order "a1"
                                :block/parent (:db/id page1)}])
          b3 (db-test/find-block-by-content @conn "b3")
          b4 (db-test/find-block-by-content @conn "b4")]
      (outliner-core/delete-blocks! conn [b3 b4 page2] {})
      (is (some? (db-test/find-block-by-content @conn "b3")))
      (is (some? (db-test/find-block-by-content @conn "b4")))
      (let [page2' (ldb/get-page @conn "page2")]
        (is (= "page2" (:block/title page2')))
        (is (= (:db/id page1) (:db/id (:block/parent page2'))))
        (is (= "a1" (:block/order page2')))))))

(deftest delete-blocks-hard-retracts-subtree
  (let [user-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        page (ldb/get-page @conn "page1")
        parent (db-test/find-block-by-content @conn "parent")
        original-order (:block/order parent)]
    (d/transact! conn [{:block/uuid user-uuid
                        :block/title "Alice"}])
    (outliner-core/delete-blocks! conn [parent] {:deleted-by-uuid user-uuid})
    (let [parent' (db-test/find-block-by-content @conn "parent")
          child' (db-test/find-block-by-content @conn "child")]
      (is (nil? parent'))
      (is (nil? child')))))
