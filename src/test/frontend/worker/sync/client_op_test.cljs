(ns frontend.worker.sync.client-op-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]))

(defn- new-memory-db
  []
  (let [Database (js/require "better-sqlite3")]
    (new Database ":memory:")))

(defn- with-client-ops-db
  [repo f]
  (let [db (new-memory-db)
        prev-client-ops-conns @worker-state/*client-ops-conns]
    (reset! worker-state/*client-ops-conns {repo db})
    (try
      (f db)
      (finally
        (.close db)
        (reset! worker-state/*client-ops-conns prev-client-ops-conns)))))

(defn- sqlite-count
  [^js db sql & args]
  (let [^js stmt (.prepare db sql)
        ^js row (if (seq args)
                  (.apply (.-get stmt) stmt (to-array args))
                  (.get stmt))]
    (if row
      (or (aget row "c")
          (aget row "count"))
      0)))

(deftest sqlite-sync-meta-roundtrip-test
  (let [repo "repo-1"]
    (with-client-ops-db
      repo
      (fn [_db]
        (client-op/update-graph-uuid repo "graph-1")
        (client-op/update-local-tx repo 9)
        (client-op/update-local-checksum repo "checksum-1")

        (client-op/update-graph-uuid repo "graph-2")
        (client-op/update-local-tx repo 12)
        (client-op/update-local-checksum repo "checksum-2")

        (is (= "graph-2" (client-op/get-graph-uuid repo)))
        (is (= 12 (client-op/get-local-tx repo)))
        (is (= "checksum-2" (client-op/get-local-checksum repo)))))))

(deftest sqlite-asset-ops-coalescing-test
  (let [repo "repo-asset"
        asset-uuid (random-uuid)]
    (with-client-ops-db
      repo
      (fn [_db]
        (client-op/add-asset-ops repo [[:update-asset 10 {:block-uuid asset-uuid}]])
        (is (= 1 (client-op/get-unpushed-asset-ops-count repo)))
        (is (= [:update-asset 10 {:block-uuid asset-uuid}]
               (:update-asset (first (client-op/get-all-asset-ops repo)))))

        ;; older remove should be ignored because a newer update already exists
        (client-op/add-asset-ops repo [[:remove-asset 9 {:block-uuid asset-uuid}]])
        (is (= [:update-asset 10 {:block-uuid asset-uuid}]
               (:update-asset (first (client-op/get-all-asset-ops repo)))))

        ;; newer remove should replace update
        (client-op/add-asset-ops repo [[:remove-asset 11 {:block-uuid asset-uuid}]])
        (is (= [:remove-asset 11 {:block-uuid asset-uuid}]
               (:remove-asset (first (client-op/get-all-asset-ops repo)))))

        (client-op/remove-asset-op repo asset-uuid)
        (is (= 0 (client-op/get-unpushed-asset-ops-count repo)))))))

(deftest cleanup-finished-history-ops-removes-only-unreferenced-finished-txs-test
  (let [repo "repo-cleanup"
        keep-tx-id (random-uuid)
        remove-tx-id (random-uuid)
        pending-tx-id (random-uuid)]
    (with-client-ops-db
      repo
      (fn [db]
        (client-op/update-local-tx repo 99)
        (client-op/upsert-local-tx-entry!
         repo
         {:tx-id keep-tx-id
          :created-at 1
          :pending? false
          :failed? false
          :normalized-tx-data []
          :reversed-tx-data []})
        (client-op/upsert-local-tx-entry!
         repo
         {:tx-id remove-tx-id
          :created-at 2
          :pending? false
          :failed? false
          :normalized-tx-data []
          :reversed-tx-data []})
        (client-op/upsert-local-tx-entry!
         repo
         {:tx-id pending-tx-id
          :created-at 3
          :pending? true
          :failed? false
          :normalized-tx-data []
          :reversed-tx-data []})

        (is (= 1 (client-op/cleanup-finished-history-ops! repo #{keep-tx-id})))
        (is (= 1 (sqlite-count db "select count(*) as c from client_ops where tx_id = ?" (str keep-tx-id))))
        (is (= 0 (sqlite-count db "select count(*) as c from client_ops where tx_id = ?" (str remove-tx-id))))
        (is (= 1 (sqlite-count db "select count(*) as c from client_ops where tx_id = ?" (str pending-tx-id))))
        (is (= 99 (client-op/get-local-tx repo)))))))

(deftest cleanup-finished-history-ops-no-conn-is-noop-test
  (let [repo "repo-no-conn"
        prev-client-ops-conns @worker-state/*client-ops-conns]
    (reset! worker-state/*client-ops-conns {})
    (try
      (testing "cleanup should be safe when client-ops conn is missing"
        (is (= 0 (client-op/cleanup-finished-history-ops! repo #{}))))
      (finally
        (reset! worker-state/*client-ops-conns prev-client-ops-conns)))))

(deftest reset-local-tx-preserves-monotonicity-test
  (let [repo "repo-monotonic"]
    (with-client-ops-db
      repo
      (fn [_db]
        (client-op/update-local-tx repo 9)
        (let [error (try
                      (client-op/reset-local-tx repo)
                      nil
                      (catch :default error
                        error))]
          (is (some? error))
          (is (= "local-tx should be monotonically increasing"
                 (ex-message error)))
          (is (= {:repo repo
                  :prev-t 9
                  :new-t 0}
                 (select-keys (ex-data error) [:repo :prev-t :new-t])))
          (is (= 9 (client-op/get-local-tx repo))))))))
