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

(deftest test-insert-property
  (are [x y] (= x y)
    (gp-property/insert-property test-db :org "hello" "a" "b")
    "hello\n:PROPERTIES:\n:a: b\n:END:"

    (gp-property/insert-property test-db :org "hello" "a" false)
    "hello\n:PROPERTIES:\n:a: false\n:END:"

    (gp-property/insert-property test-db :org "hello\n:PROPERTIES:\n:a: b\n:END:\n" "c" "d")
    "hello\n:PROPERTIES:\n:a: b\n:c: d\n:END:"

    (gp-property/insert-property test-db :org "hello\n:PROPERTIES:\n:a: b\n:END:\nworld\n" "c" "d")
    "hello\n:PROPERTIES:\n:a: b\n:c: d\n:END:\nworld"

    (gp-property/insert-property test-db :org "#+BEGIN_QUOTE
 hello world
  #+END_QUOTE" "c" "d")
    ":PROPERTIES:\n:c: d\n:END:\n#+BEGIN_QUOTE\n hello world\n  #+END_QUOTE"

    (gp-property/insert-property test-db :org "hello
DEADLINE: <2021-10-25 Mon>
SCHEDULED: <2021-10-25 Mon>" "a" "b")
    "hello\nSCHEDULED: <2021-10-25 Mon>\nDEADLINE: <2021-10-25 Mon>\n:PROPERTIES:\n:a: b\n:END:"

    (gp-property/insert-property test-db :org "hello
DEADLINE: <2021-10-25 Mon>
SCHEDULED: <2021-10-25 Mon>\n:PROPERTIES:\n:a: b\n:END:\n" "c" "d")
    "hello\nDEADLINE: <2021-10-25 Mon>\nSCHEDULED: <2021-10-25 Mon>\n:PROPERTIES:\n:a: b\n:c: d\n:END:"

    (gp-property/insert-property test-db :org "hello
DEADLINE: <2021-10-25 Mon>
SCHEDULED: <2021-10-25 Mon>\n:PROPERTIES:\n:a: b\n:END:\nworld\n" "c" "d")
    "hello\nDEADLINE: <2021-10-25 Mon>\nSCHEDULED: <2021-10-25 Mon>\n:PROPERTIES:\n:a: b\n:c: d\n:END:\nworld"

    (gp-property/insert-property test-db :markdown "hello\na:: b\nworld\n" "c" "d")
    "hello\na:: b\nc:: d\nworld"

    (gp-property/insert-property test-db :markdown "> quote" "c" "d")
    "c:: d\n> quote"

    (gp-property/insert-property test-db :markdown "#+BEGIN_QUOTE
 hello world
  #+END_QUOTE" "c" "d")
    "c:: d\n#+BEGIN_QUOTE\n hello world\n  #+END_QUOTE"))

(deftest test-insert-properties
  (are [x y] (= x y)
    (gp-property/insert-properties test-db :markdown "" {:foo "bar"})
    "foo:: bar"

    (gp-property/insert-properties test-db :markdown "" {"foo" "bar"})
    "foo:: bar"

    (gp-property/insert-properties test-db :markdown "" {"foo space" "bar"})
    "foo-space:: bar"

    (gp-property/insert-properties test-db :markdown "" {:foo #{"bar" "baz"}})
    "foo:: [[bar]], [[baz]]"

    (gp-property/insert-properties test-db :markdown "" {:foo ["bar" "bar" "baz"]})
    "foo:: [[bar]], [[baz]]"

    (gp-property/insert-properties test-db :markdown "a\nb\n" {:foo ["bar" "bar" "baz"]})
    "a\nfoo:: [[bar]], [[baz]]\nb"

    (gp-property/insert-properties test-db :markdown "" {:foo "\"bar, baz\""})
    "foo:: \"bar, baz\""

    (gp-property/insert-properties test-db :markdown "abcd\nempty::" {:id "123" :foo "bar"})
    "abcd\nempty::\nid:: 123\nfoo:: bar"

    (gp-property/insert-properties test-db :markdown "abcd\nempty:: " {:id "123" :foo "bar"})
    "abcd\nempty:: \nid:: 123\nfoo:: bar"

    (gp-property/insert-properties test-db :markdown "abcd\nempty::" {:id "123"})
    "abcd\nempty::\nid:: 123"

    (gp-property/insert-properties test-db :markdown "abcd\nempty::\nanother-empty::" {:id "123"})
    "abcd\nempty::\nanother-empty::\nid:: 123"))

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