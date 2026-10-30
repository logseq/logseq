(ns frontend.worker.sync.sync-recovery-test
  "Sync recovers from transient server failures and lost socket messages:
  a retryable reject, a pull lost to a ws drop, an upload ack lost to a ws drop."
  (:require [cljs.test :refer [async deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.apply-txs :as sync-apply]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.handle-message :as sync-handle-message]
            [frontend.worker.undo-redo :as undo-redo]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]
            [promesa.core :as p]))

(def ^:private test-repo "sync-recovery-test-repo")

(defn- new-client-ops-db
  []
  (let [Database (js/require "better-sqlite3")
        db (new Database ":memory:")]
    (client-op/ensure-sqlite-schema! db)
    db))

(defn- client-op-tx-row
  [^js db tx-id]
  (let [^js stmt (.prepare db (str "select tx_id, pending, failed from client_ops "
                                   "where kind = 'tx' and tx_id = ? limit 1"))]
    (.get stmt (str tx-id))))

(defn- setup-parent-child
  "A graph that syncs: it has :logseq.kv/graph-remote?, as upload and download
  set, so its local txs get the client-op rows these tests read."
  []
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page 1"}
                 :blocks [{:block/title "parent"
                           :build/children [{:block/title "child 1"}
                                            {:block/title "child 2"}
                                            {:block/title "child 3"}]}]}]})]
    (d/transact! conn [(sqlite-util/kv :logseq.kv/graph-remote? true)] {:persist-op? false})
    {:conn conn
     :client-ops-conn (new-client-ops-db)
     :parent (db-test/find-block-by-content @conn "parent")
     :child1 (db-test/find-block-by-content @conn "child 1")
     :child3 (db-test/find-block-by-content @conn "child 3")}))

