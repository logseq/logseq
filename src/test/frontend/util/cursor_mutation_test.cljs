(ns frontend.util.cursor-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.util.cursor :as cursor]))

;; Fails if, in `start?`, `and` becomes `or`.
(deftest start?-is-false-when-the-caret-is-not-at-the-start-test
  (is (true? (cursor/start? #js {:value "abc" :selectionStart 0})))
  (is (false? (cursor/start? #js {:value "abc" :selectionStart 2}))))
