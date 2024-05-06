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
    ["ZxX"
     "ZxZ"
     "Zxd"
     "Zxf"
     "Zxh"
     "Zxl"
     "Zxn"
     "Zxp"
     "Zxt"
     "Zxx"
     "Zy"
     "Zy0V"
     "Zy1"
     "Zy2"
     "Zy3"
     "Zy4"
     "Zy4V"
     "Zy5"
     "Zy6"
     "Zy6V"]

    ["Zy7" "axV"]
    ["ZyB"
     "ZyE"
     "ZyL"
     "ZyP"
     "ZyS"
     "ZyZ"
     "Zyd"
     "Zyg"
     "Zyn"
     "Zyu"
     "Zz"
     "Zz8"
     "ZzG"
     "ZzV"
     "Zzl"
     "a0"
     "a0G"
     "a0V"
     "a1"
     "a2"]))
