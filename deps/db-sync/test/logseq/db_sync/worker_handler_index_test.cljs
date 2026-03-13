(ns logseq.db-sync.worker-handler-index-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [logseq.db-sync.common :as common]
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

(deftest graphs-create-defaults-ready-for-use-true-test
  (async done
         (let [request (js/Request. "http://localhost/graphs" #js {:method "POST"})
               url (js/URL. (.-url request))
               d1-runs (atom [])]
           (-> (p/with-redefs [common/read-json (fn [_]
                                                  (p/resolved #js {"graph-name" "Graph 1"
                                                                   "schema-version" "65"}))
                               common/<d1-all (fn [& _]
                                                (p/resolved #js {:results #js []}))
                               common/get-sql-rows (fn [result]
                                                     (aget result "results"))
                               common/<d1-run (fn [_db sql & args]
                                                (swap! d1-runs conj {:sql sql
                                                                     :args args})
                                                (p/resolved {:ok true}))]
                 (p/let [resp (index-handler/handle {:db :db
                                                     :env #js {}
                                                     :request request
                                                     :url url
                                                     :claims #js {"sub" "user-1"}
                                                     :route {:handler :graphs/create
                                                             :path-params {}}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)
                         graph-insert (first @d1-runs)]
                   (is (= 200 (.-status resp)))
                   (is (string/includes? (:sql graph-insert) "graph_ready_for_use"))
                   (is (= 1 (nth (:args graph-insert) 5)))
                   (is (= true (:graph-ready-for-use? body)))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
