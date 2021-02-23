(ns frontend.react-impl-test
  "To facilitate testing, imitate the behavior of react"
  (:require [frontend.react-impl :as r]
            [cljs.test :refer [deftest is are testing use-fixtures]]))

(deftest simple-react-test
  (r/auto-clean-state
    (let [react-ref (atom 1)]

      (r/defc simple-component
        []
        (+ 2 (r/react react-ref)))

      (let [result (simple-component)]

        (is (= 3 @result))
        (reset! react-ref 2)
        (is (= 4 @result))))))

(deftest nest-component-test
  (r/auto-clean-state
    (let [a (atom 1)
          b (atom 2)]

      (r/defc inner
        []
        (r/react b))

      (r/defc out
        []
        (let [out (r/react a)
              inner-result (inner)]
          (+ out @inner-result)))

      (let [out-result (out)]
        (is (= 3 @out-result))
        (reset! b 4)
        (is (= 5 @out-result))))))

(deftest defc-params-test
  (r/auto-clean-state
    (let [a (atom 1)
          b (atom 2)]

      (r/defc inner-1
        [c]
        (+ c (r/react b)))

      (r/defc out-1
        []
        (let [out (r/react a)
              inner-result (inner-1 5)]
          (+ out @inner-result)))

      (let [out-result (out-1)]
        (is (= 8 @out-result))

        (reset! b 4)

        (is (= 10 @out-result))))))