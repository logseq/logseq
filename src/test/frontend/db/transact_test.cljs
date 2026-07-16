(ns frontend.db.transact-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db.transact :as db-transact]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(deftest worker-call-preserves-result-test
  (async done
    (let [result {:blocks [{:block/uuid (random-uuid)}]}]
      (-> (db-transact/worker-call #(p/resolved result))
          (p/then (fn [value]
                    (is (= result value))))
          (p/finally done)))))

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

(deftest outliner-ops-refresh-page-window-only-for-structural-ops-test
  (is (false? (#'db-transact/outliner-ops-need-page-window-refresh?
               [[:save-block [{:block/uuid (random-uuid)} {}]]
                [:set-block-property [(random-uuid) :block/tags 4]]])))
  (is (true? (#'db-transact/outliner-ops-need-page-window-refresh?
              [[:insert-blocks [[{:block/uuid (random-uuid)}] (random-uuid) {}]]])))
  (is (true? (#'db-transact/outliner-ops-need-page-window-refresh?
              [[:move-blocks [[(random-uuid)] (random-uuid) {}]]]))))

(deftest collapse-expand-ops-refresh-page-window-test
  (let [block-id (random-uuid)
        tx-id (random-uuid)]
    (is (true? (#'db-transact/outliner-ops-need-page-window-refresh?
                [[:collapse-expand-blocks [[{:block/uuid block-id
                                              :block/collapsed? true}]
                                           {}]]])))
    (state/set-state! :db/latest-transacted-entity-uuids {})
    (#'db-transact/refresh-worker-op-blocks!
     [[:collapse-expand-blocks [[{:block/uuid block-id
                                   :block/collapsed? true}]
                                {}]]]
     {:db-sync/tx-id tx-id}
     nil
     nil)
    (let [latest (state/get-state :db/latest-transacted-entity-uuids)]
      (is (= #{block-id} (:updated-ids latest)))
      (is (= tx-id (get-in latest [:entity-tx-ids block-id])))
      (is (true? (:page-window-refresh? latest)))
      (is (= tx-id (:tx-id latest))))))

(deftest refresh-worker-op-blocks-publishes-content-ops-test
  (let [block-id (random-uuid)
        tx-id (random-uuid)]
    (state/set-state! :db/latest-transacted-entity-uuids {})
    (#'db-transact/refresh-worker-op-blocks!
     [[:save-block [{:block/uuid block-id} {}]]]
     {:db-sync/tx-id tx-id}
     nil
     nil)
    (let [latest (state/get-state :db/latest-transacted-entity-uuids)]
      (is (= #{block-id} (:updated-ids latest)))
      (is (= #{} (:deleted-ids latest)))
      (is (false? (:page-window-refresh? latest)))
      (is (= tx-id (:tx-id latest)))
      (is (not (:page-children-stale? latest))))))

(deftest refresh-worker-op-blocks-publishes-structural-ops-test
  (let [block-id (random-uuid)
        target-id (random-uuid)
        tx-id (random-uuid)
        page-window {:root {:block/uuid target-id}
                     :rows [{:db/id 1 :block/uuid block-id}]}]
    (state/set-state! :db/latest-transacted-entity-uuids {})
    (#'db-transact/refresh-worker-op-blocks!
     [[:insert-blocks [[{:block/uuid block-id}] target-id {}]]]
     {:db-sync/tx-id tx-id}
     page-window
     nil)
    (let [latest (state/get-state :db/latest-transacted-entity-uuids)]
      (is (= #{block-id target-id} (:updated-ids latest)))
      (is (= #{} (:deleted-ids latest)))
      (is (= {block-id tx-id target-id tx-id}
             (:entity-tx-ids latest)))
      (is (true? (:page-window-refresh? latest)))
      (is (= tx-id (:tx-id latest)))
      (is (= page-window (:page-window latest)))
      (is (not (:page-children-stale? latest))))))

(deftest refresh-worker-op-blocks-keeps-cross-page-refresh-separate-test
  (let [block-id (random-uuid)
        current-page-id (random-uuid)
        target-page-id (random-uuid)
        tx-id (random-uuid)]
    (state/set-state! :db/latest-transacted-entity-uuids {})
    (#'db-transact/refresh-worker-op-blocks!
     [[:indent-outdent-blocks [[block-id] true {}]]]
     {:db-sync/tx-id tx-id}
     {:root {:block/uuid current-page-id}}
     #{current-page-id target-page-id})
    (let [latest (state/get-state :db/latest-transacted-entity-uuids)]
      (is (= #{block-id} (:updated-ids latest)))
      (is (= #{target-page-id} (:affected-page-uuids latest)))
      (is (= tx-id (get-in latest [:entity-tx-ids target-page-id]))))))

(deftest row-data-block-ids-use-worker-rows-for-content-only-test
  (let [current-id (random-uuid)
        inserted-id (random-uuid)]
    (is (= #{current-id}
           (#'db-transact/row-data-block-ids
            [[:save-block [{:block/uuid current-id} {}]]])))
    (is (nil?
         (#'db-transact/row-data-block-ids
          [[:save-block [{:block/uuid current-id} {}]]
           [:insert-blocks [[{:block/uuid inserted-id}]
                            current-id
                            {:sibling? true}]]]))
        "Structural operations refresh from their page window.")))

(deftest editor-callback-runs-from-its-worker-response-test
  (let [callback-id (random-uuid)
        rows [{:block/uuid (random-uuid)}]
        calls (atom [])]
    (state/queue-edit-block-fn! callback-id #(reset! calls %))
    (#'db-transact/run-edit-block-fn!
     {:editor/edit-block-fn-id callback-id}
     {:rows rows})
    (is (= rows @calls))
    (is (nil? (state/take-edit-block-fn! callback-id))
        "The callback runs exactly once.")))

(deftest apply-outliner-ops-refreshes-after-worker-persistence-test
  (async done
    (let [block-id (random-uuid)
          tx-id (random-uuid)
          editor-info {:block-id block-id}
          calls (atom [])
          page-window {:root {:block/uuid (random-uuid)} :rows []}
          worker-result (p/deferred)]
      (state/set-state! :db/latest-transacted-entity-uuids {})
      (state/set-state! :editor/pending-new-block {:typed-text "abc"})
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo (constantly "test-repo")
                          state/get-editor-info (constantly editor-info)
                          state/<invoke-db-worker
                          (fn [api & args]
                            (swap! calls conj [api (vec args)])
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
              (p/let [_ (p/delay 0)
                      _ (is (= [:thread-api/apply-outliner-ops]
                               (mapv first @calls)))
                      _ (is (= editor-info
                               (get-in @calls [0 1 2 :ui/editor-info])))
                      _ (is (= {} (state/get-state :db/latest-transacted-entity-uuids))
                            "UI refresh state must not change until the worker transaction resolves.")
                      _ (p/resolve! worker-result {:result ::persisted
                                                  :page-window page-window})
                      value result
                      _ (p/delay 0)
                      latest (state/get-state :db/latest-transacted-entity-uuids)]
                (is (= ::persisted value))
                (is (= #{block-id} (:updated-ids latest)))
                (is (= page-window (:page-window latest)))
                (is (= tx-id (:tx-id latest)))
                (is (= {:typed-text "abc"}
                       (state/get-state :editor/pending-new-block))
                    "Worker completion must not discard input queued before the editor renders."))))
          (p/finally (fn []
                       (state/set-state! :editor/pending-new-block nil)
                       (done)))))))

(deftest apply-outliner-ops-completes-before-next-frame-callback-test
  (async done
    (let [callback-id (random-uuid)
          block-id (random-uuid)
          original-raf (.-requestAnimationFrame js/globalThis)
          frame-callback (atom nil)
          settlement (atom nil)]
      (set! (.-requestAnimationFrame js/globalThis)
            #(reset! frame-callback %))
      (state/queue-edit-block-fn!
       callback-id
       (fn [& _]
         (throw (js/Error. "editor callback failed"))))
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo (constantly "test-repo")
                          state/get-editor-info (constantly nil)
                          state/<invoke-db-worker
                          (fn [_api & _args]
                            (p/resolved {:result ::persisted
                                         :page-window {:rows []}}))]
            (let [result (db-transact/apply-outliner-ops
                          nil
                          [[:save-block [{:block/uuid block-id} {}]]]
                          {:editor/edit-block-fn-id callback-id})]
              (-> result
                  (p/then #(reset! settlement [:resolved %]))
                  (p/catch #(reset! settlement [:rejected (ex-message %)])))
              (p/let [_ (p/delay 0)
                      _ (is (= [:resolved ::persisted] @settlement)
                            "DB completion must not wait for cursor work.")
                      _ (when-let [f @frame-callback] (f))
                      _ (p/delay 0)]
                (is (= [:resolved ::persisted] @settlement)
                    "Cursor callback failure must not reject committed DB work."))))
          (p/finally
           (fn []
             (state/remove-edit-block-fn! callback-id)
             (set! (.-requestAnimationFrame js/globalThis) original-raf)
             (done)))))))

(deftest apply-outliner-ops-removes-editor-callback-on-worker-failure-test
  (async done
    (let [callback-id (random-uuid)]
      (state/queue-edit-block-fn! callback-id (fn [] nil))
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo (constantly "test-repo")
                          state/get-editor-info (constantly nil)
                          state/<invoke-db-worker
                          (fn [_api & _args]
                            (p/rejected (js/Error. "worker failed")))]
            (-> (db-transact/apply-outliner-ops
                 nil
                 [[:save-block [{:block/uuid (random-uuid)} {}]]]
                 {:editor/edit-block-fn-id callback-id})
                (p/then (fn [_]
                          (is false "Worker failure should reject.")))
                (p/catch (fn [_]
                           (is (nil? (state/take-edit-block-fn! callback-id)))))))
          (p/finally
           (fn []
             (state/remove-edit-block-fn! callback-id)
             (done)))))))
