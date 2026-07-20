(ns frontend.components.block.reactivity-test
  (:require ["react" :as react]
            [cljs.test :refer [async deftest is testing use-fixtures]]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.subs :as subs]
            [goog.object :as gobj]
            [promesa.core :as p]))

(def ^:private test-graph-id "block-reactivity-test")

(defn- block
  ([block-uuid tx-id title]
   (block block-uuid tx-id title {}))
  ([block-uuid tx-id title attrs]
   (merge {:block/uuid block-uuid
           :block/tx-id tx-id
           :block/title title}
          attrs)))

(defn- delta
  [rev overrides]
  (merge {:graph-id test-graph-id
          :rev rev
          :op-id (str "operation-" rev)
          :blocks {}
          :deleted {}
          :children {}
          :affected-keys #{}}
         overrides))

(defn- finish-async!
  [done promise]
  (-> promise
      (p/catch (fn [error]
                 (is false (str error))))
      (p/finally done)))

(defn- with-use-sync-external-store
  [replacement f]
  (let [original (gobj/get react "useSyncExternalStore")]
    (gobj/set react "useSyncExternalStore" replacement)
    (try
      (f)
      (finally
        (gobj/set react "useSyncExternalStore" original)))))

(defn- mount-block-row!
  "Mount the real UUID hook behind a minimal React external-store harness."
  [block-uuid surface render-events]
  (let [*mounted? (atom true)
        *unsubscribe (atom nil)
        render-count (atom 0)
        notification-count (atom 0)]
    (letfn [(listener! []
              (when @*mounted?
                (swap! notification-count inc)
                (render!)))
            (render! []
              (when @*mounted?
                (with-use-sync-external-store
                  (fn [subscribe get-snapshot _get-server-snapshot]
                    (when-not @*unsubscribe
                      (reset! *unsubscribe (subscribe listener!)))
                    (get-snapshot))
                  (fn []
                    (let [loaded-block (db-hooks/use-block block-uuid)]
                      (swap! render-count inc)
                      (swap! render-events conj
                             [surface (:block/title loaded-block)]))))))]
      (render!)
      {:render-count render-count
       :notification-count notification-count
       :unmount! (fn []
                   (reset! *mounted? false)
                   (when-let [unsubscribe @*unsubscribe]
                     (unsubscribe)
                     (reset! *unsubscribe nil)))})))

(defn- unmount-row!
  [row]
  ((:unmount! row)))

(use-fixtures :each
  {:before #(subs/reset-graph! test-graph-id)
   :after #(subs/reset-graph! test-graph-id)})

(deftest the-same-uuid-shares-one-load-across-main-and-sidebar-test
  (async done
         (let [block-uuid (random-uuid)
               request (p/deferred)
               load-calls (atom [])
               render-events (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [graph-id requested-uuid]
                              (swap! load-calls conj [graph-id requested-uuid])
                              request)]
              (let [main-row (mount-block-row! block-uuid :main render-events)
                    sidebar-row (mount-block-row! block-uuid :sidebar render-events)]
                (p/let [_ (p/delay 0)
                        _ (is (= [[test-graph-id block-uuid]] @load-calls)
                              "All mounted surfaces share the canonical UUID request.")
                        _ (p/resolve! request
                                      {:basis-rev 1
                                       :blocks
                                       {block-uuid
                                        (block block-uuid 1 "before")}})
                        _ (p/delay 0)
                        _ (is (= 2 @(:render-count main-row)))
                        _ (is (= 2 @(:render-count sidebar-row)))
                        _ (is (= #{[:main "before"] [:sidebar "before"]}
                                 (set (take-last 2 @render-events))))
                        main-renders @(:render-count main-row)
                        sidebar-renders @(:render-count sidebar-row)
                        _ (subs/apply-delta!
                           (delta 2
                                  {:blocks
                                   {block-uuid
                                    (block block-uuid 2 "after")}}))]
                  (is (= (inc main-renders) @(:render-count main-row)))
                  (is (= (inc sidebar-renders) @(:render-count sidebar-row)))
                  (is (= #{[:main "after"] [:sidebar "after"]}
                         (set (take-last 2 @render-events)))
                      "One UUID delta updates every mounted surface immediately.")
                  (is (= 2 @(:notification-count main-row)))
                  (is (= 2 @(:notification-count sidebar-row)))
                  (unmount-row! main-row)
                  (unmount-row! sidebar-row))))))))

(deftest unrelated-uuid-delta-does-not-notify-or-render-test
  (async done
         (let [block-uuid (random-uuid)
               unrelated-uuid (random-uuid)
               render-events (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id requested-uuid]
                              (p/resolved
                               {:basis-rev 1
                                :blocks
                                {requested-uuid
                                 (block requested-uuid 1 "mounted")}}))]
              (let [row (mount-block-row! block-uuid :main render-events)]
                (p/let [_ (p/delay 0)
                        renders-before @(:render-count row)
                        notifications-before @(:notification-count row)
                        events-before @render-events
                        _ (subs/apply-delta!
                           (delta 2
                                  {:blocks
                                   {unrelated-uuid
                                    (block unrelated-uuid 2 "unrelated")}}))]
                  (is (= notifications-before @(:notification-count row))
                      "An unrelated UUID produces zero subscription notifications.")
                  (is (= renders-before @(:render-count row))
                      "An unrelated UUID produces zero row renders.")
                  (is (= events-before @render-events))
                  (unmount-row! row))))))))

