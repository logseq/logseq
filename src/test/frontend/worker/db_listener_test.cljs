(ns frontend.worker.db-listener-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.markdown-mirror :as markdown-mirror]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.sync :as db-sync]
            [logseq.db :as ldb]))

(deftest transit-safe-tx-meta-keeps-outliner-ops-test
  (testing "worker tx-meta sanitization should preserve semantic outliner ops"
    (let [outliner-ops [[:save-block [{:block/uuid (random-uuid)
                                       :block/title "hello"} nil]]]
          tx-meta {:outliner-op :save-block
                   :outliner-ops outliner-ops
                   :db-sync/inverse-outliner-ops outliner-ops
                   :error-handler (fn [_] nil)}
          safe-tx-meta (#'db-listener/transit-safe-tx-meta tx-meta)]
      (is (= outliner-ops (:outliner-ops safe-tx-meta)))
      (is (= outliner-ops (:db-sync/inverse-outliner-ops safe-tx-meta)))
      (is (nil? (:error-handler safe-tx-meta))))))

(deftest markdown-mirror-listener-enqueues-worker-mirror-work-test
  (let [calls (atom [])
        tx-report {:tx-data [:tx]}]
    (with-redefs [markdown-mirror/<handle-tx-report!
                  (fn [repo conn tx-report opts]
                    (swap! calls conj [repo conn tx-report opts]))]
      ((get-method db-listener/listen-db-changes :markdown-mirror)
       :markdown-mirror
       {:repo "repo"}
       tx-report))
    (is (= [["repo" nil tx-report {:defer? true}]]
           @calls))))

(deftest db-listener-persists-local-tx-before-broadcasting-ui-refresh-test
  (let [conn (d/create-conn)
        calls (atom [])]
    (with-redefs [db-sync/update-local-sync-checksum! (fn [& _] nil)
                  db-sync/handle-local-tx! (fn [& _]
                                             (swap! calls conj :persist-local-tx))
                  worker-pipeline/invoke-hooks (fn [_conn tx-report _context]
                                                 (swap! calls conj :build-ui-refresh)
                                                 {:tx-report tx-report})
                  shared-service/broadcast-to-clients! (fn [event _payload]
                                                         (when (= :sync-db-changes event)
                                                           (swap! calls conj :broadcast-ui-refresh)))]
      (db-listener/listen-db-changes! "repo" conn :handler-keys [:sync-db-to-main-thread :db-sync])
      (d/transact! conn [{:db/id -1 :block/title "b1"}] {:local-tx? true}))
    (is (= [:persist-local-tx :build-ui-refresh :broadcast-ui-refresh] @calls)
        "UI refresh work must wait until the local tx has been persisted.")))

(deftest db-listener-broadcasts-processed-transaction-data-test
  (let [conn (d/create-conn)
        payloads (atom [])]
    (with-redefs [db-sync/update-local-sync-checksum! (fn [& _] nil)
                  db-sync/handle-local-tx! (fn [& _] nil)
                  worker-pipeline/invoke-hooks (fn [_conn tx-report _context]
                                                 {:tx-report tx-report})
                  shared-service/broadcast-to-clients! (fn [event payload]
                                                         (when (= :sync-db-changes event)
                                                           (swap! payloads conj payload)))]
      (db-listener/listen-db-changes! "repo" conn :handler-keys [:sync-db-to-main-thread :db-sync])
      (d/transact! conn [{:db/id -1 :block/title "hello"}] {:local-tx? true}))
    (let [payload (first @payloads)
          roundtripped (-> payload ldb/write-transit-str ldb/read-transit-str)]
      (is (= [[:block/title "hello"]]
             (mapv (juxt :a :v) (:tx-data payload))))
      (is (= [[:block/title "hello"]]
             (mapv (juxt :a :v) (:tx-data roundtripped))))
      (is (not-any? #(contains? payload %)
                    [:changed-entity-ids
                     :task-route-candidate-ids
                     :comment-route-candidate-ids])))))
