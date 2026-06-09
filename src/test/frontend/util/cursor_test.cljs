(ns frontend.util.cursor-test
  (:require [cljs.test :refer [are deftest is testing]]
            [frontend.util.cursor :as cursor]))

(deftest adjacent-line-end-pos-test
  (testing ":up returns the end of the previous hard line"
    ;; "aaa\nbbbbbb\ncc" -> \n at 3 and 10, count 13
    (are [pos expected] (= expected (cursor/adjacent-line-end-pos "aaa\nbbbbbb\ncc" pos :up))
      10 3    ;; end of middle line -> end of first line
      13 10   ;; end of content (last line) -> end of middle line
      3 nil)) ;; end of first line -> no previous line
  (testing ":down returns the end of the next hard line"
    (are [pos expected] (= expected (cursor/adjacent-line-end-pos "aaa\nbbbbbb\ncc" pos :down))
      3 10    ;; end of first line -> end of middle line
      10 13   ;; end of middle line -> end of last line (count)
      13 13)) ;; end of content -> stays (no next line)
  (testing "lands at line end regardless of relative line length"
    ;; short line "x" between two longer lines: \n at 17 and 19, count 36
    (is (= 36 (cursor/adjacent-line-end-pos "longer first line\nx\nlonger last line" 19 :down)))
    (is (= 17 (cursor/adjacent-line-end-pos "longer first line\nx\nlonger last line" 19 :up))))
  (testing "single-line content has no adjacent line"
    (is (nil? (cursor/adjacent-line-end-pos "abc" 3 :up)))
    (is (= 3 (cursor/adjacent-line-end-pos "abc" 3 :down)))))
