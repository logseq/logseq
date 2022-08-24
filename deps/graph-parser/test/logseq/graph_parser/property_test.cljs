(ns logseq.graph-parser.property-test
  (:require [cljs.test :refer [are deftest is]]
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

(deftest property-value-from-content
  (is (= "62b38254-4be7-4627-a2b7-6d9ee20999e5"
         (gp-property/property-value-from-content
          "id"
          "type:: blog-posting\ndesc:: nice walkthrough on creating a blog with #nbb\nid:: 62b38254-4be7-4627-a2b7-6d9ee20999e5"))
      "Pulls value from end of block content")

  (is (= "nice walkthrough on creating a blog with #nbb"
         (gp-property/property-value-from-content
          "desc"
          "type:: blog-posting\ndesc:: nice walkthrough on creating a blog with #nbb\nid:: 62b38254-4be7-4627-a2b7-6d9ee20999e5"))
      "Pulls value from middle of block content"))
