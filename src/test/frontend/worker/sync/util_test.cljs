(ns frontend.worker.sync.util-test
  (:require [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
            [frontend.worker.sync.util :as sync-util]
            [logseq.common.version :as build-version]
            [promesa.core :as p]))

(deftest coerce-http-request-adds-client-revision-to-tx-batch-test
  (is (= (build-version/revision)
         (:client-revision
          (sync-util/coerce-http-request :sync/tx-batch
                                         {:t-before 0
                                          :txs []})))))

(deftest coerce-http-request-does-not-add-client-revision-to-other-requests-test
  (is (= {:graph-name "Demo"}
         (sync-util/coerce-http-request :graphs/create
                                        {:graph-name "Demo"}))))

(deftest coerce-http-request-preserves-explicit-client-revision-test
  (is (= "explicit-revision"
         (:client-revision
          (sync-util/coerce-http-request :sync/tx-batch
                                         {:t-before 0
                                          :txs []
                                          :client-revision "explicit-revision"})))))

(deftest fetch-json-preserves-network-cause-in-diagnostics-test
  (async done
         (let [original-fetch js/fetch
               cause (js/Object.assign (js/Error. "unable to get local issuer certificate")
                                       #js {:code "UNABLE_TO_GET_ISSUER_CERT_LOCALLY"})
               error (js/TypeError. "fetch failed" #js {:cause cause})
               url "https://example.com/e2ee/user-keys"]
           (set! js/fetch (fn [_url _opts] (p/rejected error)))
           (-> (p/with-redefs [sync-util/auth-token (constantly "secret-token")]
                 (sync-util/fetch-json url {} {}))
               (p/then (fn [_] (is false "Expected TLS failure")))
               (p/catch (fn [result]
                          (is (= "UNABLE_TO_GET_ISSUER_CERT_LOCALLY" (:code (ex-data result))))
                          (is (string/includes? (ex-message result) "UNABLE_TO_GET_ISSUER_CERT_LOCALLY"))
                          (is (string/includes? (ex-message result) "unable to get local issuer certificate"))
                          (is (identical? error (ex-cause result)))))
               (p/finally (fn []
                            (set! js/fetch original-fetch)
                            (done)))))))

(deftest fetch-json-preserves-errors-without-a-cause-test
  (async done
         (let [original-fetch js/fetch
               error (js/TypeError. "Failed to fetch")]
           (set! js/fetch (fn [_url _opts] (p/rejected error)))
           (-> (p/with-redefs [sync-util/auth-token (constantly "token")]
                 (sync-util/fetch-json "https://example.com/e2ee/user-keys" {} {}))
               (p/then (fn [_] (is false "Expected network failure")))
               (p/catch (fn [result]
                          (is (identical? error result))))
               (p/finally (fn []
                            (set! js/fetch original-fetch)
                            (done)))))))
