(ns frontend.util.property-test
  (:require [cljs.test :refer [are deftest testing]]
            [frontend.util.property :as property]))

(deftest remove-id-property
  (testing "org"
    (are [x y] (= (property/remove-id-property :org x) y)
      "hello\n:PROPERTIES:\n:id: f9873a81-07b9-4246-b910-53a6f5ec7e04\n:END:\n"
      "hello\n:PROPERTIES:\n:END:"

      "hello\n:PROPERTIES:\n:id: f9873a81-07b9-4246-b910-53a6f5ec7e04\na: b\n:END:\n"
      "hello\n:PROPERTIES:\na: b\n:END:"))
  (testing "markdown"
    (are [x y] (= (property/remove-id-property :markdown x) y)
      "hello\nid:: f9873a81-07b9-4246-b910-53a6f5ec7e04"
      "hello"

      "hello\nid:: f9873a81-07b9-4246-b910-53a6f5ec7e04\n\nworld"
      "hello\n\nworld"

      "hello\naa:: bb\nid:: f9873a81-07b9-4246-b910-53a6f5ec7e04\n\nworld"
      "hello\naa:: bb\n\nworld")))

(deftest test-remove-empty-properties
  (testing "remove properties if it is empty. Available in orgmode"
    (are [x y] (= (property/remove-empty-properties x) y)
      "* TODO properties demo\nabcd"
      "* TODO properties demo\nabcd"

      "* TODO properties demo\n:PROPERTIES:\n:END:\nabcd"
      "* TODO properties demo\nabcd"

      "* TODO properties demo\n:PROPERTIES:\n:END:\n\n\nabcd"
      "* TODO properties demo\nabcd"

      "* TODO properties demo\n:PROPERTIES:\n\n:END:\n\n\nabcd"
      "* TODO properties demo\nabcd")))

(deftest test-remove-properties
  (testing "properties with non-blank lines"
    (are [x y] (= x y)
      (property/remove-properties :org "** hello\n:PROPERTIES:\n:x: y\n:END:\n")
      "** hello"

      (property/remove-properties :org "** hello\n:PROPERTIES:\n:x: y\na:b\n:END:\n")
      "** hello"

      (property/remove-properties :markdown "** hello\nx:: y\na:: b\n")
      "** hello"

      (property/remove-properties :markdown "** hello\nx:: y\na::b\n")
      "** hello"))

  (testing "properties with blank lines"
    (are [x y] (= x y)
      (property/remove-properties :org "** hello\n:PROPERTIES:\n\n:x: y\n:END:\n")
      "** hello"

      (property/remove-properties :org "** hello\n:PROPERTIES:\n:x: y\n\na:b\n:END:\n")
      "** hello"))

  (testing "invalid-properties"
    (are [x y] (= x y)
      (property/remove-properties :markdown "hello\nnice\nfoo:: bar")
      "hello\nnice\nfoo:: bar"

      (property/remove-properties :markdown "hello\nnice\nfoo:: bar\ntest")
      "hello\nnice\nfoo:: bar\ntest"

      (property/remove-properties :markdown "** hello\nx:: y\n\na:: b\n")
      "** hello\n\na:: b")))

(deftest test-get-property-keys
  (testing "org mode"
    (are [x y] (= x y)
        (property/get-property-keys :org "hello\n:PROPERTIES:\n:x1: y1\n:x2: y2\n:END:\n")
        ["X1" "X2"]

        (property/get-property-keys :org "hello\n:PROPERTIES:\n:END:\n")
        nil))
  (testing "markdown mode"
    (are [x y] (= x y)
        (property/get-property-keys :markdown "hello\nx1:: y1\nx2:: y2\n")
        ["X1" "X2"]

        (property/get-property-keys :markdown "hello\n")
        nil)))

