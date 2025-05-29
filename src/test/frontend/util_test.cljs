(ns frontend.util-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.util :as util]
            [frontend.config :as config]))

(deftest test-find-first
  (testing "find-first"
    (is (= 1 (util/find-first identity [1])))))

(deftest test-delete-emoji-current-pos
  (testing "safe current position from end for emoji"
    (is (= 3 (util/safe-dec-current-pos-from-end "abc😀d" 5)))
    (is (= 3 (util/safe-dec-current-pos-from-end "abc😀" 5)))
    (is (= 0 (util/safe-dec-current-pos-from-end "😀" 2)))
    (is (= 0 (util/safe-dec-current-pos-from-end "a" 1)))
    (is (= 4 (util/safe-dec-current-pos-from-end "abcde" 5)))
    (is (= 1 (util/safe-dec-current-pos-from-end "中文" 2)))
    (is (= 0 (util/safe-dec-current-pos-from-end "中" 1)))
    (is (= 0 (util/safe-dec-current-pos-from-end "a" 1))))

  (testing "safe current position from start for emoji"
    (is (= 5 (util/safe-inc-current-pos-from-start "abc😀d" 3)))
    (is (= 2 (util/safe-inc-current-pos-from-start "abcde" 1)))
    (is (= 1 (util/safe-inc-current-pos-from-start "中文" 0)))
    (is (= 2 (util/safe-inc-current-pos-from-start "😀" 0)))
    (is (= 1 (util/safe-inc-current-pos-from-start "中" 0)))
    (is (= 1 (util/safe-inc-current-pos-from-start "a" 0)))))

(deftest test-get-line-pos
  (testing "get-line-pos"
    (is (= 3 (util/get-line-pos "abcde" 3)))
    (is (= 4 (util/get-line-pos "abcd\ne" 4)))
    (is (= 0 (util/get-line-pos "abcd\ne" 5)))
    (is (= 4 (util/get-line-pos "abc😀d" 5)))
    (is (= 1 (util/get-line-pos "abc\nde" 5)))
    (is (= 1 (util/get-line-pos "abc\n😀d" 6)))
    (is (= 2 (util/get-line-pos "ab\nc😀d" 6)))
    (is (= 1 (util/get-line-pos "abc\nde\nf" 5)))
    (is (= 1 (util/get-line-pos "abc\n😀d\ne" 6)))
    (is (= 2 (util/get-line-pos "ab\nc😀d\ne" 6)))))

(deftest test-get-text-range
  (testing "get-text-range"
    (is (= "" (util/get-text-range "abcdefg" 0 true)))
    (is (= "" (util/get-text-range "abcdefg" 0 false)))
    (is (= "abcdefg" (util/get-text-range "abcdefg" 10 true)))
    (is (= "abcdefg" (util/get-text-range "abcdefg" 10 false)))
    (is (= "abc" (util/get-text-range "abcdefg" 3 true)))
    (is (= "abc" (util/get-text-range "abcdefg" 3 false)))
    (is (= "abc" (util/get-text-range "abcdefg\nhijklmn" 3 true)))
    (is (= "abcdefg\nhij" (util/get-text-range "abcdefg\nhijklmn" 3 false)))
    (is (= "abcdefg\nhijklmn" (util/get-text-range "abcdefg\nhijklmn" 10 false)))
    (is (= "abcdefg\nhijklmn\nopq" (util/get-text-range "abcdefg\nhijklmn\nopqrst" 3 false)))
    (is (= "a😀b" (util/get-text-range "a😀bcdefg" 3 true)))
    (is (= "a😀b" (util/get-text-range "a😀bcdefg" 3 false)))
    (is (= "a😀b" (util/get-text-range "a😀bcdefg\nhijklmn" 3 true)))
    (is (= "a😀bcdefg\nhij" (util/get-text-range "a😀bcdefg\nhijklmn" 3 false)))
    (is (= "a😀bcdefg\nh😀i" (util/get-text-range "a😀bcdefg\nh😀ijklmn" 3 false)))))

(deftest test-memoize-last
  (testing "memoize-last add test"
    (let [actual-ops (atom 0)
          m+ (util/memoize-last (fn [x1 x2]
                                  (swap! actual-ops inc)    ;; side effect for counting
                                  (+ x1 x2)))]
      (is (= (m+ 1 1) 2))
      (is (= @actual-ops 1))
      (is (= (m+ 1 1) 2))
      (is (= (m+ 1 1) 2))
      (is (= @actual-ops 1))
      (is (= (m+ 1 2) 3))
      (is (= @actual-ops 2))
      (is (= (m+ 2 3) 5))
      (is (= @actual-ops 3))
      (is (= (m+ 3 5) 8))
      (is (= @actual-ops 4))
      (is (= (m+ 3 5) 8))
      (is (= @actual-ops 4)))))

(deftest test-media-format-from-input
  (testing "predicate file type from ext (html5 supported)"
    (is (= (config/ext-of-audio? "file.mp3") true))
    (is (= (config/ext-of-audio? "fIle.mP3") true))
    (is (= (config/ext-of-audio? "https://x.com/file.mp3") true))
    (is (= (config/ext-of-audio? "file.wma") false))
    (is (= (config/ext-of-audio? "file.wma" false) true))
    (is (= (config/ext-of-video? "file.mp4") true))
    (is (= (config/ext-of-video? "file.mp3") false))
    (is (= (config/ext-of-image? "file.svg") true))
    (is (= (config/ext-of-image? "a.file.png") true))
    (is (= (config/ext-of-image? "file.tiff") false))))
