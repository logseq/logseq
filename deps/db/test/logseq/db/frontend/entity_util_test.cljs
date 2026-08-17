(ns logseq.db.frontend.entity-util-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.test.helper :as db-test]))

(deftest hidden?-hides-pages-not-hide-by-default-properties
  (testing "hide? on a page hides the page"
    (is (true? (entity-util/hidden? {:db/id 1 :logseq.property/hide? true}))))

  (testing "hide? on a property does not hide the property entity"
    (is (false? (entity-util/hidden? {:db/id 2
                                      :logseq.property/hide? true
                                      :block/tags [{:db/ident :logseq.class/Property}]}))))

  (testing "deleted properties remain hidden"
    (is (true? (entity-util/hidden? {:db/id 3
                                     :logseq.property/hide? true
                                     :logseq.property/deleted-at 1
                                     :block/tags [{:db/ident :logseq.class/Property}]}))))

  (testing "entities under a hidden page remain hidden"
    (is (true? (entity-util/hidden? {:db/id 4
                                     :block/parent {:db/id 1 :logseq.property/hide? true}}))))

  (testing "entities under a hide-by-default property are not hidden by that property's hide?"
    (is (false? (entity-util/hidden? {:db/id 5
                                      :block/parent {:db/id 2
                                                     :logseq.property/hide? true
                                                     :block/tags [{:db/ident :logseq.class/Property}]}})))))

(deftest hidden?-uses-property-tags-from-db-entities
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:keywords {:logseq.property/type :default
                                       :logseq.property/hide? true}}
               :pages-and-blocks [{:page {:block/title "Hidden page"
                                          :build/properties {:logseq.property/hide? true}}}]})
        keywords (d/entity @conn :user.property/keywords)
        hidden-page (db-test/find-page-by-title @conn "Hidden page")]
    (is (true? (:logseq.property/hide? keywords)))
    (is (false? (entity-util/hidden? keywords)))
    (is (true? (entity-util/hidden? hidden-page)))))
