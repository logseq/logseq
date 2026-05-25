(ns frontend.components.select-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.select :as select]))

(deftest next-local-selected-choices-ignores-unchanged-props-test
  (is (nil? (#'select/next-local-selected-choices
             {:selected-choices [1]}
             {:selected-choices [1]}
             #{1 2}))))

(deftest next-local-selected-choices-syncs-changed-props-test
  (is (= #{1 2}
         (#'select/next-local-selected-choices
          {:selected-choices [1]}
          {:selected-choices [1 2]}
          #{1}))))

(deftest next-local-selected-choices-skips-external-state-test
  (is (nil? (#'select/next-local-selected-choices
             {:selected-choices [1]}
             {:selected-choices [1 2]
              :selected-choices-atom (atom #{1})}
             #{1}))))

(deftest toggle-selected-choice-removes-only-chosen-value-test
  (let [choices (atom #{1 2})]
    (is (false? (#'select/toggle-selected-choice! choices 2)))
    (is (= #{1} @choices))))

(deftest toggle-selected-choice-adds-chosen-value-test
  (let [choices (atom #{1})]
    (is (true? (#'select/toggle-selected-choice! choices 2)))
    (is (= #{1 2} @choices))))
