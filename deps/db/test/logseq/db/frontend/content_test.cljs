(ns logseq.db.frontend.content-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db.frontend.content :as db-content]
            [logseq.common.util.page-ref :as page-ref]))

(deftest replace-tags-with-page-refs
  (testing "tags with overlapping names get replaced correctly"
    (is (= "string [[foo]] string2 [[foo-bar]]"
           (db-content/replace-tags-with-id-refs
            "string #foo string2 #foo-bar"
            [{:block/title "foo" :block/uuid "foo"}
             {:block/title "foo-bar" :block/uuid "foo-bar"}])))))

(deftest title-ref->id-ref
  (let [page-uuid (random-uuid)]
    (is (= (str "some page ref " (page-ref/->page-ref page-uuid))
           (db-content/title-ref->id-ref "some page ref [[page1]]" [{:block/title "page1" :block/uuid page-uuid}]))
        "Replaces page ref name with uuid"))

  (testing "does replace tag with :replace-tag? true"
    (is (= "some #[[5c6cd067-c602-4955-96b8-74b62e08113c]] tag"
           (db-content/title-ref->id-ref "some #test tag"
                                         [{:block/title "test" :block/uuid #uuid "5c6cd067-c602-4955-96b8-74b62e08113c"}]
                                         {:replace-tag? true})))
    (is (= "some #[[5c6cd067-c602-4955-96b8-74b62e08113c]] tag"
           (db-content/title-ref->id-ref "some #[[another test]] tag"
                                         [{:block/title "another test" :block/uuid #uuid "5c6cd067-c602-4955-96b8-74b62e08113c"}]
                                         {:replace-tag? true}))))

  (testing "does not replace tag with :replace-tag? false"
    (is (= "some #test tag"
           (db-content/title-ref->id-ref "some #test tag"
                                         [{:block/title "test" :block/uuid (random-uuid)}]
                                         {:replace-tag? false})))
    (is (= "some #[[another test]] tag"
           (db-content/title-ref->id-ref "some #[[another test]] tag"
                                         [{:block/title "another test" :block/uuid (random-uuid)}]
                                         {:replace-tag? false})))))