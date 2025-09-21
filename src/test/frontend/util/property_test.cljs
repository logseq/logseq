(ns frontend.util.property-test
  (:require [cljs.test :refer [are deftest testing]]
            [frontend.handler.file-based.property.util :as property-util]
            [logseq.graph-parser.property :as gp-property]))

(deftest remove-id-property
  (testing "org"
    (are [x y] (= (property-util/remove-id-property :org x) y)
      "hello\n:PROPERTIES:\n:id: f9873a81-07b9-4246-b910-53a6f5ec7e04\n:END:\n"
      "hello\n:PROPERTIES:\n:END:"

      "hello\n:PROPERTIES:\n:id: f9873a81-07b9-4246-b910-53a6f5ec7e04\na: b\n:END:\n"
      "hello\n:PROPERTIES:\na: b\n:END:"))
  (testing "markdown"
    (are [x y] (= (property-util/remove-id-property :markdown x) y)
      "hello\nid:: f9873a81-07b9-4246-b910-53a6f5ec7e04"
      "hello"

      "hello\nid:: f9873a81-07b9-4246-b910-53a6f5ec7e04\n\nworld"
      "hello\n\nworld"

      "hello\naa:: bb\nid:: f9873a81-07b9-4246-b910-53a6f5ec7e04\n\nworld"
      "hello\naa:: bb\n\nworld")))

(deftest test-remove-empty-properties
  (testing "remove properties if it is empty. Available in orgmode"
    (are [x y] (= (property-util/remove-empty-properties x) y)
      "* TODO properties demo\nabcd"
      "* TODO properties demo\nabcd"

      "* TODO properties demo\n:PROPERTIES:\n:END:\nabcd"
      "* TODO properties demo\nabcd"

      "* TODO properties demo\n:PROPERTIES:\n:END:\n\n\nabcd"
      "* TODO properties demo\nabcd"

      "* TODO properties demo\n:PROPERTIES:\n\n:END:\n\n\nabcd"
      "* TODO properties demo\nabcd")))

(deftest test-get-property-keys
  (testing "org mode"
    (are [x y] (= x y)
        (#'property-util/get-property-keys :org "hello\n:PROPERTIES:\n:x1: y1\n:x2: y2\n:END:\n")
        ["X1" "X2"]

        (#'property-util/get-property-keys :org "hello\n:PROPERTIES:\n:END:\n")
        nil))
  (testing "markdown mode"
    (are [x y] (= x y)
        (#'property-util/get-property-keys :markdown "hello\nx1:: y1\nx2:: y2\n")
        ["X1" "X2"]

        (#'property-util/get-property-keys :markdown "hello\n")
        nil)))

(deftest test-build-properties-str
  (are [x y] (= (#'gp-property/build-properties-str :mardown x) y)
    {:title "a"}
    "title:: a\n"
    {:title "a/b/c"}
    "title:: a/b/c\n"
    {:title "a/b/c" :tags "d,e"}
    "title:: a/b/c\ntags:: d,e\n")
  (are [x y] (= (#'gp-property/build-properties-str :org x) y)
    {:title "a"}
    ":PROPERTIES:\n:title: a\n:END:"
    {:title "a/b/c"}
    ":PROPERTIES:\n:title: a/b/c\n:END:"
    {:title "a/b/c" :tags "d,e"}
    ":PROPERTIES:\n:title: a/b/c\n:tags: d,e\n:END:"))

(deftest test-with-built-in-properties
  (let [content "#+BEGIN_QUERY\n{:title      \"cool NEXT\"\n    :query      [:find (pull ?h [*])\n                 :in $ ?start ?next\n                 :where\n                 [?h :block/marker ?marker]\n                 [(contains? #{\"NOW\" \"LATER\" \"TODO\"} ?marker)]\n                 [?h :block/ref-pages ?p]\n                [?p :block/journal-day ?d]\n                 [(> ?d ?start)]\n                 [(< ?d ?next)]]\n    :inputs     [:today :7d-after]\n    :collapsed? false}\n#+END_QUERY"]
    (let [md-property "query-table:: true"]
      (are [x y] (= (property-util/with-built-in-properties {:query-table true} x :markdown) y)
       content
       (str md-property "\n" content)

       "title"
       (str "title\n" md-property)

       "title\nbody"
       (str "title\n" md-property "\nbody")

       "1. list"
       (str md-property "\n1. list")))

    (let [org-property ":PROPERTIES:\n:query-table: true\n:END:"]
      (are [x y] (= (property-util/with-built-in-properties {:query-table true} x :org) y)
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
    (are [x y expected] (= expected (property-util/get-visible-ordered-properties x y {}))
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
    (are [x y z expected] (= expected (property-util/get-visible-ordered-properties x y z))
      ;; page block
      {:logseq.order-list-type "number" :foo "bar"}  [:logseq.order-list-type :foo] {:pre-block false}
      [[:foo "bar"]]
      ;; normal block
      {:logseq.order-list-type "number" :foo "bar"}  [:logseq.order-list-type :foo] {:pre-block false}
      [[:foo "bar"]]))

  (testing "hidden editable properties"
    (are [x y z expected] (= expected (property-util/get-visible-ordered-properties x y z))
      ;; page block
      {:title "foo"} [:title] {:pre-block? true :page-id 1}
      '()
      {:title "foo" :foo "bar"} [:title :foo] {:pre-block? true :page-id 1}
      [[:foo "bar"]])))
