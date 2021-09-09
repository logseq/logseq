(ns frontend.text-test
  (:require [cljs.test :refer [are deftest testing]]
            [frontend.text :as text]))

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
    "[[foo]] [[bar]]" #{"foo" "bar"}
    "[[foo]],[[bar]]" #{"foo", "bar"}
    "[[foo]], [[bar]]" #{"foo", "bar"}
    "[[foo]]" #{"foo"}
    "[[nested [[foo]]]]" #{"nested [[foo]]"}
    "[[nested [[foo]]]], [[foo]]" #{"nested [[foo]]" "foo"}
    "[[nested [[foo]] [[bar]]]], [[foo]]" #{"nested [[foo]] [[bar]]" "foo"}
    "[[nested [[foo]], [[bar]]]], [[foo]]" #{"nested [[foo]], [[bar]]" "foo"}
    "#tag," #{"tag"}
    "#tag" #{"tag"}
    "#tag1,#tag2" #{"tag1" "tag2"}
    "[[Jan 26th, 2021]], hello" #{"hello" "Jan 26th, 2021"}))

(deftest extract-level-spaces
  []
  (testing "markdown"
    (are [x y] (= (text/extract-level-spaces x :markdown) y)
      "- foobar" "- "
      "--   foobar" "-- "
      "---------------------   foobar" "--------------------- "))
  (testing "org mode"
    (are [x y] (= (text/extract-level-spaces x :org) y)
      "* foobar" "* "
      "**   foobar" "** "
      "*********************  foobar" "********************* ")))

(deftest remove-level-spaces
  []
  (testing "markdown"
    (are [x y] (= (text/remove-level-spaces x :markdown true) y)
      "- foobar" "foobar"
      " - foobar" "foobar"))
  (testing "markdown without spaces between the `#` and title"
    (are [x y] (= (text/remove-level-spaces x :markdown) y)
      "-foobar" "foobar"))
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

(deftest test-add-timestamp
  []
  (are [x y] (= x y)
    (text/add-timestamp "LATER hello world\nhello"
                        "scheduled"
                        "<2021-08-25 Wed>")
    "LATER hello world\nSCHEDULED: <2021-08-25 Wed>\nhello"

    (text/add-timestamp "LATER hello world "
                        "scheduled"
                        "<2021-08-25 Wed>")
    "LATER hello world\nSCHEDULED: <2021-08-25 Wed>"

    (text/add-timestamp "LATER hello world\nfoo:: bar\ntest"
                        "scheduled"
                        "<2021-08-25 Wed>")
    "LATER hello world\nSCHEDULED: <2021-08-25 Wed>\nfoo:: bar\ntest"))

#_(cljs.test/test-ns 'frontend.text-test)
