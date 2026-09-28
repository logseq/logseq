(ns logseq.common.util.date-time-test
  (:require [cljs-time.core :as t]
            [cljs.test :refer [deftest is testing]]
            [logseq.common.util.date-time :as date-time-util]))

(deftest with-day-of-month-test
  (testing "restores a day that exists in the destination month"
    (is (t/equal? (t/date-time 2026 7 31)
                  (date-time-util/with-day-of-month (t/date-time 2026 7 30) 31))))
  (testing "clamps to the last day of a shorter month"
    (is (t/equal? (t/date-time 2026 2 28)
                  (date-time-util/with-day-of-month (t/date-time 2026 2 28) 31))))
  (testing "preserves time-of-day"
    (is (t/equal? (t/date-time 2028 3 31 9 30)
                  (date-time-util/with-day-of-month (t/date-time 2028 3 29 9 30) 31)))))

(deftest plus-preserving-month-day-test
  (testing "Jan 31 + 5 months re-anchors to Jun 30, then + 1 month to Jul 31"
    (let [jan-31 (t/date-time 2026 1 31)
          jun-30 (date-time-util/plus-preserving-month-day jan-31 (t/months 5) 31)]
      (is (t/equal? (t/date-time 2026 6 30) jun-30))
      (is (t/equal? (t/date-time 2026 7 31)
                    (date-time-util/plus-preserving-month-day jun-30 (t/months 1) 31)))))
  (testing "day and week periods pass through unchanged"
    (let [start (t/date-time 2026 1 31)]
      (is (t/equal? (t/plus start (t/days 2))
                    (date-time-util/plus-preserving-month-day start (t/days 2) 31)))
      (is (t/equal? (t/plus start (t/weeks 1))
                    (date-time-util/plus-preserving-month-day start (t/weeks 1) 31))))))