(deftest equal-tx-id-keeps-the-mounted-snapshot-test
  (async done
         (let [block-uuid (random-uuid)
               original (block block-uuid 10 "authoritative"
                               {:block/format :markdown})
               render-events (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id _requested-uuid]
                              (p/resolved
                               {:basis-rev 1
                                :blocks {block-uuid original}}))]
              (let [row (mount-block-row! block-uuid :sidebar render-events)]
                (p/let [_ (p/delay 0)
                        original-snapshot (subs/block-snapshot block-uuid)
                        renders-before @(:render-count row)
                        notifications-before @(:notification-count row)
                        _ (subs/apply-delta!
                           (delta 2
                                  {:blocks
                                   {block-uuid
                                    (block block-uuid 10 "wrong replacement"
                                           {:block/format :org})}}))]
                  (testing "tx-id is the complete block change predicate"
                    (is (identical? original-snapshot
                                    (subs/block-snapshot block-uuid)))
                    (is (= original (:value (subs/block-snapshot block-uuid))))
                    (is (= notifications-before
                           @(:notification-count row)))
                    (is (= renders-before @(:render-count row))))
                  (unmount-row! row))))))))

(deftest unmounted-row-discards-a-late-load-result-test
  (async done
         (let [block-uuid (random-uuid)
               first-request (p/deferred)
               second-request (p/deferred)
               load-calls (atom 0)
               render-events (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id _requested-uuid]
                              (case (swap! load-calls inc)
                                1 first-request
                                2 second-request
                                (p/rejected
                                 (js/Error. "unexpected block request"))))]
              (let [first-row (mount-block-row! block-uuid :main render-events)]
                (p/let [_ (p/delay 0)
                        _ (is (= 1 @load-calls))
                        first-render-count @(:render-count first-row)
                        _ (unmount-row! first-row)
                        _ (p/delay 0)
                        _ (p/resolve! first-request
                                      {:basis-rev 10
                                       :blocks
                                       {block-uuid
                                        (block block-uuid 10 "late")}})
                        _ (p/delay 0)
                        _ (is (= first-render-count
                                 @(:render-count first-row))
                              "A completed request cannot render an unmounted row.")
                        _ (is (= {:status :loading}
                                 (subs/block-snapshot block-uuid))
                              "The unmounted slot does not retain a late result.")
                        second-row
                        (mount-block-row! block-uuid :sidebar render-events)
                        _ (p/delay 0)
                        _ (is (= 2 @load-calls)
                              "A later mount starts a fresh canonical request.")
                        _ (p/resolve! second-request
                                      {:basis-rev 11
                                       :blocks
                                       {block-uuid
                                        (block block-uuid 11 "current")}})
                        _ (p/delay 0)]
                  (is (= "current"
                         (-> (subs/block-snapshot block-uuid)
                             :value
                             :block/title)))
                  (is (not-any? #(= [:main "late"] %) @render-events))
                  (is (= [:sidebar "current"] (last @render-events)))
                  (unmount-row! second-row))))))))
