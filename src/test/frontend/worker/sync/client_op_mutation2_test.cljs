(ns frontend.worker.sync.client-op-mutation2-test
  "Second-run mutation survivors in frontend.worker.sync.client-op."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]
            [logseq.db.test.helper :as db-test]))

(defn- new-memory-db
  []
  (let [Database (js/require "better-sqlite3")]
    (new Database ":memory:")))

(defn- with-client-ops-db
  [repo f]
  (let [db (new-memory-db)
        prev-client-ops-conns @worker-state/*client-ops-conns]
    (reset! worker-state/*client-ops-conns {repo db})
    (try
      (f db)
      (finally
        (.close db)
        (reset! worker-state/*client-ops-conns prev-client-ops-conns)))))

(defn- with-store
  [repo store f]
  (let [prev @worker-state/*client-ops-conns]
    (reset! worker-state/*client-ops-conns {repo store})
    (try
      (f)
      (finally
        (reset! worker-state/*client-ops-conns prev)))))

(defn- thrown-ex-data
  [f]
  (try (f)
       nil
       (catch :default e (ex-data e))))

(defn- tx-entry
  [tx-id & {:as opts}]
  (merge {:tx-id tx-id
          :created-at 1
          :normalized-tx-data []
          :reversed-tx-data []}
         opts))

;; Fails if, in `sqlite-store-or-throw`, the `:type` key is dropped, the `:repo` key is dropped or `:db-sync/legacy-client-ops-storage` becomes `:db-sync/undo-redo`.
(deftest legacy-client-ops-storage-throws-with-type-and-repo
  (let [repo "repo-legacy"]
    (with-store repo #js {}
      (fn []
        (is (= {:type :db-sync/legacy-client-ops-storage :repo repo}
               (thrown-ex-data #(client-op/get-graph-uuid repo))))))))

;; Fails if, in `sqlite-run!`, the `:bind` key is dropped.
;; Fails if, in `sqlite-rows`, the `:bind` key is dropped, the `:rowMode` key is dropped or the `:returnValue` key is dropped.
(deftest sqlite-wasm-mode-passes-bind-and-row-options
  (let [repo "repo-wasm"
        calls (atom [])
        db #js {:exec (fn [^js opts]
                        (swap! calls conj opts)
                        (if (and (re-find #"^select value" (.-sql opts))
                                 (= "object" (.-rowMode opts))
                                 (= "resultRows" (.-returnValue opts))
                                 (array? (.-bind opts)))
                          #js [#js {:value "g1"}]
                          #js []))}]
    (with-store repo db
      (fn []
        (is (= "g1" (client-op/get-graph-uuid repo)))
        (client-op/update-graph-uuid repo "g2")
        (is (every? #(array? (.-bind %)) @calls)
            "Every statement is run with a bind array")))))

;; Fails if, in `update-graph-uuid`, the `:pre` key is dropped.
;; Fails if, in `update-local-checksum`, the `:pre` key is dropped.
;; Fails if, in `upsert-local-tx-entry!`, the `:pre` key is dropped.
(deftest writes-without-their-key-arg-are-rejected
  (let [repo "repo-pre"]
    (with-client-ops-db
      repo
      (fn [_db]
        (is (thrown? js/Error (client-op/update-graph-uuid repo nil)))
        (is (nil? (client-op/get-graph-uuid repo)))
        (is (thrown? js/Error (client-op/update-local-checksum repo nil 3)))
        (is (thrown? js/Error (client-op/update-local-checksum repo "c" nil)))
        (is (thrown? js/Error (client-op/upsert-local-tx-entry! repo (tx-entry nil))))
        (is (empty? (client-op/get-pending-local-txs repo)))))))

;; Fails if, in `update-local-tx`, the `:repo` key is dropped, the `:prev-t` key is dropped or the `:new-t` key is dropped.
(deftest update-local-tx-must-increase
  (let [repo "repo-monotonic"]
    (with-client-ops-db
      repo
      (fn [_db]
        (client-op/update-local-tx repo 9)
        (is (= {:repo repo :prev-t 9 :new-t 3}
               (thrown-ex-data #(client-op/update-local-tx repo 3))))
        (is (= 9 (client-op/get-local-tx repo)))))))

;; Fails if, in `reset-local-tx`, the body becomes `nil`.
(deftest reset-local-tx-sets-zero
  (let [repo "repo-reset"]
    (with-client-ops-db
      repo
      (fn [_db]
        (client-op/update-local-tx repo 9)
        (client-op/reset-local-tx repo)
        (is (= 0 (client-op/get-local-tx repo)))))))

;; Fails if, in `row->pending-local-tx`, the `:db-sync/undo-redo` key is dropped or `:db-sync/undo-redo` becomes `:db-sync/checksum`.
;; Fails if, in `upsert-local-tx-entry!`, the `:tx-id` key is dropped or the `:created-at` key is dropped.
;; Fails if, in `get-pending-local-txs`, the `vec` step is dropped.
;; Fails if, in `history-action-ops-by-tx-id`, the `seq` step is dropped.
(deftest local-tx-entry-roundtrip
  (let [repo "repo-entry"
        tx-id (random-uuid)]
    (with-client-ops-db
      repo
      (fn [_db]
        (let [result (client-op/upsert-local-tx-entry! repo (tx-entry tx-id :created-at 77 :undo-redo :undo))]
          (is (= {:tx-id tx-id :created-at 77 :should-inc-pending? true} result)))
        (is (= :undo (:db-sync/undo-redo (client-op/get-local-tx-entry repo tx-id))))
        (let [pending (client-op/get-pending-local-txs repo)]
          (is (vector? pending))
          (is (= [tx-id] (map :tx-id pending))))
        (is (= {:db-sync/forward-outliner-ops nil :db-sync/inverse-outliner-ops nil}
               (client-op/history-action-ops-by-tx-id repo tx-id))
            "Empty op lists are reported as nil")))))

;; Fails if, in `sync-conflict-row->map`, the `:id` key is dropped or the `:created-at` key is dropped.
;; Fails if, in `get-all-sync-conflicts`, the body becomes `nil`, the `(map sync-conflict-row->map)` step is dropped or the `(group-by :block-uuid)` step is dropped.
(deftest sync-conflicts-roundtrip
  (let [repo "repo-conflicts"
        block-a (random-uuid)
        block-b (random-uuid)]
    (with-client-ops-db
      repo
      (fn [_db]
        (client-op/add-sync-conflicts! repo [{:block-uuid block-a :attr :block/title :value "va" :remote-t 5}
                                             {:block-uuid block-b :attr :block/title :value "vb" :remote-t 6}])
        (let [conflict (first (client-op/get-sync-conflicts repo block-a))]
          (is (number? (:id conflict)))
          (is (number? (:created-at conflict)))
          (is (= {:block-uuid block-a :attr :block/title :value "va" :remote-t 5}
                 (select-keys conflict [:block-uuid :attr :value :remote-t]))))
        (let [all (client-op/get-all-sync-conflicts repo)]
          (is (= #{block-a block-b} (set (keys all))))
          (is (= [:block/title] (map :attr (get all block-a))))
          (is (= ["vb"] (map :value (get all block-b)))))))))

;; Fails if, in `mark-pending-txs-false!`, the `(filter uuid?)` step is dropped or the `(filter (fn [tx-id]` step is dropped.
;; Fails if, in `mark-failed-txs!`, the `(filter uuid?)` step is dropped, the `(filter (fn [tx-id]` step is dropped, the `count` step is dropped or `filter` becomes `remove`.
(deftest mark-txs-counts-only-pending-uuid-ids
  (let [repo "repo-mark"
        pending-id (random-uuid)
        done-id (random-uuid)
        string-id (random-uuid)
        failed-id (random-uuid)
        pending-id-2 (random-uuid)
        failed-id-2 (random-uuid)]
    (with-client-ops-db
      repo
      (fn [_db]
        (client-op/upsert-local-tx-entry! repo (tx-entry pending-id))
        (client-op/upsert-local-tx-entry! repo (tx-entry done-id :pending? false))
        (client-op/upsert-local-tx-entry! repo (tx-entry string-id))
        (client-op/upsert-local-tx-entry! repo (tx-entry failed-id))
        (client-op/upsert-local-tx-entry! repo (tx-entry pending-id-2))
        (is (= 2 (client-op/mark-pending-txs-false! repo [pending-id pending-id-2 done-id]))
            "Only the pending ones are counted")
        (is (= 0 (client-op/mark-pending-txs-false! repo [(str string-id)]))
            "A string is not a tx id")
        (client-op/upsert-local-tx-entry! repo (tx-entry failed-id-2))
        (is (= 2 (client-op/mark-failed-txs! repo [failed-id failed-id-2 done-id]))
            "Only the pending ones are counted")
        (is (= 0 (client-op/mark-failed-txs! repo [(str string-id)])))
        (is (= [string-id] (map :tx-id (client-op/get-pending-local-txs repo)))
            "The string ids left their tx pending")))))

;; Fails if, in `local-asset-op-map`, the `:block/uuid` key is dropped.
;; Fails if, in `add-asset-ops`, the `second` step is dropped.
;; Fails if, in `get-all-asset-ops`, the `vec` step is dropped.
(deftest asset-ops-keep-uuid-and-ignore-updates-older-than-a-remove
  (let [repo "repo-asset-ops"
        asset-uuid (random-uuid)]
    (with-client-ops-db
      repo
      (fn [_db]
        (client-op/add-asset-ops repo [[:remove-asset 5 {:block-uuid asset-uuid}]])
        (is (= [{:block/uuid asset-uuid
                 :remove-asset [:remove-asset 5 {:block-uuid asset-uuid}]}]
               (client-op/get-all-asset-ops repo)))
        (is (vector? (client-op/get-all-asset-ops repo)))
        (client-op/add-asset-ops repo [[:update-asset 3 {:block-uuid asset-uuid}]])
        (is (= [{:block/uuid asset-uuid
                 :remove-asset [:remove-asset 5 {:block-uuid asset-uuid}]}]
               (client-op/get-all-asset-ops repo))
            "An update older than the remove is dropped")))))

;; Fails if, in `add-all-exists-asset-as-ops`, the body becomes `nil`, the `(keep (fn [d]` step is dropped or the `:block-uuid` key is dropped.
(deftest add-all-exists-asset-as-ops-adds-an-update-per-asset-block
  (let [repo "repo-all-assets"
        asset-uuid (random-uuid)
        conn (db-test/create-conn)
        prev @worker-state/*datascript-conns]
    (d/transact! conn [{:block/uuid asset-uuid
                        :logseq.property.asset/type "png"}])
    (reset! worker-state/*datascript-conns {repo conn})
    (try
      (with-client-ops-db
        repo
        (fn [_db]
          (client-op/add-all-exists-asset-as-ops repo)
          (is (= [{:block/uuid asset-uuid
                   :update-asset [:update-asset 1 {:block-uuid asset-uuid}]}]
                 (client-op/get-all-asset-ops repo)))))
      (finally
        (reset! worker-state/*datascript-conns prev)))))
