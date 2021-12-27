(ns frontend.util.page-property-test
  (:require [cljs.test :refer [are deftest testing]]
            [frontend.util.page-property :as property]))

(deftest test-insert-property
  (testing "add org page property"
    (are [x y] (= x y)
      (property/insert-property :org "" :title "title")
      "#+title: title"

      (property/insert-property :org "hello" :title "title")
      "#+title: title\nhello"

      (property/insert-property :org "#+title: title\nhello" :title "new title")
      "#+title: new title\nhello"

      (property/insert-property :org "#+title: title\nhello" :alias "alias1")
      "#+alias: alias1\n#+title: title\nhello"

      (property/insert-property :org "#+title: title\n#+alias: alias1\nhello" :alias "alias2")
      "#+title: title\n#+alias: alias2\nhello"

      (property/insert-property :org "#+title: title\n#+alias: alias1, alias2\nhello" :alias "alias3")
      "#+title: title\n#+alias: alias3\nhello"))

  (testing "add markdown page property"
    (are [x y] (= x y)
      (property/insert-property :markdown "" :title "title")
      "title:: title"

      (property/insert-property :markdown "hello" :title "title")
      "title:: title\nhello"

      (property/insert-property :markdown "title:: title\nhello" :title "new title")
      "title:: new title\nhello"

      (property/insert-property :markdown "title:: title\nhello" :alias "alias1")
      "alias:: alias1\ntitle:: title\nhello"

      (property/insert-property :markdown "title:: title\nalias:: alias1\nhello" :alias "alias2")
      "title:: title\nalias:: alias2\nhello"

      (property/insert-property :markdown "title:: title\nalias:: alias1, alias2\nhello" :alias "alias3")
      "title:: title\nalias:: alias3\nhello"

      (property/insert-property :markdown "title:: title\nalias:: alias1, alias2\nhello" :aliases "aliases1")
      "aliases:: aliases1\ntitle:: title\nalias:: alias1, alias2\nhello"

      (property/insert-property :markdown "title:: title\nalias:: alias1, alias2\naliases:: aliases1\nhello" :aliases "aliases2")
      "title:: title\nalias:: alias1, alias2\naliases:: aliases2\nhello")))

(deftest test-insert-properties
  (testing "add org page properties"
    (are [x y] (= x y)

      (property/insert-properties :org "" {:title "title"})
      "#+title: title"

      (property/insert-properties :org "hello" {:title "title"})
      "#+title: title\nhello"

      (property/insert-properties :org "#+title: title\nhello"
                                  {:title "new title"
                                   :alias "alias1"})
      "#+alias: alias1\n#+title: new title\nhello"

      (property/insert-properties :org "#+title: title\n#+alias: alias1\nhello"
                                  {:title "new title"
                                   :alias "alias2"
                                   :aliases "aliases1"})
      "#+aliases: aliases1\n#+title: new title\n#+alias: alias2\nhello"

      (property/insert-properties :org "#+title: title\n#+alias: alias1, alias2\n#+aliases: aliases1\nhello"
                                  {:title "new title"
                                   :alias "alias2"
                                   :aliases "aliases1"})
      "#+title: new title\n#+alias: alias2\n#+aliases: aliases1\nhello"))

  (testing "add markdown page properties"
    (are [x y] (= x y)
      (property/insert-properties :markdown "" {:title "title"})
      "title:: title"

      (property/insert-properties :markdown "hello" {:title "title"})
      "title:: title\nhello"

      (property/insert-properties :markdown "title:: title\nhello"
                                  {:title "new title"
                                   :alias "alias1"})
      "alias:: alias1\ntitle:: new title\nhello"

      (property/insert-properties :markdown "title:: title\nalias:: alias1\nhello"
                                  {:title "new title"
                                   :alias "alias2"
                                   :aliases "aliases1"})
      "aliases:: aliases1\ntitle:: new title\nalias:: alias2\nhello"

      (property/insert-properties :markdown "title:: title\nalias:: alias1, alias2\naliases:: aliases1\nhello"
                                  {:title "new title"
                                   :alias "alias2"
                                   :aliases "aliases1"})
      "title:: new title\nalias:: alias2\naliases:: aliases1\nhello")))

#_(cljs.test/run-tests)
