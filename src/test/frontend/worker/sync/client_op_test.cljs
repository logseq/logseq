(ns frontend.worker.sync.client-op-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.sqlite.gc :as sqlite-gc]))

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

(deftest gc-on-client-ops-db-preserves-sync-metadata-test
  "Reproduces the bug where GC on client-ops db could reset local-tx to 0.
  The client-ops db has a kvs table (created by create-kvs-table!) but it's
  empty because client-ops doesn't store Datascript data. Running GC on an
  empty kvs table is a no-op with better-sqlite3 but can crash or misbehave
  with WASM sqlite (browser), leading to db corruption and local-tx reset."
  (let [repo "repo-gc-test"]
    (with-client-ops-db
      repo
      (fn [db]
        ;; client-ops db gets a kvs table during db open, but it's empty
        (common-sqlite/create-kvs-table! db)
        (client-op/ensure-sqlite-schema! db)
        (client-op/update-local-tx repo 42)
        (is (= 42 (client-op/get-local-tx repo))
            "local-tx should be 42 before GC")

        ;; GC on client-ops db: kvs table is empty because client-ops db
        ;; does not store Datascript data. gc-kvs-table! expects a valid
        ;; Datascript schema at kvs addr 0, which doesn't exist here.
        ;; This causes transit-js to throw "Expected first argument to be
        ;; a string" because it receives undefined instead of a transit
        ;; string. This is why gc-sqlite-dbs! must NOT include client-ops db.
        (testing "gc-kvs-table! crashes on client-ops db with empty kvs table"
          (is (thrown-with-msg?
               js/Error
               #"Expected first argument to be a string"
               (sqlite-gc/gc-kvs-table! db {:full-gc? false}))))

        ;; After GC, local-tx should still be intact
        (is (= 42 (client-op/get-local-tx repo))
            "local-tx should still be 42 after GC")

        ;; VACUUM should also be safe
        (.exec db "VACUUM")
        (is (= 42 (client-op/get-local-tx repo))
            "local-tx should still be 42 after VACUUM")))))
