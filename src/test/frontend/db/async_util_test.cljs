(ns frontend.db.async-util-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db.async.util :as db-async-util]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest q-with-transact-db-uses-worker-without-renderer-db-test
  (async done
    (let [repo "logseq_db_async_query_worker"
          query '[:find [(pull ?b [:db/id :block/title]) ...]
                  :where
                  [?b :block/title]]
          worker-calls (atom [])]
      (state/clear-async-queries!)
      (p/with-redefs [db-async-util/<invoke-db-worker
                      (fn [api repo' inputs]
                        (swap! worker-calls conj [api repo' inputs])
                        (p/resolved [{:db/id 1 :block/title "from-worker"}]))]
        (-> (p/let [first-result (db-async-util/<q repo {:transact-db? true} query)
                    second-result (db-async-util/<q repo {:transact-db? true} query)]
              (is (= [{:db/id 1 :block/title "from-worker"}] first-result))
              (is (= first-result second-result))
              (is (= [[:thread-api/q repo [query]]
                      [:thread-api/q repo [query]]]
                     @worker-calls)))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (state/clear-async-queries!)
               (done))))))))
