(ns logseq.common.util.macro-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.common.util.macro :as macro-util]))

(def poem
  "Rose is $1, violet's $2. Life's ordered: Org assists you.")

(deftest expand-value-if-macro-substitutes-property-arguments
  (testing "property-value macro expansion still substitutes $1 $2"
    (is (= "Rose is red, violet's blue. Life's ordered: Org assists you."
           (macro-util/expand-value-if-macro
            "{{poem red blue}}"
            {"poem" poem}))))

  (testing "a macro with no args is unchanged"
    (is (= "{{poem}}"
           (macro-util/expand-value-if-macro "{{poem}}" {"poem" poem})))
    (is (= poem (macro-util/macro-subs poem [])))))
