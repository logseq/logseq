(ns frontend.util-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.util :refer [find-first safe-dec-current-pos-from-end]]))

(deftest test-find-first
  (testing "find-first"
    (is (= 1 (find-first identity [1])))))

(deftest test-delete-emoji-current-pos
  (testing "safe current position from end for emoji"
    (is (= 3 (safe-dec-current-pos-from-end "abc😀d" 5)))
    (is (= 3 (safe-dec-current-pos-from-end "abc😀" 5)))
    (is (= 0 (safe-dec-current-pos-from-end "😀" 2)))
    (is (= 4 (safe-dec-current-pos-from-end "abcde" 5)))
    (is (= 1 (safe-dec-current-pos-from-end "中文" 2)))))

