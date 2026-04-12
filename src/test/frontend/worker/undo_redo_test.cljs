(ns frontend.worker.undo-redo-test
  (:require [cljs.test :refer [deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.worker.a-test-env]
            [frontend.worker.sync.apply-txs :as sync-apply]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.undo-redo :as worker-undo-redo]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]))

(def ^:private test-repo "test-worker-undo-redo")

(defn- new-client-ops-db
  []
  (let [Database (js/require "better-sqlite3")
        db (new Database ":memory:")]
    (client-op/ensure-sqlite-schema! db)
    db))

(defn- delete-client-op-tx-row!
  [^js db tx-id]
  (let [^js stmt (.prepare db "delete from client_ops where kind = 'tx' and tx_id = ?")]
    (.run stmt (str tx-id))))

(defn- client-op-tx-row-exists?
  [^js db tx-id]
  (let [^js stmt (.prepare db "select 1 as ok from client_ops where kind = 'tx' and tx_id = ? limit 1")
        row (.get stmt (str tx-id))]
    (some? row)))

(defn- local-tx-meta
  [m]
  (assoc m
         :local-tx? true
         :db-sync/tx-id (or (:db-sync/tx-id m) (random-uuid))))

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

(deftest undo-redo-selection-editor-info-roundtrip-test
  (testing "undo/redo result keeps block selection editor info when no cursor is recorded"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)
          selection-info {:selected-block-uuids [child-uuid]
                          :selection-direction :down}]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/title "selection-history"]]
                   (local-tx-meta
                    {:outliner-op :save-block
                     :undo-redo/editor-info selection-info
                     :outliner-ops [[:save-block [{:block/uuid child-uuid
                                                   :block/title "selection-history"} {}]]]}))
      (let [undo-result (worker-undo-redo/undo test-repo)]
        (is (= [selection-info] (:editor-cursors undo-result)))
        (is (nil? (:block-content undo-result))))
      (let [redo-result (worker-undo-redo/redo test-repo)]
        (is (= [selection-info] (:editor-cursors redo-result)))
        (is (nil? (:block-content redo-result)))))))

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

