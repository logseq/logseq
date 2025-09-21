(ns frontend.format.mldoc-test
  (:require [logseq.graph-parser.block :as gp-block]
            [cljs.test :refer [deftest testing are]]
            [frontend.test.helper :as test-helper]))

(deftest test-extract-plain
  (testing "normalize date values"
    (are [x y] (= (gp-block/extract-plain test-helper/test-db x) y)
      "foo #book #[[nice test]]"
      "foo"

      "foo   #book #[[nice test]]"
      "foo"

      "**foo** #book #[[nice test]]"
      "foo"

      "foo [[bar]] #book #[[nice test]]"
      "foo [[bar]]"

      "foo  [[bar]] #book #[[nice test]]"
      "foo  [[bar]]"

      "[[foo bar]]"
      "foo bar"

      "[[Foo Bar]]"
      "Foo Bar"

      "[[Foo [[Bar]]]]"
      "Foo [[Bar]]"

      "foo [[Foo [[Bar]]]]"
      "foo [[Foo [[Bar]]]]"

      "foo [[Foo [[Bar]]]] #tag"
      "foo [[Foo [[Bar]]]]")))
