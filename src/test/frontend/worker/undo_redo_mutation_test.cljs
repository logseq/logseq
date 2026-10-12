(ns frontend.worker.undo-redo-mutation-test
  "Tests for frontend.worker.undo-redo found by mutation testing. Each test
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

(def ^:private test-repo "test-worker-undo-redo-mutation")

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

;; Fails if, in `set-pending-editor-info!`, `if` becomes `if-not`.
(deftest set-pending-editor-info-goes-into-next-entry-test
  (let [alpha (block-uuid "alpha")
        info (cursor alpha)]
    (worker-undo-redo/set-pending-editor-info! test-repo info)
    (is (= info (:pending-editor-info (worker-undo-redo/get-debug-state test-repo))))
    (transact-local! [[:db/add [:block/uuid alpha] :block/title "alpha 2"]] (random-uuid))
    (is (= [info] (:editor-cursors (worker-undo-redo/undo test-repo))))
    (testing "nil clears the pending editor info"
      (worker-undo-redo/set-pending-editor-info! test-repo info)
      (worker-undo-redo/set-pending-editor-info! test-repo nil)
      (is (nil? (:pending-editor-info (worker-undo-redo/get-debug-state test-repo)))))))

;; Fails if, in `undo-redo-aux`, `first` becomes `last`.
(deftest ui-state-entry-with-editor-info-returns-ui-state-str-test
  (testing "record-editor-info! appends to the newest entry, a ui-state entry included; undo and redo still return its ui-state string"
    (let [ui-state-str "{:old-state {}, :new-state {:route-data {:to :page}}}"
          info (cursor (block-uuid "alpha"))]
      (worker-undo-redo/record-ui-state! test-repo ui-state-str)
      (worker-undo-redo/record-editor-info! test-repo info)
      (is (= ui-state-str (:ui-state-str (worker-undo-redo/undo test-repo))))
      (is (= ui-state-str (:ui-state-str (worker-undo-redo/redo test-repo)))))))

;; Fails if, in `undo-redo-action-meta`, `not` becomes `identity`.
(deftest synced-graph-history-action-tx-meta-test
  (testing "on a synced graph undo and redo go to the worker history action, marked undo and redo"
    (mark-graph-synced!)
    (let [alpha (block-uuid "alpha")
          tx-id (random-uuid)]
      (transact-local! [[:db/add [:block/uuid alpha] :block/title "alpha 2"]] tx-id)
      (worker-undo-redo/undo test-repo)
      (worker-undo-redo/redo test-repo)
      (let [[undo-call redo-call] @*history-action-calls]
        (is (= 2 (count @*history-action-calls)))
        (is (= [tx-id true true false] ((juxt :tx-id :undo? (comp :undo? :tx-meta) (comp :redo? :tx-meta)) undo-call)))
        (is (= [false false true] ((juxt :undo? (comp :undo? :tx-meta) (comp :redo? :tx-meta)) redo-call)))))))

;; Fails if, in `gen-undo-ops!`, `and` becomes `or` or `nil?` becomes `some?`.
(deftest added-and-retracted-ids-test
  (let [alpha (block-uuid "alpha")
        beta-id (:db/id (d/entity @(conn) [:block/uuid (block-uuid "beta")]))
        new-uuid (random-uuid)]
    (testing "an edit adds and retracts no entity"
      (transact-local! [[:db/add [:block/uuid alpha] :block/title "alpha 2"]] (random-uuid))
      (is (= #{} (:added-ids (db-transact-data :undo-ops))))
      (is (= #{} (:retracted-ids (db-transact-data :undo-ops)))))
    (testing "a delete retracts the entity"
      (transact-local! [[:db/retractEntity beta-id]] (random-uuid))
      (is (= #{} (:added-ids (db-transact-data :undo-ops))))
      (is (= #{beta-id} (:retracted-ids (db-transact-data :undo-ops)))))
    (testing "an insert adds the entity"
      (transact-local! [{:block/uuid new-uuid :block/title "new"}] (random-uuid))
      (is (= #{(:db/id (d/entity @(conn) [:block/uuid new-uuid]))}
             (:added-ids (db-transact-data :undo-ops))))
      (is (= #{} (:retracted-ids (db-transact-data :undo-ops)))))))
