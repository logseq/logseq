(ns frontend.format.block-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.format.block :as block]))

(def ^:private latex-only-title "$$ x^2 + y^2 = z^2 $$")
(def ^:private mixed-title "Pythagoras: $$ x^2 + y^2 = z^2 $$")

(deftest parse-title-and-body-latex-only-vs-mixed-title-test
  (testing "latex-only content has no heading title; the formula lives in ast-body"
    (let [parsed (block/parse-title-and-body nil :markdown latex-only-title)]
      (is (empty? (:block.temp/ast-title parsed))
          "Displayed_Math is not a heading title")
      (is (= "Displayed_Math"
             (some (fn [form]
                     (when (and (vector? form)
                                (= "Displayed_Math" (first form)))
                       (first form)))
                   (tree-seq coll? seq (:block.temp/ast-body parsed))))
          "The formula is parsed as Displayed_Math in the body")
      (is (= "x^2 + y^2 = z^2"
             (some (fn [form]
                     (when (and (vector? form)
                                (= "Displayed_Math" (first form)))
                       (string/trim (str (second form)))))
                   (tree-seq coll? seq (:block.temp/ast-body parsed)))))))

  (testing "mixed-title latex keeps a usable heading title"
    (let [parsed (block/parse-title-and-body nil :markdown mixed-title)
          title-text (->> (:block.temp/ast-title parsed)
                          (tree-seq coll? seq)
                          (keep (fn [form]
                                  (when (and (vector? form)
                                             (= "Plain" (first form)))
                                    (second form))))
                          (apply str))]
      (is (seq (:block.temp/ast-title parsed)))
      (is (re-find #"Pythagoras" title-text)))))
