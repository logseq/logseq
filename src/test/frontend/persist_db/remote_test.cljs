(ns frontend.persist-db.remote-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.persist-db.remote :as remote]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(deftest invoke-success-returns-decoded-transit-result
  (async done
    (let [captured (atom nil)
          client (remote/create-client
                  {:base-url "http://127.0.0.1:9101"
                   :auth-token "token-1"
                   :fetch-fn (fn [req]
                               (reset! captured req)
                               (p/resolved {:status 200
                                            :body (js/JSON.stringify
                                                   #js {:ok true
                                                        :resultTransit (ldb/write-transit-str [{:repo "graph-a"}])})}))})]
      (-> (p/let [result (remote/invoke! client "thread-api/list-db" false [])
                  headers (:headers @captured)]
            (is (= [{:repo "graph-a"}] result))
            (is (= "Bearer token-1" (get headers "Authorization"))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest invoke-error-propagates-status-and-error-code
  (async done
    (let [client (remote/create-client
                  {:base-url "http://127.0.0.1:9101"
                   :fetch-fn (fn [_req]
                               (p/resolved {:status 409
                                            :body (js/JSON.stringify
                                                   #js {:ok false
                                                        :error #js {:code "repo-locked"
                                                                    :message "graph already locked"}})}))})]
      (-> (remote/invoke! client "thread-api/transact" false ["graph-a" [] {}])
          (p/then (fn [_]
                    (is false "expected invoke! to reject on non-2xx status")))
          (p/catch (fn [e]
                     (let [data (ex-data e)]
                       (is (= 409 (:status data)))
                       (is (= :repo-locked (:code data))))))
          (p/finally (fn [] (done)))))))

(deftest connect-events-parses-sse-and-reconnects
  (async done
    (let [events (atom [])
          open-count (atom 0)
          scheduled (atom nil)
          latest-handlers (atom nil)
          wrapped-worker (fn [& _] nil)
          client (remote/create-client
                  {:base-url "http://127.0.0.1:9101"
                   :auth-token "token-1"
                   :event-handler (fn [event-type wrapped-worker' payload]
                                    (swap! events conj [event-type wrapped-worker' payload]))
                   :open-sse-fn (fn [{:keys [on-message on-error]}]
                                  (swap! open-count inc)
                                  (reset! latest-handlers {:on-message on-message
                                                           :on-error on-error})
                                  {:close! (fn [] nil)})
                   :schedule-fn (fn [f _delay-ms]
                                  (reset! scheduled f)
                                  :scheduled)
                   :reconnect-delay-ms 1})
          sub (remote/connect-events! client wrapped-worker)
          payload (ldb/write-transit-str [:thread-api/persist-db {:repo "graph-a"}])]
      (-> (p/let [_ ((:on-message @latest-handlers)
                     (str "data: " (js/JSON.stringify #js {:type "thread-api/persist-db"
                                                           :payload payload})
                          "\n\n"))
                  _ (is (= [[:thread-api/persist-db wrapped-worker {:repo "graph-a"}]] @events))
                  _ ((:on-error @latest-handlers) (js/Error. "disconnect"))
                  scheduled-fn @scheduled
                  _ (is (fn? scheduled-fn))
                  _ (when (fn? scheduled-fn)
                      (scheduled-fn))]
            (is (= 2 @open-count))
            ((:disconnect! sub)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest invoke-without-auth-token-omits-authorization-header
  (async done
    (let [captured (atom nil)
          client (remote/create-client
                  {:base-url "http://127.0.0.1:9101"
                   :fetch-fn (fn [req]
                               (reset! captured req)
                               (p/resolved {:status 200
                                            :body (js/JSON.stringify
                                                   #js {:ok true
                                                        :resultTransit (ldb/write-transit-str [])})}))})]
      (-> (p/let [_ (remote/invoke! client "thread-api/list-db" false [])]
            (is (nil? (get (:headers @captured) "Authorization"))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))
