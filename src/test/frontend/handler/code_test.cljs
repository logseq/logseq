(ns frontend.handler.code-test
  (:require [clojure.test :refer [deftest is testing]]
            [frontend.handler.code :as code]))

(deftest fenced-code-content-replaces-source-range
  (testing "updates the fenced code body without losing the fence"
    (is (= "```js\nlet x = 42;\n```"
           (code/fenced-code-content "```js\nlet x = 1;\n```"
                                     {:start_pos 8
                                      :end_pos 19}
                                     "let x = 42;"))))
  (testing "empty code removes the fenced code body"
    (is (= "```js\n```"
           (code/fenced-code-content "```js\nlet x = 1;\n```"
                                     {:start_pos 8
                                      :end_pos 19}
                                     "")))))
