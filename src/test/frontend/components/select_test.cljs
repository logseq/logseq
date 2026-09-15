(ns frontend.components.select-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.select :as select]))

(deftest result-at-idx-clamps-to-highlighted-item
  (is (nil? (select/result-at-idx [] 0)))
  (is (nil? (select/result-at-idx nil 1)))
  (is (= :a (select/result-at-idx [:a :b :c] 0)))
  (is (= :b (select/result-at-idx [:a :b :c] 1)))
  (is (= :c (select/result-at-idx [:a :b :c] 2)))
  (is (= :c (select/result-at-idx [:a :b :c] 99)))
  (is (= :a (select/result-at-idx [:a :b :c] -1)))
  (is (= :a (select/result-at-idx [:a :b :c] nil))))
