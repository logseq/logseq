(ns frontend.text-test
  (:require [frontend.text :as text]
            [cljs.test :refer [deftest is are testing use-fixtures]]))

(deftest re-construct-block-properties
  []
  (testing "block content without a title"
    (are [x y] (= x y)
      (text/re-construct-block-properties :org "** :PROPERTIES:\n:x: y\n:END:\n" {"x" "y"})
      "** :PROPERTIES:\n:x: y\n:END:\n"

      (text/re-construct-block-properties :markdown "## :PROPERTIES:\n:x: y\n:END:\n" {"x" "y"})
      "## :PROPERTIES:\n:x: y\n:END:\n"))

  (testing "block content with a title"
    (are [x y] (= x y)
      (text/re-construct-block-properties :org "** hello\n:PROPERTIES:\n:x: y\n:END:\n" {"x" "y"})
      "** hello\n:PROPERTIES:\n:x: y\n:END:\n"

      (text/re-construct-block-properties :markdown "## hello\n:PROPERTIES:\n:x: y\n:END:\n" {"x" "y"})
      "## hello\n:PROPERTIES:\n:x: y\n:END:\n"))

  (testing "block content with custom properties"
    (are [x y] (= x y)
      (text/re-construct-block-properties :org "** hello\n:PROPERTIES:\n:x: y\n:END:\n" {"x" "z"})
      "** hello\n:PROPERTIES:\n:x: z\n:END:\n"

      (text/re-construct-block-properties :markdown "## hello\n:PROPERTIES:\n:x: y\n:END:\n" {"x" "y" "a" "b"})
      "## hello\n:PROPERTIES:\n:x: y\n:a: b\n:END:\n")))

#_(cljs.test/test-ns 'frontend.text-test)
