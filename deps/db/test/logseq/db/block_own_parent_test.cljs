(ns logseq.db.block-own-parent-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(deftest transact-rejects-block-as-its-own-parent-test
  (testing "a tx that makes a block its own parent throws and changes nothing"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Parent page"}
                  :blocks [{:block/title "block"}]}])
          page (ldb/get-page @conn "Parent page")
          block (db-test/find-block-by-content @conn "block")
          error (try
                  (ldb/transact! conn [[:db/add (:db/id block) :block/parent (:db/id block)]])
                  nil
                  (catch :default e e))]
      (is (some? error))
      (is (= (:db/id page)
             (:db/id (:block/parent (d/entity @conn (:db/id block)))))))))
