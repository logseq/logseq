(ns frontend.components.select-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.select :as select]))

(deftest clear-search-input-resets-query-and-bumps-epoch
  (testing "a choose must drop the pending query even when *input is already empty"
    (let [*input (atom "Task")
          *clear-epoch (atom 0)]
      (#'select/clear-search-input! *input *clear-epoch)
      (is (= "" @*input))
      (is (= 1 @*clear-epoch))))
  (testing "clearing an already-empty query still bumps the epoch"
    (let [*input (atom "")
          *clear-epoch (atom 0)]
      (#'select/clear-search-input! *input *clear-epoch)
      (is (= "" @*input))
      (is (= 1 @*clear-epoch)))))
