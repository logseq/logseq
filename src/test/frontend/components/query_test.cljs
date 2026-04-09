(ns frontend.components.query-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.query :as query]
            [frontend.state :as state]))

(deftest grouped-by-page-result-detection-supports-partial-page-refs
  (let [result [[{:db/id 42}
                 [{:block/uuid (random-uuid)}]]]]
    (is (true? (#'query/grouped-by-page-result? result true))
        "Grouped query results with page refs that only include :db/id should still be recognized")
    (is (false? (#'query/grouped-by-page-result? result false)))))

(deftest built-in-custom-query-detection-requires-stable-title-key
  (with-redefs [state/sub-config (constantly {:default-queries
                                              {:journals [{:title-key :journal.default-query/doing
                                                           :query '[:find ?b]
                                                           :inputs [:today]}]}})]
    (is (true? (#'query/built-in-custom-query? {:title-key :journal.default-query/doing
                                                :query '[:find ?b]
                                                :inputs [:today]})))
    (is (false? (#'query/built-in-custom-query? {:query '[:find ?b]
                                                 :inputs [:today]})))
    (is (false? (#'query/built-in-custom-query? {:title-key :journal.default-query/todo
                                                 :query '[:find ?b]
                                                 :inputs [:today]})))))

(deftest resolve-built-in-query-allows-explicit-built-in-queries
  (with-redefs [state/sub-config (constantly {:default-queries {:journals []}})]
    (is (true? (#'query/resolve-built-in-query? true {:title "TODO"})))
    (is (false? (#'query/resolve-built-in-query? false {:title "TODO"})))))
