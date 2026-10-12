(ns logseq.db.frontend.malli-schema-mutation-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.test.helper :as db-test]))

(deftest ref-property-value-that-is-not-the-empty-placeholder-is-validated-test
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:due {:logseq.property/type :date}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "b1"}]}
                {:page {:build/journal 20261011}}]})
        block (db-test/find-block-by-content @conn "b1")
        journal (db-test/find-journal-by-journal-day @conn 20261011)
        page (db-test/find-page-by-title @conn "page1")]
    (testing "a :date value that is a journal is valid"
      (d/transact! conn [[:db/add (:db/id block) :user.property/due (:db/id journal)]])
      (is (nil? (db-validate/validate-local-db! @conn))))
    (testing "the empty placeholder is valid"
      (d/transact! conn [[:db/add (:db/id block) :user.property/due :logseq.property/empty-placeholder]])
      (is (nil? (db-validate/validate-local-db! @conn))))
    (testing "a :date value that is an ordinary page is invalid"
      (d/transact! conn [[:db/add (:db/id block) :user.property/due (:db/id page)]])
      (let [{:keys [errors]} (db-validate/validate-local-db! @conn)]
        (is (= [(:db/id block)] (map (comp :db/id :entity) errors)) (pr-str errors))))))
