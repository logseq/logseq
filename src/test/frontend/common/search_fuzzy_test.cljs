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

(deftest fuzzy-search-multi-respects-limit
  (testing "never returns more items than :limit"
    (let [data (mapv (fn [i] {:locale (str "命令" i) :en (str "Command" i)}) (range 20))]
      (is (<= (count (fuzzy/fuzzy-search-multi data "command"
                                               {:extract-fns [:locale :en]
                                                :limit 3}))
              3)))))
