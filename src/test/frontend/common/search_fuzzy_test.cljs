(ns frontend.common.search-fuzzy-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.common.search-fuzzy :as fuzzy]))

(deftest fuzzy-search-multi-finds-by-first-field
  (testing "locale query still returns correct item when first field matches"
    (let [data [{:locale "粗体" :en "Bold"}
                {:locale "斜体" :en "Italic"}]]
      (is (seq (fuzzy/fuzzy-search-multi data "粗体"
                                         {:extract-fns [:locale :en]
                                          :limit 5}))))))

(deftest fuzzy-search-multi-finds-by-second-field
  (testing "returns item when query matches second field but not first"
    (let [data [{:locale "粗体" :en "Bold"}
                {:locale "斜体" :en "Italic"}
                {:locale "代码" :en "Code"}]]
      (is (= [{:locale "粗体" :en "Bold"}]
             (fuzzy/fuzzy-search-multi data "bold"
                                       {:extract-fns [:locale :en]
                                        :limit 5}))))))

(deftest fuzzy-search-multi-score-prefers-best-field
  (testing "item with exact match on any field ranks first"
    (let [data [{:locale "粗体" :en "Bold"}
                {:locale "粗" :en "Thick"}]
          results (fuzzy/fuzzy-search-multi data "粗体"
                                            {:extract-fns [:locale :en]
                                             :limit 5})]
      (is (= "粗体" (:locale (first results)))))))

(deftest fuzzy-search-multi-returns-empty-when-no-match
  (testing "returns empty seq when query matches nothing"
    (let [data [{:locale "粗体" :en "Bold"}]]
      (is (empty? (fuzzy/fuzzy-search-multi data "xyz"
                                            {:extract-fns [:locale :en]
                                             :limit 5}))))))

(deftest fuzzy-search-multi-skips-nil-extract-fields
  (testing "nil fields from extract-fns are silently skipped, non-nil fields still score"
    (let [data [{:en "Delete Page" :locale nil}
                {:en "New Page"    :locale nil}]]
      (is (= [{:en "Delete Page" :locale nil}]
             (fuzzy/fuzzy-search-multi data "delete"
                                       {:extract-fns [:locale :en]
                                        :limit 5}))))))

(deftest hanzi->initials-all-chinese
  (testing "pure Chinese command names produce correct pinyin initials"
    (is (= "sck"  (fuzzy/hanzi->initials "删除块")))
    (is (= "xjym" (fuzzy/hanzi->initials "新建页面")))
    (is (= "jrrz" (fuzzy/hanzi->initials "今日日志")))
    (is (= "sz"   (fuzzy/hanzi->initials "设置")))))

(deftest hanzi->initials-mixed-chinese-english
  (testing "mixed Chinese and English text combines pinyin and word initials"
    (is (= "crbe"  (fuzzy/hanzi->initials "插入 block embed")))
    (is (= "dcwp"  (fuzzy/hanzi->initials "导出为 PDF")))
    (is (= "sck"   (fuzzy/hanzi->initials "删除块")))))

(deftest hanzi->initials-punctuation-not-word-boundary
  (testing "punctuation inside a word is stripped, not treated as a word separator"
    (is (= "b"  (fuzzy/hanzi->initials "block(s)")))
    (is (= "ti" (fuzzy/hanzi->initials "TODO: items")))))

(deftest hanzi->initials-numbers
  (testing "contiguous digits form one word; space-separated digit groups each contribute first digit"
    (is (= "1"   (fuzzy/hanzi->initials "12345")))
    (is (= "124" (fuzzy/hanzi->initials "1 23 45")))))

(deftest hanzi->initials-nil-and-blank
  (testing "nil input returns nil; non-string input returns nil"
    (is (nil? (fuzzy/hanzi->initials nil)))
    (is (nil? (fuzzy/hanzi->initials 42)))))
