(ns frontend.util.page-property-test
  (:require [cljs.test :refer [are deftest testing]]
            [frontend.util.page-property :as property]))

(deftest test-insert-property
  (testing "add org page property"
    (are [x y] (= x y)
      (property/insert-property :org "" :title "title")
      "#+TITLE: title"

      (property/insert-property :org "hello" :title "title")
      "#+TITLE: title\nhello"

      (property/insert-property :org "#+TITLE: title\nhello" :title "new title")
      "#+TITLE: new title\nhello"

      (property/insert-property :org "#+TITLE: title\nhello" :alias "alias1")
      "#+ALIAS: alias1\n#+TITLE: title\nhello"

      (property/insert-property :org "#+TITLE: title\n#+ALIAS: alias1\nhello" :alias "alias2")
      "#+TITLE: title\n#+ALIAS: alias2\nhello"

      (property/insert-property :org "#+TITLE: title\n#+ALIAS: alias1, alias2\nhello" :alias "alias3")
      "#+TITLE: title\n#+ALIAS: alias3\nhello"))

  (testing "add markdown page property"
    (are [x y] (= x y)
      (property/insert-property :markdown "" :title "title")
      "TITLE:: title"

      (property/insert-property :markdown "hello" :title "title")
      "TITLE:: title\nhello"

      (property/insert-property :markdown "TITLE:: title\nhello" :title "new title")
      "TITLE:: new title\nhello"

      (property/insert-property :markdown "TITLE:: title\nhello" :alias "alias1")
      "ALIAS:: alias1\nTITLE:: title\nhello"

      (property/insert-property :markdown "TITLE:: title\nALIAS:: alias1\nhello" :alias "alias2")
      "TITLE:: title\nALIAS:: alias2\nhello"

      (property/insert-property :markdown "TITLE:: title\nALIAS:: alias1, alias2\nhello" :alias "alias3")
      "TITLE:: title\nALIAS:: alias3\nhello"

      (property/insert-property :markdown "TITLE:: title\nALIAS:: alias1, alias2\nhello" :aliases "aliases1")
      "ALIASES:: aliases1\nTITLE:: title\nALIAS:: alias1, alias2\nhello"

      (property/insert-property :markdown "TITLE:: title\nALIAS:: alias1, alias2\nALIASES:: aliases1\nhello" :aliases "aliases2")
      "TITLE:: title\nALIAS:: alias1, alias2\nALIASES:: aliases2\nhello")))

(deftest test-insert-properties
  (testing "add org page properties"
    (are [x y] (= x y)

      (property/insert-properties :org "" {:title "title"})
      "#+TITLE: title"

      (property/insert-properties :org "hello" {:title "title"})
      "#+TITLE: title\nhello"

      (property/insert-properties :org "#+TITLE: title\nhello"
                                  {:title "new title"
                                   :alias "alias1"})
      "#+ALIAS: alias1\n#+TITLE: new title\nhello"

      (property/insert-properties :org "#+TITLE: title\n#+ALIAS: alias1\nhello"
                                  {:title "new title"
                                   :alias "alias2"
                                   :aliases "aliases1"})
      "#+ALIASES: aliases1\n#+TITLE: new title\n#+ALIAS: alias2\nhello"

      (property/insert-properties :org "#+TITLE: title\n#+ALIAS: alias1, alias2\n#+ALIASES: aliases1\nhello"
                                  {:title "new title"
                                   :alias "alias2"
                                   :aliases "aliases1"})
      "#+TITLE: new title\n#+ALIAS: alias2\n#+ALIASES: aliases1\nhello"))

  (testing "add markdown page properties"
    (are [x y] (= x y)
      (property/insert-properties :markdown "" {:title "title"})
      "TITLE:: title"

      (property/insert-properties :markdown "hello" {:title "title"})
      "TITLE:: title\nhello"

      (property/insert-properties :markdown "TITLE:: title\nhello"
                                  {:title "new title"
                                   :alias "alias1"})
      "ALIAS:: alias1\nTITLE:: new title\nhello"

      (property/insert-properties :markdown "TITLE:: title\nalias:: alias1\nhello"
                                  {:title "new title"
                                   :alias "alias2"
                                   :aliases "aliases1"})
      "ALIASES:: aliases1\nTITLE:: new title\nALIAS:: alias2\nhello"

      (property/insert-properties :markdown "TITLE:: title\nALIAS:: alias1, alias2\nALIASES:: aliases1\nhello"
                                  {:title "new title"
                                   :alias "alias2"
                                   :aliases "aliases1"})
      "TITLE:: new title\nALIAS:: alias2\nALIASES:: aliases1\nhello")))

#_(cljs.test/run-tests)
