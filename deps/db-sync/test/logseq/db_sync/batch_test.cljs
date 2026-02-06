(ns logseq.db-sync.batch-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.batch :as batch]))

(deftest rows->insert-batches-test
  (testing "splits rows into batches based on max params"
    (let [rows [[1 "a" nil]
                [2 "b" nil]
                [3 "c" nil]]
          batches (batch/rows->insert-batches "kvs_import" rows {:max-params 6})]
      (is (= 2 (count batches)))
      (is (= [1 "a" nil 2 "b" nil] (:args (first batches))))
      (is (= [3 "c" nil] (:args (second batches))))
      (is (string? (:sql (first batches))))
      (is (string? (:sql (second batches))))))
  (testing "empty rows returns no batches"
    (is (= [] (batch/rows->insert-batches "kvs_import" [] {:max-params 6})))))
