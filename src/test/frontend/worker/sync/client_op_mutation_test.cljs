(ns frontend.worker.sync.client-op-mutation-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]
            [goog.object :as gobj]))

(defn- new-memory-db
  []
  (let [Database (js/require "better-sqlite3")]
    (new Database ":memory:")))

(defn- with-client-ops-db
  [repo f]
  (let [db (new-memory-db)
        prev-client-ops-conns @worker-state/*client-ops-conns
        prev-counts @client-op/*repo->pending-local-tx-count]
    (reset! worker-state/*client-ops-conns {repo db})
    (reset! client-op/*repo->pending-local-tx-count {})
    (try
      (f db)
      (finally
        (.close db)
        (reset! client-op/*repo->pending-local-tx-count prev-counts)
        (reset! worker-state/*client-ops-conns prev-client-ops-conns)))))

(defn- sqlite-count
  [^js db sql]
  (aget (.get (.prepare db sql)) "c"))

(deftest sqlite-mode-is-cached-on-the-db-test
  (with-client-ops-db
    "repo-mode"
    (fn [db]
      (client-op/get-graph-uuid "repo-mode")
      (is (= :better-sqlite (gobj/get db "__logseq_client_ops_sqlite_mode"))))))

(deftest int-bool-and-normalize-op-entries-test
  (let [int->bool #'client-op/int->bool]
    (is (false? (int->bool nil)))
    (is (false? (int->bool 0)))
    (is (false? (int->bool false)))
    (is (true? (int->bool 1)))
    (is (true? (int->bool true)))
    (is (true? (int->bool 5))))
  (let [normalize #'client-op/normalize-op-entries]
    (is (nil? (normalize nil)))
    (is (= [[:move-blocks [1 2]]] (normalize [:move-blocks [1 2]])))
    (is (= [[:move-blocks [1 2]] [:save-block [3]]]
           (normalize [[:move-blocks [1 2]] [:save-block [3]]])))))

(deftest sqlite-row-takes-the-first-row-test
  (with-client-ops-db
    "repo-row"
    (fn [db]
      (is (= 1 (aget (#'client-op/sqlite-row db "select 1 as v union all select 2 as v" []) "v"))))))

(deftest update-local-tx-requires-a-non-negative-integer-test
  (with-client-ops-db
    "repo-tx"
    (fn [_db]
      (is (thrown? js/Error (client-op/update-local-tx "repo-tx" -1)))
      (is (thrown? js/Error (client-op/update-local-tx "repo-tx" 1.5)))
      (client-op/update-local-tx "repo-tx" 3)
      (is (= 3 (client-op/get-local-tx "repo-tx"))))))

(deftest adjust-pending-local-tx-count-accumulates-and-clamps-test
  (with-client-ops-db
    "repo-count"
    (fn [_db]
      (client-op/adjust-pending-local-tx-count! "repo-count" 3)
      (client-op/adjust-pending-local-tx-count! "repo-count" 2)
      (is (= 5 (get @client-op/*repo->pending-local-tx-count "repo-count")))
      (client-op/adjust-pending-local-tx-count! "repo-count" -9)
      (is (= 0 (get @client-op/*repo->pending-local-tx-count "repo-count"))))))

(deftest rtc-db-graph-without-process-needs-a-graph-uuid-test
  (with-client-ops-db
    "repo-rtc"
    (fn [_db]
      (let [saved (aget js/globalThis "process")]
        (try
          (aset js/globalThis "process" js/undefined)
          (let [without-uuid (client-op/rtc-db-graph? "repo-rtc")
                _ (client-op/update-graph-uuid "repo-rtc" "graph-1")
                with-uuid (client-op/rtc-db-graph? "repo-rtc")]
            (aset js/globalThis "process" saved)
            (is (false? without-uuid))
            (is (true? with-uuid)))
          (finally
            (aset js/globalThis "process" saved)))))))

(deftest upsert-local-tx-entry-reports-whether-to-count-pending-test
  (with-client-ops-db
    "repo-upsert"
    (fn [_db]
      (let [tx-id (random-uuid)
            first-write (client-op/upsert-local-tx-entry! "repo-upsert" {:tx-id tx-id :inferred-outliner-ops? true})
            second-write (client-op/upsert-local-tx-entry! "repo-upsert" {:tx-id tx-id})
            _ (client-op/mark-pending-txs-false! "repo-upsert" [tx-id])
            third-write (client-op/upsert-local-tx-entry! "repo-upsert" {:tx-id tx-id})]
        (is (true? (:should-inc-pending? first-write)))
        (is (false? (:should-inc-pending? second-write)))
        (is (true? (:should-inc-pending? third-write)))
        (is (false? (:inferred-outliner-ops? (client-op/get-local-tx-entry "repo-upsert" tx-id))))))))

(deftest add-sync-conflicts-ignores-malformed-entries-test
  (with-client-ops-db
    "repo-conflicts"
    (fn [db]
      (let [block-uuid (random-uuid)]
        (client-op/add-sync-conflicts!
         "repo-conflicts"
         [{:block-uuid "not-a-uuid" :attr :block/title :value "v"}
          {:block-uuid block-uuid :attr :title :value "v"}
          {:block-uuid block-uuid :attr :block/title :value 5}])
        (is (= 0 (sqlite-count db "select count(*) as c from sync_conflicts")))
        (client-op/add-sync-conflicts!
         "repo-conflicts"
         [{:block-uuid block-uuid :attr :block/title :value "v" :remote-t 1}])
        (is (= 1 (sqlite-count db "select count(*) as c from sync_conflicts")))
        (is (= ["v"] (mapv :value (client-op/get-sync-conflicts "repo-conflicts" block-uuid))))))))

(deftest asset-ops-keep-stored-value-and-break-ties-test
  (with-client-ops-db
    "repo-asset-ops"
    (fn [^js db]
      (let [repo "repo-asset-ops"
            tie-1 (random-uuid)
            tie-2 (random-uuid)
            store (#'client-op/sqlite-store-or-throw repo)]
        (testing "the stored value is read back whole"
          (let [with-extra (random-uuid)]
            (client-op/add-asset-ops repo [[:update-asset 10 {:block-uuid with-extra :extra 1}]])
            (is (= [:update-asset 10 {:block-uuid with-extra :extra 1}]
                   (:update-asset (#'client-op/sqlite-asset-op-by-uuid store with-extra))))))
        (testing "an update at the same t replaces a remove"
          (client-op/add-asset-ops repo [[:remove-asset 10 {:block-uuid tie-1}]])
          (client-op/add-asset-ops repo [[:update-asset 10 {:block-uuid tie-1}]])
          (is (= [:update-asset 10 {:block-uuid tie-1}]
                 (:update-asset (#'client-op/sqlite-asset-op-by-uuid store tie-1)))))
        (testing "a remove at the same t replaces an update"
          (client-op/add-asset-ops repo [[:update-asset 10 {:block-uuid tie-2}]])
          (client-op/add-asset-ops repo [[:remove-asset 10 {:block-uuid tie-2}]])
          (is (= [:remove-asset 10 {:block-uuid tie-2}]
                 (:remove-asset (#'client-op/sqlite-asset-op-by-uuid store tie-2)))))
        (testing "rows without a value are not listed"
          (.run ^js (.prepare db (str "insert into client_ops (kind, created_at, asset_uuid, asset_op, asset_t, asset_value) "
                                  "values ('asset', 1, 'x', 'update-asset', 1, NULL)")))
          (is (= 3 (count (client-op/get-all-asset-ops repo)))))))))
