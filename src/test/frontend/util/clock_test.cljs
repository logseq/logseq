(ns frontend.util.clock-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.util.clock :as clock]))

(deftest test-seconds->days:hours:minutes:seconds
  (let [inputs [0, 1, 10, 60, 123 ,5432, 63953, 484882, 2394503]
        want  [[0, 0, 0, 0],
               [0, 0, 0, 1],
               [0, 0, 0, 10],
               [0, 0, 1, 0],
               [0, 0, 2, 3],
               [0, 1, 30, 32],
               [0, 17, 45, 53],
               [5, 14, 41, 22],
               [27, 17, 8, 23]]]
    (mapv #(is (= (clock/s->dhms-util %1) %2)) inputs want)))

(deftest seconds->days:hours:minutes:seconds-label-test
  (is (= "" (clock/seconds->days:hours:minutes:seconds 0)))
  (is (= "30s" (clock/seconds->days:hours:minutes:seconds 30)))
  (is (= "5m" (clock/seconds->days:hours:minutes:seconds 300)))
  (is (= "1h" (clock/seconds->days:hours:minutes:seconds 3600)) "whole hours are shown")
  (is (= "1h" (clock/seconds->days:hours:minutes:seconds 3630)) "seconds are not shown next to hours")
  (is (= "2h" (clock/seconds->days:hours:minutes:seconds 7200)))
  (is (= "1h5m" (clock/seconds->days:hours:minutes:seconds 3900)))
  (is (= "1d" (clock/seconds->days:hours:minutes:seconds 86400)))
  (is (= "1d2h" (clock/seconds->days:hours:minutes:seconds 93600))))
