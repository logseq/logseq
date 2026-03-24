(ns frontend.worker.sync.client-op-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]))

(deftest update-graph-uuid-replaces-existing-value-test
  (let [repo "repo-1"
        conn (d/create-conn client-op/schema-in-db)
        prev-client-ops-conns @worker-state/*client-ops-conns]
    (reset! worker-state/*client-ops-conns {repo conn})
    (try
      (client-op/update-graph-uuid repo "graph-1")
      (client-op/update-graph-uuid repo "graph-2")
      (let [graph-uuid-datoms (vec (d/datoms @conn :avet :graph-uuid))]
        (is (= 1 (count graph-uuid-datoms)))
        (is (= #{"graph-2"} (set (map :v graph-uuid-datoms)))))
      (finally
        (reset! worker-state/*client-ops-conns prev-client-ops-conns)))))

(deftest cleanup-finished-history-ops-removes-only-unreferenced-finished-txs-test
  (let [repo "repo-cleanup"
        conn (d/create-conn client-op/schema-in-db)
        prev-client-ops-conns @worker-state/*client-ops-conns
        keep-tx-id (random-uuid)
        remove-tx-id (random-uuid)
        pending-tx-id (random-uuid)]
    (reset! worker-state/*client-ops-conns {repo conn})
    (try
      (d/transact! conn
                   [{:db-sync/tx-id keep-tx-id
                     :db-sync/pending? false}
                    {:db-sync/tx-id remove-tx-id
                     :db-sync/pending? false}
                    {:db-sync/tx-id pending-tx-id
                     :db-sync/pending? true}
                    {:db-ident :metadata/local
                     :local-tx 99}])

      (is (= 1 (client-op/cleanup-finished-history-ops! repo #{keep-tx-id})))
      (is (some? (d/entity @conn [:db-sync/tx-id keep-tx-id])))
      (is (nil? (d/entity @conn [:db-sync/tx-id remove-tx-id])))
      (is (some? (d/entity @conn [:db-sync/tx-id pending-tx-id])))
      (is (= 99 (:local-tx (d/entity @conn [:db-ident :metadata/local]))))
      (finally
        (reset! worker-state/*client-ops-conns prev-client-ops-conns)))))

(deftest cleanup-finished-history-ops-no-conn-is-noop-test
  (let [repo "repo-no-conn"
        prev-client-ops-conns @worker-state/*client-ops-conns]
    (reset! worker-state/*client-ops-conns {})
    (try
      (testing "cleanup should be safe when client-ops conn is missing"
        (is (= 0 (client-op/cleanup-finished-history-ops! repo #{}))))
      (finally
        (reset! worker-state/*client-ops-conns prev-client-ops-conns)))))
