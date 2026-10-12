(ns frontend.worker.sync.util-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [frontend.worker.platform :as platform]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.util :as sync-util]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(deftest cli-node-owner-needs-node-runtime-and-cli-owner-test
  (with-redefs [platform/current (fn [] {:env {:runtime :node :owner-source :electron}})]
    (is (false? (sync-util/cli-node-owner?))))
  (with-redefs [platform/current (fn [] {:env {:runtime :browser :owner-source :cli}})]
    (is (false? (sync-util/cli-node-owner?))))
  (with-redefs [platform/current (fn [] {:env {:runtime :node :owner-source :cli}})]
    (is (true? (sync-util/cli-node-owner?)))))

(deftest get-graph-id-prefers-db-graph-uuid-then-client-op-test
  (let [db-uuid #uuid "6a1d0c1e-0000-4000-8000-0000000000aa"
        op-uuid #uuid "6a1d0c1e-0000-4000-8000-0000000000bb"]
    (with-redefs [worker-state/get-datascript-conn (fn [_repo] (atom :db))
                  ldb/get-graph-rtc-uuid (fn [_db] db-uuid)
                  client-op/get-graph-uuid (fn [_repo] nil)]
      (is (= (str db-uuid) (sync-util/get-graph-id "repo"))))
    (with-redefs [worker-state/get-datascript-conn (fn [_repo] (atom :db))
                  ldb/get-graph-rtc-uuid (fn [_db] nil)
                  client-op/get-graph-uuid (fn [_repo] op-uuid)]
      (is (= (str op-uuid) (sync-util/get-graph-id "repo"))))
    (with-redefs [worker-state/get-datascript-conn (fn [_repo] nil)
                  client-op/get-graph-uuid (fn [_repo] op-uuid)]
      (is (= (str op-uuid) (sync-util/get-graph-id "repo"))))))

(defn- <fetch-json-with-response
  "Calls fetch-json against a stubbed fetch answering `status` and `text`.
  Resolves to {:requests [...] :result value :error rejection}. (A promise
  step returning an error would reject the chain, so a rejection is wrapped.)"
  [status text opts fetch-opts]
  (let [requests (atom [])
        original-fetch (.-fetch js/globalThis)
        original-token (:auth/id-token @worker-state/*state)]
    (swap! worker-state/*state assoc :auth/id-token "token")
    (set! (.-fetch js/globalThis)
          (fn [url init]
            (swap! requests conj {:url url :init (js->clj init)})
            (p/resolved #js {:ok (< status 300)
                             :status status
                             :text (fn [] (p/resolved text))})))
    (-> (p/let [settled (-> (sync-util/fetch-json "https://sync.test/x" opts fetch-opts)
                            (p/then (fn [value] {:result value}))
                            (p/catch (fn [e] {:error e})))]
          (assoc settled :requests @requests))
        (p/finally (fn []
                     (set! (.-fetch js/globalThis) original-fetch)
                     (swap! worker-state/*state assoc :auth/id-token original-token))))))

(deftest-async fetch-json-keeps-caller-headers-test
  (p/let [{:keys [requests]} (<fetch-json-with-response
                              200 "{\"ok\":true}"
                              {:method "POST" :headers {"content-type" "application/json"}}
                              {})]
    (is (= {"content-type" "application/json"
            "authorization" "Bearer token"}
           (get-in (first requests) [:init "headers"])))))

(deftest-async fetch-json-rejects-a-response-its-schema-rejects-test
  (p/let [{:keys [error result]} (<fetch-json-with-response
                                  200 "{\"foo\":1}" {} {:response-schema :worker/health})
          ok (<fetch-json-with-response
              200 "{\"ok\":true}" {} {:response-schema :worker/health})]
    (is (nil? result))
    (is (= "db-sync invalid response" (ex-message error)))
    (is (= {:ok true} (:result ok)))))

(deftest-async fetch-json-error-body-is-coerced-by-error-schema-test
  (p/let [{valid :error} (<fetch-json-with-response
                          400 "{\"error\":\"bad\"}" {} {})
          {invalid :error} (<fetch-json-with-response
                            400 "{\"message\":\"bad\"}" {} {})]
    (is (= "db-sync request failed" (ex-message valid)))
    (is (= {:status 400 :url "https://sync.test/x" :body {:error "bad"}}
           (ex-data valid)))
    (is (= "db-sync request failed" (ex-message invalid)))
    (is (nil? (:body (ex-data invalid))))))
