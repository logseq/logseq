(ns logseq.db.frontend.query-dsl-test
  (:require [cljs.reader :as reader]
            [cljs.test :refer [deftest is testing]]
            [logseq.db.frontend.query-dsl :as query-dsl]))

(defn- read-query
  [s]
  (reader/read-string query-dsl/custom-readers (query-dsl/pre-transform s)))

(defn- quoted-tags-query
  [page-name]
  (str "(tags " (pr-str (str "[[" page-name "]]")) ")"))

(deftest pre-transform-quotes-page-refs
  (testing "page references should be quoted and tags should be handled"
    (is (= "#tag foo" (query-dsl/pre-transform "#foo")))
    (is (= "(and #tag foo)" (query-dsl/pre-transform "(and #foo)")))
    (is (= "\"[[test #foo]]\"" (query-dsl/pre-transform "[[test #foo]]")))
    (is (= "(and \"[[test #foo]]\" (or #tag foo))"
           (query-dsl/pre-transform "(and [[test #foo]] (or #foo))")))
    (is (= "\"for #clojure\"" (query-dsl/pre-transform "\"for #clojure\"")))
    (is (= "(and \"for #clojure\")" (query-dsl/pre-transform "(and \"for #clojure\")")))
    (is (= "(and \"for #clojure\" #tag foo)"
           (query-dsl/pre-transform "(and \"for #clojure\" #foo)")))
    (is (= "(and \"[[outside]]\" (property prop \"2 [[6a8ead3b-a450-4916-a7e2-d16d0d2b59fd]]\"))"
           (query-dsl/pre-transform
            "(and [[outside]] (property prop \"2 [[6a8ead3b-a450-4916-a7e2-d16d0d2b59fd]]\"))")))))

(deftest pre-transform-special-characters-in-page-refs
  (testing "double quote in a page title"
    (is (= (quoted-tags-query "Project\"")
           (query-dsl/pre-transform "(tags [[Project\"]])")))
    (is (= '(tags "[[Project\"]]")
           (read-query "(tags [[Project\"]])"))))

  (testing "backslash in a page title"
    (is (= (quoted-tags-query "Project\\")
           (query-dsl/pre-transform "(tags [[Project\\]])")))
    (is (= '(tags "[[Project\\]]")
           (read-query "(tags [[Project\\]])"))))

  (testing "[[ inside a page title"
    (is (= (quoted-tags-query "Project[[Gremlin Garden]]")
           (query-dsl/pre-transform "(tags [[Project[[Gremlin Garden]]]])")))
    (is (= '(tags "[[Project[[Gremlin Garden]]]]")
           (read-query "(tags [[Project[[Gremlin Garden]]]])"))))

  (testing "]] at the end of a page title"
    (is (= (quoted-tags-query "Project]]")
           (query-dsl/pre-transform "(tags [[Project]]]])")))
    (is (= '(tags "[[Project]]]]")
           (read-query "(tags [[Project]]]])"))))

  (testing "title that is itself a page ref"
    (is (= (quoted-tags-query "[[Gremlin Home]]")
           (query-dsl/pre-transform "(tags [[[[Gremlin Home]]]])")))
    (is (= '(tags "[[[[Gremlin Home]]]]")
           (read-query "(tags [[[[Gremlin Home]]]])"))))

  (testing "multiple page refs with special characters stay independent"
    (is (= (str "(and " (pr-str "[[foo\"]]") " " (pr-str "[[bar\\]]") ")")
           (query-dsl/pre-transform "(and [[foo\"]] [[bar\\]])")))
    (is (= (list 'and "[[foo\"]]" "[[bar\\]]")
           (read-query "(and [[foo\"]] [[bar\\]])")))))
