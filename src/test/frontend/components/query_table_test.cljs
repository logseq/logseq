(ns frontend.components.query-table-test
  (:require [clojure.test :refer [deftest testing are]]
            [frontend.state :as state]
            [frontend.components.query-table :as query-table]
            [frontend.util :as util]))

(deftest sort-result
  ;; Define since it's not defined
  (state/set-preferred-language! "en")

  (testing "sort by block content"
    (are [sort-state result sorted-result]
         (= (mapv #(hash-map :block/content %) sorted-result)
            (#'query-table/sort-result (mapv #(hash-map :block/content %) result) sort-state))
         {:sort-desc? true :sort-by-column :block}
         ["abc" "cde"] ["cde" "abc"]

         {:sort-desc? false :sort-by-column :block}
         ["abc" "cde"] ["abc" "cde"]))

  (testing "sort by integer block property"
    (are [sort-state result sorted-result]
         (= (mapv #(hash-map :block/properties %) sorted-result)
            (#'query-table/sort-result (mapv #(hash-map :block/properties %) result) sort-state))
         {:sort-desc? true :sort-by-column :integer}
         [{:integer 8} {:integer 7} {:integer 77} {:integer 0} {:integer -8}]
         [{:integer 77} {:integer 8} {:integer 7} {:integer 0} {:integer -8}]

         {:sort-desc? false :sort-by-column :integer}
         [{:integer 8} {:integer 7} {:integer 77} {:integer 0} {:integer -8}]
         [{:integer -8} {:integer 0} {:integer 7} {:integer 8} {:integer 77}]))

  (testing "sort by boolean block property"
    (are [sort-state result sorted-result]
         (= (mapv #(hash-map :block/properties %) sorted-result)
            (#'query-table/sort-result (mapv #(hash-map :block/properties %) result) sort-state))
         {:sort-desc? true :sort-by-column :funny?}
         [{:funny? true} {:funny? false}] [{:funny? true} {:funny? false}]

         {:sort-desc? false :sort-by-column :funny?}
         [{:funny? true} {:funny? false}] [{:funny? false} {:funny? true}]))

  (testing "sort by string block property"
    (are [sort-state result sorted-result]
         (= (mapv #(hash-map :block/properties %) sorted-result)
            (#'query-table/sort-result (mapv #(hash-map :block/properties %) result) sort-state))
         {:sort-desc? true :sort-by-column :title}
         [{:title "abc"} {:title "cde"}] [{:title "cde"} {:title "abc"}]

         {:sort-desc? false :sort-by-column :title}
         [{:title "abc"} {:title "cde"}] [{:title "abc"} {:title "cde"}]))

  (testing "sort by mixed type block property"
    (are [sort-state result sorted-result]
         (= (mapv #(hash-map :block/properties %) sorted-result)
            (#'query-table/sort-result (mapv #(hash-map :block/properties %) result) sort-state))
         {:sort-desc? true :sort-by-column :title}
         [{:title 1} {:title "A"} {:title 2} {:title "B"} {:title 11} {:title "C"}]
         [{:title "C"} {:title "B"} {:title "A"} {:title 11} {:title 2} {:title 1}]

         {:sort-desc? false :sort-by-column :title}
         [{:title 1} {:title "A"} {:title 2} {:title "B"} {:title 11} {:title "C"}]
         [{:title 1} {:title 2} {:title 11} {:title "A"} {:title "B"} {:title "C"}]))

  (testing "sort by decimal number block property"
    (are [sort-state result sorted-result]
         (= (mapv #(hash-map :block/properties %) sorted-result)
            (#'query-table/sort-result (mapv #(hash-map :block/properties %) result) sort-state))
         {:sort-desc? true :sort-by-column :title}
         [{:title 1.1} {:title 1.2} {:title 1.11}]
         [{:title 1.2} {:title 1.11} {:title 1.1}]

         {:sort-desc? false :sort-by-column :title}
         [{:title 1.1} {:title 1.2} {:title 1.11}]
         [{:title 1.1} {:title 1.11} {:title 1.2}]))

   (testing "sort by semver-style string block property"
     (are [sort-state result sorted-result]
          (= (mapv #(hash-map :block/properties %) sorted-result)
             (#'query-table/sort-result (mapv #(hash-map :block/properties %) result) sort-state))
          {:sort-desc? true :sort-by-column :title}
          [{:title "1.1.0"} {:title "1.2.0"} {:title "1.11.0"} {:title "1.1.1"} {:title "1.11.1"} {:title "1.2.1"}]
          [{:title "1.11.1"} {:title "1.11.0"} {:title "1.2.1"} {:title "1.2.0"} {:title "1.1.1"} {:title "1.1.0"}]

          {:sort-desc? false :sort-by-column :title}
          [{:title "1.1.0"} {:title "1.2.0"} {:title "1.11.0"} {:title "1.1.1"} {:title "1.11.1"} {:title "1.2.1"}]
          [{:title "1.1.0"} {:title "1.1.1"} {:title "1.2.0"} {:title "1.2.1"} {:title "1.11.0"} {:title "1.11.1"}]))

  (testing "sort by string block property for specific locale"
    (state/set-preferred-language! "zh-CN")
    (are [sort-state result sorted-result]
         (= (mapv #(hash-map :block/properties %) sorted-result)
            (#'query-table/sort-result (mapv #(hash-map :block/properties %) result) sort-state))
         {:sort-desc? true :sort-by-column :title}
         [{:title "意志"} {:title "圆圈"}] [{:title "圆圈"} {:title "意志"}]

         {:sort-desc? false :sort-by-column :title}
         [{:title "圆圈"} {:title "意志"}] [{:title "意志"} {:title "圆圈"}])
    (state/set-preferred-language! "en")))

(deftest sort-result-performance
  (testing "monitor time of sort by integer block property"
    (are [sort-state result _sorted-result timeout]
         (>= timeout (:time (util/with-time (#'query-table/sort-result (mapv #(hash-map :block/properties %) result) sort-state))))
      {:sort-desc? true :sort-by-column :rating}
      [{:rating 8} {:rating 7}] [{:rating 8} {:rating 7}]
         2.0 ;; actual: ~0.05
 
      {:sort-desc? false :sort-by-column :rating}
      [{:rating 8} {:rating 7}] [{:rating 7} {:rating 8}]
      2.0 ;; actual: ~0.05
      )))
