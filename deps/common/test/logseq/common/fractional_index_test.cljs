(ns logseq.common.fractional-index-test
    (:require [clojure.test :refer [deftest are]]
              [logseq.common.fractional-index :as index]))

(deftest increment-integer-test
  (are [x y]
       (= (index/increment-integer x index/base-62-digits) y)
    "a0" "a1"
    "r3333333333333333zz" "r333333333333333400"))

(deftest generate-key-between-test
  (are [x y]
       (= (index/generate-key-between x nil) y)
    "a0" "a1"
    "rzzzzzzzzzzzzzzzzzz" "s0000000000000000000"))

(deftest generate-n-keys-between-test
  (are [x y]
       (= (index/generate-n-keys-between (first x) (second x) 20) y)
    ["ZxV" "Zy7"]
    ["ZxX" "ZxZ" "Zxd" "Zxf" "Zxh" "Zxl" "Zxn" "Zxp" "Zxt" "Zxv" "Zy" "Zy0V" "Zy1" "Zy2" "Zy2V" "Zy3" "Zy4" "Zy4V" "Zy5" "Zy6"]

    ["Zy7" "axV"]
    ["ZyB" "ZyE" "ZyL" "ZyP" "ZyS" "ZyZ" "Zyd" "Zyg" "Zyn" "Zyr" "Zz" "Zz8" "ZzG" "ZzV" "Zzd" "Zzl" "a0" "a0G" "a0V" "a1"]

    [nil "c0a3"]
    ["aG"
     "aH"
     "aI"
     "aJ"
     "aK"
     "aL"
     "aM"
     "aN"
     "aO"
     "aP"
     "aQ"
     "aR"
     "aS"
     "aT"
     "aU"
     "aV"
     "aW"
     "b0X"
     "bY1"
     "b2Z"]

    ["c0a3" nil]
    ["c0a4"
     "c0a5"
     "c0a6"
     "c0a7"
     "c0a8"
     "c0a9"
     "c0aA"
     "c0aB"
     "c0aC"
     "c0aD"
     "c0aE"
     "c0aF"
     "c0aG"
     "c0aH"
     "c0aI"
     "c0aJ"
     "c0aK"
     "c0aL"
     "c0aM"
     "c0aN"]

    [nil nil]
    ["a0"
     "a1"
     "a2"
     "a3"
     "a4"
     "a5"
     "a6"
     "a7"
     "a8"
     "a9"
     "aA"
     "aB"
     "aC"
     "aD"
     "aE"
     "aF"
     "aG"
     "aH"
     "aI"
     "aJ"]))