(defn- latest-undo-history-data
  []
  (let [undo-op (last (get @worker-undo-redo/*undo-ops test-repo))]
    (some #(when (= ::worker-undo-redo/db-transact (first %))
             (second %))
          undo-op)))

(defn- latest-redo-history-data
  []
  (let [redo-op (last (get @worker-undo-redo/*redo-ops test-repo))]
    (some #(when (= ::worker-undo-redo/db-transact (first %))
             (second %))
          redo-op)))

(defn- move-retract-entity-ops-to-front
  [tx-data]
  (let [retract-entity-op? (fn [item]
                             (and (vector? item)
                                  (= 2 (count item))
                                  (= :db/retractEntity (first item))))
        retract-ops (filter retract-entity-op? tx-data)
        others (remove retract-entity-op? tx-data)]
    (vec (concat retract-ops others))))

(defn- poison-history-tx-order!
  [tx-id]
  (when-let [entry (client-op/get-local-tx-entry test-repo tx-id)]
    (client-op/upsert-local-tx-entry!
     test-repo
     {:tx-id tx-id
      :pending? true
      :failed? false
      :outliner-op (:outliner-op entry)
      :undo-redo (:db-sync/undo-redo entry)
      :forward-outliner-ops (:forward-outliner-ops entry)
      :inverse-outliner-ops (:inverse-outliner-ops entry)
      :inferred-outliner-ops? (:inferred-outliner-ops? entry)
      :normalized-tx-data (move-retract-entity-ops-to-front (:tx entry))
      :reversed-tx-data (move-retract-entity-ops-to-front (:reversed-tx entry))})))

(defn- property-value-titles
  [value]
  (cond
    (nil? value) []
    (string? value) [value]
    (map? value) [(:block/title value)]
    (coll? value) (->> value
                       (mapcat property-value-titles)
                       vec)
    :else [value]))

(deftest undo-missing-history-action-row-replays-from-inline-ops-test
  (testing "undo/redo should replay from inline history ops when pending row is missing"
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
      (is (seq (:db-sync/forward-outliner-ops (latest-undo-history-data))))
      (is (seq (:db-sync/inverse-outliner-ops (latest-undo-history-data))))
      ;; Poison tx-data so undo/redo must not rely on raw datoms.
      (swap! worker-undo-redo/*undo-ops
             update test-repo
             (fn [stack]
               (update stack
                       (dec (count stack))
                       (fn [op]
                         (mapv (fn [item]
                                 (if (= ::worker-undo-redo/db-transact (first item))
                                   [::worker-undo-redo/db-transact
                                    (assoc (second item)
                                           :tx-data [(d/datom 1 :block/title "poisoned" 1 true)])]
                                   item))
                               op)))))
      (delete-client-op-tx-row! client-ops-conn tx-id-2)
      (let [undo-result (worker-undo-redo/undo test-repo)]
        (is (not= ::worker-undo-redo/empty-undo-stack undo-result))
        (is (= "v1" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
        (is (= 1 (count (get @worker-undo-redo/*undo-ops test-repo))))
        (is (= 1 (count (get @worker-undo-redo/*redo-ops test-repo)))))
      (let [redo-result (worker-undo-redo/redo test-repo)]
        (is (not= ::worker-undo-redo/empty-redo-stack redo-result))
        (is (= "v2" (:block/title (d/entity @conn [:block/uuid child-uuid]))))))))

(deftest redo-invalid-history-action-result-keeps-redo-strict-test
  (testing "redo should not silently skip invalid worker results"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)
          tx-id-1 (random-uuid)
          tx-id-2 (random-uuid)
          prev-apply-action @worker-undo-redo/*apply-history-action!]
      (try
        (save-block-title! conn child-uuid "v1" tx-id-1)
        (save-block-title! conn child-uuid "v2" tx-id-2)
        (is (not= ::worker-undo-redo/empty-undo-stack
                  (worker-undo-redo/undo test-repo)))
        (is (= "v1" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
        (reset! worker-undo-redo/*apply-history-action!
                (fn [_repo _tx-id _undo? _tx-meta]
                  {:applied? false
                   :reason :invalid-history-action-tx}))
        (is (= ::worker-undo-redo/empty-redo-stack
               (worker-undo-redo/redo test-repo)))
        (is (= "v1" (:block/title (d/entity @conn [:block/uuid child-uuid]))))
        (is (empty? (get @worker-undo-redo/*undo-ops test-repo)))
        (is (empty? (get @worker-undo-redo/*redo-ops test-repo)))
        (finally
          (reset! worker-undo-redo/*apply-history-action! prev-apply-action))))))

(deftest undo-skippable-worker-error-does-not-fallback-to-local-tx-test
  (testing "undo should not fallback to tx-data when worker reports skippable invalid ops"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)
          tx-id-1 (random-uuid)
          tx-id-2 (random-uuid)
          prev-apply-action @worker-undo-redo/*apply-history-action!]
      (try
        (save-block-title! conn child-uuid "v1" tx-id-1)
        (save-block-title! conn child-uuid "v2" tx-id-2)
        (reset! worker-undo-redo/*apply-history-action!
                (fn [_repo _tx-id _undo? _tx-meta]
                  (throw (ex-info "semantic-error-renamed"
                                  {:reason :invalid-history-action-ops}))))
        (let [undo-result (worker-undo-redo/undo test-repo)]
          (is (= ::worker-undo-redo/empty-undo-stack undo-result))
          (is (= "v2" (:block/title (d/entity @conn [:block/uuid child-uuid])))))
        (finally
          (reset! worker-undo-redo/*apply-history-action! prev-apply-action))))))

(deftest undo-row-missing-and-poisoned-tx-data-does-not-clear-history-test
  (testing "missing pending row with poisoned tx-data should not clear undo history"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          client-ops-conn (get @worker-state/*client-ops-conns test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)
          tx-id (random-uuid)]
      (save-block-title! conn child-uuid "new-title" tx-id)
      (swap! worker-undo-redo/*undo-ops
             update test-repo
             (fn [stack]
               (update stack
                       (dec (count stack))
                       (fn [op]
                         (mapv (fn [item]
                                 (if (= ::worker-undo-redo/db-transact (first item))
                                   [::worker-undo-redo/db-transact
                                    (assoc (second item) :tx-data [(d/datom 1 :block/title "poisoned" 1 true)])]
                                   item))
                               op)))))
      (delete-client-op-tx-row! client-ops-conn tx-id)
      (is (not= ::worker-undo-redo/empty-undo-stack
                (worker-undo-redo/undo test-repo)))
      (is (seq (get @worker-undo-redo/*redo-ops test-repo))))))

(deftest undo-redo-rebinds-stack-to-latest-history-tx-id-test
  (testing "undo/redo pushes stack op with latest persisted history tx id"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          client-ops-conn (get @worker-state/*client-ops-conns test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (save-block-title! conn child-uuid "v1")
      (let [source-tx-id (:db-sync/tx-id (latest-undo-history-data))]
        (is (uuid? source-tx-id))
        (is (not= ::worker-undo-redo/empty-undo-stack
                  (worker-undo-redo/undo test-repo)))
        (let [redo-tx-id (:db-sync/tx-id (latest-redo-history-data))]
          (is (uuid? redo-tx-id))
          (is (= source-tx-id redo-tx-id))
          (is (not= ::worker-undo-redo/empty-redo-stack
                    (worker-undo-redo/redo test-repo)))
          (let [undo-tx-id (:db-sync/tx-id (latest-undo-history-data))]
            (is (uuid? undo-tx-id))
            (is (not= source-tx-id undo-tx-id))
            (is (client-op-tx-row-exists? client-ops-conn undo-tx-id))))))))

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
  (testing "non-semantic outliner-op with transact placeholder is persisted in undo history"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (d/transact! conn
                   [[:db/add [:block/uuid child-uuid] :block/title "restored child"]]
                   (local-tx-meta
                    {:client-id "test-client"
                     :outliner-op :restore-recycled}))
      (let [undo-op (last (get @worker-undo-redo/*undo-ops test-repo))
            data (some #(when (= ::worker-undo-redo/db-transact (first %))
                          (second %))
                       undo-op)]
        (is (some? data))
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

(deftest undo-cycle-todo-removes-task-class-test
  (testing "undoing first status set should remove task class and status"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          block-uuid (:block/uuid (db-test/find-block-by-content @conn "task"))]
      (outliner-op/apply-ops! conn
                              [[:set-block-property [[:block/uuid block-uuid]
                                                     :logseq.property/status
                                                     :logseq.property/status.todo]]]
                              (local-tx-meta {:client-id "test-client"}))

      (let [block-after-set (d/entity @conn [:block/uuid block-uuid])]
        (is (= :logseq.property/status.todo
               (some-> (:logseq.property/status block-after-set) :db/ident)))
        (is (contains? (set (map :db/ident (:block/tags block-after-set)))
                       :logseq.class/Task)))

      (is (map? (worker-undo-redo/undo test-repo)))
      (let [block-after-undo (d/entity @conn [:block/uuid block-uuid])]
        (is (not (contains? (d/pull @conn [:logseq.property/status] [:block/uuid block-uuid])
                            :logseq.property/status)))
        (is (not (contains? (set (map :db/ident (:block/tags block-after-undo)))
                            :logseq.class/Task)))))))

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

(deftest undo-delete-page-restores-class-property-and-today-page-test
  (testing "undoing delete-page restores hard-retracted class/property pages and today page blocks"
    (let [conn (worker-state/get-datascript-conn test-repo)
          class-title "undo class page movie"
          [_ class-uuid] (outliner-op/apply-ops! conn
                                                 [[:create-page [class-title
                                                                 {:class? true
                                                                  :redirect? false
                                                                  :split-namespace? true
                                                                  :tags ()}]]]
                                                 (local-tx-meta {:client-id "test-client"}))
          _ (outliner-op/apply-ops! conn
                                    [[:upsert-property [:user.property/undo-rating
                                                        {:logseq.property/type :number}
                                                        {:property-name "undo-rating"}]]]
                                    (local-tx-meta {:client-id "test-client"}))
          property-page (d/entity @conn :user.property/undo-rating)
          property-uuid (:block/uuid property-page)
          today-day (date-time-util/ms->journal-day (js/Date.))
          today-title (date-time-util/int->journal-title
                       today-day
                       (:logseq.property.journal/title-format
                        (d/entity @conn :logseq.class/Journal)))
          [_ today-page-uuid] (outliner-op/apply-ops! conn
                                                      [[:create-page [today-title
                                                                      {:today-journal? true
                                                                       :redirect? false
                                                                       :split-namespace? true
                                                                       :tags ()}]]]
                                                      (local-tx-meta {:client-id "test-client"}))
          today-page-id (:db/id (d/entity @conn [:block/uuid today-page-uuid]))
          today-child-uuid (random-uuid)
          _ (outliner-op/apply-ops! conn
                                    [[:insert-blocks [[{:block/uuid today-child-uuid
                                                        :block/title "today undo child"}]
                                                      today-page-id
                                                      {:sibling? false
                                                       :keep-uuid? true}]]]
                                    (local-tx-meta {:client-id "test-client"}))
          class-ident-before (:db/ident (d/entity @conn [:block/uuid class-uuid]))
          property-ident-before (:db/ident (d/entity @conn [:block/uuid property-uuid]))]
      (worker-undo-redo/clear-history! test-repo)

      (outliner-op/apply-ops! conn
                              [[:delete-page [class-uuid {}]]]
                              (local-tx-meta {:client-id "test-client"}))
      (is (nil? (d/entity @conn [:block/uuid class-uuid])))
      (is (map? (worker-undo-redo/undo test-repo)))
      (is (= class-ident-before
             (:db/ident (d/entity @conn [:block/uuid class-uuid]))))

      (worker-undo-redo/clear-history! test-repo)
      (outliner-op/apply-ops! conn
                              [[:delete-page [property-uuid {}]]]
                              (local-tx-meta {:client-id "test-client"}))
      (is (nil? (d/entity @conn :user.property/undo-rating)))
      (is (map? (worker-undo-redo/undo test-repo)))
      (is (= property-ident-before
             (:db/ident (d/entity @conn [:block/uuid property-uuid]))))

      (worker-undo-redo/clear-history! test-repo)
      (outliner-op/apply-ops! conn
                              [[:delete-page [today-page-uuid {}]]]
                              (local-tx-meta {:client-id "test-client"}))
      (is (some? (d/entity @conn [:block/uuid today-page-uuid])))
      (is (nil? (d/entity @conn [:block/uuid today-child-uuid])))
      (is (map? (worker-undo-redo/undo test-repo)))
      (is (some? (d/entity @conn [:block/uuid today-child-uuid]))))))

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
            inserted-a (when inserted-a-id (d/entity @conn inserted-a-id))]
        (is (some? inserted-a))
        (is (= template-root-uuid
               (some-> inserted-a :logseq.property/used-template :block/uuid)))))))

(deftest undo-history-canonicalizes-template-replace-empty-target-to-apply-template-test
  (testing "template replace-empty-target history keeps semantic forward op and restores empty target"
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
      (let [data (latest-undo-history-data)
            inverse-ops (:db-sync/inverse-outliner-ops data)
            delete-op (some #(when (= :delete-blocks (first %)) %) inverse-ops)
            restore-empty-insert-op (some #(when (= :insert-blocks (first %)) %) inverse-ops)
            restore-empty-save-op (some #(when (= :save-block (first %)) %) inverse-ops)]
        (is (contains? #{:apply-template :insert-blocks}
                       (ffirst (:db-sync/forward-outliner-ops data))))
        (is (some? delete-op))
        (is (or (some? restore-empty-insert-op)
                (some? restore-empty-save-op)))
        (if restore-empty-insert-op
          (do
            (is (= empty-target-uuid
                   (get-in restore-empty-insert-op [1 0 0 :block/uuid])))
            (is (= ""
                   (get-in restore-empty-insert-op [1 0 0 :block/title]))))
          (do
            (is (= empty-target-uuid
                   (get-in restore-empty-save-op [1 0 :block/uuid])))
            (is (= ""
                   (get-in restore-empty-save-op [1 0 :block/title])))))))))

(deftest undo-history-replace-empty-target-insert-restores-empty-target-with-insert-op-test
  (testing "replace-empty-target insert inverse should delete inserted blocks and reinsert original empty target"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [page-uuid]} (seed-page-parent-child!)
          page-id (:db/id (d/entity @conn [:block/uuid page-uuid]))
          empty-target-uuid (random-uuid)
          inserted-root-uuid (random-uuid)
          inserted-child-uuid (random-uuid)]
      (outliner-op/apply-ops!
       conn
       [[:insert-blocks [[{:block/uuid empty-target-uuid
                           :block/title ""}]
                         page-id
                         {:sibling? false
                          :keep-uuid? true}]]]
       (local-tx-meta {:client-id "test-client"}))
      (let [empty-target (d/entity @conn [:block/uuid empty-target-uuid])]
        (outliner-op/apply-ops!
         conn
         [[:insert-blocks [[{:block/uuid inserted-root-uuid
                             :block/title "insert root"}
                            {:block/uuid inserted-child-uuid
                             :block/title "insert child"
                             :block/parent [:block/uuid inserted-root-uuid]}]
                           (:db/id empty-target)
                           {:sibling? true
                            :replace-empty-target? true}]]]
         (local-tx-meta {:client-id "test-client"})))
      (let [data (latest-undo-history-data)
            inverse-ops (:db-sync/inverse-outliner-ops data)
            delete-op (some #(when (= :delete-blocks (first %)) %) inverse-ops)
            restore-empty-insert-op (some #(when (= :insert-blocks (first %)) %) inverse-ops)
            restore-empty-save-op (some #(when (= :save-block (first %)) %) inverse-ops)
            delete-ids (set (get-in delete-op [1 0]))]
        (is (= :insert-blocks (ffirst (:db-sync/forward-outliner-ops data))))
        (is (seq delete-ids))
        (is (or (some? restore-empty-insert-op)
                (some? restore-empty-save-op)))
        (if restore-empty-insert-op
          (do
            (is (= empty-target-uuid
                   (get-in restore-empty-insert-op [1 0 0 :block/uuid])))
            (is (= ""
                   (get-in restore-empty-insert-op [1 0 0 :block/title]))))
          (do
            (is (= empty-target-uuid
                   (get-in restore-empty-save-op [1 0 :block/uuid])))
            (is (= ""
                   (get-in restore-empty-save-op [1 0 :block/title])))))))))

(deftest apply-template-op-replays-via-undo-redo-test
  (testing ":apply-template op can be applied and replayed via undo/redo"
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
         [[:apply-template [(:db/id template-root)
                            (:db/id empty-target)
                            {:sibling? true
                             :replace-empty-target? true
                             :template-blocks blocks-to-insert}]]]
         (local-tx-meta {:client-id "test-client"})))

      (let [data (latest-undo-history-data)]
        (is (= :apply-template (ffirst (:db-sync/forward-outliner-ops data)))))

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
        (is (some? inserted-b))))))

(deftest apply-template-repeated-undo-redo-uses-latest-history-tx-id-test
  (testing ":apply-template repeated undo/redo should always undo latest recreated blocks"
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
      (worker-undo-redo/clear-history! test-repo)
      (let [template-root (d/entity @conn [:block/uuid template-root-uuid])
            empty-target (d/entity @conn [:block/uuid empty-target-uuid])
            template-blocks (->> (ldb/get-block-and-children @conn template-root-uuid
                                                             {:include-property-block? true})
                                 rest)
            blocks-to-insert (cons (assoc (first template-blocks)
                                          :logseq.property/used-template (:db/id template-root))
                                   (rest template-blocks))
            find-inserted-a-id (fn []
                                 (d/q '[:find ?b .
                                        :in $ ?template-uuid
                                        :where
                                        [?template :block/uuid ?template-uuid]
                                        [?b :logseq.property/used-template ?template]
                                        [?b :block/title "a"]]
                                      @conn
                                      template-root-uuid))]
        (outliner-op/apply-ops!
         conn
         [[:apply-template [(:db/id template-root)
                            (:db/id empty-target)
                            {:sibling? true
                             :replace-empty-target? true
                             :template-blocks blocks-to-insert}]]]
         (local-tx-meta {:client-id "test-client"}))
        (is (some? (find-inserted-a-id)))
        (is (not= ::worker-undo-redo/empty-undo-stack
                  (worker-undo-redo/undo test-repo)))
        (is (nil? (find-inserted-a-id)))
        (is (not= ::worker-undo-redo/empty-redo-stack
                  (worker-undo-redo/redo test-repo)))
        (let [redo-1-a-id (find-inserted-a-id)]
          (is (some? redo-1-a-id))
          (is (not= ::worker-undo-redo/empty-undo-stack
                    (worker-undo-redo/undo test-repo)))
          (is (nil? (find-inserted-a-id)))
          (is (not= ::worker-undo-redo/empty-redo-stack
                    (worker-undo-redo/redo test-repo)))
          (let [redo-2-a-id (find-inserted-a-id)]
            (is (some? redo-2-a-id))
            (is (not= redo-1-a-id redo-2-a-id))
            (is (not= ::worker-undo-redo/empty-undo-stack
                      (worker-undo-redo/undo test-repo)))
            (is (nil? (find-inserted-a-id)))))))))

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
          page-id (:db/id (d/entity @conn [:block/uuid page-uuid]))
          inserted-uuid (random-uuid)]
      (d/transact! conn
                   [{:block/uuid inserted-uuid
                     :block/title "inserted"
                     :block/page [:block/uuid page-uuid]
                     :block/parent [:block/uuid page-uuid]}]
                   (local-tx-meta
                    {:client-id "test-client"
                     :outliner-op :insert-blocks
                     :outliner-ops [[:insert-blocks [[{:block/title "inserted"
                                                       :block/uuid inserted-uuid}]
                                                     page-id
                                                     {:sibling? false}]]]}))
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

(deftest repeated-set-block-property-text-value-undo-redo-test
  (testing "set-block-property text value survives repeated undo/redo for one and many cardinalities"
    (worker-undo-redo/clear-history! test-repo)
    (let [conn (worker-state/get-datascript-conn test-repo)
          {:keys [child-uuid]} (seed-page-parent-child!)]
      (doseq [[suffix cardinality] [[:one :one] [:many :many]]]
        (let [property-id (keyword (str "user.property/p1-undo-redo-" (name suffix)))]
          (outliner-op/apply-ops! conn
                                  [[:upsert-property [property-id
                                                      {:logseq.property/type :default
                                                       :db/cardinality cardinality}
                                                      {}]]]
                                  (local-tx-meta {:client-id "test-client"}))
          (worker-undo-redo/clear-history! test-repo)
          (outliner-op/apply-ops! conn
                                  [[:set-block-property [[:block/uuid child-uuid]
                                                         property-id
                                                         "value-1"]]]
                                  (local-tx-meta {:client-id "test-client"}))
          (let [history (latest-undo-history-data)]
            (is (empty? (:db-sync/forward-outliner-ops history))))
          (dotimes [_ 3]
            (when-let [undo-tx-id (:db-sync/tx-id (latest-undo-history-data))]
              (poison-history-tx-order! undo-tx-id))
            (is (map? (worker-undo-redo/undo test-repo)))
            (is (empty? (property-value-titles
                         (get (d/entity @conn [:block/uuid child-uuid]) property-id))))
            (when-let [redo-tx-id (:db-sync/tx-id (latest-redo-history-data))]
              (poison-history-tx-order! redo-tx-id))
            (is (map? (worker-undo-redo/redo test-repo)))
            (let [titles (property-value-titles
                          (get (d/entity @conn [:block/uuid child-uuid]) property-id))]
              (is (contains? (set titles) "value-1")))))))))

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
