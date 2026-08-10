(ns frontend.handler.search-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.handler.search :as search-handler]
            [frontend.search :as search]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest search-resolves-string-page-filter-through-worker-test
  (async done
    (let [worker-call (atom nil)
          block-search-call (atom nil)
          state-update (atom nil)]
      (-> (p/with-redefs [state/<invoke-db-worker
                          (fn [& args]
                            (reset! worker-call args)
                            (p/resolved {:db/id 42}))
                          search/block-search
                          (fn [repo q opts]
                            (reset! block-search-call {:repo repo
                                                       :q q
                                                       :opts opts})
                            (p/resolved [{:block/uuid "block-1"}]))
                          search/file-search
                          (fn [_q]
                            (p/resolved ["file.md"]))
                          state/swap-state!
                          (fn [_f & args]
                            (reset! state-update args)
                            nil)]
            (search-handler/search "logseq_db_test" "needle" {:page-db-id "page-name"
                                                              :limit 5}))
          (.then (fn [result]
                   (is (= [:thread-api/pull "logseq_db_test" [:db/id] [:block/name "page-name"]]
                          @worker-call))
                   (is (= {:repo "logseq_db_test"
                           :q "needle"
                           :opts {:page-db-id "page-name"
                                  :limit 5
                                  :page "42"}}
                          @block-search-call))
                   (is (= [:search/result {:blocks [{:block/uuid "block-1"}]
                                            :has-more? false}]
                          @state-update))
                   (is (= {:blocks [{:block/uuid "block-1"}]
                           :has-more? false}
                          result))
                   (done)))
          (.catch (fn [error]
                    (is false (str error))
                    (done)))))))
