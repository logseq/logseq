(ns frontend.common.thread-api-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.common.thread-api :as thread-api]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- invoke-rejected-api
  [api-kw error]
  (let [prev (get @thread-api/*thread-apis api-kw)]
    (vswap! thread-api/*thread-apis assoc api-kw (fn [] (p/rejected error)))
    (-> (thread-api/remote-function (subs (str api-kw) 1)
                                    (ldb/write-transit-str []))
        (p/finally (fn []
                     (if prev
                       (vswap! thread-api/*thread-apis assoc api-kw prev)
                       (vswap! thread-api/*thread-apis dissoc api-kw)))))))

(deftest remote-function-returns-transit-safe-error-when-ex-data-is-unserializable
  (async done
         (-> (invoke-rejected-api :thread-api/test-unserializable-error
                                  (ex-info "DB write failed with invalid data"
                                           {:errors #js {:fn (fn [])}}))
             (p/then (fn [result]
                       (is (string? result)
                           (str "remote-function must resolve with a transit string, got "
                                (pr-str (type result))))
                       (let [error (ldb/read-transit-str result)]
                         (is (instance? ExceptionInfo error) (pr-str error))
                         (is (= "DB write failed with invalid data" (ex-message error)))
                         (is (map? (ex-data error))))))
             (p/catch (fn [error]
                        (is false (str "unserializable error must not kill the worker: " error))))
             (p/finally done))))

(deftest remote-function-preserves-notification-and-query-error-data
  (async done
         (-> (p/do!
              (-> (invoke-rejected-api :thread-api/test-notification-error
                                       (ex-info "class exists"
                                                {:type :notification
                                                 :payload {:message "Duplicate page"
                                                           :type :warning}}))
                  (p/then (fn [result]
                            (let [error (ldb/read-transit-str result)]
                              (is (= :notification (:type (ex-data error))))
                              (is (= "Duplicate page" (get-in (ex-data error) [:payload :message])))
                              (is (= :warning (get-in (ex-data error) [:payload :type])))))))
              (-> (invoke-rejected-api :thread-api/test-query-error
                                       (ex-info "bad query"
                                                {:error :parser/query
                                                 :payload {:message "Expected ]"}}))
                  (p/then (fn [result]
                            (let [error (ldb/read-transit-str result)]
                              (is (= :parser/query (:error (ex-data error))))
                              (is (= "Expected ]" (get-in (ex-data error) [:payload :message]))))))))
             (p/catch (fn [error]
                        (is false (str error))))
             (p/finally done))))

(def ^:private repo "logseq_db_thread-api-gate-test")

(defn- call [api & args]
  (p/let [result (thread-api/remote-function (subs (str api) 1) (ldb/write-transit-str (vec args)))]
    (ldb/read-transit-str result)))

(defn- with-thread-apis
  "Runs (f) with these thread apis registered, restoring the previous ones afterwards."
  [apis f]
  (let [previous (select-keys @thread-api/*thread-apis (keys apis))]
    (vswap! thread-api/*thread-apis merge apis)
    (p/finally (f)
               (fn []
                 (vswap! thread-api/*thread-apis #(merge (apply dissoc % (keys apis)) previous))))))

(deftest a-call-sent-behind-the-graph-open-runs-after-it-test
  (async done
         (let [opened? (atom false)]
           (-> (with-thread-apis
                 {:thread-api/create-or-open-db (fn [_repo _opts]
                                                  (p/let [_ (p/delay 50)]
                                                    (reset! opened? true)
                                                    {:schema {}}))
                  :thread-api/gate-test-read (fn [_repo] @opened?)}
                 (fn []
                   ;; sent in this order, as the renderer does right after a reload
                   (let [open (call :thread-api/create-or-open-db repo {})
                         read (call :thread-api/gate-test-read repo)]
                     (p/let [read-result read
                             _ open]
                       (is (true? read-result) "the read ran on the opened graph, not before it")))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest calls-for-other-graphs-and-after-the-open-do-not-wait-test
  (async done
         (let [opened? (atom false)]
           (-> (with-thread-apis
                 {:thread-api/create-or-open-db (fn [_repo _opts]
                                                  (p/let [_ (p/delay 200)]
                                                    (reset! opened? true)
                                                    {:schema {}}))
                  :thread-api/gate-test-read (fn [_repo] @opened?)}
                 (fn []
                   (let [open (call :thread-api/create-or-open-db repo {})]
                     (p/let [other (call :thread-api/gate-test-read "logseq_db_another-graph")
                             _ open
                             after (call :thread-api/gate-test-read repo)]
                       (is (false? other) "a call for another graph runs at once")
                       (is (true? after) "a call after the open runs normally")))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest a-failed-open-releases-its-waiters-test
  (async done
         (let [read-ran? (atom false)]
           (-> (with-thread-apis
                 {:thread-api/create-or-open-db (fn [_repo _opts]
                                                  (p/let [_ (p/delay 50)]
                                                    (throw (ex-info "open failed" {}))))
                  :thread-api/gate-test-read (fn [_repo] (reset! read-ran? true) :ran)}
                 (fn []
                   (let [open (-> (call :thread-api/create-or-open-db repo {}) (p/catch (fn [_] :open-failed)))]
                     (p/let [read-result (call :thread-api/gate-test-read repo)
                             _ open]
                       (is (true? @read-ran?) "the read still runs after a failed open")
                       (is (= :ran read-result))))))
               (p/catch (fn [e] (is false (str "unexpected error: " e))))
               (p/finally done)))))
