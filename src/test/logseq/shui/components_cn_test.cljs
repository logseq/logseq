(ns logseq.shui.components-cn-test
  "cn merges class names (later size/padding utilities win) and caches the
  merge by its input string; a repeated or differently split call gives the
  same answer as the first."
  (:require [cljs.test :refer [deftest is]]
            [logseq.shui.components :as components]))

(deftest later-utilities-of-one-group-win
  (is (= "flex p-4" (components/cn "flex p-2" "p-4")))
  (is (= "h-8 px-2 hover:px-3" (components/cn "h-8 px-1" "px-2" "hover:px-3")))
  (is (= "!p-2" (components/cn "!p-2" "p-4")) "an important utility is not overridden"))

(deftest skips-nils-falses-blanks-and-flattens-nested-sequences
  (is (= "a b c d" (components/cn "a" nil false "" ["b" ["c"]] :d)))
  (is (= "" (components/cn)))
  (is (= "" (components/cn nil "  "))))

(deftest a-repeated-merge-equals-the-first
  (let [first-answer (components/cn "inline-flex h-9 px-4 py-2" "h-7 px-2")]
    (is (= "inline-flex py-2 h-7 px-2" first-answer))
    (is (= first-answer (components/cn "inline-flex h-9 px-4 py-2" "h-7 px-2")))
    (is (= first-answer (components/cn ["inline-flex h-9 px-4 py-2" "h-7 px-2"])) "the same classes split differently")))

(deftest many-distinct-class-strings-still-merge-correctly
  (dotimes [i 5000]
    (components/cn (str "c" i)))
  (is (= "c1 p-3" (components/cn "c1 p-1" "p-3"))))
