(ns logseq.graph-parser.property-test
  (:require [cljs.test :refer [are deftest is testing]]
            [logseq.graph-parser.property :as gp-property]))

(def test-db "test-db")

(deftest test-remove-properties-with-unmatched-fences
  (doseq [content ["```text\n```python\ncaption:: sample\n```"
                   "```text\nline\n```extra\ncaption:: sample"]]
    (is (= content (gp-property/remove-properties :markdown content)))))

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

(deftest test-remove-properties-after-table
  (testing "properties that follow a table are removed"
    (are [x y] (= x y)
      (gp-property/remove-properties :markdown "| a | b |\n|---|---|\n| c | d |\nkey:: v")
      "| a | b |\n|---|---|\n| c | d |"

      (gp-property/remove-properties :markdown "| a | b |\n|---|---|\n| c | d |\nkey:: v\nother:: w")
      "| a | b |\n|---|---|\n| c | d |"))
  (testing "text after the first line is kept"
    (is (= "text\n| a | b |\n| c | d |\nkey:: v"
           (gp-property/remove-properties :markdown "text\n| a | b |\n| c | d |\nkey:: v")))))
