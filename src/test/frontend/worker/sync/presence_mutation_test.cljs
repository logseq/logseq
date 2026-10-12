(ns frontend.worker.sync.presence-mutation-test
  "Tests for frontend.worker.sync.presence found by mutation testing"
  (:require [cljs.test :refer [deftest is]]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.presence :as sync-presence]))

(defn- sync-counts
  "sync-presence/sync-counts for repo \"r\" with local tx local-tx and remote tx remote-tx."
  [local-tx remote-tx]
  (sync-presence/sync-counts
   {:get-datascript-conn (fn [_repo] :conn)
    :get-unpushed-asset-ops-count (fn [_repo] 0)
    :get-local-tx (fn [_repo] local-tx)
    :get-graph-uuid (fn [_repo] "graph-1")
    :latest-remote-tx (if (some? remote-tx) {"r" remote-tx} {})
    :latest-remote-checksum {}}
   "r"))

(deftest sync-counts-pending-server-test
  (with-redefs [worker-state/*db-sync-client (atom nil)
                worker-state/*db-sync-config (atom {})]
    (is (= 4 (:pending-server (sync-counts 3 7))))
    (is (= 0 (:pending-server (sync-counts 7 3))))
    (is (nil? (:pending-server (sync-counts 3 nil)))
        "unknown when the remote tx is unknown")))

(deftest sync-counts-ws-state-test
  (with-redefs [worker-state/*db-sync-client (atom {:repo "r" :ws-state (atom :open)})
                worker-state/*db-sync-config (atom {:ws-url "wss://sync.example.test"})]
    (is (= :open (:ws-state (sync-counts 1 1))) "the client's own ws state"))
  (with-redefs [worker-state/*db-sync-client (atom nil)
                worker-state/*db-sync-config (atom {:ws-url "wss://sync.example.test"})]
    (is (= :stopped (:ws-state (sync-counts 1 1))) "no client, sync configured"))
  (with-redefs [worker-state/*db-sync-client (atom nil)
                worker-state/*db-sync-config (atom {})]
    (is (= :inactive (:ws-state (sync-counts 1 1))) "no client, sync not configured")))

(deftest rtc-state-payload-carries-counts-test
  (let [files [{:asset-id "a" :asset-type "png" :file "assets/a.png"}]
        payload (sync-presence/rtc-state-payload
                 (fn [_repo] {:pending-local 2
                              :pending-asset 3
                              :missing-asset-upload-files files
                              :pending-server 4})
                 {:repo "r" :ws-state (atom :open) :online-users (atom nil)})]
    (is (true? (:rtc-lock payload)))
    (is (= 2 (:unpushed-block-update-count payload)))
    (is (= 3 (:pending-asset-ops-count payload)))
    (is (= files (:missing-asset-upload-files payload)))
    (is (= 4 (:pending-server-ops-count payload))))
  (let [payload (sync-presence/rtc-state-payload
                 (fn [_repo] {})
                 {:repo "r" :ws-state (atom :closed) :online-users (atom nil)})]
    (is (false? (:rtc-lock payload)))
    (is (= 0 (:unpushed-block-update-count payload)))
    (is (= 0 (:pending-server-ops-count payload)))))
