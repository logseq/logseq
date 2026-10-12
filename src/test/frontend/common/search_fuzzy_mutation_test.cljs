(ns frontend.common.search-fuzzy-mutation-test
  "Cases of frontend.common.search-fuzzy that no other test checks: a change
   to any of these lines left every test passing."
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.common.search-fuzzy :as fuzzy]))

;; Fails if, in `score`, `empty?` becomes `seq` or `inc` becomes `dec`.
(deftest score-of-an-exact-match
  ;; 3 consecutive matches score 1 + 2 + 3, same length 1, prefix bonus
  ;; MAX-STRING-LENGTH + 10, whole string consumed 1
  (is (= 1018 (fuzzy/score "abc" "abc")))
  (testing "a longer string with the same prefix: no bonus for consuming it all"
    (is (= 1016.75 (fuzzy/score "abc" "abcd")))))

;; Fails if, in `score`, `empty?` becomes `seq`.
(deftest fuzzy-search-ranks-exact-match-above-longer-prefix-match
  (is (= ["abc" "abcd"] (fuzzy/fuzzy-search ["abcd" "abc"] "abc"))))

;; Fails if, in `zh-simplified-char?`, `>=` becomes `>` or `<=` becomes `<`.
(deftest hanzi->initials-at-the-cjk-block-edges
  (testing "the first and last code points of both ranges count as Chinese"
    (doseq [code [0x4E00 0x9FFF 0x3400 0x4DBF]]
      (let [c (js/String.fromCharCode code)]
        (is (= 1 (count (fuzzy/hanzi->initials c))) (str "U+" (.toString code 16))))))
  (testing "U+4E00 is yi"
    (is (= "y" (fuzzy/hanzi->initials (js/String.fromCharCode 0x4E00))))))
