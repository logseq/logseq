(ns frontend.worker.undo-redo-mutation2-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.worker.a-test-env]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.apply-txs :as sync-apply]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.undo-redo :as worker-undo-redo]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(def ^:private test-repo "test-worker-undo-redo-mutation2")

(defn- new-client-ops-db
  []
  (let [Database (js/require "better-sqlite3")
        db (new Database ":memory:")]
    (client-op/ensure-sqlite-schema! db)
    db))

(defn- with-worker-conns
  [f]
  (let [datascript-prev @worker-state/*datascript-conns
        client-ops-prev @worker-state/*client-ops-conns
        apply-history-action-prev @worker-undo-redo/*apply-history-action!
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page 1"}
                 :blocks [{:block/title "task"}
                          {:block/title "parent"
                           :build/children [{:block/title "child"}]}]}]})
        client-ops-conn (new-client-ops-db)]
    (reset! worker-state/*datascript-conns {test-repo conn})
    (reset! worker-state/*client-ops-conns {test-repo client-ops-conn})
    (reset! worker-undo-redo/*apply-history-action! sync-apply/apply-history-action!)
    (d/listen! conn ::gen-undo-ops
               (fn [tx-report]
                 (db-sync/enqueue-local-tx! test-repo tx-report)))
    (worker-undo-redo/clear-history! test-repo)
    (try
      (f)
      (finally
        (d/unlisten! conn ::gen-undo-ops)
        (worker-undo-redo/clear-history! test-repo)
        (.close client-ops-conn)
        (reset! worker-undo-redo/*apply-history-action! apply-history-action-prev)
        (reset! worker-state/*datascript-conns datascript-prev)
        (reset! worker-state/*client-ops-conns client-ops-prev)))))

(use-fixtures :each with-worker-conns)

(defn- child-uuid
  [conn]
  (:block/uuid (db-test/find-block-by-content @conn "child")))

(defn- save-block-title!
  [conn block-uuid title tx-id]
  (d/transact! conn
               [[:db/add [:block/uuid block-uuid] :block/title title]]
               {:local-tx? true
                :db-sync/tx-id tx-id
                :outliner-op :save-block
                :outliner-ops [[:save-block [{:block/uuid block-uuid
                                              :block/title title} {}]]]}))

(defn- cursor
  [block-uuid]
  {:block-uuid block-uuid
   :container-id :unknown-container
   :start-pos 1
   :end-pos 2})

(defn- db-transact-data
  [op]
  (some #(when (= ::worker-undo-redo/db-transact (first %)) (second %)) op))

(defn- top-undo-data
  []
  (db-transact-data (last (get @worker-undo-redo/*undo-ops test-repo))))

(defn- update-top-undo-data!
  [f]
  (swap! worker-undo-redo/*undo-ops
         update test-repo
         (fn [stack]
           (update stack (dec (count stack))
                   (fn [op]
                     (mapv (fn [item]
                             (if (= ::worker-undo-redo/db-transact (first item))
                               [::worker-undo-redo/db-transact (f (second item))]
                               item))
                           op))))))

(deftest pending-editor-info-test
  (let [conn (worker-state/get-datascript-conn test-repo)
        block-uuid (child-uuid conn)
        info (cursor block-uuid)]
    (testing "set, clear and read back"
      (worker-undo-redo/set-pending-editor-info! test-repo info)
      (is (= info (:pending-editor-info (worker-undo-redo/get-debug-state test-repo))))
      (worker-undo-redo/set-pending-editor-info! test-repo nil)
      (is (nil? (:pending-editor-info (worker-undo-redo/get-debug-state test-repo)))))
    (testing "the next local tx takes it"
      (worker-undo-redo/set-pending-editor-info! test-repo info)
      (save-block-title! conn block-uuid "edited" (random-uuid))
      (is (nil? (:pending-editor-info (worker-undo-redo/get-debug-state test-repo))))
      (let [result (worker-undo-redo/undo test-repo)]
        (is (= [info] (:editor-cursors result)))
        (is (= "child" (:block-content result)))))))

(deftest record-editor-info-and-block-content-test
  (let [conn (worker-state/get-datascript-conn test-repo)
        block-uuid (child-uuid conn)
        info (cursor block-uuid)]
    (save-block-title! conn block-uuid "edited" (random-uuid))
    (is (= 1 (count (last (get @worker-undo-redo/*undo-ops test-repo))))
        "no editor info: the entry holds only the db-transact")
    (is (vector? (last (get @worker-undo-redo/*undo-ops test-repo))))
    (worker-undo-redo/record-editor-info! test-repo info)
    (let [undo-result (worker-undo-redo/undo test-repo)]
      (is (= [info] (:editor-cursors undo-result)))
      (is (= "child" (:block-content undo-result))))
    (let [redo-result (worker-undo-redo/redo test-repo)]
      (is (= [info] (:editor-cursors redo-result)))
      (is (= "edited" (:block-content redo-result))))))

(deftest history-entry-ids-and-referenced-tx-ids-test
  (let [conn (worker-state/get-datascript-conn test-repo)
        block-uuid (child-uuid conn)
        tx-id-1 (random-uuid)
        tx-id-2 (random-uuid)]
    (save-block-title! conn block-uuid "v1" tx-id-1)
    (save-block-title! conn block-uuid "v2" tx-id-2)
    (is (= #{} (:added-ids (top-undo-data))))
    (is (= #{} (:retracted-ids (top-undo-data))))
    (is (= #{tx-id-1 tx-id-2} (worker-undo-redo/referenced-history-tx-ids test-repo)))
    (worker-undo-redo/undo test-repo)
    (is (= #{tx-id-1 tx-id-2} (worker-undo-redo/referenced-history-tx-ids test-repo)))
    (is (= #{} (worker-undo-redo/referenced-history-tx-ids "other-repo")))))

(deftest synced-graph-history-action-meta-and-sanitized-redo-entry-test
  (let [conn (worker-state/get-datascript-conn test-repo)
        block-uuid (child-uuid conn)
        tx-id (random-uuid)
        calls (atom [])]
    (d/transact! conn [(ldb/kv :logseq.kv/graph-remote? true)] {:persist-op? false})
    (reset! worker-undo-redo/*apply-history-action!
            (fn [repo tx-id' undo? tx-meta']
              (swap! calls conj {:repo repo :tx-id tx-id' :undo? undo? :tx-meta tx-meta'})
              {:applied? true :history-tx-id (random-uuid)}))
    (save-block-title! conn block-uuid "edited" tx-id)
    (update-top-undo-data!
     #(assoc % :tx :a :tx-data :b :reversed-tx :c :reversed-tx-data :d
             :db-sync/normalized-tx-data :e :db-sync/reversed-tx-data :f
             :db-sync/forward-outliner-ops [[:fwd]]
             :db-sync/inverse-outliner-ops [[:inv]]))
    (worker-undo-redo/undo test-repo)
    (let [call (first @calls)
          tx-meta (:tx-meta call)]
      (is (= tx-id (:tx-id call)))
      (is (true? (:undo? call)))
      (is (= {:gen-undo-ops? false
              :persist-op? true
              :undo? true
              :redo? false
              :db-sync/source-tx-id tx-id
              :db-sync/forward-outliner-ops [[:fwd]]
              :db-sync/inverse-outliner-ops [[:inv]]}
             (select-keys tx-meta [:gen-undo-ops? :persist-op? :undo? :redo?
                                   :db-sync/source-tx-id
                                   :db-sync/forward-outliner-ops
                                   :db-sync/inverse-outliner-ops])))
      (is (not (contains? tx-meta :db-sync/tx-id)))
      (is (= :save-block (:outliner-op tx-meta))))
    (let [redo-data (db-transact-data (last (get @worker-undo-redo/*redo-ops test-repo)))]
      (is (some? redo-data))
      (is (= tx-id (:db-sync/tx-id redo-data)))
      (doseq [k [:tx :tx-data :reversed-tx :reversed-tx-data
                 :db-sync/normalized-tx-data :db-sync/reversed-tx-data]]
        (is (not (contains? redo-data k)) (str k))))
    (worker-undo-redo/redo test-repo)
    (let [call (second @calls)]
      (is (false? (:undo? call)))
      (is (false? (:undo? (:tx-meta call))))
      (is (true? (:redo? (:tx-meta call)))))))

(deftest local-graph-replay-tx-meta-test
  (let [conn (worker-state/get-datascript-conn test-repo)
        block-uuid (child-uuid conn)
        tx-id (random-uuid)
        metas (atom [])]
    (save-block-title! conn block-uuid "edited" tx-id)
    (update-top-undo-data!
     #(assoc % :db-sync/forward-outliner-ops [[:fwd]]
             :db-sync/inverse-outliner-ops [[:inv]]))
    (d/listen! conn ::capture (fn [tx-report] (swap! metas conj (:tx-meta tx-report))))
    (worker-undo-redo/undo test-repo)
    (worker-undo-redo/redo test-repo)
    (d/unlisten! conn ::capture)
    (let [[undo-meta redo-meta] (take 2 @metas)]
      (doseq [[m undo?] [[undo-meta true] [redo-meta false]]]
        (is (= :save-block (:outliner-op m)))
        (is (true? (:local-tx? m)))
        (is (false? (:gen-undo-ops? m)))
        (is (true? (:persist-op? m)))
        (is (= undo? (:undo? m)))
        (is (= (not undo?) (:redo? m)))
        (is (true? (:undo-redo/replay-tx-datoms? m)))
        (is (uuid? (:db-sync/tx-id m)))
        (is (not= tx-id (:db-sync/tx-id m)))
        (is (= tx-id (:db-sync/source-tx-id m))))
      (is (= [[:inv]] (:db-sync/forward-outliner-ops undo-meta)))
      (is (= [[:fwd]] (:db-sync/inverse-outliner-ops undo-meta)))
      (is (= [[:fwd]] (:db-sync/forward-outliner-ops redo-meta)))
      (is (= [[:inv]] (:db-sync/inverse-outliner-ops redo-meta))))))

(deftest local-graph-replay-that-throws-is-refused-test
  (let [conn (worker-state/get-datascript-conn test-repo)
        block-uuid (child-uuid conn)]
    (save-block-title! conn block-uuid "edited" (random-uuid))
    (update-top-undo-data! #(assoc % :tx-datoms [[nil :block/title "x" true]]))
    (let [result (worker-undo-redo/undo test-repo)]
      (is (= {:undo? true :refused? true} result))
      (is (= 1 (count (get @worker-undo-redo/*undo-ops test-repo))))
      (is (= 0 (count (get @worker-undo-redo/*redo-ops test-repo)))))))
