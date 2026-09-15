(ns frontend.util.text-test
  (:require [cljs.test :refer [are deftest is testing]]
            [frontend.util.text :as text-util]))

(deftest get-string-all-indexes
  (are [x y] (= x y)
    (text-util/get-string-all-indexes "[[hello]] [[world]]" "[[" {})
    [0 10]

    (text-util/get-string-all-indexes "abc abc ab" "ab" {})
    [0 4 8]

    (text-util/get-string-all-indexes "a.c a.c ab" "a." {})
    [0 4]

    (text-util/get-string-all-indexes "abc" "" {:before? true})
    [0]

    (text-util/get-string-all-indexes "abc" "" {:before? false})
    [3]))

(deftest test-wrapped-by
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
    (map #(text-util/wrapped-by? "prop::value" % "::" "") (take 12 (range)))))

(deftest cut-by
  (are [expected value before end] (= expected (text-util/cut-by value before end))
    ["abc " " def " " ghi"] "abc <x> def </x> ghi" "<x>" "</x>"
    ["abc" nil nil] "abc" "<x>" "</x>"
    ["abc " "def" nil] "abc <x>def" "<x>" "</x>"
    ["a " "b" " c [d] e"] "a [b] c [d] e" "[" "]"
    ["" "" "abc"] "abc" "" ""))

(deftest get-graph-name-from-path-strips-only-one-leading-db-prefix
  (are [input expected] (= expected (text-util/get-graph-name-from-path input))
    "logseq_db_demo" "demo"
    "logseq_db_logseq_db_demo" "logseq_db_demo"
    "my_logseq_db_notes" "my_logseq_db_notes"))

(deftest image-url-test
  (testing "image extensions still match"
    (is (true? (text-util/image-url? "https://cdn.example.com/poster.jpg")))
    (is (true? (text-util/image-url? "https://cdn.example.com/poster.webp?w=300"))))
  (testing "Amazon/IMDb/TMDB hosts match even without an extension"
    (is (true? (text-util/image-url? "https://m.media-amazon.com/images/M/MV5BNT17G7zk")))
    (is (true? (text-util/image-url? "https://image.tmdb.org/t/p/w500/abc"))))
  (testing "non-image URLs do not match"
    (is (false? (text-util/image-url? "https://www.imdb.com/title/tt5849986/")))
    (is (false? (text-util/image-url? "not-a-url")))))