(defn- with-conns
  "Runs `f` with the graph and client-ops conns installed for `test-repo` and
  local txs recorded as pending, as the worker does."
  [conn client-ops-conn f]
  (let [db-prev @worker-state/*datascript-conns
        ops-prev @worker-state/*client-ops-conns
        cleanup (fn []
                  (d/unlisten! conn ::record-local-tx)
                  (undo-redo/clear-history! test-repo)
                  (swap! client-op/*repo->pending-local-tx-count dissoc test-repo)
                  (reset! worker-state/*datascript-conns db-prev)
                  (reset! worker-state/*client-ops-conns ops-prev))]
    (swap! client-op/*repo->pending-local-tx-count dissoc test-repo)
    (reset! worker-state/*datascript-conns {test-repo conn})
    (reset! worker-state/*client-ops-conns {test-repo client-ops-conn})
    (undo-redo/clear-history! test-repo)
    (client-op/update-local-tx test-repo 0)
    (d/listen! conn ::record-local-tx
               (fn [tx-report]
                 (db-sync/enqueue-local-tx! test-repo tx-report)))
    (let [result (try (f) (catch :default e (cleanup) (throw e)))]
      (if (p/promise? result)
        (p/finally result cleanup)
        (do (cleanup) result)))))

(defn- capture-ws
  [*sent]
  (doto (js-obj)
    (aset "readyState" 1)
    (aset "send" (fn [raw]
                   (swap! *sent conj (js->clj (js/JSON.parse raw) :keywordize-keys true))))))

(defn- test-client
  [ws inflight]
  {:repo test-repo
   :graph-id "graph-1"
   :ws ws
   :send-queue (atom (p/resolved nil))
   :pending-pull-since (atom nil)
   :inflight (atom inflight)
   :online-users (atom [])
   :ws-state (atom :open)})

(defn- with-captured-timeouts
  "Runs `f` with js/setTimeout recording its delays instead of scheduling."
  [*delays f]
  (let [original js/setTimeout]
    (set! js/setTimeout (fn [_f ms] (swap! *delays conj ms) :timeout-id))
    (try (f) (finally (set! js/setTimeout original)))))

(defn- handle-reject!
  "Handles a tx/reject message and returns the error it raised, if any."
  [client message]
  (try
    (with-redefs [shared-service/broadcast-to-clients! (fn [& _] nil)]
      (sync-handle-message/handle-message! test-repo client (js/JSON.stringify (clj->js message))))
    nil
    (catch :default error
      error)))

(deftest retryable-tx-reject-keeps-the-edit-pending-test
  (testing "a reject the server marks retryable keeps the local edit applied and pending, and schedules a resend"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          child-uuid (:block/uuid child1)
          *delays (atom [])]
      (with-conns conn client-ops-conn
        (fn []
          (outliner-core/delete-blocks! conn [child1] {})
          (let [tx-id (:tx-id (first (sync-apply/pending-txs test-repo)))
                client (test-client nil [tx-id])
                error (with-captured-timeouts *delays
                        #(handle-reject! client {:type "tx/reject"
                                                 :reason "db transact failed"
                                                 :retryable true
                                                 :t 0
                                                 :failed-tx-id (str tx-id)}))
                row (client-op-tx-row client-ops-conn tx-id)]
            (is (nil? error) "A transient failure is not a sync error")
            (is (nil? (d/entity @conn [:block/uuid child-uuid]))
                "The local edit stays applied")
            (is (= 1 (aget row "pending")) "The edit stays in the outbox")
            (is (not= 1 (aget row "failed")))
            (is (= [] @(:inflight client)))
            (is (= 1 (count @*delays)) "A resend is scheduled")))))))

(deftest retryable-tx-reject-after-commit-pulls-test
  (testing "a retryable reject whose t moved past ours pulls instead of rolling back every inflight tx"
    (async done
           (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
                 child-uuid (:block/uuid child1)
                 *sent (atom [])]
             (-> (with-conns conn client-ops-conn
                   (fn []
                     (outliner-core/delete-blocks! conn [child1] {})
                     (let [tx-id (:tx-id (first (sync-apply/pending-txs test-repo)))
                           client (test-client (capture-ws *sent) [tx-id])
                           error (handle-reject! client {:type "tx/reject"
                                                         :reason "db transact failed"
                                                         :retryable true
                                                         :t 1})]
                       (p/then @(:send-queue client)
                               (fn [_]
                                 (let [row (client-op-tx-row client-ops-conn tx-id)]
                                   (is (nil? error))
                                   (is (= [{:type "pull" :since 0}] @*sent))
                                   (is (nil? (d/entity @conn [:block/uuid child-uuid])))
                                   (is (= 1 (aget row "pending")))
                                   (is (not= 1 (aget row "failed")))))))))
                 (p/catch (fn [error] (is nil (str error))))
                 (p/finally done))))))

(deftest snapshot-upload-in-progress-reject-keeps-the-edit-pending-test
  (testing "a reject while the server's snapshot upload runs keeps the edit pending"
    (let [{:keys [conn client-ops-conn child1]} (setup-parent-child)
          child-uuid (:block/uuid child1)
          *delays (atom [])]
      (with-conns conn client-ops-conn
        (fn []
          (outliner-core/delete-blocks! conn [child1] {})
          (let [tx-id (:tx-id (first (sync-apply/pending-txs test-repo)))
                client (test-client nil [tx-id])
                error (with-captured-timeouts *delays
                        #(handle-reject! client {:type "tx/reject"
                                                 :reason "snapshot upload in progress"
                                                 :t 0}))
                row (client-op-tx-row client-ops-conn tx-id)]
            (is (nil? error))
            (is (nil? (d/entity @conn [:block/uuid child-uuid])))
            (is (= 1 (aget row "pending")))
            (is (not= 1 (aget row "failed")))
            (is (= 1 (count @*delays)))))))))

(deftest ws-close-forgets-the-unanswered-pull-test
  (testing "a pull sent on a socket that closed does not block the pulls of the next socket"
    (async done
           (let [*sent (atom [])
                 original-set-timeout js/setTimeout
                 prev-client @worker-state/*db-sync-client
                 old-ws #js {:readyState 3 :close (fn [] nil)}
                 client (assoc (test-client old-ws [])
                               :reconnect (atom {:attempt 0 :timer nil})
                               :stale-kill-timer (atom nil))]
             (reset! (:pending-pull-since client) 10)
             (set! js/setTimeout (fn [_f _ms] :timeout-id))
             (reset! worker-state/*db-sync-client client)
             (-> (p/with-redefs [shared-service/broadcast-to-clients! (fn [& _] nil)
                                 sync-handle-message/sync-counts (constantly {})
                                 client-op/get-local-tx (constantly 10)
                                 sync-apply/enqueue-flush-pending! (fn [& _] nil)]
                   (#'db-sync/attach-ws-handlers! test-repo client old-ws "wss://sync.example.test/sync/graph-1")
                   ((.-onclose old-ws) #js {})
                   (is (nil? @(:pending-pull-since client)))
                   (let [client' (assoc client :ws (capture-ws *sent))]
                     (sync-handle-message/handle-message!
                      test-repo client'
                      (js/JSON.stringify (clj->js {:type "changed" :t 11})))
                     (p/then @(:send-queue client')
                             (fn [_]
                               (is (= [{:type "pull" :since 10}] @*sent))))))
                 (p/catch (fn [error] (is nil (str error))))
                 (p/finally (fn []
                              (set! js/setTimeout original-set-timeout)
                              (reset! worker-state/*db-sync-client prev-client)
                              (done))))))))

(deftest stale-ws-close-forgets-the-unanswered-pull-test
  (let [original-set-interval js/setInterval
        original-clear-interval js/clearInterval
        original-set-timeout js/setTimeout
        prev-client @worker-state/*db-sync-client
        *interval-f (atom nil)
        ws #js {:readyState 3 :close (fn [] nil)}
        client (assoc (test-client ws [])
                      :reconnect (atom {:attempt 0 :timer nil})
                      :stale-kill-timer (atom nil))]
    (reset! (:pending-pull-since client) 10)
    (set! js/setInterval (fn [f _ms] (reset! *interval-f f) :interval-id))
    (set! js/clearInterval (fn [_] nil))
    (set! js/setTimeout (fn [_f _ms] :timeout-id))
    (reset! worker-state/*db-sync-client client)
    (with-redefs [shared-service/broadcast-to-clients! (fn [& _] nil)]
      (try
        (#'db-sync/close-stale-ws-loop client ws "wss://sync.example.test/sync/graph-1")
        (@*interval-f)
        (is (nil? @(:pending-pull-since client)))
        (finally
          (reset! worker-state/*db-sync-client prev-client)
          (set! js/setInterval original-set-interval)
          (set! js/clearInterval original-clear-interval)
          (set! js/setTimeout original-set-timeout))))))

(defn- child-titles
  [db parent-id]
  (->> (:block/_parent (d/entity db parent-id))
       (sort-by :block/order)
       (mapv :block/title)))

(deftest pull-ok-passes-the-server-tx-id-test
  (testing "pull/ok keeps the tx id the server stored, so the client can see its own txs"
    (async done
           (let [tx-id (random-uuid)
                 *remote-txs (atom nil)
                 client (test-client #js {} [])
                 raw-message (js/JSON.stringify
                              (clj->js {:type "pull/ok"
                                        :t 1
                                        :txs [{:t 1
                                               :tx (sqlite-util/write-transit-str [])
                                               :tx-id (str tx-id)}]}))]
             (-> (p/with-redefs [client-op/get-local-tx (constantly 0)
                                 client-op/update-local-tx (fn [& _] nil)
                                 sync-handle-message/sync-counts (constantly {})
                                 shared-service/broadcast-to-clients! (fn [& _] nil)
                                 sync-crypt/graph-e2ee? (constantly false)
                                 sync-crypt/<ensure-graph-aes-key (fn [& _] (p/resolved nil))
                                 sync-apply/apply-remote-txs! (fn [_repo _client remote-txs]
                                                                (reset! *remote-txs remote-txs))
                                 sync-apply/enqueue-flush-pending! (fn [& _] nil)]
                   (sync-handle-message/handle-message! test-repo client raw-message))
                 (p/then (fn [_]
                           (is (= [tx-id] (mapv :tx-id @*remote-txs)))))
                 (p/catch (fn [error] (is nil (str error))))
                 (p/finally done))))))

(deftest pulled-own-move-is-not-replayed-test
  (testing "a pending move up/down the pull shows the server applied moves the block once"
    (async done
           (let [{:keys [conn client-ops-conn parent child3]} (setup-parent-child)
                 parent-id (:db/id parent)]
             (-> (p/resolved nil)
                 (p/then
                  (fn [_]
                   (with-conns conn client-ops-conn
                   (fn []
                     (outliner-op/apply-ops! conn
                                             [[:move-blocks-up-down [[(:block/uuid child3)] true]]]
                                             {:client-id "test-client" :local-tx? true})
                     (is (= ["child 1" "child 3" "child 2"] (child-titles @conn parent-id)))
                     (let [local-tx (first (sync-apply/pending-txs test-repo))
                           remote-txs [{:t 1
                                        :tx-id (:tx-id local-tx)
                                        :outliner-op :move-blocks-up-down
                                        :tx-data (:tx local-tx)}]]
                       (p/with-redefs [shared-service/broadcast-to-clients! (fn [& _] nil)]
                         (p/let [_ (sync-apply/apply-remote-txs! test-repo nil remote-txs)]
                           (is (= ["child 1" "child 3" "child 2"] (child-titles @conn parent-id))
                               "The block moved once, not once more by a replay")
                           (is (empty? (sync-apply/pending-txs test-repo))
                               "The pulled tx is acknowledged, so it is not uploaded again"))))))))
                 (p/catch (fn [error] (is nil (str error))))
                 (p/finally done))))))
