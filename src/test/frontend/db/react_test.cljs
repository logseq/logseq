(ns frontend.db.react-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [frontend.db.async.util :as db-async-util]
            [frontend.db.conn :as conn]
            [frontend.db.react :as react]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(use-fixtures :each
  {:before react/clear-query-state!
   :after react/clear-query-state!})

(deftest q-and-refresh-run-worker-query-without-reading-renderer-db-test
  (async done
    (let [repo "logseq_db_react_worker_query"
          query '[:find ?title
                  :where
                  [?b :block/title ?title]]
          worker-calls (atom [])
          renderer-db-reads (atom 0)]
      (react/clear-query-state!)
      (p/with-redefs [util/node-test? false
                      conn/get-db
                      (fn [& _]
                        (swap! renderer-db-reads inc)
                        nil)
                      db-async-util/<q
                      (fn [repo' opts & inputs]
                        (swap! worker-calls conj [repo' opts inputs])
                        (p/resolved #{["worker-title"]}))]
        (let [result-atom (react/q repo [:frontend.worker.react/test-worker-query]
                                   {:return-promise? false}
                                   query)]
          (is (some? result-atom)
              "Worker-backed queries must not require a renderer DataScript conn.")
          (-> (p/let [_ (p/delay 0)
                      _ (react/refresh-affected-queries!
                         repo
                         [[:frontend.worker.react/test-worker-query]])
                      _ (p/delay 0)]
                (when result-atom
                  (is (= #{["worker-title"]} @result-atom))
                  (is (= #{["worker-title"]} @result-atom))
                  (is (zero? @renderer-db-reads)
                      "Worker-backed queries and refreshes should not read the renderer DB.")
                  (is (= [[repo
                           {:transact-db? false
                            :advanced-query? true}
                           [query]]
                          [repo
                           {:transact-db? false
                            :advanced-query? true}
                           [query]]]
                         @worker-calls))))
              (p/catch
               (fn [error]
                 (is false (str error))))
	              (p/finally
	               (fn []
	                 (react/clear-query-state!)
	                 (done)))))))))

(deftest q-and-refresh-resolve-async-inputs-fn-before-worker-query-test
  (async done
    (let [repo "logseq_db_react_async_inputs"
          query '[:find ?title
                  :in $ ?page
                  :where
                  [?b :block/page ?page]
                  [?b :block/title ?title]]
          worker-calls (atom [])
          original-invoke-db-worker db-async-util/<invoke-db-worker]
      (react/clear-query-state!)
      (set! db-async-util/<invoke-db-worker
            (fn [api repo' inputs]
              (swap! worker-calls conj [api repo' inputs])
              (p/resolved #{["worker-title"]})))
      (p/with-redefs [util/node-test? false]
        (let [result-atom (react/q repo [:frontend.worker.react/async-inputs-test]
                                   {:inputs-fn (fn []
                                                 (p/resolved ["worker-page"]))}
                                   query)]
          (is (some? result-atom))
          (-> (p/let [_ (p/delay 0)
                      _ (react/refresh-affected-queries!
                         repo
                         [[:frontend.worker.react/async-inputs-test]])
                      _ (p/delay 0)]
                (is (= #{["worker-title"]} @result-atom))
                (is (= [[:thread-api/q repo [query "worker-page"]]
                        [:thread-api/q repo [query "worker-page"]]]
                       @worker-calls)))
              (p/catch
               (fn [error]
                 (is false (str error))))
              (p/finally
               (fn []
                 (set! db-async-util/<invoke-db-worker original-invoke-db-worker)
                 (react/clear-query-state!)
                 (done)))))))))

(deftest q-and-refresh-run-query-fn-without-reading-renderer-db-test
  (async done
    (let [repo "logseq_db_react_query_fn"
          renderer-db-reads (atom 0)
          query-fn-calls (atom [])]
      (react/clear-query-state!)
      (p/with-redefs [util/node-test? false
                      conn/get-db
                      (fn [& _]
                        (swap! renderer-db-reads inc)
                        nil)]
        (let [result-atom (react/q repo [:frontend.worker.react/query-fn-test]
                                   {:query-fn (fn [db _]
                                                (swap! query-fn-calls conj db)
                                                (p/resolved :query-fn-result))}
                                   nil)]
          (is (some? result-atom)
              "Query functions should not require a renderer DataScript conn.")
          (-> (p/let [_ (p/delay 0)
                      _ (react/refresh-affected-queries!
                         repo
                         [[:frontend.worker.react/query-fn-test]])
                      _ (p/delay 0)]
                (is (= :query-fn-result @result-atom))
                (is (= [nil nil] @query-fn-calls)
                    "Query functions should receive nil instead of a renderer DB.")
                (is (zero? @renderer-db-reads)
                    "Query function execution should not read the renderer DB."))
              (p/catch
               (fn [error]
                 (is false (str error))))
              (p/finally
               (fn []
                 (react/clear-query-state!)
                 (done)))))))))

(deftest q-runs-kv-query-through-worker-without-reading-renderer-db-test
  (async done
    (let [repo "logseq_db_react_kv"
          renderer-db-reads (atom 0)
          worker-calls (atom [])]
      (react/clear-query-state!)
      (p/with-redefs [util/node-test? false
                      conn/get-db
                      (fn [& _]
                        (swap! renderer-db-reads inc)
                        nil)
                      state/<invoke-db-worker
                      (fn [api & args]
                        (swap! worker-calls conj [api args])
                        (p/resolved :worker-kv-value))]
        (-> (p/let [result (react/q repo [:kv :logseq.kv/test-key]
                                    {:return-promise? true}
                                    nil)]
              (is (= :worker-kv-value result))
              (is (= [[:thread-api/get-key-value [repo :logseq.kv/test-key]]]
                     @worker-calls))
              (is (zero? @renderer-db-reads)
                  "KV reactive queries should read key values through the worker."))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (react/clear-query-state!)
               (done))))))))
