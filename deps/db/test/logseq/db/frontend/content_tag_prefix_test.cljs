(ns logseq.db.frontend.content-tag-prefix-test
  "A tag that is the start of another tag in the same block, in another case,
  does not replace the start of the longer one."
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.frontend.content :as db-content]))

(deftest a-shorter-tag-in-another-case-does-not-eat-a-namespaced-one
  ;; imported from `- zq14x #A/B #a`: was "zq14x [[a]]/B [[a]]"
  (is (= "zq14x [[ab]] [[a]]"
         (db-content/replace-tags-with-id-refs
          "zq14x #A/B #a"
          [{:block/title "a" :block/uuid "a"}
           {:block/title "A/B" :block/uuid "ab"}]))))

(deftest a-shorter-tag-in-another-case-does-not-eat-a-longer-one
  (is (= "x [[foo-bar]] [[foo]]"
         (db-content/replace-tags-with-id-refs
          "x #Foo-bar #foo"
          [{:block/title "foo" :block/uuid "foo"}
           {:block/title "Foo-bar" :block/uuid "foo-bar"}]))))

(deftest same-case-and-bracketed-tags-still-replace
  (is (= "string [[foo]] string2 [[foo-bar]] [[fb]]"
         (db-content/replace-tags-with-id-refs
          "string #foo string2 #foo-bar #[[favorite book]]"
          [{:block/title "foo" :block/uuid "foo"}
           {:block/title "foo-bar" :block/uuid "foo-bar"}
           {:block/title "favorite book" :block/uuid "fb"}]))))