(deftest test-insert-property
  (are [x y] (= x y)
    (property/insert-property :org "hello" "a" "b")
    "hello\n:PROPERTIES:\n:a: b\n:END:"

    (property/insert-property :org "hello" "a" false)
    "hello\n:PROPERTIES:\n:a: false\n:END:"

    (property/insert-property :org "hello\n:PROPERTIES:\n:a: b\n:END:\n" "c" "d")
    "hello\n:PROPERTIES:\n:a: b\n:c: d\n:END:"

    (property/insert-property :org "hello\n:PROPERTIES:\n:a: b\n:END:\nworld\n" "c" "d")
    "hello\n:PROPERTIES:\n:a: b\n:c: d\n:END:\nworld"

    (property/insert-property :org "#+BEGIN_QUOTE
 hello world
  #+END_QUOTE" "c" "d")
    ":PROPERTIES:\n:c: d\n:END:\n#+BEGIN_QUOTE\n hello world\n  #+END_QUOTE"

     (property/insert-property :org "hello
DEADLINE: <2021-10-25 Mon>
SCHEDULED: <2021-10-25 Mon>" "a" "b")
    "hello\nSCHEDULED: <2021-10-25 Mon>\nDEADLINE: <2021-10-25 Mon>\n:PROPERTIES:\n:a: b\n:END:"

    (property/insert-property :org "hello
DEADLINE: <2021-10-25 Mon>
SCHEDULED: <2021-10-25 Mon>\n:PROPERTIES:\n:a: b\n:END:\n" "c" "d")
    "hello\nDEADLINE: <2021-10-25 Mon>\nSCHEDULED: <2021-10-25 Mon>\n:PROPERTIES:\n:a: b\n:c: d\n:END:"

    (property/insert-property :org "hello
DEADLINE: <2021-10-25 Mon>
SCHEDULED: <2021-10-25 Mon>\n:PROPERTIES:\n:a: b\n:END:\nworld\n" "c" "d")
    "hello\nDEADLINE: <2021-10-25 Mon>\nSCHEDULED: <2021-10-25 Mon>\n:PROPERTIES:\n:a: b\n:c: d\n:END:\nworld"

    (property/insert-property :markdown "hello\na:: b\nworld\n" "c" "d")
    "hello\na:: b\nc:: d\nworld"

    (property/insert-property :markdown "> quote" "c" "d")
    "c:: d\n> quote"

    (property/insert-property :markdown "#+BEGIN_QUOTE
 hello world
  #+END_QUOTE" "c" "d")
    "c:: d\n#+BEGIN_QUOTE\n hello world\n  #+END_QUOTE"))

(deftest test-insert-properties
  (are [x y] (= x y)
    (property/insert-properties :markdown "" {:foo "bar"})
    "foo:: bar"

    (property/insert-properties :markdown "" {"foo" "bar"})
    "foo:: bar"

    (property/insert-properties :markdown "" {"foo space" "bar"})
    "foo-space:: bar"

    (property/insert-properties :markdown "" {:foo #{"bar" "baz"}})
    "foo:: [[bar]], [[baz]]"

    (property/insert-properties :markdown "" {:foo ["bar" "bar" "baz"]})
    "foo:: [[bar]], [[baz]]"

    (property/insert-properties :markdown "a\nb\n" {:foo ["bar" "bar" "baz"]})
    "a\nfoo:: [[bar]], [[baz]]\nb"

    (property/insert-properties :markdown "" {:foo "\"bar, baz\""})
    "foo:: \"bar, baz\""

    (property/insert-properties :markdown "abcd\nempty::" {:id "123" :foo "bar"})
    "abcd\nempty::\nid:: 123\nfoo:: bar"

    (property/insert-properties :markdown "abcd\nempty:: " {:id "123" :foo "bar"})
    "abcd\nempty:: \nid:: 123\nfoo:: bar"

    (property/insert-properties :markdown "abcd\nempty::" {:id "123"})
    "abcd\nempty::\nid:: 123"

    (property/insert-properties :markdown "abcd\nempty::\nanother-empty::" {:id "123"})
    "abcd\nempty::\nanother-empty::\nid:: 123"))

(deftest test-build-properties-str
  (are [x y] (= (property/build-properties-str :mardown x) y)
    {:title "a"}
    "title:: a\n"
    {:title "a/b/c"}
    "title:: a/b/c\n"
    {:title "a/b/c" :tags "d,e"}
    "title:: a/b/c\ntags:: d,e\n")
  (are [x y] (= (property/build-properties-str :org x) y)
    {:title "a"}
    ":PROPERTIES:\n:title: a\n:END:"
    {:title "a/b/c"}
    ":PROPERTIES:\n:title: a/b/c\n:END:"
    {:title "a/b/c" :tags "d,e"}
    ":PROPERTIES:\n:title: a/b/c\n:tags: d,e\n:END:"))

(deftest test-with-built-in-properties
  (let [content "#+BEGIN_QUERY\n{:title      \"cool NEXT\"\n    :query      [:find (pull ?h [*])\n                 :in $ ?start ?next\n                 :where\n                 [?h :block/marker ?marker]\n                 [(contains? #{\"NOW\" \"LATER\" \"TODO\"} ?marker)]\n                 [?h :block/ref-pages ?p]\n                 [?p :block/journal? true]\n                 [?p :block/journal-day ?d]\n                 [(> ?d ?start)]\n                 [(< ?d ?next)]]\n    :inputs     [:today :7d-after]\n    :collapsed? false}\n#+END_QUERY"]
    (let [md-property "query-table:: true"]
      (are [x y] (= (property/with-built-in-properties {:query-table true} x :markdown) y)
       content
       (str md-property "\n" content)

       "title"
       (str "title\n" md-property)

       "title\nbody"
       (str "title\n" md-property "\nbody")

       "1. list"
       (str md-property "\n1. list")))

    (let [org-property ":PROPERTIES:\n:query-table: true\n:END:"]
      (are [x y] (= (property/with-built-in-properties {:query-table true} x :org) y)
        content
        (str org-property "\n" content)

        "title"
        (str "title\n" org-property)

        "title\nbody"
        (str "title\n" org-property "\nbody")

        "1. list"
        (str org-property "\n1. list")))))

(deftest get-visible-ordered-properties
  (testing "basic cases"
    (are [x y expected] (= expected (property/get-visible-ordered-properties x y {}))
      ;; returns in property order
      {:prop "val" :prop2 "val2"} [:prop2 :prop]
      [[:prop2 "val2"] [:prop "val"]]
      ;; returns empty non-nil value if properties is non-nil
      {} [:prop]
      '()
      ;; returns nil if properties is nil
      nil []
      nil))

  (testing "hidden properties"
    (are [x y z expected] (= expected (property/get-visible-ordered-properties x y z))
      ;; page block
      {:logseq.order-list-type "number" :foo "bar"}  [:logseq.order-list-type :foo] {:pre-block false}
      [[:foo "bar"]]
      ;; normal block
      {:logseq.order-list-type "number" :foo "bar"}  [:logseq.order-list-type :foo] {:pre-block false}
      [[:foo "bar"]]))

  (testing "hidden editable properties"
    (are [x y z expected] (= expected (property/get-visible-ordered-properties x y z))
      ;; page block
      {:title "foo"} [:title] {:pre-block? true}
      '()
      {:title "foo" :foo "bar"} [:title :foo] {:pre-block? true}
      [[:foo "bar"]]
      ;; normal block
      {:logseq.table.version 2} [:logseq.table.version] {:pre-block? false}
      '()
      {:logseq.table.version 2 :foo "bar"} [:logseq.table.version :foo] {:pre-block? false}
      [[:foo "bar"]])))