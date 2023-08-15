(ns frontend.format.mldoc-test
  (:require [frontend.format.mldoc :as mldoc]
            [cljs.test :refer [deftest testing are]]))

(deftest test-extract-plain
  (testing "normalize date values"
    (are [x y] (= (mldoc/extract-plain x) y)
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
