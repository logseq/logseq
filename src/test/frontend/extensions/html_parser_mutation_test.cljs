(ns frontend.extensions.html-parser-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.extensions.html-parser :as html-parser]
            [hickory.core :as hickory]))

;; hickory/parse needs the browser's DOMParser (absent under Node), so the
;; parse step is stubbed with the hiccup it returns for this HTML; the
;; conversion to markdown is the real code.
;; Fails if, in `convert`, `when-not` becomes `when`.
(deftest convert-turns-non-blank-html-into-markdown-test
  (with-redefs [hickory/parse identity
                hickory/as-hiccup (fn [html]
                                    (when (= html "<b>bold</b>")
                                      [[:html {} [:head {}] [:body {} [:b {} "bold"]]]]))]
    (is (= "**bold**" (html-parser/convert "<b>bold</b>")))
    (is (nil? (html-parser/convert "  ")))))
