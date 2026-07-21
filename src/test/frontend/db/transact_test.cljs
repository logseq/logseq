(ns frontend.db.transact-test
  (:require ["react-dom" :as react-dom]
            [cljs.test :refer [async deftest is testing]]
            [frontend.db.subs :as db-subs]
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

(deftest operation-row-uuids-contains-only-changed-rows-in-order-test
  (let [block-a (random-uuid)
        block-b (random-uuid)
        block-c (random-uuid)
        deleted-block (random-uuid)
        target (random-uuid)]
    (testing "unchanged insertion and movement targets are excluded"
      (is (= [block-b block-a block-c]
             (#'db-transact/operation-row-uuids
              [[:insert-blocks [[{:block/uuid block-b}
                                  {:block/uuid block-a}]
                                 target
                                 {}]]
               [:move-blocks [[block-c block-b] target {}]]]))))
    (testing "deleted rows are excluded and changed-row order is stable"
      (is (= [block-a block-b]
             (#'db-transact/operation-row-uuids
              [[:move-blocks-up-down [[block-a block-b] true]]
               [:delete-blocks [[deleted-block] {}]]
               [:indent-outdent-blocks [[block-a block-b] true {}]]]))))))

(deftest operation-row-uuids-deduplicates-property-op-rows-test
  (let [block-a (random-uuid)
        block-b (random-uuid)]
    (is (= [block-a block-b]
           (#'db-transact/operation-row-uuids
            [[:set-block-property [block-a :block/tags 4]]
             [:set-block-properties [block-a {:block/tags 4}]]
             [:class-add-property [block-b :user.property/foo]]
             [:class-remove-property [block-b :user.property/foo]]
             [:delete-closed-value [:logseq.property/status block-b]]
             [:batch-delete-property-value [[block-a block-b] :block/tags 4]]])))))

(deftest editor-callback-runs-from-its-worker-response-test
  (let [calls (atom [])]
    (#'db-transact/run-edit-block-fn!
     {:editor/edit-block-fn (fn [_rows] (reset! calls :called))}
     nil)
    (is (= :called @calls))))

(deftest worker-response-uses-its-canonical-delta-for-editor-rows-test
  (async done
    (let [block-a-uuid (random-uuid)
          block-b-uuid (random-uuid)
          block-a {:block/uuid block-a-uuid :block/tx-id 1}
          block-b {:block/uuid block-b-uuid :block/tx-id 1}
          row-uuids [block-b-uuid block-a-uuid]
          delta {:graph-id "editor-row-resolution-test"
                 :rev 1
                 :blocks {block-a-uuid block-a
                          block-b-uuid block-b}
                 :deleted {}
                 :children {}
                 :affected-keys #{[:graph]}}
          calls (atom [])
          original-flush-sync (.-flushSync react-dom)]
      (set! (.-flushSync react-dom) (fn [f] (f)))
      (-> (p/with-redefs [db-subs/apply-delta!
                          (fn [value]
                            (swap! calls conj [:delta value])
                            false)
                          db-subs/resolve-blocks!
                          (fn [_requested-uuids]
                            (p/rejected
                             (js/Error. "Editor rows must not be fetched again.")))]
            (p/let [_ (#'db-transact/publish-worker-response!
                       {:editor/edit-block-fn
                        (fn [rows]
                          (swap! calls conj [:callback rows]))}
                       delta
                       row-uuids
                       true)]
              (is (= [[:delta delta]
                      [:callback [block-b block-a]]]
                     @calls))
              (is (identical? delta (second (first @calls)))
                  "The response must apply the worker-owned delta untouched.")
              (is (= :callback (first (last @calls)))
                  "A matching broadcast may win, but the response-owned callback still runs once.")))
          (p/finally (fn []
                       (set! (.-flushSync react-dom) original-flush-sync)
                       (done)))))))

(deftest apply-outliner-ops-applies-the-exact-delta-once-before-editor-side-effects-test
  (async done
    (let [repo "direct-render-delta-test"
          block-id (random-uuid)
          block {:block/uuid block-id
                 :block/tx-id 1}
          delta {:graph-id repo
                 :rev 1
                 :blocks {block-id block}
                 :deleted {}
                 :children {}
                 :affected-keys #{[:graph]}}
          original-flush-sync (.-flushSync react-dom)
          calls (atom [])]
      (set! (.-flushSync react-dom)
            (fn [f]
              (swap! calls conj :commit-start)
              (f)
              (swap! calls conj :commit-end)))
      (-> (p/with-redefs [util/node-test? false
                          db-subs/apply-delta!
                          (fn [value]
                            (swap! calls conj [:delta value])
                            true)
                          db-subs/resolve-blocks!
                          (fn [_row-uuids]
                            (p/rejected
                             (js/Error. "Editor rows must not be fetched again.")))
                          state/get-current-repo (constantly repo)
                          state/get-route-match (constantly nil)
                          state/get-editor-info (constantly nil)
                          state/<invoke-db-worker
                          (fn [api & _args]
                            (case api
                              :thread-api/undo-redo-set-pending-editor-info
                              (p/resolved nil)

                              :thread-api/apply-outliner-ops
                              (p/resolved {:result ::persisted
                                           :delta delta
                                           :editor-row-uuids [block-id]})

                              (p/resolved nil)))]
            (p/let [value (db-transact/apply-outliner-ops
                           nil
                           [[:save-block [{:block/uuid block-id} {}]]]
                           {:editor/edit-block-fn
                            (fn [_rows]
                              (swap! calls conj :editor-callback))})]
              (is (= ::persisted value))
              (is (= [:commit-start :delta :commit-end
                      :commit-start :editor-callback :commit-end]
                     (mapv #(if (vector? %) (first %) %) @calls)))
              (let [applied-deltas (keep #(when (= :delta (first %))
                                            (second %))
                                         (filter vector? @calls))]
                (is (= 1 (count applied-deltas)))
                (is (identical? delta (first applied-deltas))
                    "The direct response must pass the worker-owned delta through untouched."))))
          (p/finally (fn []
                       (set! (.-flushSync react-dom) original-flush-sync)
                       (done)))))))

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

(deftest apply-outliner-ops-hands-a-late-response-to-the-graph-aware-delta-store-test
  (async done
    (let [repo (atom "old-repo")
          route (atom {:data {:name :page}
                       :path-params {:name "old-page"}})
          worker-result (p/deferred)
          callback-calls (atom 0)
          delta {:graph-id "old-repo"
                 :rev 1
                 :blocks {}
                 :deleted {}
                 :children {}
                 :affected-keys #{[:graph]}}
          applied-deltas (atom [])]
      (-> (p/with-redefs [util/node-test? false
                          db-subs/apply-delta! (fn [value]
                                                 (swap! applied-deltas conj value)
                                                 false)
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
              (p/resolve! worker-result {:result ::persisted
                                         :delta delta})
              (p/let [value result
                      _ (p/delay 0)]
                (is (= ::persisted value))
                (is (= 1 (count @applied-deltas)))
                (is (identical? delta (first @applied-deltas))
                    "Graph staleness is decided by the subscription store, not by route state.")
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
