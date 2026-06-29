(ns logseq.db-sync.malli-schema-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.malli-schema :as db-sync-schema]))

(def ^:private request-samples
  {:graphs/create {:graph-name "Demo"}
   :graph-members/create {:email "user@example.com"}
   :graph-members/update {:role "member"}
   :sync/tx-batch {:t-before 0 :txs []}
   :e2ee/user-keys {:public-key "public"
                    :encrypted-private-key "private"}
   :e2ee/graph-aes-key {:encrypted-aes-key "aes"}
   :e2ee/grant-access {:target-user-email+encrypted-aes-key-coll
                       [{:email "user@example.com"
                         :encrypted-aes-key "aes"}]}})

(defn- coerce-request
  [schema-key body]
  ((get db-sync-schema/http-request-coercers schema-key) body))

(defn- coerce-response
  [schema-key body]
  ((get db-sync-schema/http-response-coercers schema-key) body))

(deftest http-request-client-revision-is-optional-test
  (doseq [[schema-key body] request-samples]
    (testing schema-key
      (is (= body (coerce-request schema-key body))))))

(deftest tx-batch-request-client-revision-accepts-string-test
  (let [body' (assoc (:sync/tx-batch request-samples)
                     :client-revision "test-revision")]
    (is (= body' (coerce-request :sync/tx-batch body')))))

(deftest tx-batch-request-client-revision-rejects-non-string-test
  (is (thrown? js/Error
               (coerce-request :sync/tx-batch
                               (assoc (:sync/tx-batch request-samples)
                                      :client-revision 42)))))

(deftest snapshot-download-response-accepts-stream-response-without-t-test
  (let [body {:ok true
              :key "stream/graph.snapshot"
              :url "https://sync.example.test/sync/graph/snapshot/stream"
              :content-encoding "gzip"}]
    (is (= body (coerce-response :sync/snapshot-download body)))))
