(ns frontend.format.page-test
  (:require [frontend.handler.page :as handler-page]
            [cljs.test :refer [deftest are testing run-tests]]))

(deftest test-replace-page-ref!
  (are [x y] (= (let [[content old-name new-name] x]
                  (handler-page/replace-page-ref! content old-name new-name))
                y)
    ["bla [[foo]] bla" "foo" "bar"] "bla [[bar]] bla"

    ["bla [[logseq/foo]] bla" "logseq/foo" "logseq/bar"] "bla [[logseq/bar]] bla"

    ["bla [[file:./logseq.foo.org][logseq/foo]] bla" "logseq/foo" "logseq/bar"]
    "bla [[file:./logseq.bar.org][logseq/bar]] bla"

    ["bla [[file:./pages/logseq.foo.org][logseq/foo]] bla" "logseq/foo" "logseq/bar"]
    "bla [[file:./pages/logseq.bar.org][logseq/bar]] bla"

    ["bla [[file:./pages/logseq.foo.org][logseq/foo]] bla [[logseq/foo]]" "logseq/foo" "logseq/bar"]
    "bla [[file:./pages/logseq.bar.org][logseq/bar]] bla [[logseq/bar]]"

    ["bla [[file:./pages/logseq.foo.org][don't change this label]] bla [[logseq/foo]]" "logseq/foo" "logseq/bar"]
    "bla [[file:./pages/logseq.bar.org][don't change this label]] bla [[logseq/bar]]"))

(deftest test-replace-tag-ref!
  (are [x y] (= (let [[content old-name new-name] x]
                  (handler-page/replace-tag-ref! content old-name new-name))
                y)
    ["#foo" "foo" "bar"] "#bar"
    ["#foo" "foo" "new bar"] "#[[new bar]]"

    ["bla #foo bla" "foo" "bar"] "bla #bar bla"
    ["bla #foo bla" "foo" "new bar"] "bla #[[new bar]] bla"

    ["bla #foo" "foo" "bar"] "bla #bar"
    ["bla #foo" "foo" "new bar"] "bla #[[new bar]]"

    ["#foo #foobar bar#foo #foo" "foo" "bar"]
    "#bar #foobar bar#foo #bar"
    
    ["#foo #foobar bar#foo #foo" "foo" "new bar"]
    "#[[new bar]] #foobar bar#foo #[[new bar]]"

    ["#logseq/foo #logseq/foobar bar#logseq/foo #logseq/foo" "logseq/foo" "logseq/bar"]
    "#logseq/bar #logseq/foobar bar#logseq/foo #logseq/bar"))

(deftest test-replace-old-page!
  (are [x y] (= (let [[content old-name new-name] x]
                  (handler-page/replace-old-page! content old-name new-name))
                y)
    ["#foo bla [[foo]] bla #foo" "foo" "bar"]
    "#bar bla [[bar]] bla #bar"

    ["#logseq/foo bla [[logseq/foo]] bla [[file:./pages/logseq.foo.org][logseq/foo]] bla #logseq/foo" "logseq/foo" "logseq/bar"]
    "#logseq/bar bla [[logseq/bar]] bla [[file:./pages/logseq.bar.org][logseq/bar]] bla #logseq/bar"))

#_(run-tests)
