(ns logseq.graph-parser.property-test
  (:require [cljs.test :refer [are deftest]]
            [logseq.graph-parser.property :as gp-property]))

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
