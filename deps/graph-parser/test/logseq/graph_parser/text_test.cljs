(ns logseq.graph-parser.text-test
  (:require [cljs.test :refer [are deftest testing]]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.mldoc :as gp-mldoc]))

(deftest test-get-page-name
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
  (are [x y] (= (text/page-ref-un-brackets! x) y)
    "[[page]]" "page"
    "[[another page]]" "another page"
    "[[nested [[page]]]]" "nested [[page]]"
    "[single bracket]" "[single bracket]"
    "no brackets" "no brackets"))

(def block-patterns
  {:markdown "-"
   :org "*"})

(deftest remove-level-spaces
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

(defn- parse-property
  [k v user-config]
  (let [references (gp-mldoc/get-references v (gp-mldoc/default-config :markdown))]
    (text/parse-property k v references user-config)))

(deftest test-parse-property
  (testing "for default comma separated properties"
    (are [k v y] (= (parse-property k v {}) y)
         :tags "foo" #{"foo"}
         :tags "comma, separated" #{"comma" "separated"}
         :alias "one, two, one" #{"one" "two"}))

  (testing "for user comma separated properties"
    (are [k v y] (= (parse-property k v {:property/separated-by-commas #{:comma-prop}}) y)
         :comma-prop "foo" #{"foo"}
         :comma-prop "comma, separated" #{"comma" "separated"}
         :comma-prop "one, two, one" #{"one" "two"}))

  (testing "for user comma separated properties with mixed values"
    (are [k v y] (= (parse-property k v {:property/separated-by-commas #{:comma-prop}}) y)
         :comma-prop "foo, #bar" #{"foo", "bar"}
         :comma-prop "comma, separated, [[page ref]], [[nested [[page]]]], #[[nested [[tag]]]], end" #{"page ref" "nested [[page]]" "nested [[tag]]" "comma" "separated" "end"}))

  (testing "for normal properties"
    (are [k v y] (= (parse-property k v {}) y)
         :normal "[[foo]] [[bar]]" #{"foo" "bar"}
         :normal "[[foo]], [[bar]]" #{"foo" "bar"}
         :normal "[[foo]]" #{"foo"}
         :normal "[[foo]], [[bar]], #baz" #{"foo" "bar" "baz"}
         :normal "[[foo [[bar]]]]" #{"foo [[bar]]"}
         :normal "[[foo [[bar]]]], [[baz]]" #{"baz" "foo [[bar]]"}
         :title "comma, is ok" "comma, is ok"))

  (testing "for tags in properties with punctuation"
    (are [k v y] (= (parse-property k v {}) y)
         :prop "#foo, #bar. #baz!" #{"foo" "bar" "baz"}
         :prop "#foo: '#bar'" #{"foo" "bar"}))

  (testing "parse-property with quoted strings"
    (are [k v y] (= (parse-property k v {}) y)
         :tags "\"foo, bar\"" "\"foo, bar\""
         :tags "\"[[foo]], [[bar]]\"" "\"[[foo]], [[bar]]\""))

  (testing "parse title property with square bracket"
    (are [k v y] (= (parse-property k v {}) y)
         :title "[[Jan 11th, 2022]] 21:26" "[[Jan 11th, 2022]] 21:26"
         :title "[[[[aldsfkd]] a.b/c.d]]" "[[[[aldsfkd]] a.b/c.d]]"))

  (testing "built-in properties parse as expected"
    (are [k v y] (= (parse-property k v {}) y)
         :id "62e98716-9c0b-4253-83e7-7f8e8a23fe19" "62e98716-9c0b-4253-83e7-7f8e8a23fe19"
         :filters "{\"product process\" true}" "{\"product process\" true}"
         :collapsed "false" false
         :created-at "1609233702047" 1609233702047
         :background-color "#533e7d" "#533e7d")))


#_(cljs.test/test-ns 'logseq.graph-parser.text-test)
