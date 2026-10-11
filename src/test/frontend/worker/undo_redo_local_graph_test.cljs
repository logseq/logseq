(ns frontend.worker.undo-redo-local-graph-test
  "Undo and redo on a local graph replay the entry's tx datoms. Each test
  records undo entries by calling `gen-undo-ops!` on a transaction's report,
  as the worker's local transaction path does."
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.worker.a-test-env]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.undo-redo :as worker-undo-redo]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(def ^:private test-repo "test-worker-undo-redo-local-graph")

(def ^:private *history-action-calls
  "The worker history actions (synced-graph undo and redo) the stub received."
  (atom []))

(defn- stub-apply-history-action!
  [_repo tx-id undo? tx-meta]
  (swap! *history-action-calls conj {:tx-id tx-id :undo? undo? :tx-meta tx-meta})
  {:applied? true})

(defn- with-worker-conns
  [f]
  (let [datascript-prev @worker-state/*datascript-conns
        client-ops-prev @worker-state/*client-ops-conns
        apply-history-action-prev @worker-undo-redo/*apply-history-action!
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page 1"}
                 :blocks [{:block/title "alpha"}
                          {:block/title "beta"}
                          {:block/title "gamma"}]}]})
        Database (js/require "better-sqlite3")
        client-ops-conn (new Database ":memory:")]
    (client-op/ensure-sqlite-schema! client-ops-conn)
    (reset! worker-state/*datascript-conns {test-repo conn})
    (reset! worker-state/*client-ops-conns {test-repo client-ops-conn})
    (reset! worker-undo-redo/*apply-history-action! stub-apply-history-action!)
    (reset! *history-action-calls [])
    (worker-undo-redo/clear-history! test-repo)
    (try
      (f)
      (finally
        (worker-undo-redo/clear-history! test-repo)
        (.close client-ops-conn)
        (reset! worker-undo-redo/*apply-history-action! apply-history-action-prev)
        (reset! worker-state/*datascript-conns datascript-prev)
        (reset! worker-state/*client-ops-conns client-ops-prev)))))

(use-fixtures :each with-worker-conns)

(defn- conn [] (worker-state/get-datascript-conn test-repo))

(defn- block-uuid [title]
  (:block/uuid (db-test/find-block-by-content @(conn) title)))

(defn- title-of [uuid]
  (:block/title (d/entity @(conn) [:block/uuid uuid])))

(defn- transact-local!
  "Transacts tx-data as a local outliner change and records its undo entry
  under tx-id."
  [tx-data tx-id]
  (let [report (d/transact! (conn) tx-data {:outliner-op :save-block :local-tx? true})]
    (worker-undo-redo/gen-undo-ops! test-repo report tx-id
                                    {:apply-history-action! stub-apply-history-action!})
    report))

(defn- mark-graph-synced! []
  (d/transact! (conn) [(ldb/kv :logseq.kv/graph-remote? true)] {:persist-op? false}))

(defn- cursor [uuid]
  {:block-uuid uuid :container-id 1 :start-pos 0 :end-pos 0})

(defn- db-transact-data
  "The ::db-transact data of the newest entry on stack (:undo-ops or :redo-ops)."
  [stack]
  (some #(when (= ::worker-undo-redo/db-transact (first %)) (second %))
        (last (get (worker-undo-redo/get-debug-state test-repo) stack))))

(deftest undo-block-content-is-first-cursor-redo-block-content-is-last-cursor-test
  (testing "an entry with the cursor before the change (pending) and after it (record-editor-info!): undo gives the first cursor's block title, redo the last's, as history.cljs restores those cursors"
    (let [alpha (block-uuid "alpha")
          beta (block-uuid "beta")
          gamma (block-uuid "gamma")]
      (worker-undo-redo/set-pending-editor-info! test-repo (cursor alpha))
      (transact-local! [[:db/add [:block/uuid gamma] :block/title "gamma 2"]] (random-uuid))
      (worker-undo-redo/record-editor-info! test-repo (cursor beta))
      (let [undo-result (worker-undo-redo/undo test-repo)]
        (is (= "gamma" (title-of gamma)))
        (is (= [(cursor alpha) (cursor beta)] (:editor-cursors undo-result)))
        (is (= "alpha" (:block-content undo-result))))
      (let [redo-result (worker-undo-redo/redo test-repo)]
        (is (= "gamma 2" (title-of gamma)))
        (is (= "beta" (:block-content redo-result)))))))

(deftest local-graph-replay-tx-meta-test
  (testing "on a local graph the undo transaction is marked undo, the redo transaction redo; the redo entry keeps the change's tx id, which the redo names as its source; the undo entry then takes the redo transaction's tx id"
    (let [alpha (block-uuid "alpha")
          tx-id (random-uuid)
          *metas (atom [])]
      (transact-local! [[:db/add [:block/uuid alpha] :block/title "alpha 2"]] tx-id)
      (d/listen! (conn) ::capture (fn [report] (swap! *metas conj (:tx-meta report))))
      (try
        (worker-undo-redo/undo test-repo)
        (is (= "alpha" (title-of alpha)))
        (let [undo-meta (last @*metas)]
          (is (true? (:undo? undo-meta)))
          (is (false? (:redo? undo-meta)))
          (is (= tx-id (:db-sync/source-tx-id undo-meta))))
        (is (= tx-id (:db-sync/tx-id (db-transact-data :redo-ops))))
        (worker-undo-redo/redo test-repo)
        (is (= "alpha 2" (title-of alpha)))
        (let [redo-meta (last @*metas)]
          (is (false? (:undo? redo-meta)))
          (is (true? (:redo? redo-meta)))
          (is (= tx-id (:db-sync/source-tx-id redo-meta)))
          (is (= (:db-sync/tx-id redo-meta) (:db-sync/tx-id (db-transact-data :undo-ops)))))
        (finally
          (d/unlisten! (conn) ::capture))))))

(deftest entry-recorded-locally-on-graph-synced-since-goes-to-history-action-test
  (testing "an entry recorded on a local graph (it has :tx-datoms) is not replayed once the graph syncs: undo goes to the worker history action"
    (let [alpha (block-uuid "alpha")
          tx-id (random-uuid)]
      (transact-local! [[:db/add [:block/uuid alpha] :block/title "alpha 2"]] tx-id)
      (is (seq (:tx-datoms (db-transact-data :undo-ops))))
      (mark-graph-synced!)
      (worker-undo-redo/undo test-repo)
      (is (= [tx-id] (map :tx-id @*history-action-calls)))
      (is (= "alpha 2" (title-of alpha))))))
