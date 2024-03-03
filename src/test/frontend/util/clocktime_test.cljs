(ns frontend.util.clocktime-test
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