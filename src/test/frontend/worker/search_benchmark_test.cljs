(ns frontend.worker.search-benchmark-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.worker.search-benchmark :as search-benchmark]
            [promesa.core :as p]))

(deftest score-results-computes-retrieval-metrics-test
  (let [score (search-benchmark/score-results
               ["wrong" "expected-b" "expected-a"]
               ["expected-a" "expected-b"]
               3)]
    (is (= {:precision-at-k 1
            :recall 1
            :recall-at-1 0
            :recall-at-3 1
            :recall-at-5 1
            :mrr 0.5
            :f1 1
            :hits-at-k 2
            :matched-ids ["expected-a" "expected-b"]
            :unmatched-expected-ids []}
           score))))

(deftest run-benchmark-compares-backends-and-summarizes-test
  (async done
    (let [cases [{:id "exact-title"
                  :query "alpha"
                  :expected-ids ["a"]
                  :expected-in-top-k 3}
                 {:id "cross-block"
                  :query "distributed idea"
                  :expected-ids ["b"]
                  :expected-in-top-k 3}]
          backends [{:id :keyword
                     :search (fn [{:keys [id]}]
                               (p/resolved
                                (case id
                                  "exact-title" [{:id "a"}]
                                  "cross-block" [{:id "wrong"}])))}
                    {:id :hybrid
                     :search (fn [{:keys [id]}]
                               (p/resolved
                                (case id
                                  "exact-title" [{:id "a"}]
                                  "cross-block" [{:id "b"}])))}]]
      (-> (search-benchmark/run-benchmark cases backends)
          (p/then (fn [{:keys [summary results]}]
                    (is (= 4 (count results)))
                    (is (= 0.5 (get-in summary [:keyword :avg-recall-at-1])))
                    (is (= 1 (get-in summary [:hybrid :avg-recall-at-1])))
                    (is (= 1 (get-in summary [:hybrid :avg-mrr])))))
          (p/catch (fn [error]
                     (is false (str "unexpected error: " error))))
          (p/finally done)))))
