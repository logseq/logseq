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
           (read-query "(and [[foo\"]] [[bar\\]])"))))

  (testing "]] in the middle of a page title"
    (is (= (quoted-tags-query "Project]] Garden")
           (query-dsl/pre-transform "(tags [[Project]] Garden]])")))
    (is (= '(tags "[[Project]] Garden]]")
           (read-query "(tags [[Project]] Garden]])"))))

  (testing "nested [[...]] followed by more title text"
    (is (= (quoted-tags-query "Project[[Gremlin]] extra")
           (query-dsl/pre-transform "(tags [[Project[[Gremlin]] extra]])")))
    (is (= '(tags "[[Project[[Gremlin]] extra]]")
           (read-query "(tags [[Project[[Gremlin]] extra]])"))))

  (testing "page ref immediately before a tags vector close"
    (is (= (str "(tags [ " (pr-str "[[foo]]") "])")
           (query-dsl/pre-transform "(tags [ [[foo]]])")))
    (is (= '(tags ["[[foo]]"])
           (read-query "(tags [ [[foo]]])"))))

  (testing "page ref followed by another DSL symbol stays a single argument"
    (is (= (str "(between " (pr-str "[[Dec 26th, 2020]]") " tomorrow)")
           (query-dsl/pre-transform "(between [[Dec 26th, 2020]] tomorrow)")))
    (is (= (list 'between "[[Dec 26th, 2020]]" 'tomorrow)
           (read-query "(between [[Dec 26th, 2020]] tomorrow)"))))

  (testing "title ending with ] inside a tags vector"
    (is (= (str "(tags [ " (pr-str "[[foo]]]") "])")
           (query-dsl/pre-transform "(tags [ [[foo]]]])")))
    (is (= '(tags ["[[foo]]]"])
           (read-query "(tags [ [[foo]]]])"))))

  (testing "title ending with ]] inside a tags vector"
    (is (= (str "(tags [ " (pr-str "[[foo]]]]") "])")
           (query-dsl/pre-transform "(tags [ [[foo]]]]])")))
    (is (= '(tags ["[[foo]]]]"])
           (read-query "(tags [ [[foo]]]]])"))))

  (testing "later tag ending with ]] does not swallow an earlier between date"
    (is (= (str "(and (between " (pr-str "[[Dec 26th, 2020]]") " tomorrow) (tags "
                (pr-str "[[bar]]]]") "))")
           (query-dsl/pre-transform
            "(and (between [[Dec 26th, 2020]] tomorrow) (tags [[bar]]]]))")))
    (is (= (list 'and (list 'between "[[Dec 26th, 2020]]" 'tomorrow) (list 'tags "[[bar]]]]"))
           (read-query "(and (between [[Dec 26th, 2020]] tomorrow) (tags [[bar]]]]))"))))

  (testing "title can contain ]] then a paren then more text"
    (is (= (quoted-tags-query "A]] B) C")
           (query-dsl/pre-transform "(tags [[A]] B) C]])")))
    (is (= '(tags "[[A]] B) C]]")
           (read-query "(tags [[A]] B) C]])"))))

  (testing "later page-ref sibling ending with ]] does not swallow a between date"
    (is (= (str "(and (between " (pr-str "[[Dec 26th, 2020]]") " tomorrow) "
                (pr-str "[[foo]]]]") ")")
           (query-dsl/pre-transform
            "(and (between [[Dec 26th, 2020]] tomorrow) [[foo]]]])")))
    (is (= (list 'and (list 'between "[[Dec 26th, 2020]]" 'tomorrow) "[[foo]]]]")
           (read-query "(and (between [[Dec 26th, 2020]] tomorrow) [[foo]]]])")))))
