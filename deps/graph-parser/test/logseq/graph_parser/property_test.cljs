(ns logseq.graph-parser.property-test
  (:require [cljs.test :refer [are deftest testing]]
            [logseq.graph-parser.property :as gp-property]))

(def test-db "test-db")

(deftest test->new-properties
  (are [x y] (= (gp-property/->new-properties x) y)
    ":PROPERTIES:\n:foo: bar\n:END:"
    "foo:: bar"

    "hello\n:PROPERTIES:\n:foo: bar\n:END:"
    "hello\nfoo:: bar"

    "hello\n:PROPERTIES:\n:foo: bar\n:nice: bingo\n:END:"
    "hello\nfoo:: bar\nnice:: bingo"

    "hello\n:PROPERTIES:\n:foo: bar\n:nice: bingo\n:END:"
    "hello\nfoo:: bar\nnice:: bingo"

    "hello\n:PROPERTIES:\n:foo: bar\n:nice: bingo\n:END:\nnice"
    "hello\nfoo:: bar\nnice:: bingo\nnice"

    "hello\n:PROPERTIES:\n:foo: bar\n:nice:\n:END:\nnice"
    "hello\nfoo:: bar\nnice:: \nnice"

    "hello\n:PROPERTIES:\n:foo: bar\n:nice\n:END:\nnice"
    "hello\nfoo:: bar\n:nice\nnice"))

(deftest test-remove-properties
  (testing "properties with non-blank lines"
    (are [x y] (= x y)
      (gp-property/remove-properties :org "** hello\n:PROPERTIES:\n:x: y\n:END:\n")
      "** hello"

      (gp-property/remove-properties :org "** hello\n:PROPERTIES:\n:x: y\na:b\n:END:\n")
      "** hello"

      (gp-property/remove-properties :markdown "** hello\nx:: y\na:: b\n")
      "** hello"

      (gp-property/remove-properties :markdown "** hello\nx:: y\na::b\n")
      "** hello"))

  (testing "properties with blank lines"
    (are [x y] (= x y)
      (gp-property/remove-properties :org "** hello\n:PROPERTIES:\n\n:x: y\n:END:\n")
      "** hello"

      (gp-property/remove-properties :org "** hello\n:PROPERTIES:\n:x: y\n\na:b\n:END:\n")
      "** hello"))

  (testing "invalid-properties"
    (are [x y] (= x y)
      (gp-property/remove-properties :markdown "hello\nnice\nfoo:: bar")
      "hello\nnice\nfoo:: bar"

      (gp-property/remove-properties :markdown "hello\nnice\nfoo:: bar\ntest")
      "hello\nnice\nfoo:: bar\ntest"

      (gp-property/remove-properties :markdown "** hello\nx:: y\n\na:: b\n")
      "** hello\n\na:: b")))