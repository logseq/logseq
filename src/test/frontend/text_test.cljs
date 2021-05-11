(ns frontend.text-test
  (:require [frontend.text :as text]
            [cljs.test :refer [deftest is are testing use-fixtures]]))

(deftest page-ref?
  []
  (are [x y] (= (text/page-ref? x) y)
    "[[page]]" true
    "[[another page]]" true
    "[single bracket]" false
    "no brackets" false))

(deftest page-ref-un-brackets!
  []
  (are [x y] (= (text/page-ref-un-brackets! x) y)
    "[[page]]" "page"
    "[[another page]]" "another page"
    "[[nested [[page]]]]" "nested [[page]]"
    "[single bracket]" "[single bracket]"
    "no brackets" "no brackets"))

(deftest sep-by-comma
  []
  (are [x y] (= (text/sep-by-comma x) y)
    "foo,bar" ["foo" "bar"]
    "foo, bar" ["foo" "bar"]
    "foo bar" ["foo bar"]
    "[[foo]] [[bar]]" ["[[foo]] [[bar]]"]
    "[[foo]],[[bar]]" ["[[foo]]", "[[bar]]"]
    "[[foo]], [[bar]]" ["[[foo]]", "[[bar]]"]
    "[[foo]]" ["[[foo]]"]
    "[[nested [[foo]]]]" ["[[nested [[foo]]]]"]))

(deftest split-page-refs-without-brackets
  []
  (are [x y] (= (text/split-page-refs-without-brackets x) y)
    "foobar" "foobar"
    "foo bar" "foo bar"
    "foo, bar" #{"foo" "bar"}
    "foo \"bar\"" #{"foo" "bar"}
    "[[foo]] [[bar]]" #{"foo]] [[bar"}
    "[[foo]],[[bar]]" #{"foo", "bar"}
    "[[foo]], [[bar]]" #{"foo", "bar"}
    "[[foo]]" #{"foo"}
    "[[nested [[foo]]]]" #{"nested [[foo]]"}
    "[[nested [[foo]]]], [[foo]]" #{"nested [[foo]]" "foo"}
    "#tag," #{"tag"}
    "#tag" #{"tag"}
    "#tag1,#tag2" #{"tag1" "tag2"}
    "[[Jan 26th, 2021]], hello" #{"hello" "Jan 26th, 2021"}))

(deftest extract-level-spaces
  []
  (testing "markdown"
    (are [x y] (= (text/extract-level-spaces x :markdown) y)
      "# foobar" "# "
      "##   foobar" "##   "
      "#####################   foobar" "#####################   "))
  (testing "org mode"
    (are [x y] (= (text/extract-level-spaces x :org) y)
      "* foobar" "* "
      "**   foobar" "**   "
      "*********************  foobar" "*********************  ")))

(deftest remove-level-spaces
  []
  (testing "markdown"
    (are [x y] (= (text/remove-level-spaces x :markdown true) y)
      "# foobar" "foobar"
      "##   foobar" "foobar"
      "#####################   foobar" "foobar"))
  (testing "markdown without spaces between the `#` and title"
    (are [x y] (= (text/remove-level-spaces x :markdown) y)
      "#foobar" "foobar"
      "##foobar" "foobar"
      "#####################foobar" "foobar"))
  (testing "org"
    (are [x y] (= (text/remove-level-spaces x :org true) y)
      "* foobar" "foobar"
      "**   foobar" "foobar"
      "*********************   foobar" "foobar"))
  (testing "org without spaces between the `#` and title"
    (are [x y] (= (text/remove-level-spaces x :org) y)
      "*foobar" "foobar"
      "**foobar" "foobar"
      "*********************foobar" "foobar")))

(deftest append-newline-after-level-spaces
  []
  (are [x y] (= (text/append-newline-after-level-spaces x :markdown) y)
    "# foobar" "#\nfoobar"
    "# foobar\nfoo" "#\nfoobar\nfoo"
    "## foobar\nfoo" "##\nfoobar\nfoo")

  (are [x y] (= (text/append-newline-after-level-spaces x :org) y)
    "* foobar" "*\nfoobar"
    "* foobar\nfoo" "*\nfoobar\nfoo"
    "** foobar\nfoo" "**\nfoobar\nfoo"))

(deftest remove-id-property
  []
  (are [x y] (= (text/remove-id-property! :org x) y)
    "hello\n:PROPERTIES:\n:id: f9873a81-07b9-4246-b910-53a6f5ec7e04\n:END:\n"
    "hello\n:PROPERTIES:\n:END:"

    "hello\n:PROPERTIES:\n:id: f9873a81-07b9-4246-b910-53a6f5ec7e04\na: b\n:END:\n"
    "hello\n:PROPERTIES:\na: b\n:END:"))

(deftest test-remove-properties!
  []
  (testing "properties with non-blank lines"
    (are [x y] (= x y)
      (text/remove-properties! :org "** hello\n:PROPERTIES:\n:x: y\n:END:\n")
      "** hello"

      (text/remove-properties! :org "** hello\n:PROPERTIES:\n:x: y\na:b\n:END:\n")
      "** hello"))
  (testing "properties with blank lines"
    (are [x y] (= x y)
      (text/remove-properties! :org "** hello\n:PROPERTIES:\n\n:x: y\n:END:\n")
      "** hello"

      (text/remove-properties! :org "** hello\n:PROPERTIES:\n:x: y\n\na:b\n:END:\n")
      "** hello")))

(deftest test-insert-property
  []
  (are [x y] (= x y)
    (text/insert-property! :org "hello" "a" "b")
    "hello\n:PROPERTIES:\n:a: b\n:END:\n"

    (text/insert-property! :org "hello" "a" false)
    "hello\n:PROPERTIES:\n:a: false\n:END:\n"

    (text/insert-property! :org "hello\n:PROPERTIES:\n:a: b\n:END:\n" "c" "d")
    "hello\n:PROPERTIES:\n:a: b\n:c: d\n:END:"

    (text/insert-property! :org "hello\n:PROPERTIES:\n:a: b\n:END: world\n" "c" "d")
    "hello\n:PROPERTIES:\n:c: d\n:END:\n:PROPERTIES:\n:a: b\n:END: world\n"))

(deftest test->new-properties
  []
  (are [x y] (= (text/->new-properties x) y)
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

#_(cljs.test/test-ns 'frontend.text-test)
