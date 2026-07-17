(ns frontend.db.transact-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.common.page-window :as page-window]
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

(deftest refresh-worker-op-blocks-publishes-structural-marker-test
  (let [block-id (random-uuid)
        target-id (random-uuid)
        tx-id (random-uuid)
        page-id (random-uuid)]
    (state/set-state! :db/latest-transacted-entity-uuids {})
    (#'db-transact/refresh-worker-op-blocks!
     [[:insert-blocks [[{:block/uuid block-id}] target-id {}]]]
     {:db-sync/tx-id tx-id
      :ui/page-id page-id}
     {:root {:block/uuid page-id} :rows []}
     nil)
    (let [latest (state/get-state :db/latest-transacted-entity-uuids)]
      (is (= #{block-id target-id} (:updated-ids latest)))
      (is (= #{} (:deleted-ids latest)))
      (is (= {block-id tx-id target-id tx-id}
             (:entity-tx-ids latest)))
      (is (true? (:page-window-refresh? latest)))
      (is (= page-id (:page-id latest)))
      (is (= tx-id (:tx-id latest)))
      (is (= page-id (get-in latest [:page-window :root :block/uuid])))
      (is (not (:page-children-stale? latest))))))

(deftest refresh-worker-op-blocks-does-not-mark-page-lookup-as-updated-test
  (let [block-id (random-uuid)
        page-db-id 10
        tx-id (random-uuid)]
    (state/set-state! :db/latest-transacted-entity-uuids {})
    (#'db-transact/refresh-worker-op-blocks!
     [[:save-block [{:block/uuid block-id} {}]]]
     {:db-sync/tx-id tx-id
      :ui/page-id page-db-id}
     nil
     nil)
    (let [latest (state/get-state :db/latest-transacted-entity-uuids)]
      (is (= #{block-id} (:updated-ids latest)))
      (is (nil? (get-in latest [:entity-tx-ids page-db-id]))))))

(deftest refresh-worker-op-blocks-keeps-cross-page-refresh-separate-test
  (let [block-id (random-uuid)
        current-page-id (random-uuid)
        target-page-id (random-uuid)
        tx-id (random-uuid)]
    (state/set-state! :db/latest-transacted-entity-uuids {})
    (#'db-transact/refresh-worker-op-blocks!
     [[:indent-outdent-blocks [[block-id] true {}]]]
     {:db-sync/tx-id tx-id}
     nil
     #{current-page-id target-page-id})
    (let [latest (state/get-state :db/latest-transacted-entity-uuids)]
      (is (= #{block-id} (:updated-ids latest)))
      (is (= #{current-page-id target-page-id} (:affected-page-uuids latest)))
      (is (= tx-id (get-in latest [:entity-tx-ids current-page-id])))
      (is (= tx-id (get-in latest [:entity-tx-ids target-page-id]))))))

(deftest editor-callback-runs-from-its-worker-response-test
  (let [callback-id (random-uuid)
        calls (atom [])]
    (state/queue-edit-block-fn! callback-id #(reset! calls :called))
    (#'db-transact/run-edit-block-fn!
     {:editor/edit-block-fn-id callback-id}
     nil)
    (is (= :called @calls))
    (is (nil? (state/take-edit-block-fn! callback-id))
        "The callback runs exactly once.")))

(deftest apply-outliner-ops-refreshes-after-worker-persistence-test
  (async done
    (let [block-id (random-uuid)
          tx-id (random-uuid)
          editor-info {:block-id block-id}
          calls (atom [])
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
                      _ (is (= [:thread-api/undo-redo-set-pending-editor-info
                                :thread-api/apply-outliner-ops]
                               (mapv first @calls)))
                      _ (is (= editor-info (get-in @calls [0 1 1]))
                            "Editor history is sent through its dedicated worker API.")
                      _ (is (not-any? #(contains? (get-in @calls [1 1 2]) %)
                                      [:ui/page-id :ui/page-window-opts :ui/editor-info :virtual/offset
                                       :editor/edit-block-fn-id])
                            "The mutation worker must not receive renderer or editor state.")
                      _ (is (= {} (state/get-state :db/latest-transacted-entity-uuids))
                            "UI refresh state must not change until the worker transaction resolves.")
                      _ (p/resolve! worker-result {:result ::persisted})
                      value result
                      _ (p/delay 0)
                      latest (state/get-state :db/latest-transacted-entity-uuids)]
                (is (= ::persisted value))
                (is (= #{block-id} (:updated-ids latest)))
                (is (nil? (:page-window latest)))
                (is (= tx-id (:tx-id latest)))
                (is (= {:typed-text "abc"}
                       (state/get-state :editor/pending-new-block))
                    "Worker completion must not discard input queued before the editor renders."))))
          (p/finally (fn []
                       (state/set-state! :editor/pending-new-block nil)
                       (done)))))))

(deftest structural-op-loads-one-window-after-the-mutation-test
  (async done
    (let [page-id (random-uuid)
          block-id (random-uuid)
          tx-id (random-uuid)
          mutation-result (p/deferred)
          current-window {:root {:block/uuid page-id}
                          :rows [{:block/uuid block-id :block/title ""}]
                          :offset 1
                          :total-count 61}
          calls (atom [])]
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo (constantly "test-repo")
                          state/get-current-page (constantly page-id)
                          state/get-route-match (constantly nil)
                          state/get-editor-info (constantly nil)
                          state/<invoke-db-worker
                          (fn [api & args]
                            (swap! calls conj [api (vec args)])
                            (case api
                              :thread-api/undo-redo-set-pending-editor-info
                              (p/resolved nil)

                              :thread-api/apply-outliner-ops
                              mutation-result

                              :thread-api/get-page-blocks-window
                              (p/resolved current-window)))]
            (let [result (db-transact/apply-outliner-ops
                          nil
                          [[:insert-blocks [[{:block/uuid block-id :block/title ""}]
                                            page-id
                                            {:sibling? false}]]]
                          {:db-sync/tx-id tx-id
                           :ui/page-id page-id
                           :ui/page-window-opts {:anchor :bottom}})]
              (p/let [_ (p/delay 0)
                      _ (is (= [:thread-api/undo-redo-set-pending-editor-info
                                :thread-api/apply-outliner-ops]
                               (mapv first @calls))
                            "The page window must not be queried before the DB mutation commits.")
                      _ (p/resolve! mutation-result {:result ::persisted})
                      value result
                      latest (state/get-state :db/latest-transacted-entity-uuids)]
                (is (= ::persisted value))
                (is (= [:thread-api/undo-redo-set-pending-editor-info
                        :thread-api/apply-outliner-ops
                        :thread-api/get-page-blocks-window]
                       (mapv first @calls)))
                (is (= {:anchor :bottom :limit page-window/limit}
                       (get-in @calls [2 1 2])))
                (is (= current-window (:page-window latest))))))
          (p/finally done)))))

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

(deftest apply-outliner-ops-ignores-response-after-graph-route-switch-test
  (async done
    (let [repo (atom "old-repo")
          route (atom {:data {:name :page}
                       :path-params {:name "old-page"}})
          worker-result (p/deferred)
          callback-id (random-uuid)
          callback-calls (atom 0)
          new-context-state {:tx-id ::new-context}]
      (state/queue-edit-block-fn! callback-id #(swap! callback-calls inc))
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo #(deref repo)
                          state/get-route-match #(deref route)
                          state/get-editor-info (constantly nil)
                          state/<invoke-db-worker
                          (fn [_api & _args]
                            worker-result)]
            (let [result (db-transact/apply-outliner-ops
                          nil
                          [[:save-block [{:block/uuid (random-uuid)} {}]]]
                          {:editor/edit-block-fn-id callback-id})]
              (reset! repo "new-repo")
              (reset! route {:data {:name :page}
                             :path-params {:name "new-page"}})
              (state/set-state! :db/latest-transacted-entity-uuids new-context-state)
              (p/resolve! worker-result {:result ::persisted
                                         :page-window {:root {:block/uuid (random-uuid)}
                                                       :rows []}})
              (p/let [value result
                      _ (p/delay 0)]
                (is (= ::persisted value))
                (is (= new-context-state
                       (state/get-state :db/latest-transacted-entity-uuids)))
                (is (zero? @callback-calls))
                (is (nil? (state/take-edit-block-fn! callback-id))))))
          (p/finally
           (fn []
             (state/remove-edit-block-fn! callback-id)
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
