(ns frontend.worker.db-core-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.db-core :as db-core]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
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
    (is (contains? api-map :thread-api/db-sync-upload-graph))))

(deftest set-db-sync-config-keeps-only-non-auth-fields-test
  (let [set-config! (get @thread-api/*thread-apis :thread-api/set-db-sync-config)
        get-config (get @thread-api/*thread-apis :thread-api/get-db-sync-config)
        state-prev @worker-state/*state
        config-prev @worker-state/*db-sync-config]
    (try
      (reset! worker-state/*state (assoc state-prev
                                         :auth/id-token "existing-id-token"
                                         :auth/oauth-token-url "https://existing.example.com/oauth2/token"
                                         :auth/oauth-domain "existing.example.com"
                                         :auth/oauth-client-id "existing-client-id"))
      (set-config! {:ws-url "wss://example.com/sync/%s"
                    :http-base "https://example.com"
                    :enabled? true
                    :auth-token "id-token-from-config"
                    :oauth-token-url "https://auth.example.com/oauth2/token"
                    :oauth-domain "auth.example.com"
                    :oauth-client-id "worker-client-id"})
      (is (= {:ws-url "wss://example.com/sync/%s"
              :http-base "https://example.com"
              :enabled? true}
             @worker-state/*db-sync-config))
      (is (= {:ws-url "wss://example.com/sync/%s"
              :http-base "https://example.com"
              :enabled? true}
             (get-config)))
      (is (= "existing-id-token" (:auth/id-token @worker-state/*state)))
      (is (= "https://existing.example.com/oauth2/token"
             (:auth/oauth-token-url @worker-state/*state)))
      (is (= "existing.example.com" (:auth/oauth-domain @worker-state/*state)))
      (is (= "existing-client-id" (:auth/oauth-client-id @worker-state/*state)))
      (finally
        (reset! worker-state/*state state-prev)
        (reset! worker-state/*db-sync-config config-prev)))))

(deftest get-db-sync-config-strips-auth-fields-test
  (let [get-config (get @thread-api/*thread-apis :thread-api/get-db-sync-config)
        config-prev @worker-state/*db-sync-config]
    (try
      (reset! worker-state/*db-sync-config {:ws-url "wss://example.com/sync/%s"
                                            :auth-token "leaked-token"
                                            :oauth-client-id "leaked-client"})
      (is (= {:ws-url "wss://example.com/sync/%s"}
             (get-config)))
      (finally
        (reset! worker-state/*db-sync-config config-prev)))))

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
