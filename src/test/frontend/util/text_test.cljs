(ns frontend.util.text-test
  (:require [cljs.test :refer [are deftest]]
            [frontend.util.text :as text-util]))

(deftest test-add-timestamp
  []
  (are [x y] (= x y)
    (text-util/add-timestamp "LATER hello world\nhello"
                        "scheduled"
                        "<2021-08-25 Wed>")
    "LATER hello world\nSCHEDULED: <2021-08-25 Wed>\nhello"

    (text-util/add-timestamp "LATER hello world "
                        "scheduled"
                        "<2021-08-25 Wed>")
    "LATER hello world\nSCHEDULED: <2021-08-25 Wed>"

    (text-util/add-timestamp "LATER hello world\nfoo:: bar\ntest"
                        "scheduled"
                        "<2021-08-25 Wed>")
    "LATER hello world\nSCHEDULED: <2021-08-25 Wed>\nfoo:: bar\ntest"))

(deftest get-string-all-indexes
  []
  (are [x y] (= x y)
    (text-util/get-string-all-indexes "[[hello]] [[world]]" "[[" {})
    [0 10]

    (text-util/get-string-all-indexes "abc abc ab" "ab" {})
    [0 4 8]

    (text-util/get-string-all-indexes "a.c a.c ab" "a." {})
    [0 4]
    
    (text-util/get-string-all-indexes "abc" "" { :before? true })
    [0]

    (text-util/get-string-all-indexes "abc" "" { :before? false })
    [3]
    ))

(deftest test-wrapped-by
  []
  (are [x y] (= x y)
    '(false false true false false)
    (map #(text-util/wrapped-by? "[[]]" % "[[" "]]") (take 5 (range)))

    '(false false true true true true false false)
    (map #(text-util/wrapped-by? "[[abc]]" % "[[" "]]") (take 8 (range)))

    '(false false false false false false true true false false false false true true false false)
    (map #(text-util/wrapped-by? "012 [[6]] [[2]]" % "[[" "]]") (take 16 (range)))

    '(true true true true true false false false false false false false)
    (map #(text-util/wrapped-by? "prop::value" % "" "::") (take 12 (range)))

    '(false false false false false false true true true true true true)
    (map #(text-util/wrapped-by? "prop::value" % "::" "") (take 12 (range)))
    ))
