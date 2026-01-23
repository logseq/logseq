(ns logseq.cli.command.query-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.query :as query-command]))

(deftest test-build-action-parses-query
  (testing "query parses query and inputs"
    (let [result (query-command/build-action {:query "[:find ?e :in $ ?title :where [?e :block/title ?title]]"
                                              :inputs "[\"Hello\"]"}
                                             "logseq_db_demo")]
      (is (true? (:ok? result)))
      (is (= :query (get-in result [:action :type])))
      (is (= "logseq_db_demo" (get-in result [:action :repo])))
      (is (= '[:find ?e :in $ ?title :where [?e :block/title ?title]]
             (get-in result [:action :query])))
      (is (= ["Hello"] (get-in result [:action :inputs]))))))

(deftest test-build-action-invalid-edn
  (testing "invalid query edn returns invalid-options"
    (let [result (query-command/build-action {:query "[:find ?e"}
                                             "logseq_db_demo")]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))
      (is (string/includes? (get-in result [:error :message]) "query"))))

  (testing "invalid inputs edn returns invalid-options"
    (let [result (query-command/build-action {:query "[:find ?e :where [?e :block/title \"Hello\"]]"
                                              :inputs "[\"Hello"}
                                             "logseq_db_demo")]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))
      (is (string/includes? (get-in result [:error :message]) "inputs")))))
