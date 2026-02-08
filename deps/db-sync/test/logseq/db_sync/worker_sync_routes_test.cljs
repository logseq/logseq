(ns logseq.db-sync.worker-sync-routes-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db-sync.worker.routes.sync :as sync-routes]))

(deftest match-route-sync-test
  (testing "sync routes"
    (let [match (sync-routes/match-route "GET" "/")]
      (is (= :sync/root (:handler match))))
    (let [match (sync-routes/match-route "GET" "/health")]
      (is (= :sync/health (:handler match))))
    (let [match (sync-routes/match-route "GET" "/pull")]
      (is (= :sync/pull (:handler match))))
    (let [match (sync-routes/match-route "GET" "/snapshot/download")]
      (is (= :sync/snapshot-download (:handler match))))
    (let [match (sync-routes/match-route "DELETE" "/admin/reset")]
      (is (= :sync/admin-reset (:handler match))))
    (let [match (sync-routes/match-route "POST" "/tx/batch")]
      (is (= :sync/tx-batch (:handler match))))
    (let [match (sync-routes/match-route "POST" "/snapshot/upload")]
      (is (= :sync/snapshot-upload (:handler match))))))

(deftest match-route-sync-method-mismatch-test
  (testing "sync method mismatch returns nil"
    (is (nil? (sync-routes/match-route "POST" "/health")))
    (is (nil? (sync-routes/match-route "GET" "/admin/reset")))
    (is (nil? (sync-routes/match-route "PUT" "/tx/batch")))))
