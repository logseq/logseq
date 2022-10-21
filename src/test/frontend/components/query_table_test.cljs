(ns frontend.components.query-table-test
  (:require [clojure.test :refer [deftest testing are]]
            [frontend.state :as state]
            [frontend.components.query-table :as query-table]))

(deftest sort-result
  ;; Define since it's not defined
  (state/set-preferred-language! "en")

  (testing "sort by block content"
    (are [sort-state result sorted-result]
         (= (mapv #(hash-map :block/content %) sorted-result)
            (#'query-table/sort-result (mapv #(hash-map :block/content %) result) sort-state))
         {:sort-desc? true :sort-by-column :block}
         ["abc" "cde"]
         ["cde" "abc"]

         {:sort-desc? false :sort-by-column :block}
         ["abc" "cde"]
         ["abc" "cde"]))

  (testing "sort by integer block property"
    (are [sort-state result sorted-result]
         (= (mapv #(hash-map :block/properties %) sorted-result)
            (#'query-table/sort-result (mapv #(hash-map :block/properties %) result) sort-state))
         {:sort-desc? true :sort-by-column :rating}
         [{:rating 8} {:rating 7}]
         [{:rating 8} {:rating 7}]

         {:sort-desc? false :sort-by-column :rating}
         [{:rating 8} {:rating 7}]
         [{:rating 7} {:rating 8}]))

  (testing "sort by boolean block property"
    (are [sort-state result sorted-result]
         (= (mapv #(hash-map :block/properties %) sorted-result)
            (#'query-table/sort-result (mapv #(hash-map :block/properties %) result) sort-state))
         {:sort-desc? true :sort-by-column :funny?}
         [{:funny? true} {:funny? false}]
         [{:funny? true} {:funny? false}]

         {:sort-desc? false :sort-by-column :funny?}
         [{:funny? true} {:funny? false}]
         [{:funny? false} {:funny? true}]))

  (testing "sort by string block property"
    (are [sort-state result sorted-result]
         (= (mapv #(hash-map :block/properties %) sorted-result)
            (#'query-table/sort-result (mapv #(hash-map :block/properties %) result) sort-state))
         {:sort-desc? true :sort-by-column :title}
         [{:title "abc"} {:title "cde"}]
         [{:title "cde"} {:title "abc"}]

         {:sort-desc? false :sort-by-column :title}
         [{:title "abc"} {:title "cde"}]
         [{:title "abc"} {:title "cde"}]))

  (testing "sort by string block property for specific locale"
    (state/set-preferred-language! "zh-CN")
    (are [sort-state result sorted-result]
         (= (mapv #(hash-map :block/properties %) sorted-result)
            (#'query-table/sort-result (mapv #(hash-map :block/properties %) result) sort-state))
         {:sort-desc? true :sort-by-column :title}
         [{:title "意志"} {:title "圆圈"}]
         [{:title "圆圈"} {:title "意志"}]

         {:sort-desc? false :sort-by-column :title}
         [{:title "圆圈"} {:title "意志"}]
         [{:title "意志"} {:title "圆圈"}])
    (state/set-preferred-language! "en")))
