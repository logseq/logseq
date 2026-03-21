(ns frontend.worker.undo-redo-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.worker.a-test-env]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.undo-redo :as worker-undo-redo]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]))

(def ^:private test-repo "test-worker-undo-redo")

(defn- local-tx-meta
  [m]
  (assoc m
         :local-tx? true
         :db-sync/tx-id (or (:db-sync/tx-id m) (random-uuid))))

(defn- with-worker-conns
  [f]
  (let [datascript-prev @worker-state/*datascript-conns
        client-ops-prev @worker-state/*client-ops-conns
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page 1"}
                 :blocks [{:block/title "task"}
                          {:block/title "parent"
                           :build/children [{:block/title "child"}]}]}]})
        client-ops-conn (d/create-conn client-op/schema-in-db)]
    (reset! worker-state/*datascript-conns {test-repo conn})
    (reset! worker-state/*client-ops-conns {test-repo client-ops-conn})
    (d/listen! conn ::gen-undo-ops
               (fn [tx-report]
                 (db-sync/enqueue-local-tx! test-repo tx-report)
                 (worker-undo-redo/gen-undo-ops! test-repo tx-report)))
    (worker-undo-redo/clear-history! test-repo)
    (try
      (f)
      (finally
        (d/unlisten! conn ::gen-undo-ops)
        (worker-undo-redo/clear-history! test-repo)
        (reset! worker-state/*datascript-conns datascript-prev)
        (reset! worker-state/*client-ops-conns client-ops-prev)))))

(use-fixtures :each with-worker-conns)

(deftest gen-undo-ops-consumes-pending-editor-info-test
  (let [conn (worker-state/get-datascript-conn test-repo)
        block (db-test/find-block-by-content @conn "task")
        block-uuid (:block/uuid block)
        tx-report (d/with @conn
                          [[:db/add (:db/id block) :block/title "updated task"]]
                          (local-tx-meta
                           {:outliner-op :save-block
                            :outliner-ops [[:save-block [{:block/uuid block-uuid
                                                          :block/title "updated task"} nil]]]}))
        editor-info {:block-uuid block-uuid
                     :container-id 1
                     :start-pos 0
                     :end-pos 7}]
    (worker-undo-redo/set-pending-editor-info! test-repo editor-info)
    (worker-undo-redo/gen-undo-ops! test-repo tx-report)
    (let [op (last (get @worker-undo-redo/*undo-ops test-repo))]
      (is (= [::worker-undo-redo/record-editor-info editor-info]
             (first op)))
      (is (nil? (get @worker-undo-redo/*pending-editor-info test-repo))))))

(deftest worker-ui-state-roundtrip-test
  (let [ui-state-str "{:old-state {}, :new-state {:route-data {:to :page}}}"]
    (worker-undo-redo/record-ui-state! test-repo ui-state-str)
    (let [undo-result (worker-undo-redo/undo test-repo)]
      (is (= ui-state-str (:ui-state-str undo-result)))
      (is (true? (:undo? undo-result))))
    (let [redo-result (worker-undo-redo/redo test-repo)]
      (is (= ui-state-str (:ui-state-str redo-result)))
      (is (false? (:undo? redo-result))))))

(defn- seed-page-parent-child!
  []
  (let [conn (worker-state/get-datascript-conn test-repo)
        page-uuid (:block/uuid (db-test/find-page-by-title @conn "page 1"))
        parent-uuid (:block/uuid (db-test/find-block-by-content @conn "parent"))
        child-uuid (d/q '[:find ?child-uuid .
                          :in $ ?parent-uuid
                          :where
                          [?parent :block/uuid ?parent-uuid]
                          [?child :block/parent ?parent]
                          [?child :block/uuid ?child-uuid]]
                        @conn
                        parent-uuid)]
    {:page-uuid page-uuid
     :parent-uuid parent-uuid
     :child-uuid child-uuid}))

(defn- save-block-title!
  [conn block-uuid title]
  (d/transact! conn
               [[:db/add [:block/uuid block-uuid] :block/title title]]
               (local-tx-meta
                {:outliner-op :save-block
                 :outliner-ops [[:save-block [{:block/uuid block-uuid
                                               :block/title title} {}]]]})))

(deftest undo-records-only-local-txs-test
  (testing "undo history records only local txs"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (save-block-title! conn child-uuid "local-update")
      (is (= 1 (count (get @worker-undo-redo/*undo-ops test-repo)))))
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/title "remote-update"]]
                   {:outliner-op :save-block
                    :local-tx? false})
      (is (empty? (get @worker-undo-redo/*undo-ops test-repo))))))

(deftest undo-history-records-semantic-action-metadata-test
  (testing "worker undo history stores a logical action id and semantic forward/inverse ops"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/title "semantic-save"]]
                   (local-tx-meta
                    {:client-id "test-client"
                     :outliner-op :save-block
                     :outliner-ops [[:save-block [{:block/uuid child-uuid
                                                   :block/title "semantic-save"} {}]]]}))
      (let [undo-op (last (get @worker-undo-redo/*undo-ops test-repo))
            data (some #(when (= ::worker-undo-redo/db-transact (first %))
                          (second %))
                       undo-op)]
        (is (uuid? (:db-sync/tx-id data)))
        (is (= :save-block (ffirst (:db-sync/forward-outliner-ops data))))
        (is (= :save-block (ffirst (:db-sync/inverse-outliner-ops data))))
        (is (= child-uuid
               (get-in data [:db-sync/forward-outliner-ops 0 1 0 :block/uuid])))
        (is (= child-uuid
               (get-in data [:db-sync/inverse-outliner-ops 0 1 0 :block/uuid])))))))

(deftest undo-history-canonicalizes-insert-block-uuids-test
  (testing "worker undo history uses the created block uuid for insert semantic ops"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [page-uuid]} (seed-page-parent-child!)
          page-id (:db/id (d/entity @conn [:block/uuid page-uuid]))
          requested-uuid (random-uuid)]
      (d/transact! conn
                   [{:block/uuid requested-uuid
                     :block/title "semantic insert"
                     :block/page [:block/uuid page-uuid]
                     :block/parent [:block/uuid page-uuid]}]
                   (local-tx-meta
                    {:client-id "test-client"
                     :outliner-op :insert-blocks
                     :outliner-ops [[:insert-blocks [[{:block/title "semantic insert"
                                                       :block/uuid requested-uuid}]
                                                     page-id
                                                     {:sibling? false}]]]}))
      (let [inserted-id (d/q '[:find ?e .
                               :in $ ?title
                               :where
                               [?e :block/title ?title]]
                             @conn
                             "semantic insert")
            inserted (d/entity @conn inserted-id)
            inserted-uuid (:block/uuid inserted)
            undo-op (last (get @worker-undo-redo/*undo-ops test-repo))
            data (some #(when (= ::worker-undo-redo/db-transact (first %))
                          (second %))
                       undo-op)]
        (is (= inserted-uuid
               (get-in data [:db-sync/forward-outliner-ops 0 1 0 0 :block/uuid])))
        (is (= inserted-uuid
               (second (first (get-in data [:db-sync/inverse-outliner-ops 0 1 0])))))))))

(deftest undo-works-for-local-graph-test
  (testing "worker undo/redo works for local changes on local graph"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (save-block-title! conn child-uuid "local-1")
      (let [undo-result (worker-undo-redo/undo test-repo)]
        (is (map? undo-result))
        (is (= "child" (:block/title (d/entity @conn [:block/uuid child-uuid])))))
      (let [redo-result (worker-undo-redo/redo test-repo)]
        (is (map? redo-result))
        (is (= "local-1" (:block/title (d/entity @conn [:block/uuid child-uuid]))))))))

(deftest undo-history-records-forward-ops-for-save-block-test
  (testing "worker save-block history keeps semantic forward ops for redo replay"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (outliner-op/apply-ops! conn
                              [[:save-block [{:block/uuid child-uuid
                                              :block/title "saved via apply-ops"} {}]]]
                              (local-tx-meta {:client-id "test-client"}))
      (let [undo-op (last (get @worker-undo-redo/*undo-ops test-repo))
            data (some #(when (= ::worker-undo-redo/db-transact (first %))
                          (second %))
                       undo-op)]
        (is (= :save-block (ffirst (:db-sync/forward-outliner-ops data))))
        (is (= child-uuid
               (get-in data [:db-sync/forward-outliner-ops 0 1 0 :block/uuid])))
        (is (= "saved via apply-ops"
               (get-in data [:db-sync/forward-outliner-ops 0 1 0 :block/title])))
        (is (= "saved via apply-ops"
               (:block/title (d/entity @conn [:block/uuid child-uuid]))))))))

(deftest undo-insert-retracts-added-entity-cleanly-test
  (testing "undoing a local insert retracts the inserted entity"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [page-uuid]} (seed-page-parent-child!)
          inserted-uuid (random-uuid)]
      (d/transact! conn
                   [{:block/uuid inserted-uuid
                     :block/title "inserted"
                     :block/page [:block/uuid page-uuid]
                     :block/parent [:block/uuid page-uuid]}]
                   (local-tx-meta {:outliner-op :insert-blocks}))
      (is (some? (d/entity @conn [:block/uuid inserted-uuid])))
      (let [undo-result (worker-undo-redo/undo test-repo)]
        (is (map? undo-result))
        (is (nil? (d/entity @conn [:block/uuid inserted-uuid])))))))

(deftest repeated-save-block-content-undo-redo-test
  (testing "multiple saves on the same block undo and redo one step at a time"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (doseq [title ["v1" "v2" "v3"]]
        (save-block-title! conn child-uuid title))
      (is (= "v3" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (worker-undo-redo/undo test-repo)
      (is (= "v2" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (worker-undo-redo/undo test-repo)
      (is (= "v1" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (worker-undo-redo/undo test-repo)
      (is (= "child" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (worker-undo-redo/redo test-repo)
      (is (= "v1" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (worker-undo-redo/redo test-repo)
      (is (= "v2" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (worker-undo-redo/redo test-repo)
      (is (= "v3" (:block/title (d/entity @conn [:block/uuid child-uuid])))))))

(deftest repeated-save-block-op-content-undo-redo-test
  (testing "sequential save-block ops preserve undo/redo order"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (doseq [title ["foo" "foo bar"]]
        (outliner-op/apply-ops! conn
                                [[:save-block [{:block/uuid child-uuid
                                                :block/title title} {}]]]
                                (local-tx-meta {:client-id "test-client"})))
      (is (= "foo bar" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (worker-undo-redo/undo test-repo)
      (is (= "foo" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (worker-undo-redo/redo test-repo)
      (is (= "foo bar" (:block/title (d/entity @conn [:block/uuid child-uuid])))))))

(deftest save-two-blocks-undo-targets-latest-block-test
  (testing "undo after saving two blocks reverts the latest saved block first"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [parent-uuid child-uuid]} (seed-page-parent-child!)]
      (save-block-title! conn parent-uuid "parent updated")
      (save-block-title! conn child-uuid "child updated")
      (worker-undo-redo/undo test-repo)
      (is (= "parent updated" (:block/title (d/entity @conn [:block/uuid parent-uuid]))))
      (is (= "child" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (worker-undo-redo/undo test-repo)
      (is (= "parent" (:block/title (d/entity @conn [:block/uuid parent-uuid])))))))

(deftest new-local-save-clears-redo-stack-test
  (testing "a new local save clears redo history"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (save-block-title! conn child-uuid "v1")
      (save-block-title! conn child-uuid "v2")
      (worker-undo-redo/undo test-repo)
      (is (= "v1" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (save-block-title! conn child-uuid "v3")
      (is (= ::worker-undo-redo/empty-redo-stack
             (worker-undo-redo/redo test-repo)))
      (is (= "v3" (:block/title (d/entity @conn [:block/uuid child-uuid])))))))
