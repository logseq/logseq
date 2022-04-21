(ns frontend.util.list-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.util.list :as list-util]))

(deftest test-re-order-items
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
