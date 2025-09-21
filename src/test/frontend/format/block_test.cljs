(ns frontend.format.block-test 
  (:require [cljs.test :refer [deftest testing are]]
            [frontend.format.block :as block]
            [frontend.date :as date]
            [frontend.util :as util]))

(deftest test-normalize-date
  (testing "normalize date values"
    (are [x y] (= (block/normalize-block x true) y)
         "Aug 12th, 2022"
         "2022-08-12T00:00:00Z"

         "2022-08-12T00:00:00Z"
         "2022-08-12T00:00:00Z"

         #{"Aug 12th, 2022"}
         "2022-08-12T00:00:00Z"

         #{"2022-08-12T00:00:00Z"}
         "2022-08-12T00:00:00Z")))

(deftest monitor-normalize-date-time
  (testing "monitor time consumption of normalize date values"
    (are [x _y timeout] (>= timeout (:time (util/with-time (block/normalize-block x true))))
      "Aug 12th, 2022"
      "2022-08-12T00:00:00Z"
      50.0 ;; actual 2.2

      "2022-08-12T00:00:00Z"
      "2022-08-12T00:00:00Z"
      1000.0 ;; actual 125

      #{"Aug 12th, 2022"}
      "2022-08-12T00:00:00Z"
      50.0 ;; actual 1.7

      #{"2022-08-12T00:00:00Z"}
      "2022-08-12T00:00:00Z"
      250.0  ;; actual 17.0
      )))

(deftest test-normalize-percentage
  (testing "normalize percentages"
    (are [x y] (= (block/normalize-block x false) y)
         "50%"
         0.5

         "0%"
         0

         "-5%"
         -0.05

         #{"50%"}
         0.5)))

(deftest test-normalize-random-values
  (testing "random values should not be processed"
    (are [x y] (= (block/normalize-block x false) y)
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

(deftest monitor-normalize-randome-values-time
  (testing "monitor time consumption of random values should not be processed"
    (are [x _y timeout] (>= timeout (:time (util/with-time (block/normalize-block x false))))
      "anreanre"
      "anreanre"
      2.0 ;; actual 0.07

      ""
      ""
      2.0 ;; actual 0.07

      "a.0%"
      "a.0%"
      0.5 ;; actual 0.02

      "%"
      "%"
      1.0 ;; actual 0.03

      "-%"
      "-%"
      0.5 ;; actual 0.02
      )))

(deftest test-normalize-journal-title
  (testing "normalize journal titles"
    (are [x y] (let [f #(-> % date/normalize-journal-title str)]
                 (= (f x) y))
      "Aug 12th, 2022"
      "20220812T000000"

      "2022-08-12"
      "20220812T000000"

      "2022-10"
      ""

      "2022Q4"
      ""

      "2022-08"
      "")))

