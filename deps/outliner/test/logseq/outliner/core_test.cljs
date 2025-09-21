(ns logseq.outliner.core-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(deftest test-delete-block-with-default-property
  (testing "Delete block with default property"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:default "test block"}}]}])
          property-value (:user.property/default (db-test/find-block-by-content @conn "b1"))
          _ (assert (:db/id property-value))
          block (db-test/find-block-by-content @conn "b1")]
      (outliner-core/delete-blocks! nil conn nil [block] {})
      (is (nil? (db-test/find-block-by-content @conn "b1")))
      (is (nil? (db-test/find-block-by-content @conn "test block"))))))

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
      (outliner-core/delete-blocks! nil conn nil [b3 b4 page2] {})
      (is (some? (db-test/find-block-by-content @conn "b3")))
      (is (some? (db-test/find-block-by-content @conn "b4")))
      (let [page2' (ldb/get-page @conn "page2")]
        (is (= "page2" (:block/title page2')))
        (is (nil? (:block/parent page2')))
        (is (nil? (:block/order page2')))))))
