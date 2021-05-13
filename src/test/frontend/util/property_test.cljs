(ns frontend.util.property_test
  (:require [cljs.test :refer [deftest is are testing]]
            [frontend.util.property :as property]))

(deftest remove-id-property
  (are [x y] (= (property/remove-id-property! :org x) y)
    "hello\n:PROPERTIES:\n:id: f9873a81-07b9-4246-b910-53a6f5ec7e04\n:END:\n"
    "hello\n:PROPERTIES:\n:END:"

    "hello\n:PROPERTIES:\n:id: f9873a81-07b9-4246-b910-53a6f5ec7e04\na: b\n:END:\n"
    "hello\n:PROPERTIES:\na: b\n:END:"))

(deftest test-remove-properties!
  (testing "properties with non-blank lines"
    (are [x y] (= x y)
      (property/remove-properties! :org "** hello\n:PROPERTIES:\n:x: y\n:END:\n")
      "** hello"

      (property/remove-properties! :org "** hello\n:PROPERTIES:\n:x: y\na:b\n:END:\n")
      "** hello"))
  (testing "properties with blank lines"
    (are [x y] (= x y)
      (property/remove-properties! :org "** hello\n:PROPERTIES:\n\n:x: y\n:END:\n")
      "** hello"

      (property/remove-properties! :org "** hello\n:PROPERTIES:\n:x: y\n\na:b\n:END:\n")
      "** hello")))

(deftest test-insert-property
  (are [x y] (= x y)
    (property/insert-property! :org "hello" "a" "b")
    "hello\n:PROPERTIES:\n:a: b\n:END:\n"

    (property/insert-property! :org "hello" "a" false)
    "hello\n:PROPERTIES:\n:a: false\n:END:\n"

    (property/insert-property! :org "hello\n:PROPERTIES:\n:a: b\n:END:\n" "c" "d")
    "hello\n:PROPERTIES:\n:a: b\n:c: d\n:END:"

    (property/insert-property! :org "hello\n:PROPERTIES:\n:a: b\n:END: world\n" "c" "d")
    "hello\n:PROPERTIES:\n:c: d\n:END:\n:PROPERTIES:\n:a: b\n:END: world\n"))

(deftest test->new-properties
  (are [x y] (= (property/->new-properties x) y)
    ":PROPERTIES:\n:foo: bar\n:END:"
    "foo:: bar"

    "hello\n:PROPERTIES:\n:foo: bar\n:END:"
    "hello\nfoo:: bar"

    "hello\n:PROPERTIES:\n:foo: bar\n:nice: bingo\n:END:"
    "hello\nfoo:: bar\nnice:: bingo"

    "hello\n:PROPERTIES:\n:foo: bar\n:nice: bingo\n:END:\n"
    "hello\nfoo:: bar\nnice:: bingo"

    "hello\n:PROPERTIES:\n:foo: bar\n:nice: bingo\n:END:\nnice"
    "hello\nfoo:: bar\nnice:: bingo\nnice"

    "hello\n:PROPERTIES:\n:foo: bar\n:nice:\n:END:\nnice"
    "hello\nfoo:: bar\nnice:: \nnice"

    "hello\n:PROPERTIES:\n:foo: bar\n:nice\n:END:\nnice"
    "hello\nfoo:: bar\n:nice\nnice"))

(cljs.test/run-tests)
