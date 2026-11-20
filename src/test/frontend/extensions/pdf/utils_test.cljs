(ns frontend.extensions.pdf.utils-test
  (:require [cljs.test :refer [are deftest is testing]]
            [frontend.extensions.pdf.utils :as pdf-utils]))

(deftest compose-pdf-spacing-diacritics-letter-then-accent
  (testing "letter then spacing accent composes when NFC has a precomposed form"
    (are [in out] (= out (pdf-utils/compose-pdf-spacing-diacritics in))
      "s\u02C7" "š"
      "c\u02C7" "č"
      "r\u02C7" "ř"
      "e\u00B4" "é"
      "z\u00B4" "ź"
      "z\u02D9" "ż"
      "S\u02C7" "Š"
      "i\u00B4" "í"
      "s\u00B4" "ś"
      "o\u00A8" "ö"
      "c\u00B8" "ç"
      "a\u02C6" "â"
      "a\u00AF" "ā")))

(deftest compose-pdf-spacing-diacritics-accent-then-letter
  (testing "spacing accent before letter (TeX overlay order)"
    (are [in out] (= out (pdf-utils/compose-pdf-spacing-diacritics in))
      "\u02C7s" "š"
      "\u02C7c" "č"
      "\u02C7r" "ř"
      "\u00B4e" "é"
      "\u00B4z" "ź"
      "\u02D9z" "ż"
      "\u00B4i" "í"
      "\u02CBe" "è"
      "\u02C6a" "â")))

(deftest compose-pdf-spacing-diacritics-text-layer-whitespace
  (testing "one pdf.js text-layer space between letter and accent is allowed"
    (are [in out] (= out (pdf-utils/compose-pdf-spacing-diacritics in))
      "s \u02C7" "š"
      "\u02C7 s" "š"
      "e \u00B4" "é"
      "z \u02D9" "ż"))
  (testing "two spaces are not treated as an overlay pair"
    (is (= "s  \u02C7" (pdf-utils/compose-pdf-spacing-diacritics "s  \u02C7"))))
  (testing "prefix accent across a word space binds to the following letter"
    (is (= "Pli ška č" (pdf-utils/compose-pdf-spacing-diacritics "Pli \u02C7ska \u010D")))))

(deftest compose-pdf-spacing-diacritics-non-regression
  (testing "standalone accents, non-composing pairs, and ASCII caret stay put"
    (are [in out] (= out (pdf-utils/compose-pdf-spacing-diacritics in))
      "\u02C7" "\u02C7"
      " \u02C7 " " \u02C7 "
      "q\u02C7" "q\u02C7"
      "\u02C7q" "\u02C7q"
      "š" "š"
      "hello" "hello"
      "a^2" "a^2"
      "`echo`" "`echo`"
      "Pli s\u02C7 ka \u010D" "Pli š ka č"
      "s\u02C7c\u02C7r\u02C7" "ščř"))
  (testing "nil and non-strings pass through"
    (is (nil? (pdf-utils/compose-pdf-spacing-diacritics nil)))
    (is (= 1 (pdf-utils/compose-pdf-spacing-diacritics 1)))))

(deftest normalize-pdf-selection-text-keeps-breakline-behavior
  (testing "existing line-join / hyphenation / CJK behavior is preserved"
    (are [in out] (= out (pdf-utils/normalize-pdf-selection-text in))
      "this is a\ntest paragraph" "this is a test paragraph"
      "he is 1\n8 years old" "he is 18 years old"
      "这是一个\n\n段落" "这是一个段落"
      "これ\n\nは、段落" "これは、段落"
      "this is a te-\nst paragraph" "this is a test paragraph"))
  (testing "blank selection still yields nil"
    (is (nil? (pdf-utils/normalize-pdf-selection-text "")))
    (is (nil? (pdf-utils/normalize-pdf-selection-text "   ")))
    (is (nil? (pdf-utils/normalize-pdf-selection-text nil))))
  (testing "breakline join then overlay composition"
    (is (= "š" (pdf-utils/normalize-pdf-selection-text "s\n\u02C7")))
    (is (= "Pli š ka č" (pdf-utils/normalize-pdf-selection-text "Pli s\u02C7 ka \u010D")))))
