(ns logseq.db-sync.worker-handler-index-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.handler.index :as index-handler]
            [promesa.core :as p]))

(deftest graph-access-response-with-timing-caches-result-test
  (async done
         (let [request (js/Request. "http://localhost/sync/graph-1"
                                    #js {:headers #js {"authorization" "Bearer token-cache-hit"}})
               env #js {"DB" #js {}}
               auth-count (atom 0)
               query-count (atom 0)]
           (-> (p/with-redefs [auth/auth-claims (fn [_request _env]
                                                  (swap! auth-count inc)
                                                  (p/resolved #js {"sub" "user-1"}))
                               index/<user-has-access-to-graph? (fn [_db _graph-id _user-id]
                                                                  (swap! query-count inc)
                                                                  (p/resolved true))]
                 (p/let [first-result (index-handler/graph-access-response-with-timing request env "graph-1")
                         second-result (index-handler/graph-access-response-with-timing request env "graph-1")]
                   (is (= 200 (.-status (:response first-result))))
                   (is (= 200 (.-status (:response second-result))))
                   (is (= 1 @auth-count))
                   (is (= 1 @query-count))
                   (is (false? (get-in first-result [:timing :cache-hit?])))
                   (is (true? (get-in second-result [:timing :cache-hit?])))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest graph-access-response-with-timing-does-not-upsert-user-test
  (async done
         (let [request (js/Request. "http://localhost/sync/graph-2"
                                    #js {:headers #js {"authorization" "Bearer token-no-upsert"}})
               env #js {"DB" #js {}}]
           (-> (p/with-redefs [auth/auth-claims (fn [_request _env]
                                                  (p/resolved #js {"sub" "user-2"}))
                               index/<user-upsert! (fn [& _]
                                                     (throw (ex-info "should-not-upsert" {})))
                               index/<user-has-access-to-graph? (fn [_db _graph-id _user-id]
                                                                  (p/resolved true))]
                 (p/let [result (index-handler/graph-access-response-with-timing request env "graph-2")]
                   (is (= 200 (.-status (:response result))))
                   (is (= true (get-in result [:timing :access-ok?])))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
