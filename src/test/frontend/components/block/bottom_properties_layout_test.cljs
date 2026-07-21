(ns frontend.components.block.bottom-properties-layout-test
  (:require [cljs.test :refer [are deftest]]
            [frontend.components.block.bottom-properties-layout :as layout]))

(deftest first-overflow-index-test
  (are [expected widths gap available-width]
       (= expected (layout/first-overflow-index widths gap available-width))
    nil [] 8 100
    nil [40 40] 8 88
    1 [40 41] 8 88
    0 [100] 8 99
    2 [20 20 60] 8 75))
