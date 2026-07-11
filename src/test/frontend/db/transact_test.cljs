(ns frontend.db.transact-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db.transact :as db-transact]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(deftest op-block-uuids-includes-move-ops-test
  (let [block-a (random-uuid)
        block-b (random-uuid)
        target (random-uuid)]
    (is (= #{block-a block-b target}
           (#'db-transact/op-block-uuids
            [[:move-blocks [[block-a block-b] target {}]]])))
    (is (= #{block-a block-b}
           (#'db-transact/op-block-uuids
            [[:move-blocks-up-down [[block-a block-b] true]]
             [:indent-outdent-blocks [[block-a block-b] true {}]]])))))

(deftest op-block-uuids-includes-property-ops-test
  (let [block-a (random-uuid)
        block-b (random-uuid)]
    (is (= #{block-a block-b}
           (#'db-transact/op-block-uuids
            [[:set-block-property [block-a :block/tags 4]]
             [:set-block-properties [block-a {:block/tags 4}]]
             [:class-add-property [block-b :user.property/foo]]
             [:class-remove-property [block-b :user.property/foo]]
             [:delete-closed-value [:logseq.property/status block-b]]
             [:batch-delete-property-value [[block-a block-b] :block/tags 4]]])))))

(deftest outliner-ops-never-request-page-tree-test
  (is (false? (#'db-transact/outliner-ops-need-page-tree?
               [[:save-block [{:block/uuid (random-uuid)} {}]]])))
  (is (false? (#'db-transact/outliner-ops-need-page-tree?
               [[:insert-blocks [[{:block/uuid (random-uuid)}] (random-uuid) {}]]])))
  (is (false? (#'db-transact/outliner-ops-need-page-tree?
               [[:delete-blocks [[(random-uuid)] {}]]])))
  (is (false? (#'db-transact/outliner-ops-need-page-tree?
               [[:indent-outdent-blocks [[(random-uuid)] true {}]]]))))

(deftest outliner-ops-refresh-page-window-only-for-structural-ops-test
  (is (false? (#'db-transact/outliner-ops-need-page-window-refresh?
               [[:save-block [{:block/uuid (random-uuid)} {}]]
                [:set-block-property [(random-uuid) :block/tags 4]]])))
  (is (true? (#'db-transact/outliner-ops-need-page-window-refresh?
              [[:insert-blocks [[{:block/uuid (random-uuid)}] (random-uuid) {}]]])))
  (is (true? (#'db-transact/outliner-ops-need-page-window-refresh?
              [[:move-blocks [[(random-uuid)] (random-uuid) {}]]]))))

(deftest refresh-worker-op-blocks-skips-page-tree-for-content-ops-test
  (let [block-id (random-uuid)
        tx-id (random-uuid)
        page-tree {:block {:block/uuid (random-uuid)}
                   :children [{:block/uuid block-id}]}]
    (state/set-state! :db/latest-transacted-entity-uuids {})
    (#'db-transact/refresh-worker-op-blocks!
     [[:save-block [{:block/uuid block-id} {}]]]
     {:db-sync/tx-id tx-id}
     page-tree)
    (let [latest (state/get-state :db/latest-transacted-entity-uuids)]
      (is (= #{block-id} (:updated-ids latest)))
      (is (= #{} (:deleted-ids latest)))
      (is (false? (:page-window-refresh? latest)))
      (is (= tx-id (:tx-id latest)))
      (is (not (:page-children-stale? latest)))
      (is (not (contains? latest :page-tree))))))

(deftest refresh-worker-op-blocks-skips-page-tree-for-structural-ops-test
  (let [block-id (random-uuid)
        target-id (random-uuid)
        tx-id (random-uuid)
        page-tree {:block {:block/uuid target-id}
                   :children [{:block/uuid block-id}]}]
    (state/set-state! :db/latest-transacted-entity-uuids {})
    (#'db-transact/refresh-worker-op-blocks!
     [[:insert-blocks [[{:block/uuid block-id}] target-id {}]]]
     {:db-sync/tx-id tx-id}
     page-tree)
    (let [latest (state/get-state :db/latest-transacted-entity-uuids)]
      (is (= #{block-id target-id} (:updated-ids latest)))
      (is (= #{} (:deleted-ids latest)))
      (is (true? (:page-window-refresh? latest)))
      (is (= tx-id (:tx-id latest)))
      (is (not (:page-children-stale? latest)))
      (is (not (contains? latest :page-tree))))))

(deftest apply-outliner-ops-refreshes-after-worker-persistence-test
  (async done
    (let [block-id (random-uuid)
          tx-id (random-uuid)
          worker-result (p/deferred)]
      (state/set-state! :db/latest-transacted-entity-uuids {})
      (p/with-redefs [util/node-test? false
                      state/get-current-repo (constantly "test-repo")
                      state/get-editor-info (constantly {})
                      state/<invoke-db-worker
                      (fn [api & _args]
                        (case api
                          :thread-api/undo-redo-set-pending-editor-info
                          (p/resolved nil)

                          :thread-api/apply-outliner-ops
                          worker-result

                          (p/resolved nil)))]
        (let [result (db-transact/apply-outliner-ops
                      nil
                      [[:save-block [{:block/uuid block-id} {}]]]
                      {:db-sync/tx-id tx-id})]
          (-> (p/let [_ (p/delay 0)
                      _ (is (= {} (state/get-state :db/latest-transacted-entity-uuids))
                            "UI refresh state must not change until the worker transaction resolves.")
                      _ (p/resolve! worker-result {:result ::persisted})
                      value result
                      latest (state/get-state :db/latest-transacted-entity-uuids)]
                (is (= ::persisted value))
                (is (= #{block-id} (:updated-ids latest)))
                (is (= tx-id (:tx-id latest))))
              (p/finally done)))))))
