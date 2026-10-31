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
