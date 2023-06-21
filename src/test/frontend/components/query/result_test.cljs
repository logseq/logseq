(ns frontend.components.query.result-test
  (:require [clojure.test :refer [deftest are testing is]]
            [rum.core :as rum]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.components.query.result :as query-result]))

(defn- mock-get-query-result
  "Mocks get-query-result assuming custom queries are being tested. Db calls are
  mocked to minimize setup"
  [result query-m {:keys [table? current-block-uuid config] :or {config {}}}]
  (with-redefs [db/custom-query (constantly (atom result))
                model/with-pages identity]
    (binding [rum/*reactions* (volatile! #{})]
      (#'query-result/get-query-result config query-m (atom nil) current-block-uuid {:table? table?}))))

(deftest get-query-result-with-transforms-and-grouping
  (let [result (mapv
                #(assoc % :block/page {:db/id 1} :block/parent {:db/id 2})
                [{:block/uuid (random-uuid) :block/scheduled 20230418}
                 {:block/uuid (random-uuid) :block/scheduled 20230415}
                 {:block/uuid (random-uuid) :block/scheduled 20230417}])
        sorted-result (sort-by :block/scheduled result)]
    (testing "For list view"
      (are [query-m expected]
           (= expected (mock-get-query-result result query-m {:table? false}))

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
             (= expected (mock-get-query-result result query {:table? true}))

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
                 (mock-get-query-result (conj result current-block)
                                        {:group-by-page? false}
                                        {:table? false
                                         :current-block-uuid (:block/uuid current-block)})))
            "Current block is not included in results")))))

(deftest get-query-result-with-remove-block-children-option
  (let [result [{:db/id 1 :block/content "parent" :block/uuid 1}
                {:db/id 2 :block/content "child" :block/uuid 2 :block/parent {:db/id 1}}]]
    (is (= [{:db/id 1 :block/content "parent" :block/uuid 1}]
           (mock-get-query-result result {:remove-block-children? true} {:table? true}))
        "Removes children when :remove-block-children? is true")
    (is (= result
           (mock-get-query-result result {:remove-block-children? false} {:table? true}))
        "Doesn't remove children when :remove-block-children? is false")))

(deftest get-query-result-sets-result-in-config
  (let [result [{:db/id 1 :block/content "parent" :block/uuid 1}]
        config {:query-result (atom nil)}]
    (is (= result
           (mock-get-query-result result {} {:table? true :config config})))
    (is (= result @(:query-result config))
        "Result is set in config for downstream use e.g. query table fn")))