(ns frontend.react-test
  ;; namespace local config for r/defc tests
  {:clj-kondo/config {:linters {:inline-def {:level :off}}}}
  (:require [frontend.react :as r]
            [cljs.test :refer [deftest is are testing use-fixtures run-tests]]
            [frontend.fixtures :as fixtures]))

(use-fixtures :each
  fixtures/react-components
  fixtures/react-impl)

(deftest simple-react-test
  (let [react-ref (atom 1)]

    (r/defc simple-component
      []
      (+ 2 (r/react react-ref)))

    (let [result (r/with-key 1 (simple-component))]

      (is (= 3 @result))
      (reset! react-ref 2)
      (is (= 4 @result)))))

(deftest nest-component-test
  (let [a (atom 1)
        b (atom 2)]

    (r/defc inner
      []

      (let [r (r/react b)]
        r))

    (r/defc out
      []
      (let [out (r/react a)
            inner-result (r/with-key "1" (inner))]
        (+ out @inner-result)))

    (let [out-result (r/with-key "2" (out))]
      (is (= 3 @out-result))
      (reset! b 4)
      (is (= 5 @out-result)))))

#_(deftest defc-params-test
  (let [a (atom 1)
        b (atom 2)]

    (r/defc inner-1
      [c]
      (+ c (r/react b)))

    (r/defc out-1
      []
      (let [out (r/react a)
            inner-result (r/with-key 1 (inner-1 5))]
        (+ out @inner-result)))

    (let [out-result (r/with-key 2 (out-1))]
      (is (= 8 @out-result))

      (reset! b 4)

      (is (= 10 @out-result)))))