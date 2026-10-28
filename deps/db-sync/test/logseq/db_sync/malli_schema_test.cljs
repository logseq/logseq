(ns logseq.db-sync.malli-schema-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.malli-schema :as db-sync-schema]
            [malli.core :as ma]))

(deftest coercer-compiles-on-first-use-and-is-shared-test
  (let [calls (atom 0)]
    (with-redefs [ma/coercer (fn [& _]
                              (swap! calls inc)
                              identity)]
      (let [coerce (#'db-sync-schema/->coercer [:map [:value :string]])]
        (is (zero? @calls))
        (is (= {:value "first"} (coerce {:value "first"})))
        (is (= {:value "second"} (coerce {:value "second"})))
        (is (= 1 @calls))))))

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

(deftest http-request-client-revision-is-optional-test
  (doseq [[schema-key body] request-samples]
    (testing schema-key
      (is (= body (coerce-request schema-key body))))))

(deftest tx-batch-request-client-revision-accepts-string-test
  (let [body' (assoc (:sync/tx-batch request-samples)
                     :client-revision "test-revision")]
    (is (= body' (coerce-request :sync/tx-batch body')))))

(deftest ws-tx-batch-client-revision-accepts-string-test
  (let [body {:type "tx/batch"
              :t-before 0
              :txs []
              :client-revision "test-revision"}]
    (is (= body (db-sync-schema/ws-client-message-coercer body)))))

(deftest tx-batch-request-client-revision-rejects-non-string-test
  (is (thrown? js/Error
               (coerce-request :sync/tx-batch
                               (assoc (:sync/tx-batch request-samples)
                                      :client-revision 42)))))

(deftest acknowledgement-validates-canonical-journal-test
  (let [body {:type "tx/batch/ok" :t-before 0 :t 1
              :txs [{:t 1 :tx "canonical Transit" :outliner-op "save-block"
                     :tx-id "00000000-0000-4000-8000-000000000001"}]}]
    (is (= :save-block (get-in (db-sync-schema/ws-server-message-coercer body)
                               [:txs 0 :outliner-op])))
    (is (uuid? (get-in (db-sync-schema/ws-server-message-coercer body) [:txs 0 :tx-id])))
    (doseq [invalid [(dissoc body :t)
                     (assoc body :t-before "invalid")
                     (assoc body :txs [{:t 1 :tx 42}])]]
      (is (thrown? js/Error (db-sync-schema/ws-server-message-coercer invalid))))))

(deftest acknowledgement-accepts-existing-client-protocol-test
  (doseq [body [{:type "tx/batch/ok" :t 1}
               {:type "tx/batch/ok" :t 1 :checksum "0000000000000000"}]]
    (is (= body (db-sync-schema/ws-server-message-coercer body)))
    (is (= body ((get db-sync-schema/http-response-coercers :sync/tx-batch) body)))))
