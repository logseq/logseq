(ns logseq.db-test
  (:require [cljs.test :refer [deftest is testing] :as t]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.test.helper :as test-helper]
            [logseq.db :as ldb]))

;; TODO: move tests to deps/db

(t/use-fixtures :each
  test-helper/db-based-start-and-destroy-db-map-fixture)

(deftest test-transact-with-multiple-tx-datoms
  (testing "last write wins with same tx"
    (let [conn (d/create-conn)]
      (d/transact! conn [[:db/add -1 :property :v1]])
      (let [tx (:max-tx @conn)]
        (ldb/transact! conn
                       [(d/datom 1 :property :v1 (inc tx) false)
                        (d/datom 1 :property :v1 (inc tx) true)]))
      (is (= :v1 (:property (d/entity @conn 1))))))
  (testing "last write wins with different tx"
    (let [conn (d/create-conn)]
      (d/transact! conn [[:db/add -1 :property :v1]])
      (let [tx (:max-tx @conn)]
        (ldb/transact! conn
                       [(d/datom 1 :property :v1 (inc tx) false)
                        (d/datom 1 :property :v1 (+ tx 2) true)]))
      (is (= :v1 (:property (d/entity @conn 1)))))))

(deftest test-transact-with-temp-conn!
  (testing "DB validation should be running after the whole transaction"
    (let [conn (conn/get-db false)]
      (testing "#Task shouldn't be converted to property"
        (is (thrown? js/Error (ldb/transact! conn [{:db/ident :logseq.class/Task
                                                    :block/tags :logseq.class/Property}]))))
      (ldb/transact-with-temp-conn!
       conn
       {}
       (fn [temp-conn]
         (ldb/transact! temp-conn [{:db/ident :logseq.class/Task
                                    :block/tags :logseq.class/Property}])
         (ldb/transact! temp-conn [[:db/retract :logseq.class/Task :block/tags :logseq.class/Property]]))))))
