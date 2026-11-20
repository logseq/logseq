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

(deftest index-routes-wait-for-the-user-upsert-test
  (async done
         (let [events (atom [])
               request (js/Request. "http://localhost/graphs"
                                    #js {:headers #js {"authorization" "Bearer token-upsert-order"}})]
           (-> (p/with-redefs [auth/semantic-auth-claims (fn [_request _env]
                                                           (p/resolved #js {"sub" "user-3"}))
                               auth/third-party-oauth-token? (constantly false)
                               index/<user-upsert! (fn [_db _claims]
                                                     (p/then (p/delay 20) (fn [_] (swap! events conj :upsert))))
                               index/<user-activity-touch! (fn [_db _user-id] (p/resolved nil))
                               index-handler/handle (fn [_ctx]
                                                      (swap! events conj :handle)
                                                      (js/Response. "{}" #js {:status 200}))]
                 (p/let [resp (index-handler/handle-fetch #js {:d1 #js {} :env #js {}} request)]
                   (is (= 200 (.-status resp)))
                   (is (= [:upsert :handle] @events)
                       "a new user is in the index before the route runs")))
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

(deftest graphs-create-non-e2ee-skips-user-rsa-key-pair-test
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
                   (is (= 200 (.-status resp)))
                   (is (string? (:graph-id body)))
                   (is (= false (:graph-e2ee? body)))
                   (is (= 1 @index-upsert-calls*))))
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
           (-> (p/with-redefs [index/<user-is-manager? (fn [_db _graph-id _user-id]
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

(deftest graphs-delete-rejects-a-plain-member-test
  (async done
         (let [request (js/Request. "http://localhost/graphs/graph-1" #js {:method "DELETE"})
               url (js/URL. (.-url request))]
           (-> (p/with-redefs [index/<user-is-manager? (fn [_db _graph-id _user-id]
                                                        (p/resolved false))
                               index/<user-has-access-to-graph? (fn [_db _graph-id _user-id]
                                                                  (p/resolved true))
                               index/<graph-delete-metadata! (fn [& _]
                                                               (throw (ex-info "should-not-delete" {})))]
                 (p/let [resp (index-handler/handle {:db :db
                                                     :env #js {}
                                                     :request request
                                                     :url url
                                                     :claims #js {"sub" "member-user"}
                                                     :route {:handler :graphs/delete
                                                             :path-params {:graph-id "graph-1"}}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 403 (.-status resp)))
                   (is (= "forbidden" (:error body)))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest graph-members-delete-closes-the-members-sockets-test
  (async done
         (let [request (js/Request. "http://localhost/graphs/graph-1/members/bob"
                                    #js {:method "DELETE"})
               url (js/URL. (.-url request))
               do-requests (atom [])
               do-namespace #js {:idFromName (fn [graph-id] graph-id)
                                 :get (fn [_]
                                        #js {:fetch (fn [do-request]
                                                      (swap! do-requests conj do-request)
                                                      (p/resolved (js/Response. "{}" #js {:status 200})))})}]
           (-> (p/with-redefs [index/<user-is-manager? (fn [_db _graph-id _user-id]
                                                        (p/resolved true))
                               index/<graph-member-role (fn [_db _graph-id _member-id]
                                                          (p/resolved "member"))
                               index/<graph-member-delete! (fn [_db _graph-id _member-id]
                                                            (p/resolved nil))]
                 (p/let [resp (index-handler/handle {:db :db
                                                     :env #js {"LOGSEQ_SYNC_DO" do-namespace}
                                                     :request request
                                                     :url url
                                                     :claims #js {"sub" "manager-user"}
                                                     :route {:handler :graph-members/delete
                                                             :path-params {:graph-id "graph-1"
                                                                           :member-id "bob"}}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 200 (.-status resp)))
                   (is (= {:ok true} body))
                   (is (= 1 (count @do-requests)))
                   (let [do-request (first @do-requests)
                         do-url (js/URL. (.-url do-request))]
                     (is (= "POST" (.-method do-request)))
                     (is (= "/internal/close-sockets" (.-pathname do-url)))
                     (is (= "bob" (.get (.-searchParams do-url) "user-id")))
                     (is (= "graph-1" (.get (.-searchParams do-url) "graph-id"))
                         "the node server's Durable Object stand-in finds the graph by graph-id"))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
