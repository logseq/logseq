(ns frontend.components.block-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block :as block]))

(deftest should-defer-block-children-render
  (testing "defer nested children rendering on current page without conflicting contexts"
    (is (true?
         (#'block/should-defer-block-children-render?
          {:current-page? true
           :defer-ready-index -1
           :level 1}
          3
          nil))))

  (testing "doesn't defer when no children"
    (is (false?
         (#'block/should-defer-block-children-render?
          {:current-page? true
           :defer-ready-index -1
           :level 1}
          0
          nil))))

  (testing "doesn't defer outside current page"
    (is (false?
         (#'block/should-defer-block-children-render?
          {:level 1}
          3
          nil))))

  (testing "doesn't defer deeper levels"
    (is (false?
         (#'block/should-defer-block-children-render?
          {:current-page? true
           :defer-ready-index -1
           :level 2}
          3
          nil))))

  (testing "doesn't defer for contexts that are sensitive to delayed rendering"
    (let [children-count 3
          anchor "ls-block-11111111-1111-1111-1111-111111111111"
          cases [{:ref? true}
                 {:custom-query? true}
                 {:sidebar? true}
                 {:embed? true}
                 {:library? true}
                 {:document/mode? true}]]
      (doseq [cfg cases]
        (is (false?
             (#'block/should-defer-block-children-render?
              (assoc cfg :current-page? true
                         :defer-ready-index -1
                         :level 1)
              children-count
              nil))))
      (is (false?
           (#'block/should-defer-block-children-render?
            {:current-page? true
             :defer-ready-index -1
             :level 1}
            children-count
            anchor))))

    (testing "doesn't defer without root ready-index context"
      (is (false?
           (#'block/should-defer-block-children-render?
            {:current-page? true
             :level 1}
            3
            nil)))))

(deftest should-defer-root-block-render
  (testing "defer when page-level block count is large"
    (is (true?
         (#'block/should-defer-root-block-render?
          {:current-page? true
           :level 0}
          80
          nil))))

  (testing "doesn't defer when page-level block count is small"
    (is (false?
         (#'block/should-defer-root-block-render?
          {:current-page? true
           :level 0}
          10
          nil))))

  (testing "doesn't defer for non-page or non-root contexts"
    (is (false?
         (#'block/should-defer-root-block-render?
          {:level 0}
          80
          nil)))
    (is (false?
         (#'block/should-defer-root-block-render?
          {:current-page? true
           :level 1}
          80
          nil)))))
