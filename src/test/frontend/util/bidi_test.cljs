(ns frontend.util.bidi-test
  (:require [cljs.test :refer [are deftest is]]
            [frontend.util.bidi :as bidi-util]))

(deftest infer-text-dir-basic
  (are [text expected] (= expected (bidi-util/infer-text-dir text))
    "الحمد لله" "rtl"
    "hello world" "ltr"
    "كلام more english" "rtl"
    "more english عربي كلام" "ltr"
    "" "auto"
    "   " "auto"
    "... ---" "auto"))

(deftest infer-text-dir-strips-prefixes
  (are [text expected] (= expected (bidi-util/infer-text-dir text))
    "[ ] مهمة" "rtl"
    "[x] مهمة" "rtl"
    "1. مهمة" "rtl"
    "TODO: مهمة" "rtl"
    "status:: مهمة" "rtl"
    "[ ] task" "ltr"
    "1. task" "ltr"
    "NOW: task" "ltr"
    "status:: task" "ltr"))

(deftest infer-text-dir-unwraps-wrappers
  (are [text expected] (= expected (bidi-util/infer-text-dir text))
    "[[اختبار]]" "rtl"
    "[اختبار](https://example.com)" "rtl"
    "[[test]]" "ltr"
    "[test](https://example.com)" "ltr"))

(deftest infer-text-dir-handles-namespace-page-refs
  (are [text expected] (= expected (bidi-util/infer-text-dir text))
    "[[x/ع]]" "ltr"
    "[[ع/x]]" "rtl"
    "alias:: [[x/ع]]" "ltr"
    "alias:: [[ع/x]]" "rtl"))

(deftest infer-text-dir-handles-complex-markdown-links
  (are [text expected] (= expected (bidi-util/infer-text-dir text))
    "[اختبار [فرعي]](https://example.com/a(b)c)" "rtl"
    "[test [nested]](https://example.com/a(b)c)" "ltr"))

(deftest infer-text-dir-prefers-content-over-leading-neutrals
  (is (= "rtl" (bidi-util/infer-text-dir " - *   اختبار")))
  (is (= "ltr" (bidi-util/infer-text-dir " - *   test"))))

(deftest row-dir-source-text-prefers-edit-content-while-editing
  (is (= "نص التحرير"
         (bidi-util/row-dir-source-text
          {:editing? true
           :edit-content "نص التحرير"
           :title "title"
           :original-name "original"
           :name "name"
           :raw-title "raw"}))))

(deftest row-dir-source-text-falls-back-when-edit-content-is-blank
  (is (= "عنوان"
         (bidi-util/row-dir-source-text
          {:editing? true
           :edit-content "   "
           :title "عنوان"
           :original-name "original"
           :name "name"
           :raw-title "raw"}))))

(deftest row-dir-source-text-ignores-edit-content-when-not-editing
  (is (= "title"
         (bidi-util/row-dir-source-text
          {:editing? false
           :edit-content "edited"
           :title "title"
           :original-name "original"
           :name "name"
           :raw-title "raw"}))))

(deftest row-dir-source-text-priority-order
  (is (= "original"
         (bidi-util/row-dir-source-text
          {:editing? false
           :edit-content nil
           :title "  "
           :original-name "original"
           :name "name"
           :raw-title "raw"})))
  (is (= "name"
         (bidi-util/row-dir-source-text
          {:editing? false
           :edit-content nil
           :title nil
           :original-name ""
           :name "name"
           :raw-title "raw"})))
  (is (= "raw"
         (bidi-util/row-dir-source-text
          {:editing? false
           :edit-content nil
           :title nil
           :original-name nil
           :name "  "
           :raw-title "raw"})))
  (is (= ""
         (bidi-util/row-dir-source-text
          {:editing? false
           :edit-content nil
           :title nil
           :original-name nil
           :name nil
           :raw-title nil}))))

(deftest row-dir-source-text-regression-chain
  (let [source (bidi-util/row-dir-source-text
                {:editing? false
                 :edit-content nil
                 :title "الحمد لله"
                 :original-name nil
                 :name nil
                 :raw-title nil})]
    (is (= "الحمد لله" source))
    (is (= "rtl" (bidi-util/infer-text-dir source)))))
