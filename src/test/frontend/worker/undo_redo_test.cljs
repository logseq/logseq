(ns frontend.worker.undo-redo-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.worker.a-test-env]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.undo-redo :as worker-undo-redo]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.op.construct :as op-construct]))

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
  ([conn block-uuid title]
   (save-block-title! conn block-uuid title (random-uuid)))
  ([conn block-uuid title tx-id]
   (d/transact! conn
                [[:db/add [:block/uuid block-uuid] :block/title title]]
                (local-tx-meta
                 {:db-sync/tx-id tx-id
                  :outliner-op :save-block
                  :outliner-ops [[:save-block [{:block/uuid block-uuid
                                                :block/title title} {}]]]}))))

(defn- undo-all!
  []
  (loop [results []]
    (let [result (worker-undo-redo/undo test-repo)]
      (if (= ::worker-undo-redo/empty-undo-stack result)
        results
        (recur (conj results result))))))

(defn- redo-all!
  []
  (loop [results []]
    (let [result (worker-undo-redo/redo test-repo)]
      (if (= ::worker-undo-redo/empty-redo-stack result)
        results
        (recur (conj results result))))))

(deftest undo-missing-history-action-row-clears-history-test
  (testing "worker undo treats missing tx-id action row as unavailable and clears history"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          client-ops-conn (get @worker-state/*client-ops-conns test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)
          tx-id-1 (random-uuid)
          tx-id-2 (random-uuid)]
      (save-block-title! conn child-uuid "v1" tx-id-1)
      (save-block-title! conn child-uuid "v2" tx-id-2)
      (is (= "v2" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
      (is (= 2 (count (get @worker-undo-redo/*undo-ops test-repo))))
      (when-let [tx-ent (d/entity @client-ops-conn [:db-sync/tx-id tx-id-2])]
        (ldb/transact! client-ops-conn [[:db/retractEntity (:db/id tx-ent)]]))
      (let [undo-result (worker-undo-redo/undo test-repo)]
        (is (= ::worker-undo-redo/empty-undo-stack undo-result))
        (is (= "v2" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
        (is (empty? (get @worker-undo-redo/*undo-ops test-repo)))
        (is (empty? (get @worker-undo-redo/*redo-ops test-repo))))
      (let [redo-result (worker-undo-redo/redo test-repo)]
        (is (= ::worker-undo-redo/empty-redo-stack redo-result))
        (is (= "v2" (:block/title (d/entity @conn [:block/uuid child-uuid]))))))))

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

(deftest undo-history-allows-non-semantic-outliner-op-test
  (testing "non-semantic outliner-op with transact placeholder should not fail undo metadata construction"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/title "restored child"]]
                   (local-tx-meta
                    {:client-id "test-client"
                     :outliner-op :restore-recycled
                     :outliner-ops [[:transact nil]]}))
      (let [undo-op (last (get @worker-undo-redo/*undo-ops test-repo))
            data (some #(when (= ::worker-undo-redo/db-transact (first %))
                          (second %))
                       undo-op)]
        (is (= op-construct/canonical-transact-op
               (:db-sync/forward-outliner-ops data)))
        (is (nil? (:db-sync/inverse-outliner-ops data)))))))

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

(deftest undo-delete-page-restores-page-out-of-recycle-test
  (testing "undoing delete-page should restore page and clear recycle marker"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [page-uuid]} (seed-page-parent-child!)]
      (outliner-op/apply-ops! conn
                              [[:delete-page [page-uuid {}]]]
                              (local-tx-meta {:client-id "test-client"}))
      (let [deleted-page (d/entity @conn [:block/uuid page-uuid])]
        (is (some? deleted-page))
        (is (true? (ldb/recycled? deleted-page))))
      (let [undo-result (worker-undo-redo/undo test-repo)
            restored-page (d/entity @conn [:block/uuid page-uuid])]
        (is (map? undo-result))
        (is (some? restored-page))
        (is (false? (ldb/recycled? restored-page)))
        (is (nil? (:block/parent restored-page)))
        (is (nil? (:logseq.property/deleted-at restored-page)))
        (is (nil? (:logseq.property.recycle/original-parent restored-page)))
        (is (nil? (:logseq.property.recycle/original-page restored-page)))
        (is (nil? (:logseq.property.recycle/original-order restored-page)))))))

(deftest redo-create-page-restores-recycled-page-test
  (testing "redoing create-page should restore recycled page instead of keeping it recycled"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          page-title "redo create page alpha"]
      (outliner-op/apply-ops! conn
                              [[:create-page [page-title {:redirect? false
                                                          :split-namespace? true
                                                          :tags ()}]]]
                              (local-tx-meta {:client-id "test-client"}))
      (let [created-page (db-test/find-page-by-title @conn page-title)]
        (is (some? created-page))
        (is (false? (ldb/recycled? created-page))))

      (is (seq (undo-all!)))
      (let [deleted-page (db-test/find-page-by-title @conn page-title)]
        (is (some? deleted-page))
        (is (true? (ldb/recycled? deleted-page))))

      (is (seq (redo-all!)))
      (let [page-after-redo (db-test/find-page-by-title @conn page-title)]
        (is (some? page-after-redo))
        (is (false? (ldb/recycled? page-after-redo)))))))

(deftest redo-template-insert-restores-valid-blocks-test
  (testing "redoing template insert after undo-all should restore inserted template blocks without invalid refs"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [page-uuid]} (seed-page-parent-child!)
          page-id (:db/id (d/entity @conn [:block/uuid page-uuid]))
          template-root-uuid (random-uuid)
          template-a-uuid (random-uuid)
          template-b-uuid (random-uuid)
          empty-target-uuid (random-uuid)]
      (outliner-op/apply-ops!
       conn
       [[:insert-blocks [[{:block/uuid template-root-uuid
                           :block/title "template 1"
                           :block/tags #{:logseq.class/Template}}
                          {:block/uuid template-a-uuid
                           :block/title "a"
                           :block/parent [:block/uuid template-root-uuid]}
                          {:block/uuid template-b-uuid
                           :block/title "b"
                           :block/parent [:block/uuid template-a-uuid]}]
                         page-id
                         {:sibling? false
                          :keep-uuid? true}]]]
       (local-tx-meta {:client-id "test-client"}))
      (outliner-op/apply-ops!
       conn
       [[:insert-blocks [[{:block/uuid empty-target-uuid
                           :block/title ""}]
                         page-id
                         {:sibling? false
                          :keep-uuid? true}]]]
       (local-tx-meta {:client-id "test-client"}))
      (let [template-root (d/entity @conn [:block/uuid template-root-uuid])
            empty-target (d/entity @conn [:block/uuid empty-target-uuid])
            template-blocks (->> (ldb/get-block-and-children @conn template-root-uuid
                                                             {:include-property-block? true})
                                 rest)
            blocks-to-insert (cons (assoc (first template-blocks)
                                          :logseq.property/used-template (:db/id template-root))
                                   (rest template-blocks))]
        (outliner-op/apply-ops!
         conn
         [[:insert-blocks [blocks-to-insert
                           (:db/id empty-target)
                           {:sibling? true
                            :replace-empty-target? true
                            :insert-template? true}]]]
         (local-tx-meta {:client-id "test-client"})))

      (is (seq (undo-all!)))
      (is (seq (redo-all!)))

      (let [inserted-a-id (d/q '[:find ?b .
                                 :in $ ?template-uuid
                                 :where
                                 [?template :block/uuid ?template-uuid]
                                 [?b :logseq.property/used-template ?template]
                                 [?b :block/title "a"]]
                               @conn
                               template-root-uuid)
            inserted-a (when inserted-a-id (d/entity @conn inserted-a-id))
            inserted-b (some->> inserted-a :block/_parent (filter #(= "b" (:block/title %))) first)]
        (is (some? inserted-a))
        (is (= template-root-uuid
               (some-> inserted-a :logseq.property/used-template :block/uuid)))
        (is (some? inserted-b))
        (is (= "b" (:block/title inserted-b)))))))

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
