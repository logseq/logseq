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
                               index/<user-rsa-key-pair (fn [_db _user-id]
                                                          (p/resolved {:public-key "pk"
                                                                       :encrypted-private-key "enc"}))
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

(deftest graphs-list-includes-user-rsa-keys-exists-flag-true-test
  (async done
         (let [request (js/Request. "http://localhost/graphs" #js {:method "GET"})
               url (js/URL. (.-url request))]
           (-> (p/with-redefs [index/<index-list (fn [_db _user-id]
                                                   (p/resolved []))
                               index/<user-rsa-key-pair (fn [_db _user-id]
                                                          (p/resolved {:public-key "pk"
                                                                       :encrypted-private-key "enc"}))]
                 (p/let [resp (index-handler/handle {:db :db
                                                     :env #js {}
                                                     :request request
                                                     :url url
                                                     :claims #js {"sub" "user-1"}
                                                     :route {:handler :graphs/list
                                                             :path-params {}}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 200 (.-status resp)))
                   (is (= [] (:graphs body)))
                   (is (= true (:user-rsa-keys-exists? body)))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest graphs-list-includes-user-rsa-keys-exists-flag-false-test
  (async done
         (let [request (js/Request. "http://localhost/graphs" #js {:method "GET"})
               url (js/URL. (.-url request))]
           (-> (p/with-redefs [index/<index-list (fn [_db _user-id]
                                                   (p/resolved []))
                               index/<user-rsa-key-pair (fn [_db _user-id]
                                                          (p/resolved nil))]
                 (p/let [resp (index-handler/handle {:db :db
                                                     :env #js {}
                                                     :request request
                                                     :url url
                                                     :claims #js {"sub" "user-1"}
                                                     :route {:handler :graphs/list
                                                             :path-params {}}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 200 (.-status resp)))
                   (is (= [] (:graphs body)))
                   (is (= false (:user-rsa-keys-exists? body)))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest graphs-create-e2ee-requires-user-rsa-key-pair-test
  (async done
         (let [request (js/Request. "http://localhost/graphs" #js {:method "POST"})
               url (js/URL. (.-url request))
               index-upsert-calls* (atom 0)]
           (-> (p/with-redefs [common/read-json (fn [_]
                                                  (p/resolved #js {"graph-name" "Graph E2EE"
                                                                   "schema-version" "65"
                                                                   "graph-e2ee?" true}))
                               index/<graph-name-exists? (fn [_db _graph-name _user-id]
                                                           (p/resolved false))
                               index/<user-rsa-key-pair (fn [_db _user-id]
                                                          (p/resolved nil))
                               index/<index-upsert! (fn
                                                      ([_db _graph-id _graph-name _user-id _schema-version _graph-e2ee?]
                                                       (swap! index-upsert-calls* inc)
                                                       (p/resolved nil))
                                                      ([_db _graph-id _graph-name _user-id _schema-version _graph-e2ee? _graph-ready-for-use?]
                                                       (swap! index-upsert-calls* inc)
                                                       (p/resolved nil)))
                               index/<graph-member-upsert! (fn [& _]
                                                             (p/resolved nil))]
                 (p/let [resp (index-handler/handle {:db :db
                                                     :env #js {}
                                                     :request request
                                                     :url url
                                                     :claims #js {"sub" "user-1"}
                                                     :route {:handler :graphs/create
                                                             :path-params {}}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 400 (.-status resp)))
                   (is (= "missing user rsa key pair" (:error body)))
                   (is (zero? @index-upsert-calls*))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest graphs-create-non-e2ee-requires-user-rsa-key-pair-test
  (async done
         (let [request (js/Request. "http://localhost/graphs" #js {:method "POST"})
               url (js/URL. (.-url request))
               index-upsert-calls* (atom 0)]
           (-> (p/with-redefs [common/read-json (fn [_]
                                                  (p/resolved #js {"graph-name" "Graph Plain"
                                                                   "schema-version" "65"
                                                                   "graph-e2ee?" false}))
                               index/<graph-name-exists? (fn [_db _graph-name _user-id]
                                                           (p/resolved false))
                               index/<user-rsa-key-pair (fn [_db _user-id]
                                                          (p/resolved nil))
                               index/<index-upsert! (fn
                                                      ([_db _graph-id _graph-name _user-id _schema-version _graph-e2ee?]
                                                       (swap! index-upsert-calls* inc)
                                                       (p/resolved nil))
                                                      ([_db _graph-id _graph-name _user-id _schema-version _graph-e2ee? _graph-ready-for-use?]
                                                       (swap! index-upsert-calls* inc)
                                                       (p/resolved nil)))
                               index/<graph-member-upsert! (fn [& _]
                                                             (p/resolved nil))]
                 (p/let [resp (index-handler/handle {:db :db
                                                     :env #js {}
                                                     :request request
                                                     :url url
                                                     :claims #js {"sub" "user-1"}
                                                     :route {:handler :graphs/create
                                                             :path-params {}}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 400 (.-status resp)))
                   (is (= "missing user rsa key pair" (:error body)))
                   (is (zero? @index-upsert-calls*))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest graphs-delete-supports-node-delete-hook-without-do-namespace-test
  (async done
         (let [request (js/Request. "http://localhost/graphs/graph-1" #js {:method "DELETE"})
               url (js/URL. (.-url request))
               hook-calls* (atom [])]
           (-> (p/with-redefs [index/<user-has-access-to-graph? (fn [_db _graph-id _user-id]
                                                                  (p/resolved true))
                               index/<graph-delete-metadata! (fn [_db _graph-id]
                                                               (p/resolved true))
                               index/<graph-delete-index-entry! (fn [_db _graph-id]
                                                                  (p/resolved true))]
                 (p/let [resp (index-handler/handle {:db :db
                                                     :env #js {"DB_SYNC_DELETE_GRAPH"
                                                               (fn [graph-id]
                                                                 (swap! hook-calls* conj graph-id)
                                                                 (p/resolved true))}
                                                     :request request
                                                     :url url
                                                     :claims #js {"sub" "user-1"}
                                                     :route {:handler :graphs/delete
                                                             :path-params {:graph-id "graph-1"}}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 200 (.-status resp)))
                   (is (= {:graph-id "graph-1" :deleted true} body))
                   (is (= ["graph-1"] @hook-calls*))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
