(ns logseq.graph-parser.text-test
  (:require [cljs.test :refer [are deftest testing is]]
            [logseq.graph-parser.text :as text]))

(deftest test-get-page-name
  []
  (are [x y] (= (text/get-page-name x) y)
         "[[page]]" "page"
         "[[another page]]" "another page"
         "[single bracket]" nil
         "no brackets" nil

         "[[another page]]" "another page"
         "[[nested [[page]]]]" "nested [[page]]"

         "[[file:./page.org][page]]" "page"
         "[[file:./pages/page.org][page]]" "page"

         "[[file:./namespace.page.org][namespace/page]]" "namespace/page"
         "[[file:./pages/namespace.page.org][namespace/page]]" "namespace/page"
         "[[file:./pages/namespace.page.org][please don't change me]]" "namespace/page"

         "[page](file:./page.md)" "page"
         "[page](file:.pages/page.md)" "page"

         "[logseq/page](file:./logseq.page.md)" "logseq/page"
         "[logseq/page](file:./pages/logseq.page.md)" "logseq/page"))

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

(def block-patterns
  {:markdown "-"
   :org "*"})

(deftest remove-level-spaces
  []
  (testing "markdown"
    (are [x y] (= (text/remove-level-spaces x :markdown (block-patterns :markdown) true) y)
      "- foobar" "foobar"
      " - foobar" "foobar"))
  (testing "markdown without spaces between the `#` and title"
    (are [x y] (= (text/remove-level-spaces x :markdown (block-patterns :markdown)) y)
      "-foobar" "foobar"))
  (testing "org"
    (are [x y] (= (text/remove-level-spaces x :org (block-patterns :org) true) y)
      "* foobar" "foobar"
      "**   foobar" "foobar"
      "*********************   foobar" "foobar"))
  (testing "org without spaces between the `#` and title"
    (are [x y] (= (text/remove-level-spaces x :org (block-patterns :org)) y)
      "*foobar" "foobar"
      "**foobar" "foobar"
      "*********************foobar" "foobar")))

(deftest test-parse-property
  (testing "parse-property"
    (are [k v y] (= (text/parse-property k v {}) y)
      :tags "foo" "foo"
      :tags "foo, bar" #{"foo" "bar"}
      :tags "foo,bar" #{"foo" "bar"}
      :tags "[[foo]]" #{"foo"}
      :tags "[[foo]] [[bar]]" #{"foo" "bar"}
      :tags "[[foo]], [[bar]]" #{"foo" "bar"}
      :tags "[[foo]], [[bar]], #baz" #{"foo" "bar" "baz"}
      :tags "#baz, [[foo]], [[bar]]" #{"foo" "bar" "baz"}
      :tags "[[foo [[bar]]]]" #{"foo [[bar]]"}
      :tags "[[foo [[bar]]]], baz" #{"baz" "foo [[bar]]"}))
  (testing "parse-property with quoted strings"
    (are [k v y] (= (text/parse-property k v {}) y)
      :tags "\"foo, bar\"" "\"foo, bar\""
      :tags "\"[[foo]], [[bar]]\"" "\"[[foo]], [[bar]]\""
      :tags "baz, \"[[foo]], [[bar]]\"" #{"baz"})))

(deftest extract-page-refs-and-tags
  (is (= #{"cljs" "nbb" "js" "amazing"}
       (text/extract-page-refs-and-tags "This project is written with #cljs, #nbb and #js. #amazing!"))
      "Don't extract punctation at end of a tag"))

#_(cljs.test/test-ns 'logseq.graph-parser.text-test)
