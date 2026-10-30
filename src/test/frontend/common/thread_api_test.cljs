(ns frontend.common.thread-api-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.common.thread-api :as thread-api]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(deftest remote-function-returns-transit-safe-error-when-ex-data-is-unserializable
  (async done
         (let [api-kw :thread-api/test-unserializable-error
               prev (get @thread-api/*thread-apis api-kw)]
           (vswap! thread-api/*thread-apis assoc api-kw
                   (fn []
                     (p/rejected (ex-info "DB write failed with invalid data"
                                          {:errors #js {:fn (fn [])}}))))
           (-> (thread-api/remote-function "thread-api/test-unserializable-error"
                                           (ldb/write-transit-str []))
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
               (p/finally (fn []
                            (if prev
                              (vswap! thread-api/*thread-apis assoc api-kw prev)
                              (vswap! thread-api/*thread-apis dissoc api-kw))
                            (done)))))))
