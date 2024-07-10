(ns logseq.db.frontend.content-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db.frontend.content :as db-content]))

(deftest replace-tags-with-page-refs
  (testing "tags with overlapping names get replaced correctly"
    (is (= "string [[~^foo]] string2 [[~^foo-bar]]"
           (db-content/replace-tags-with-page-refs
            "string #foo string2 #foo-bar"
            [{:block/title "foo" :block/uuid "foo"}
             {:block/title "foo-bar" :block/uuid "foo-bar"}])))))
