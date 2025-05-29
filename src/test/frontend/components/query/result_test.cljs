(ns frontend.components.query.result-test
  (:require [clojure.test :refer [deftest are testing is]]
            [frontend.db.model :as model]
            [frontend.components.query.result :as query-result]))

(defn- transform-query-result
  [config query-m result]
  (with-redefs [model/with-pages identity]
    (query-result/transform-query-result config query-m result)))

(deftest transform-query-result-with-transforms-and-grouping
  (let [result (mapv
                #(assoc % :block/page {:db/id 1} :block/parent {:db/id 2})
                [{:block/uuid (random-uuid) :block/scheduled 20230418}
                 {:block/uuid (random-uuid) :block/scheduled 20230415}
                 {:block/uuid (random-uuid) :block/scheduled 20230417}])
        sorted-result (sort-by :block/scheduled result)]
    (testing "For list view"
      (are [query-m expected]
           (= expected (transform-query-result {:table? false} query-m result))

        ;; Default list behavior is to group result
        {}
        {{:db/id 1} result}

        ;; User overrides default behavior to return result
        {:group-by-page? false}
        result

        ;; Return transformed result for list view
        {:result-transform '(partial sort-by :block/scheduled)}
        sorted-result

        ; User overrides transform to return grouped result
        {:result-transform '(partial sort-by :block/scheduled) :group-by-page? true}
        {{:db/id 1} sorted-result})

      (testing "For table view"
        (are [query expected]
             (= expected (transform-query-result {:table? true} query result))

          ;; Default table behavior is to return result
          {}
          result

          ;; Return transformed result
          {:result-transform '(partial sort-by :block/scheduled)}
          sorted-result

          ;; Ignore override and return normal result
          {:group-by-page? true}
          result))

      (testing "current block in results"
        (is (= result
               (let [current-block {:block/uuid (random-uuid) :block/scheduled 20230420 :block/page {:db/id 1}}]
                 (transform-query-result {:table? false
                                          :current-block-uuid (:block/uuid current-block)}
                                         {:group-by-page? false}
                                         (conj result current-block))))
            "Current block is not included in results")))))

(deftest transform-query-result-with-remove-block-children-option
  (let [result [{:db/id 1 :block/title "parent" :block/uuid 1}
                {:db/id 2 :block/title "child" :block/uuid 2 :block/parent {:db/id 1}}]]
    (is (= [{:db/id 1 :block/title "parent" :block/uuid 1}]
           (transform-query-result {:table? true} {:remove-block-children? true} result))
        "Removes children when :remove-block-children? is true")
    (is (= result
           (transform-query-result {:table? true} {:remove-block-children? false} result))
        "Doesn't remove children when :remove-block-children? is false")))

(deftest transform-query-result-sets-result-in-config
  (let [result [{:db/id 1 :block/title "parent" :block/uuid 1}]
        config {:query-result (atom nil) :table? true}]
    (is (= result
           (transform-query-result config {} result)))
    (is (= result @(:query-result config))
        "Result is set in config for downstream use e.g. query table fn")))
