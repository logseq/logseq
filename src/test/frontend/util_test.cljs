(ns frontend.util-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.util :as util]))

(deftest test-find-first
  (testing "find-first"
    (is (= 1 (util/find-first identity [1])))))

(deftest test-delete-emoji-current-pos
  (testing "safe current position from end for emoji"
    (is (= 3 (util/safe-dec-current-pos-from-end "abc😀d" 5)))
    (is (= 3 (util/safe-dec-current-pos-from-end "abc😀" 5)))
    (is (= 0 (util/safe-dec-current-pos-from-end "😀" 2)))
    (is (= 4 (util/safe-dec-current-pos-from-end "abcde" 5)))
    (is (= 1 (util/safe-dec-current-pos-from-end "中文" 2))))

  (testing "safe current position from start for emoji"
    (is (= 5 (util/safe-inc-current-pos-from-start "abc😀d" 3)))
    (is (= 2 (util/safe-inc-current-pos-from-start "😀" 0)))
    (is (= 2 (util/safe-inc-current-pos-from-start "abcde" 1)))
    (is (= 1 (util/safe-inc-current-pos-from-start "中文" 0)))))

(deftest test-safe-path-join
  (testing "safe path join with custom schema"
    (is (= (util/node-path.join "a/b" "c/d.md") "a/b/c/d.md"))
    (is (= (util/node-path.join "a/b/c" "../../d.md") "a/d.md"))
    (is (= (util/node-path.join "file:///a/b" "c/d.md") "file:///a/b/c/d.md"))
    (is (= (util/node-path.join "file:///a/b" "../d.md") "file:///a/d.md"))
    (is (= (util/node-path.join "file:///a   a2/b" "c/d.md") "file:///a   a2/b/c/d.md"))
    (is (= (util/node-path.join "C:/a2/b" "c/d.md") "C:/a2/b/c/d.md"))
    (is (= (util/node-path.join "content://a/b" "../d.md") "content://a/d.md"))
    (is (= (util/node-path.join "https://logseq.com/a/b" "c/d.md") "https://logseq.com/a/b/c/d.md"))))

