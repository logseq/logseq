(ns frontend.util-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.util :refer [find-first]]))

(deftest test-find-first
  (testing "find-first"
    (is (= 1 (find-first identity [1])))))

