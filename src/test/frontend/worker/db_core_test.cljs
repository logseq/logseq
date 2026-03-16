(ns frontend.worker.db-core-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.db-core :as db-core]
            [frontend.worker.shared-service :as shared-service]
            [promesa.core :as p]))

(deftest db-core-registers-db-sync-thread-apis
  (let [api-map @thread-api/*thread-apis]
    (is (contains? api-map :thread-api/set-db-sync-config))
    (is (contains? api-map :thread-api/db-sync-start))
    (is (contains? api-map :thread-api/db-sync-stop))
    (is (contains? api-map :thread-api/db-sync-update-presence))
    (is (contains? api-map :thread-api/db-sync-request-asset-download))
    (is (contains? api-map :thread-api/db-sync-grant-graph-access))
    (is (contains? api-map :thread-api/db-sync-ensure-user-rsa-keys))
    (is (contains? api-map :thread-api/db-sync-upload-graph))
    (is (contains? api-map :thread-api/db-sync-import-kvs-rows))))

(deftest init-service-does-not-close-db-when-graph-unchanged
  (async done
    (let [service {:status {:ready (p/resolved true)}
                   :proxy #js {}}
          close-calls (atom [])
          create-calls (atom 0)
          *service @#'db-core/*service
          old-service @*service]
      (reset! *service ["graph-a" service])
      (with-redefs [db-core/close-db! (fn [repo]
                                        (swap! close-calls conj repo)
                                        nil)
                    shared-service/<create-service (fn [& _]
                                                     (swap! create-calls inc)
                                                     (p/resolved service))]
        (-> (#'db-core/<init-service! "graph-a" {})
            (p/then (fn [result]
                      (is (= service result))
                      (is (= [] @close-calls))
                      (is (zero? @create-calls))))
            (p/catch (fn [e]
                       (is false (str "unexpected error: " e))))
            (p/finally (fn []
                         (reset! *service old-service)
                         (done))))))))
