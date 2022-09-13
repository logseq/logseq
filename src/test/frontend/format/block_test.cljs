(ns frontend.format.block-test 
  (:require [cljs.test :refer [deftest testing are]]
            [frontend.format.block :as block]))

(deftest test-normalize-date
  (testing "normalize date values"
    (are [x y] (= (block/normalize-block x) y)
         "Aug 12th, 2022"
         "2022-08-12T00:00:00Z"

         "2022-08-12T00:00:00Z"
         "2022-08-12T00:00:00Z")))

(deftest test-normalize-percentage
  (testing "normalize percentages"
    (are [x y] (= (block/normalize-block x) y)
         "50%"
         0.5

         "0%"
         0

         "-5%"
         -0.05)))

(deftest test-random-values
  (testing "random values should not be processed"
    (are [x y] (= (block/normalize-block x) y)
         "anreanre"
         "anreanre"

         ""
         ""

         "a.0%"
         "a.0%"

         "%"
         "%"

         "-%"
         "-%")))
