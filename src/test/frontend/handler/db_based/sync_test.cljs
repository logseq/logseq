(ns frontend.handler.db-based.sync-test
  (:require [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(deftest remove-member-request-test
  (async done
         (let [called (atom nil)]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (reset! called {:url url :opts opts})
                                                    (p/resolved {:ok true}))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))]
                 (p/let [_ (db-sync/<rtc-remove-member! "graph-1" "user-2")
                         {:keys [url opts]} @called]
                   (is (= "http://base/graphs/graph-1/members/user-2" url))
                   (is (= "DELETE" (:method opts)))
                   (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest leave-graph-uses-current-user-test
  (async done
         (let [called (atom nil)]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (reset! called {:url url :opts opts})
                                                    (p/resolved {:ok true}))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               user-handler/user-uuid (fn [] "user-1")]
                 (p/let [_ (db-sync/<rtc-leave-graph! "graph-1")
                         {:keys [url opts]} @called]
                   (is (= "http://base/graphs/graph-1/members/user-1" url))
                   (is (= "DELETE" (:method opts)))
                   (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest leave-graph-missing-user-test
  (async done
         (-> (p/with-redefs [user-handler/user-uuid (fn [] nil)]
               (db-sync/<rtc-leave-graph! "graph-1"))
             (p/then (fn [_]
                       (is false "expected rejection")
                       (done)))
             (p/catch (fn [e]
                        (is (= :db-sync/invalid-member (:type (ex-data e))))
                        (done))))))

(deftest rtc-create-graph-persists-disabled-e2ee-flag-test
  (async done
         (let [fetch-called (atom nil)
               tx-called (atom nil)]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               db/get-db (fn [] :db)
                               ldb/get-graph-schema-version (fn [_] {:major 65})
                               db-sync/fetch-json (fn [url opts _]
                                                    (reset! fetch-called {:url url :opts opts})
                                                    (p/resolved {:graph-id "graph-1"
                                                                 :graph-e2ee? false}))
                               ldb/transact! (fn [repo tx-data]
                                               (reset! tx-called {:repo repo :tx-data tx-data})
                                               nil)]
                 (db-sync/<rtc-create-graph! "logseq_db_demo" false))
               (p/then (fn [graph-id]
                         (let [request-body (-> @fetch-called
                                                (get-in [:opts :body])
                                                js/JSON.parse
                                                (js->clj :keywordize-keys true))
                               tx-data (:tx-data @tx-called)]
                           (is (= "graph-1" graph-id))
                           (is (= "http://base/graphs" (:url @fetch-called)))
                           (is (= false (:graph-e2ee? request-body)))
                           (is (= :logseq.kv/graph-rtc-e2ee?
                                  (get-in tx-data [2 :db/ident])))
                           (is (= false
                                  (get-in tx-data [2 :kv/value]))))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest rtc-create-graph-defaults-e2ee-enabled-test
  (async done
         (let [fetch-called (atom nil)
               tx-called (atom nil)]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               db/get-db (fn [] :db)
                               ldb/get-graph-schema-version (fn [_] {:major 65})
                               db-sync/fetch-json (fn [url opts _]
                                                    (reset! fetch-called {:url url :opts opts})
                                                    (p/resolved {:graph-id "graph-2"}))
                               ldb/transact! (fn [repo tx-data]
                                               (reset! tx-called {:repo repo :tx-data tx-data})
                                               nil)]
                 (db-sync/<rtc-create-graph! "logseq_db_demo"))
               (p/then (fn [graph-id]
                         (let [request-body (-> @fetch-called
                                                (get-in [:opts :body])
                                                js/JSON.parse
                                                (js->clj :keywordize-keys true))
                               tx-data (:tx-data @tx-called)]
                           (is (= "graph-2" graph-id))
                           (is (= "http://base/graphs" (:url @fetch-called)))
                           (is (= true (:graph-e2ee? request-body)))
                           (is (= :logseq.kv/graph-rtc-e2ee?
                                  (get-in tx-data [2 :db/ident])))
                           (is (= true
                                  (get-in tx-data [2 :kv/value]))))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest rtc-upload-graph-persists-local-e2ee-choice-and-defers-bootstrap-to-worker-test
  (async done
         (let [tx-called (atom nil)
               worker-calls (atom [])
               get-remote-graphs-calls (atom 0)
               rtc-start-calls (atom 0)]
           (-> (p/with-redefs [ldb/transact! (fn [repo tx-data]
                                               (reset! tx-called {:repo repo :tx-data tx-data})
                                               nil)
                               state/<invoke-db-worker (fn [& args]
                                                         (swap! worker-calls conj args)
                                                         (p/resolved {:graph-id "graph-1"}))
                               db-sync/<get-remote-graphs (fn []
                                                            (swap! get-remote-graphs-calls inc)
                                                            (p/resolved []))
                               db-sync/<rtc-start! (fn [_repo]
                                                     (swap! rtc-start-calls inc)
                                                     (p/resolved nil))]
                 (db-sync/<rtc-upload-graph! "logseq_db_demo" false))
               (p/then (fn [_]
                         (is (= "logseq_db_demo" (:repo @tx-called)))
                         (is (= :logseq.kv/graph-rtc-e2ee?
                                (get-in @tx-called [:tx-data 0 :db/ident])))
                         (is (= false
                                (get-in @tx-called [:tx-data 0 :kv/value])))
                         (is (= [[:thread-api/db-sync-upload-graph "logseq_db_demo"]]
                                @worker-calls))
                         (is (= 1 @get-remote-graphs-calls))
                         (is (= 1 @rtc-start-calls))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest get-remote-graphs-canonicalizes-prefixed-graph-names
  (async done
    (let [set-state-calls (atom [])]
      (-> (p/with-redefs [db-sync/http-base (constantly "http://base")
                          user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                      (resolve true))
                          db-sync/fetch-json (fn [url _opts _schema]
                                               (if (string/ends-with? url "/graphs")
                                                 (p/resolved {:graphs [{:graph-name "logseq_db_demo"
                                                                        :graph-id "graph-1"
                                                                        :schema-version 1}
                                                                       {:graph-name "logseq_db_logseq_db_legacy"
                                                                        :graph-id "graph-2"
                                                                        :schema-version 1}]})
                                                 (p/rejected (ex-info "unexpected fetch-json URL"
                                                                      {:url url}))))
                          state/set-state! (fn [k v]
                                             (swap! set-state-calls conj [k v]))
                          repo-handler/refresh-repos! (fn [] nil)]
            (p/let [result (db-sync/<get-remote-graphs)
                    urls (mapv :url result)]
              (is (= ["logseq_db_demo" "logseq_db_legacy"] urls))
              (is (not-any? #(re-find #"^logseq_db_logseq_db_" %) urls))
              (is (some (fn [[k v]]
                          (and (= :rtc/graphs k)
                               (= urls (mapv :url v))))
                        @set-state-calls))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest rtc-download-graph-delegates-to-worker-download-by-id-test
  (async done
         (let [worker-calls (atom [])
               state-calls (atom [])
               pub-events (atom [])]
           (-> (p/with-redefs [state/set-state! (fn [k v]
                                                  (swap! state-calls conj [k v]))
                               state/pub-event! (fn [event]
                                                  (swap! pub-events conj event)
                                                  nil)
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               state/<invoke-db-worker (fn [& args]
                                                         (swap! worker-calls conj args)
                                                         (p/resolved {:row-count 2}))]
                 (db-sync/<rtc-download-graph! "demo-graph" "graph-1" false))
               (p/then (fn [_]
                         (is (= [[:rtc/downloading-graph-uuid "graph-1"]
                                 [:rtc/downloading-graph-uuid nil]]
                                @state-calls))
                         (is (empty? @pub-events))
                         (is (= 1 (count @worker-calls)))
                         (let [[op repo graph-id graph-e2ee?] (first @worker-calls)]
                           (is (= :thread-api/db-sync-download-graph-by-id op))
                           (is (string/ends-with? repo "demo-graph"))
                           (is (= "graph-1" graph-id))
                           (is (= false graph-e2ee?)))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest rtc-download-graph-canonicalizes-prefixed-graph-name-before-worker-download-test
  (async done
         (let [worker-calls (atom [])]
           (-> (p/with-redefs [user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                            (resolve true))
                               state/<invoke-db-worker (fn [& args]
                                                         (swap! worker-calls conj args)
                                                         (p/resolved {:row-count 1}))
                               state/set-state! (fn [& _] nil)
                               state/pub-event! (fn [& _] nil)]
                 (db-sync/<rtc-download-graph! "logseq_db_demo" "graph-2" true))
               (p/then (fn [_]
                         (is (= 1 (count @worker-calls)))
                         (let [[op repo graph-id graph-e2ee?] (first @worker-calls)]
                           (is (= :thread-api/db-sync-download-graph-by-id op))
                           (is (= "logseq_db_demo" repo))
                           (is (= "graph-2" graph-id))
                           (is (= true graph-e2ee?))
                           (is (not (string/starts-with? repo "logseq_db_logseq_db_"))))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest rtc-download-graph-clears-downloading-state-on-worker-error-test
  (async done
         (let [state-calls (atom [])
               pub-events (atom [])]
           (-> (p/with-redefs [state/set-state! (fn [k v]
                                                  (swap! state-calls conj [k v]))
                               state/pub-event! (fn [event]
                                                  (swap! pub-events conj event)
                                                  nil)
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               state/<invoke-db-worker (fn [& _]
                                                         (p/rejected (ex-info "download failed" {:code :download-failed})))]
                 (db-sync/<rtc-download-graph! "demo-graph" "graph-3" false))
               (p/then (fn [_]
                         (is false "expected rejection")
                         (done)))
               (p/catch (fn [error]
                          (is (= :download-failed (-> error ex-data :code)))
                          (is (= [[:rtc/downloading-graph-uuid "graph-3"]
                                  [:rtc/downloading-graph-uuid nil]]
                                 @state-calls))
                          (is (empty? @pub-events))
                          (done)))))))
