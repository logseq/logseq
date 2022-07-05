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
    (text-util/get-string-all-indexes "[[hello]] [[world]]" "[[" true)
    [0 10]

    (text-util/get-string-all-indexes "abc abc ab" "ab" true)
    [0 4 8]

    (text-util/get-string-all-indexes "a.c a.c ab" "a." true)
    [0 4]))
