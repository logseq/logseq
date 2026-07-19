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
     #{block-id invalidated-id}
     [deleted-id]
     [page-id]
     [target-id])
    (let [latest (state/get-state :db/latest-transacted-entity-uuids)]
      (is (= #{block-id invalidated-id} (:updated-ids latest)))
      (is (= #{deleted-id} (:deleted-ids latest)))
      (is (= [updated-block] (:updated-blocks latest)))
      (is (= #{page-id} (:affected-page-uuids latest)))
      (is (= page-id (:page-id latest)))
      (is (= tx-id (:tx-id latest)))
      (is (every? #(= tx-id (get-in latest [:entity-tx-ids %]))
                  [block-id deleted-id invalidated-id]))
      (is (nil? (get-in latest [:entity-tx-ids target-id])))
      (is (nil? (get-in latest [:entity-tx-ids page-id])))
      (is (= tx-id (get-in latest [:tree-tx-ids page-id])))
      (is (= tx-id (get-in latest [:children-tx-ids target-id]))))))

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
     #{block-id}
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
     #{block-id}
     nil
     #{current-page-id target-page-id}
     nil)
    (let [latest (state/get-state :db/latest-transacted-entity-uuids)]
      (is (= #{block-id} (:updated-ids latest)))
      (is (= #{current-page-id target-page-id} (:affected-page-uuids latest)))
      (is (nil? (get-in latest [:entity-tx-ids current-page-id])))
      (is (nil? (get-in latest [:entity-tx-ids target-page-id]))))))

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
                                                   :updated-blocks [updated-block]
                                                   :entity-updated-block-uuids #{block-id}})
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
                                           :updated-blocks [inserted-block]
                                           :entity-updated-block-uuids #{inserted-id}
                                           :structural-parent-uuids #{page-id}})

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
              (is (= #{inserted-id} (:updated-ids latest)))
              (is (= tx-id (get-in latest [:children-tx-ids page-id])))
              (is (nil? (get-in latest [:entity-tx-ids target-id])))))
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

(deftest structural-editor-ops-publish-authoritative-rows-after-worker-response-test
  (async done
    (let [page-id (random-uuid)
          target-id (random-uuid)
          inserted-id (random-uuid)
          tx-id (random-uuid)
          worker-result (p/deferred)
          callback-rows (atom [])]
      (state/set-state! :db/latest-transacted-entity-uuids {})
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo (constantly "test-repo")
                          state/get-current-page (constantly page-id)
                          state/get-route-match (constantly nil)
                          state/get-editor-info (constantly nil)
                          state/<invoke-db-worker
                          (fn [api & _args]
                            (case api
                              :thread-api/undo-redo-set-pending-editor-info
                              (p/resolved nil)

                              :thread-api/apply-outliner-ops
                              worker-result

                              (p/resolved nil)))]
            (let [saved-block {:block/uuid target-id
                               :block/title "typed before Enter"}
                  inserted-block {:block/uuid inserted-id
                                  :block/title ""}
                  ops [[:save-block [saved-block nil]]
                       [:insert-blocks [[inserted-block]
                                        target-id
                                        {:sibling? true
                                         :keep-uuid? true
                                         :outliner-op :insert-blocks}]]]
                  result (db-transact/apply-outliner-ops
                          nil
                          ops
                          {:db-sync/tx-id tx-id
                           :ui/page-id page-id
                           :editor/edit-block-fn #(reset! callback-rows %)})]
              (p/let [_ (p/delay 0)
                      _ (is (= {} (state/get-state :db/latest-transacted-entity-uuids))
                            "Enter must not publish an uncommitted tree delta.")
                      _ (is (= [] @callback-rows)
                            "The cursor must not target an uncommitted inserted block.")
                      persisted-saved-block (assoc saved-block :db/id 1)
                      persisted-inserted-block (assoc inserted-block
                                                       :db/id 2
                                                       :block/parent {:db/id 3}
                                                       :block/order "a0")
                      _ (p/resolve! worker-result {:result ::persisted
                                                   :updated-blocks [persisted-saved-block
                                                                    persisted-inserted-block]
                                                   :entity-updated-block-uuids #{target-id inserted-id}
                                                   :structural-parent-uuids #{page-id}})
                      value result
                      latest (state/get-state :db/latest-transacted-entity-uuids)]
                (is (= ::persisted value))
                (is (= tx-id (:tx-id latest)))
                (is (= [persisted-saved-block persisted-inserted-block]
                       (:updated-blocks latest)))
                (is (= [persisted-saved-block persisted-inserted-block]
                       @callback-rows)
                    "Enter must update content and cursor from the same authoritative response."))))
          (p/finally done)))))

(deftest failed-delete-does-not-publish-an-uncommitted-tree-test
  (async done
    (let [page-id (random-uuid)
          deleted-id (random-uuid)
          worker-result (p/deferred)
          callback-count (atom 0)]
      (state/set-state! :db/latest-transacted-entity-uuids {})
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo (constantly "test-repo")
                          state/get-current-page (constantly page-id)
                          state/get-route-match (constantly nil)
                          state/get-editor-info (constantly nil)
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
                          [[:delete-blocks [[deleted-id] {}]]]
                          {:ui/page-id page-id
                           :editor/edit-block-fn (fn [_] (swap! callback-count inc))})]
              (p/let [_ (p/delay 0)
                      _ (is (= {} (state/get-state :db/latest-transacted-entity-uuids)))
                      _ (is (zero? @callback-count))
                      _ (p/reject! worker-result (js/Error. "worker failed"))
                      _ (p/catch result identity)
                      latest (state/get-state :db/latest-transacted-entity-uuids)]
                (is (= {} latest))
                (is (zero? @callback-count)))))
          (p/finally done)))))

(deftest dependent-outliner-mutations-reach-the-worker-in-call-order-test
  (async done
    (let [repo "ordered-worker-repo"
          first-id (random-uuid)
          second-id (random-uuid)
          first-result (p/deferred)
          second-result (p/deferred)
          calls (atom [])]
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo (constantly repo)
                          state/get-current-page (constantly nil)
                          state/get-route-match (constantly nil)
                          state/get-editor-info (constantly nil)
                          state/<invoke-db-worker
                          (fn [api _repo & args]
                            (case api
                              :thread-api/undo-redo-set-pending-editor-info
                              (p/resolved nil)

                              :thread-api/apply-outliner-ops
                              (let [block-id (-> args first first second first first)]
                                (swap! calls conj block-id)
                                (if (= block-id first-id)
                                  first-result
                                  second-result))))]
            (let [first-request (db-transact/apply-outliner-ops
                                 nil
                                 [[:delete-blocks [[first-id] {}]]]
                                 {:outliner-op :delete-blocks})
                  second-request (db-transact/apply-outliner-ops
                                  nil
                                  [[:delete-blocks [[second-id] {}]]]
                                  {:outliner-op :delete-blocks})]
              (p/let [_ (p/delay 0)
                      _ (is (= [first-id] @calls)
                            "A dependent mutation must wait for the previous worker response.")
                      _ (p/resolve! first-result {:result :first})
                      _ (p/delay 0)
                      _ (is (= [first-id second-id] @calls))
                      _ (p/resolve! second-result {:result :second})
                      values (p/all [first-request second-request])]
                (is (= [:first :second] values)))))
          (p/finally done)))))

