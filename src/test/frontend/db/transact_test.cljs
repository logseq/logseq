(ns frontend.db.transact-test
  (:require ["react-dom" :as react-dom]
            [cljs.test :refer [async deftest is]]
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

(deftest refresh-worker-op-blocks-publishes-authoritative-delta-test
  (let [block-id (random-uuid)
        target-id (random-uuid)
        deleted-id (random-uuid)
        invalidated-id (random-uuid)
        tx-id (random-uuid)
        page-id (random-uuid)
        updated-block {:block/uuid block-id :block/title "persisted"}]
    (state/set-state! :db/latest-transacted-entity-uuids {})
    (#'db-transact/refresh-worker-op-blocks!
     [[:insert-blocks [[{:block/uuid block-id}] target-id {}]]]
     {:db-sync/tx-id tx-id
      :ui/page-id page-id}
     [updated-block]
     [deleted-id]
     [page-id]
     [invalidated-id])
    (let [latest (state/get-state :db/latest-transacted-entity-uuids)]
      (is (= #{block-id target-id invalidated-id} (:updated-ids latest)))
      (is (= #{deleted-id} (:deleted-ids latest)))
      (is (= [updated-block] (:updated-blocks latest)))
      (is (= #{page-id} (:affected-page-uuids latest)))
      (is (= page-id (:page-id latest)))
      (is (= tx-id (:tx-id latest)))
      (is (every? #(= tx-id (get-in latest [:entity-tx-ids %]))
                  [block-id target-id deleted-id invalidated-id page-id])))))

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
     nil
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
     nil
     #{current-page-id target-page-id}
     nil)
    (let [latest (state/get-state :db/latest-transacted-entity-uuids)]
      (is (= #{block-id} (:updated-ids latest)))
      (is (= #{current-page-id target-page-id} (:affected-page-uuids latest)))
      (is (= tx-id (get-in latest [:entity-tx-ids current-page-id])))
      (is (= tx-id (get-in latest [:entity-tx-ids target-page-id]))))))

(deftest editor-callback-runs-from-its-worker-response-test
  (let [calls (atom [])]
    (#'db-transact/run-edit-block-fn!
     {:editor/edit-block-fn (fn [_rows] (reset! calls :called))}
     nil)
    (is (= :called @calls))))

(deftest apply-outliner-ops-refreshes-after-worker-persistence-test
  (async done
    (let [block-id (random-uuid)
          tx-id (random-uuid)
          editor-info {:block-id block-id}
          calls (atom [])
          worker-result (p/deferred)]
      (state/set-state! :db/latest-transacted-entity-uuids {})
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
                                      [:ui/page-id :ui/editor-info :virtual/offset
                                       :editor/edit-block-fn])
                            "The mutation worker must not receive renderer or editor state.")
                      _ (is (= {} (state/get-state :db/latest-transacted-entity-uuids))
                            "UI refresh state must not change until the worker transaction resolves.")
                      updated-block {:block/uuid block-id
                                     :block/title "persisted"}
                      _ (p/resolve! worker-result {:result ::persisted
                                                   :updated-blocks [updated-block]})
                      value result
                      _ (p/delay 0)
                      latest (state/get-state :db/latest-transacted-entity-uuids)]
                (is (= ::persisted value))
                (is (= #{block-id} (:updated-ids latest)))
                (is (= [updated-block] (:updated-blocks latest)))
                (is (= tx-id (:tx-id latest))))))
          (p/finally (fn []
                       (done)))))))

(deftest journal-insert-publishes-changed-blocks-without-reloading-the-page-test
  (async done
    (let [page-id (random-uuid)
          target-id (random-uuid)
          inserted-id (random-uuid)
          tx-id (random-uuid)
          inserted-block {:block/uuid inserted-id
                          :block/parent {:db/id page-id}
                          :block/order "b"}
          calls (atom [])]
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo (constantly "test-repo")
                          state/get-route-match (constantly nil)
                          state/get-editor-info (constantly nil)
                          state/<invoke-db-worker
                          (fn [api & args]
                            (swap! calls conj [api (vec args)])
                            (case api
                              :thread-api/undo-redo-set-pending-editor-info
                              (p/resolved nil)

                              :thread-api/apply-outliner-ops
                              (p/resolved {:result ::persisted
                                           :updated-blocks [inserted-block]})

                              (p/resolved nil)))]
            (p/let [value (db-transact/apply-outliner-ops
                           nil
                           [[:insert-blocks [[{:block/uuid inserted-id}]
                                             target-id
                                             {:keep-uuid? true}]]]
                           {:db-sync/tx-id tx-id
                            :ui/page-id page-id
                            :ui/all-page-blocks? true})
                    latest (state/get-state :db/latest-transacted-entity-uuids)]
              (is (= ::persisted value))
              (is (= [:thread-api/undo-redo-set-pending-editor-info
                      :thread-api/apply-outliner-ops]
                     (mapv first @calls)))
              (is (= [inserted-block] (:updated-blocks latest)))
              (is (= #{inserted-id target-id} (:updated-ids latest)))))
          (p/finally done)))))

(deftest apply-outliner-ops-runs-editor-callback-synchronously-test
  (async done
    (let [block-id (random-uuid)
          original-raf (.-requestAnimationFrame js/globalThis)
          frame-callback (atom nil)
          callback-called? (atom false)
          settlement (atom nil)]
      (set! (.-requestAnimationFrame js/globalThis)
            #(reset! frame-callback %))
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo (constantly "test-repo")
                          state/get-editor-info (constantly nil)
                          state/<invoke-db-worker
                          (fn [_api & _args]
                            (p/resolved {:result ::persisted}))]
            (let [result (db-transact/apply-outliner-ops
                          nil
                          [[:save-block [{:block/uuid block-id} {}]]]
                          {:editor/edit-block-fn
                           (fn [_rows]
                             (reset! callback-called? true)
                             (throw (js/Error. "editor callback failed")))})]
              (-> result
                  (p/then #(reset! settlement [:resolved %]))
                  (p/catch #(reset! settlement [:rejected (ex-message %)])))
              (p/let [_ (p/delay 0)
                      _ (is (= [:resolved ::persisted] @settlement)
                            "Committed DB work should resolve even when the editor callback fails.")
                      _ (is @callback-called?
                            "The editor callback should run in the same worker response cycle.")
                      _ (when-let [f @frame-callback] (f))
                      _ (p/delay 0)]
                (is (= [:resolved ::persisted] @settlement)
                    "Cursor callback failure must not reject committed DB work."))))
          (p/finally
           (fn []
             (set! (.-requestAnimationFrame js/globalThis) original-raf)
             (done)))))))

(deftest structural-ops-run-editor-callback-after-dom-commit-test
  (async done
    (let [page-id (random-uuid)
          block-id (random-uuid)
          original-flush-sync (.-flushSync react-dom)
          original-set-state state/set-state!
          calls (atom [])]
      (set! (.-flushSync react-dom)
            (fn [f]
              (swap! calls conj :commit-start)
              (f)
              (swap! calls conj :commit-end)))
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo (constantly "test-repo")
                          state/get-current-page (constantly page-id)
                          state/get-route-match (constantly nil)
                          state/get-editor-info (constantly nil)
                          state/set-state!
                          (fn [path & args]
                            (when (= :db/latest-transacted-entity-uuids path)
                              (swap! calls conj :publish))
                            (apply original-set-state path args))
                          state/<invoke-db-worker
                          (fn [api & _args]
                            (case api
                              :thread-api/apply-outliner-ops
                              (p/resolved {:result ::persisted
                                           :updated-blocks [{:block/uuid block-id}]})

                              (p/resolved nil)))]
            (p/do!
             (db-transact/apply-outliner-ops
              nil
              [[:insert-blocks [[{:block/uuid block-id}] page-id {}]]]
              {:ui/page-id page-id
               :editor/edit-block-fn #(swap! calls conj [:insert (:block/uuid (first %))])})
             (db-transact/apply-outliner-ops
              nil
              [[:delete-blocks [[block-id] {}]]]
              {:ui/page-id page-id
               :editor/edit-block-fn #(swap! calls conj [:delete (:block/uuid (first %))])})))
          (p/then (fn []
                    (is (= [:commit-start :publish :commit-end [:insert block-id]
                            :commit-start :publish :commit-end [:delete block-id]]
                           @calls))))
          (p/finally (fn []
                       (set! (.-flushSync react-dom) original-flush-sync)
                       (done)))))))

(deftest apply-outliner-ops-ignores-response-after-graph-route-switch-test
  (async done
    (let [repo (atom "old-repo")
          route (atom {:data {:name :page}
                       :path-params {:name "old-page"}})
          worker-result (p/deferred)
          callback-calls (atom 0)
          new-context-state {:tx-id ::new-context}]
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
                          {:editor/edit-block-fn (fn [_rows] (swap! callback-calls inc))})]
              (reset! repo "new-repo")
              (reset! route {:data {:name :page}
                             :path-params {:name "new-page"}})
              (state/set-state! :db/latest-transacted-entity-uuids new-context-state)
              (p/resolve! worker-result {:result ::persisted})
              (p/let [value result
                      _ (p/delay 0)]
                (is (= ::persisted value))
                (is (= new-context-state
                       (state/get-state :db/latest-transacted-entity-uuids)))
                (is (zero? @callback-calls)))))
          (p/finally
           done)))))

(deftest apply-outliner-ops-does-not-run-editor-callback-on-worker-failure-test
  (async done
    (let [callback-called? (atom false)]
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo (constantly "test-repo")
                          state/get-editor-info (constantly nil)
                          state/<invoke-db-worker
                          (fn [_api & _args]
                            (p/rejected (js/Error. "worker failed")))]
            (-> (db-transact/apply-outliner-ops
                 nil
                 [[:save-block [{:block/uuid (random-uuid)} {}]]]
                 {:editor/edit-block-fn (fn [_rows] (reset! callback-called? true))})
                (p/then (fn [_]
                          (is false "Worker failure should reject.")))
                (p/catch (fn [_]
                           (is (false? @callback-called?))))))
          (p/finally
           done)))))
