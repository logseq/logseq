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

(defn split-page-refs-without-brackets
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

(defn extract-level-spaces
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

(defn remove-level-spaces
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

(defn append-newline-after-level-spaces
  []
  (are [x y] (= (text/append-newline-after-level-spaces x :markdown) y)
    "# foobar" "#\nfoobar"
    "# foobar\nfoo" "#\nfoobar\nfoo"
    "## foobar\nfoo" "##\nfoobar\nfoo")

  (are [x y] (= (text/append-newline-after-level-spaces x :org) y)
    "* foobar" "*\nfoobar"
    "* foobar\nfoo" "*\nfoobar\nfoo"
    "** foobar\nfoo" "**\nfoobar\nfoo"))

(defn remove-id-property
  []
  (are [x y] (= (text/remove-id-property x) y)
    "hello\n:PROPERTIES:\n:id: f9873a81-07b9-4246-b910-53a6f5ec7e04\n:END:\n"
    "hello\n:PROPERTIES:\n:END:"

    "hello\n:PROPERTIES:\n:id: f9873a81-07b9-4246-b910-53a6f5ec7e04\na: b\n:END:\n"
    "hello\n:PROPERTIES:\na: b\n:END:"))

(deftest re-construct-block-properties
  []
  (testing "block content without a title"
    (are [x y] (= x y)
      (text/re-construct-block-properties :org "** :PROPERTIES:\n:x: y\n:END:\n" {"x" "y"} false)
      "** \n:PROPERTIES:\n:x: y\n:END:\n"

      (text/re-construct-block-properties :markdown "## :PROPERTIES:\n:x: y\n:END:\n" {"x" "y"} false)
      "## \n:PROPERTIES:\n:x: y\n:END:\n"))

  (testing "query block without a title"
    (are [x y] (= x y)
      (text/re-construct-block-properties :org "** #+BEGIN_QUERY
test
#+END_QUERY" {"created_at" 1609332958103} false)
      "** \n:PROPERTIES:\n:created_at: 1609332958103\n:END:\n#+BEGIN_QUERY\ntest\n#+END_QUERY"))

  (testing "table without a title"
    (are [x y] (= x y)
      (text/re-construct-block-properties :org "** |x|y|
|1|2|" {"created_at" 1609332958103} false)
      "** \n:PROPERTIES:\n:created_at: 1609332958103\n:END:\n|x|y|\n|1|2|"))

  (testing "block content with a title"
    (are [x y] (= x y)
      (text/re-construct-block-properties :org "** hello\n:PROPERTIES:\n:x: y\n:END:\n" {"x" "y"} true)
      "** hello\n:PROPERTIES:\n:x: y\n:END:\n"

      (text/re-construct-block-properties :markdown "## hello\n:PROPERTIES:\n:x: y\n:END:\n" {"x" "y"} true)
      "## hello\n:PROPERTIES:\n:x: y\n:END:\n"))

  (testing "block content with custom properties"
    (are [x y] (= x y)
      (text/re-construct-block-properties :org "** hello\n:PROPERTIES:\n:x: y\n:END:\n" {"x" "z"} true)
      "** hello\n:PROPERTIES:\n:x: z\n:END:\n"

      (text/re-construct-block-properties :markdown "## hello\n:PROPERTIES:\n:x: y\n:END:\n" {"x" "y" "a" "b"} true)
      "## hello\n:PROPERTIES:\n:x: y\n:a: b\n:END:\n")))

(defn test-remove-properties!
  []
  (testing "properties with non-blank lines"
    (are [x y] (= x y)
      (text/remove-properties! "** hello\n:PROPERTIES:\n:x: y\n:END:\n")
      "** hello"

      (text/remove-properties! "** hello\n:PROPERTIES:\n:x: y\na:b\n:END:\n")
      "** hello"))
  (testing "properties with blank lines"
    (are [x y] (= x y)
      (text/remove-properties! "** hello\n:PROPERTIES:\n\n:x: y\n:END:\n")
      "** hello"

      (text/remove-properties! "** hello\n:PROPERTIES:\n:x: y\n\na:b\n:END:\n")
      "** hello")))

(defn test-insert-property
  []
  (are [x y] (= x y)
    (text/insert-property "hello" "a" "b")
    "hello\n:PROPERTIES:\n:a: b\n:END:\n"

    (text/insert-property "hello" "a" false)
    "hello\n:PROPERTIES:\n:a: false\n:END:\n"

    (text/insert-property "hello\n:PROPERTIES:\n:a: b\n:END:\n" "c" "d")
    "hello\n:PROPERTIES:\n:a: b\n:c: d\n:END:"

    (text/insert-property "hello\n:PROPERTIES:\n:a: b\n:END: world\n" "c" "d")
    "hello\n:PROPERTIES:\n:c: d\n:END:\n:PROPERTIES:\n:a: b\n:END: world\n"))

#_(cljs.test/test-ns 'frontend.text-test)
