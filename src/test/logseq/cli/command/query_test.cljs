(ns logseq.cli.command.query-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [logseq.cli.command.query :as query-command]))

(deftest test-build-action-parses-query
  (testing "query parses query and inputs"
    (let [result (query-command/build-action {:query "[:find ?e :in $ ?title :where [?e :block/title ?title]]"
                                              :inputs "[\"Hello\"]"}
                                             "logseq_db_demo"
                                             {})]
      (is (true? (:ok? result)))
      (is (= :query (get-in result [:action :type])))
      (is (= "logseq_db_demo" (get-in result [:action :repo])))
      (is (= '[:find ?e :in $ ?title :where [?e :block/title ?title]]
             (get-in result [:action :query])))
      (is (= ["Hello"] (get-in result [:action :inputs]))))))

(deftest test-build-action-invalid-edn
  (testing "invalid query edn returns invalid-options"
    (let [result (query-command/build-action {:query "[:find ?e"}
                                             "logseq_db_demo"
                                             {})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))
      (is (string/includes? (get-in result [:error :message]) "query"))))

  (testing "invalid inputs edn returns invalid-options"
    (let [result (query-command/build-action {:query "[:find ?e :where [?e :block/title \"Hello\"]]"
                                              :inputs "[\"Hello"}
                                             "logseq_db_demo"
                                             {})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))
      (is (string/includes? (get-in result [:error :message]) "inputs")))))

(deftest test-build-action-named-query
  (testing "named query resolves from config"
    (let [config {:custom-queries {"my-query"
                                   {:doc "Custom query"
                                    :inputs ["title"]
                                    :query '[:find ?e
                                             :in $ ?title
                                             :where
                                             [?e :block/title ?title]]}}}
          result (query-command/build-action {:name "my-query"
                                              :inputs "[\"Alpha\"]"}
                                             "logseq_db_demo"
                                             config)]
      (is (true? (:ok? result)))
      (is (= '[:find ?e :in $ ?title :where [?e :block/title ?title]]
             (get-in result [:action :query])))
      (is (= ["Alpha"] (get-in result [:action :inputs])))))

  (testing "unknown named query returns unknown-query error"
    (let [result (query-command/build-action {:name "missing"}
                                             "logseq_db_demo"
                                             {:custom-queries {}})]
      (is (false? (:ok? result)))
      (is (= :unknown-query (get-in result [:error :code])))))

  (testing "rejects both name and query"
    (let [result (query-command/build-action {:name "my-query"
                                              :query "[:find ?e :where [?e :block/title ?title]]"}
                                             "logseq_db_demo"
                                             {:custom-queries {"my-query" {:query '[:find ?e]}}})]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "optional inputs are padded with nils"
    (let [config {:custom-queries {"task-search"
                                   {:inputs ["search-status" "?search-title" "?recent-days"]
                                    :query '[:find [?e ...]
                                             :in $ ?search-status ?search-title ?recent-days
                                             :where
                                             [?e :block/title ?title]]}}}
          result (query-command/build-action {:name "task-search"
                                              :inputs "[\"doing\"]"}
                                             "logseq_db_demo"
                                             config)]
      (is (true? (:ok? result)))
      (is (= ["doing" nil nil] (get-in result [:action :inputs])))))

  (testing "missing required inputs returns invalid-options"
    (let [config {:custom-queries {"task-search"
                                   {:inputs ["search-status" "?search-title"]
                                    :query '[:find [?e ...]
                                             :in $ ?search-status ?search-title
                                             :where
                                             [?e :block/title ?title]]}}}
          result (query-command/build-action {:name "task-search"
                                              :inputs "[]"}
                                             "logseq_db_demo"
                                             config)]
      (is (false? (:ok? result)))
      (is (= :invalid-options (get-in result [:error :code])))))

  (testing "optional inputs can define defaults in cli.edn"
    (let [config {:custom-queries {"task-search"
                                   {:inputs [{:name "search-status"}
                                             {:name "?search-title" :default "fallback-title"}
                                             {:name "?recent-days" :default 7}]
                                    :query '[:find [?e ...]
                                             :in $ ?search-status ?search-title ?recent-days
                                             :where
                                             [?e :block/title ?title]]}}}
          result (query-command/build-action {:name "task-search"
                                              :inputs "[\"doing\"]"}
                                             "logseq_db_demo"
                                             config)]
      (is (true? (:ok? result)))
      (is (= ["doing" "fallback-title" 7] (get-in result [:action :inputs])))))

  (testing "built-in task-search uses defaults for optional inputs"
    (let [result (query-command/build-action {:name "task-search"
                                              :inputs "[\"doing\"]"}
                                             "logseq_db_demo"
                                             {})]
      (is (true? (:ok? result)))
      (let [inputs (get-in result [:action :inputs])]
        (is (= ["doing" "" 0] (subvec inputs 0 3)))
        (is (number? (nth inputs 3)))))))

(deftest test-query-list-merges-built-in-and-custom
  (testing "built-in and custom queries are both listed"
    (let [queries (query-command/list-queries {:custom-queries {"custom-q" {:query '[:find ?e]}}})
          names (set (map :name queries))]
      (is (contains? names "block-search"))
      (is (contains? names "task-search"))
      (is (contains? names "custom-q"))))

  (testing "custom query overrides built-in name"
    (let [queries (query-command/list-queries {:custom-queries {"block-search" {:query '[:find ?e]}}})
          block-search (first (filter #(= "block-search" (:name %)) queries))]
      (is (= :custom (:source block-search))))))
