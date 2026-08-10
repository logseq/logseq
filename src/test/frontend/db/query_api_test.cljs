(ns frontend.db.query-api-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db.query-custom :as query-custom]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.state :as state]
            [promesa.core :as p]))

(defn- finish-async!
  [done promise]
  (-> promise
      (p/catch (fn [error]
                 (is false (str error))))
      (p/finally done)))

(deftest dsl-query-apis-return-one-worker-response-test
  (async done
    (let [repo "direct-query-api"
          query-string "(task TODO)"
          query-map {:query '(task TODO)}
          worker-calls (atom [])]
      (finish-async!
       done
       (p/with-redefs
         [state/<invoke-db-worker
          (fn [api & args]
            (swap! worker-calls conj [api args])
            (p/resolved (case api
                          :thread-api/query-dsl-query :dsl-result
                          :thread-api/query-dsl-custom-query :custom-result)))]
         (p/let [dsl-result (query-dsl/query repo query-string {:cards? true})
                 custom-result (query-dsl/custom-query repo query-map {})]
           (is (= :dsl-result dsl-result))
           (is (= :custom-result custom-result))
           (is (= [[:thread-api/query-dsl-query
                    [repo query-string
                     {:cards? true
                      :block-attrs query-dsl/db-block-attrs}]]
                   [:thread-api/query-dsl-custom-query
                    [repo query-map
                     {:block-attrs query-dsl/db-block-attrs}]]]
                  @worker-calls))))))))

(deftest advanced-query-api-resolves-inputs-and-returns-worker-response-test
  (async done
    (let [repo "direct-advanced-query-api"
          query '[:find ?title
                  :in $ ?page
                  :where
                  [?page-id :block/name ?page]
                  [?block :block/page ?page-id]
                  [?block :block/title ?title]]
          worker-result #{["Worker result"]}
          worker-calls (atom [])]
      (finish-async!
       done
       (p/with-redefs
         [state/get-current-page (constantly "current-page")
          state/<invoke-db-worker
          (fn [api & args]
            (swap! worker-calls conj [api args])
            (p/resolved worker-result))]
         (p/let [result (query-custom/custom-query
                         repo
                         {:query query
                          :inputs [:current-page]}
                         {:current-page-fn (constantly "Current Page")})]
           (is (= worker-result result))
           (is (= [[:thread-api/query-custom
                    [repo
                     {:query query
                      :inputs [:current-page]}
                     {:current-page "current-page"
                      :current-page-title "Current Page"}]]]
                  @worker-calls))))))))

(deftest direct-query-apis-reject-empty-query-test
  (is (thrown? js/Error
               (query-dsl/query "direct-query-api" "")))
  (is (thrown? js/Error
               (query-dsl/custom-query "direct-query-api" {} {})))
  (is (thrown? js/Error
               (query-custom/custom-query
                "direct-query-api"
                {:query '[:find ?title
                          :where [_ :block/title ?title]]}
                {:current-page-fn (constantly 42)}))))
