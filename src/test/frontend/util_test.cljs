(ns frontend.util-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.util :as util]
            [frontend.modules.shortcut.data-helper :as shortcut-data-helper]))

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

(deftest test-memoize-last
  (testing "memoize-last add test"
    (let [actual-ops (atom 0)
          m+         (util/memoize-last (fn [x1 x2]
                                           (swap! actual-ops inc) ;; side effect for counting
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
      (is (= @actual-ops 4))))

  (testing "memoize-last nested mapping test"
    (let [actual-ops (atom 0)
          flatten-f  (util/memoize-last (fn [& args]
                                           (swap! actual-ops inc) ;; side effect for counting
                                           (apply #'shortcut-data-helper/flatten-key-bindings args)))
          target     (atom {:part1 {:date-picker/complete         {:binding "enter"
                                                                   :fn      "ui-handler/shortcut-complete"}
                                    :date-picker/prev-day         {:binding "left"
                                                                   :fn      "ui-handler/shortcut-prev-day"}}
                            :part2 {:date-picker/next-day         {:binding "right"
                                                                   :fn      "ui-handler/shortcut-next-day"}
                                    :date-picker/prev-week        {:binding ["up" "ctrl+p"]
                                                                   :fn      "ui-handler/shortcut-prev-week"}}})]
      (is (= (flatten-f (vals @target)) {:date-picker/complete         "enter"
                                         :date-picker/prev-day         "left"
                                         :date-picker/next-day         "right"
                                         :date-picker/prev-week        ["up" "ctrl+p"]}))
      (is (= @actual-ops 1))
      (is (= (flatten-f (vals @target)) {:date-picker/complete         "enter"
                                         :date-picker/prev-day         "left"
                                         :date-picker/next-day         "right"
                                         :date-picker/prev-week        ["up" "ctrl+p"]}))
      (is (= @actual-ops 1))
      ;; edit value
      (swap! target assoc-in [:part1 :date-picker/complete :binding] "tab")
      (is (= (flatten-f (vals @target)) {:date-picker/complete         "tab"
                                         :date-picker/prev-day         "left"
                                         :date-picker/next-day         "right"
                                         :date-picker/prev-week        ["up" "ctrl+p"]}))
      (is (= @actual-ops 2))
      (is (= (flatten-f (vals @target)) {:date-picker/complete         "tab"
                                         :date-picker/prev-day         "left"
                                         :date-picker/next-day         "right"
                                         :date-picker/prev-week        ["up" "ctrl+p"]}))
      (is (= @actual-ops 2))
      (is (= (flatten-f (vals @target)) {:date-picker/complete         "tab"
                                         :date-picker/prev-day         "left"
                                         :date-picker/next-day         "right"
                                         :date-picker/prev-week        ["up" "ctrl+p"]}))
      (is (= @actual-ops 2))
      ;; edit key
      (swap! target assoc :part3 {:date-picker/next-week {:binding "down"
                                                          :fn      "ui-handler/shortcut-next-week"}})
      (is (= (flatten-f (vals @target)) {:date-picker/complete         "tab"
                                         :date-picker/prev-day         "left"
                                         :date-picker/next-day         "right"
                                         :date-picker/prev-week        ["up" "ctrl+p"]
                                         :date-picker/next-week        "down"}))
      (is (= @actual-ops 3))
      (is (= (flatten-f (vals @target)) {:date-picker/complete         "tab"
                                         :date-picker/prev-day         "left"
                                         :date-picker/next-day         "right"
                                         :date-picker/prev-week        ["up" "ctrl+p"]
                                         :date-picker/next-week        "down"}))
      (is (= @actual-ops 3)))))