(deftest failed-outliner-mutation-does-not-stall-the-next-call-test
  (async done
    (let [repo "recovering-worker-repo"
          first-id (random-uuid)
          second-id (random-uuid)
          first-result (p/deferred)
          second-result (p/deferred)
          calls (atom [])]
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo (constantly repo)
                          state/get-current-page (constantly nil)
                          state/get-route-match (constantly nil)
                          state/get-editor-info (constantly nil)
                          state/<invoke-db-worker
                          (fn [api _repo & args]
                            (case api
                              :thread-api/undo-redo-set-pending-editor-info
                              (p/resolved nil)

                              :thread-api/apply-outliner-ops
                              (let [block-id (-> args first first second first first)]
                                (swap! calls conj block-id)
                                (if (= block-id first-id)
                                  first-result
                                  second-result))))]
            (let [first-request (db-transact/apply-outliner-ops
                                 nil
                                 [[:delete-blocks [[first-id] {}]]]
                                 {:outliner-op :delete-blocks})
                  second-request (db-transact/apply-outliner-ops
                                  nil
                                  [[:delete-blocks [[second-id] {}]]]
                                  {:outliner-op :delete-blocks})]
              (p/let [_ (p/delay 0)
                      _ (is (= [first-id] @calls))
                      _ (p/reject! first-result (js/Error. "first mutation failed"))
                      first-error (p/catch first-request identity)
                      _ (is (instance? js/Error first-error))
                      _ (p/delay 0)
                      _ (is (= [first-id second-id] @calls)
                            "A rejected mutation must release the repo queue.")
                      _ (p/resolve! second-result {:result :second})
                      second-value second-request]
                (is (= :second second-value)))))
          (p/finally done)))))

(deftest independent-repos-do-not-share-an-outliner-mutation-queue-test
  (async done
    (let [current-repo (atom "repo-a")
          first-result (p/deferred)
          second-result (p/deferred)
          calls (atom [])]
      (-> (p/with-redefs [util/node-test? false
                          state/get-current-repo #(deref current-repo)
                          state/get-current-page (constantly nil)
                          state/get-route-match (constantly nil)
                          state/get-editor-info (constantly nil)
                          state/<invoke-db-worker
                          (fn [api repo & _args]
                            (case api
                              :thread-api/undo-redo-set-pending-editor-info
                              (p/resolved nil)

                              :thread-api/apply-outliner-ops
                              (do
                                (swap! calls conj repo)
                                (if (= repo "repo-a") first-result second-result))))]
            (let [first-request (db-transact/apply-outliner-ops
                                 nil
                                 [[:delete-blocks [[(random-uuid)] {}]]]
                                 {:outliner-op :delete-blocks})
                  _ (reset! current-repo "repo-b")
                  second-request (db-transact/apply-outliner-ops
                                  nil
                                  [[:delete-blocks [[(random-uuid)] {}]]]
                                  {:outliner-op :delete-blocks})]
              (p/let [_ (p/delay 0)
                      _ (is (= ["repo-a" "repo-b"] @calls)
                            "Independent graphs must start their mutations without waiting for each other.")
                      _ (p/resolve! first-result {:result :first})
                      _ (p/resolve! second-result {:result :second})
                      _ (p/all [(p/catch first-request identity) second-request])]
                nil)))
          (p/finally done)))))

(deftest structural-ops-publish-tree-and-editor-in-one-dom-commit-test
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
                                           :updated-blocks [{:block/uuid block-id}]
                                           :entity-updated-block-uuids #{block-id}})

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
                    (is (= [:commit-start :publish [:insert block-id] :commit-end
                            :commit-start :publish [:delete block-id] :commit-end]
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
