(ns frontend.components.select-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.select :as select]))

(deftest sync-local-selected-choices-preserves-local-state-when-props-are-unchanged-test
  (let [selected-choices (atom #{1 2})
        prev-selected-choices (atom #{1})]
    (#'select/sync-local-selected-choices!
     selected-choices
     prev-selected-choices
     [1]
     nil)
    (is (= #{1 2} @selected-choices))
    (is (= #{1} @prev-selected-choices))))

(deftest sync-local-selected-choices-syncs-changed-props-test
  (let [selected-choices (atom #{1})
        prev-selected-choices (atom #{1})]
    (#'select/sync-local-selected-choices!
     selected-choices
     prev-selected-choices
     [1 2]
     nil)
    (is (= #{1 2} @selected-choices))
    (is (= #{1 2} @prev-selected-choices))))

(deftest sync-local-selected-choices-skips-external-state-test
  (let [selected-choices (atom #{1})
        prev-selected-choices (atom #{1})]
    (#'select/sync-local-selected-choices!
     selected-choices
     prev-selected-choices
     [1 2]
     selected-choices)
    (is (= #{1} @selected-choices))
    (is (= #{1 2} @prev-selected-choices))))

(deftest toggle-selected-choice-removes-only-chosen-value-test
  (let [choices (atom #{1 2})]
    (is (false? (#'select/toggle-selected-choice! choices 2)))
    (is (= #{1} @choices))))

(deftest toggle-selected-choice-adds-chosen-value-test
  (let [choices (atom #{1})]
    (is (true? (#'select/toggle-selected-choice! choices 2)))
    (is (= #{1 2} @choices))))
