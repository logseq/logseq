(ns frontend.persist-db.remote-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.persist-db.protocol :as protocol]
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
      (-> (p/let [result (remote/invoke! client "thread-api/list-db" [])
                  headers (:headers @captured)
                  body (js->clj (js/JSON.parse (:body @captured)) :keywordize-keys true)]
            (is (= [{:repo "graph-a"}] result))
            (is (= "Bearer token-1" (get headers "Authorization")))
            (is (= "thread-api/list-db" (:method body)))
            (is (string? (:argsTransit body))))
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
      (-> (remote/invoke! client "thread-api/transact" ["graph-a" [] {}])
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

(deftest connect-events-closes-current-subscription-before-reconnect
  (async done
    (let [open-count (atom 0)
          closed (atom [])
          scheduled (atom nil)
          latest-handlers (atom nil)
          wrapped-worker (fn [& _] nil)
          client (remote/create-client
                  {:base-url "http://127.0.0.1:9101"
                   :open-sse-fn (fn [{:keys [on-error]}]
                                  (let [subscription-id (swap! open-count inc)]
                                    (reset! latest-handlers {:on-error on-error})
                                    {:close! (fn []
                                               (swap! closed conj subscription-id))}))
                   :schedule-fn (fn [f _delay-ms]
                                  (reset! scheduled f)
                                  :scheduled)
                   :reconnect-delay-ms 1})
          sub (remote/connect-events! client wrapped-worker)]
      (-> (p/let [_ ((:on-error @latest-handlers) (js/Error. "disconnect"))
                  scheduled-fn @scheduled
                  _ (is (= [1] @closed))
                  _ (is (fn? scheduled-fn))
                  _ (when (fn? scheduled-fn)
                      (scheduled-fn))
                  _ ((:on-error @latest-handlers) (js/Error. "disconnect"))]
            (is (= 2 @open-count))
            (is (= [1 2] @closed))
            ((:disconnect! sub)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest connect-events-scheduled-reconnect-does-not-open-after-disconnect
  (async done
    (let [open-count (atom 0)
          scheduled (atom nil)
          latest-handlers (atom nil)
          wrapped-worker (fn [& _] nil)
          client (remote/create-client
                  {:base-url "http://127.0.0.1:9101"
                   :open-sse-fn (fn [{:keys [on-error]}]
                                  (swap! open-count inc)
                                  (reset! latest-handlers {:on-error on-error})
                                  {:close! (fn [] nil)})
                   :schedule-fn (fn [f _delay-ms]
                                  (reset! scheduled f)
                                  :scheduled)
                   :reconnect-delay-ms 1})
          sub (remote/connect-events! client wrapped-worker)]
      (-> (p/let [_ ((:on-error @latest-handlers) (js/Error. "disconnect"))
                  scheduled-fn @scheduled
                  _ (is (fn? scheduled-fn))
                  _ ((:disconnect! sub))
                  _ (when (fn? scheduled-fn)
                      (scheduled-fn))]
            (is (= 1 @open-count)))
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
      (-> (p/let [_ (remote/invoke! client "thread-api/list-db" [])
                  body (js->clj (js/JSON.parse (:body @captured)) :keywordize-keys true)]
            (is (nil? (get (:headers @captured) "Authorization")))
            (is (string? (:argsTransit body))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest remote-export-db-uses-binary-thread-api
  (async done
    (let [calls (atom [])
          client {:base-url "http://127.0.0.1:9101"}
          db (remote/->InRemote client nil nil)
          payload (js/Uint8Array. #js [1 2 3])]
      (-> (p/with-redefs [remote/invoke! (fn [client' method args]
                                          (swap! calls conj [client' method args])
                                          (p/resolved payload))]
            (p/let [result (protocol/<export-db db "graph-a" {:return-data? true})]
              (is (= [client "thread-api/export-db-binary" ["graph-a"]]
                     (first @calls)))
              (is (identical? payload result))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest remote-import-db-uses-binary-thread-api
  (async done
    (let [calls (atom [])
          client {:base-url "http://127.0.0.1:9101"}
          db (remote/->InRemote client nil nil)
          payload (.from js/Buffer "sqlite-bytes")]
      (-> (p/with-redefs [remote/invoke! (fn [client' method args]
                                          (swap! calls conj [client' method args])
                                          (p/resolved nil))]
            (p/let [_ (protocol/<import-db db "graph-a" payload)]
              (is (= [client "thread-api/import-db-binary" ["graph-a" payload]]
                     (first @calls)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))
