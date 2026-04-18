(ns logseq.db.common.initial-data-refs-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.test.helper :as db-test]))

(deftest get-block-refs-count-matches-get-block-refs-for-class-page-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "Ref A"}}
                {:page {:block/title "Ref B"}}]})
        topic-id (:db/id (d/entity @conn :user.class/Topic))
        ref-a-id (d/q '[:find ?e .
                        :in $ ?title
                        :where [?e :block/title ?title]]
                      @conn
                      "Ref A")
        ref-b-id (d/q '[:find ?e .
                        :in $ ?title
                        :where [?e :block/title ?title]]
                      @conn
                      "Ref B")
        _ (d/transact! conn [[:db/add ref-a-id :block/refs topic-id]
                             [:db/add ref-b-id :block/refs topic-id]
                             [:db/add ref-b-id :logseq.property/hide? true]])
        refs (common-initial-data/get-block-refs @conn topic-id)
        count* (common-initial-data/get-block-refs-count @conn topic-id)]
    (is (= (count refs) count*))
    (is (= 1 count*))))

(deftest get-block-refs-count-page-without-db-ident-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Foo"}}
                {:page {:block/title "Bar"}}]})
        foo-id (d/q '[:find ?e .
                      :in $ ?title
                      :where [?e :block/title ?title]]
                    @conn
                    "Foo")
        bar-id (d/q '[:find ?e .
                      :in $ ?title
                      :where [?e :block/title ?title]]
                    @conn
                    "Bar")
        _ (d/transact! conn [[:db/add bar-id :block/refs foo-id]])
        count* (common-initial-data/get-block-refs-count @conn foo-id)]
    (is (= 1 count*))))
