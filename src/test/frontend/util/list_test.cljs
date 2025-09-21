(ns frontend.util.list-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.util.list :as list-util]))

(deftest test-re-order-items
  (testing "Single list"
    (is (= (list-util/re-order-items
            ["2. x"
             "3. x"]
            2)
           "3. x\n4. x"))
    (is (= (list-util/re-order-items
            ["7. x"
             "foo"
             "bar 3."
             "5. x"
             "baz"]
            2)
           "3. x\nfoo\nbar 3.\n4. x\nbaz")))
  (testing "Only reorder the first list"
    (is (= (list-util/re-order-items
            ["7. x"
             "foo"
             "\n"
             "\n"
             "bar 3."
             "5. x"
             "baz"]
            2)
           "3. x\nfoo\n\n\nbar 3.\n5. x\nbaz"))))
