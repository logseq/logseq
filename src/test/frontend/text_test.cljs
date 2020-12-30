(ns frontend.text-test
  (:require [frontend.text :as text]
            [cljs.test :refer [deftest is are testing use-fixtures]]))

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

#_(cljs.test/test-ns 'frontend.text-test)
