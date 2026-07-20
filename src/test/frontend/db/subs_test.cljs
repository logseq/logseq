(ns frontend.db.subs-test
  (:require [cljs.test :refer [async deftest is testing use-fixtures]]
            [frontend.db.subs :as subs]
            [frontend.state :as state]
            [promesa.core :as p]))

(def ^:private test-graph-id "subs-test-graph")

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

(use-fixtures :each
  {:before #(subs/reset-graph! test-graph-id)
   :after #(subs/reset-graph! test-graph-id)})

(deftest block-changed-uses-only-tx-id-test
  (let [block-uuid (random-uuid)
        old-block (block block-uuid 10 "before" {:block/format :markdown
                                                 :user.property/priority :high})]
    (testing "equal transaction IDs are unchanged regardless of map contents"
      (is (false? (subs/block-changed?
                   old-block
                   (block block-uuid 10 "after" {:block/format :org
                                                 :user.property/priority :low})))))
    (testing "different transaction IDs are changed"
      (is (true? (subs/block-changed? old-block
                                      (assoc old-block :block/tx-id 11)))))
    (testing "missing transaction IDs fail fast"
      (is (thrown-with-msg? js/Error
                            #":block/tx-id"
                            (subs/block-changed? (dissoc old-block :block/tx-id)
                                                 old-block)))
      (is (thrown-with-msg? js/Error
                            #":block/tx-id"
                            (subs/block-changed? old-block
                                                 (dissoc old-block :block/tx-id)))))))

(deftest block-deltas-are-complete-replacements-test
  (let [block-uuid (random-uuid)
        old-block (block block-uuid 10 "before" {:block/format :markdown
                                                 :user.property/priority :high})
        replacement (block block-uuid 11 "after")
        pending-load (p/deferred)]
    (with-redefs [subs/<load-block (fn [_graph-id _block-uuid] pending-load)]
      (let [notifications (atom 0)
            unsubscribe (subs/subscribe-block! block-uuid #(swap! notifications inc))]
        (subs/apply-delta! (delta 1 {:blocks {block-uuid old-block}}))
        (reset! notifications 0)
        (subs/apply-delta! (delta 2 {:blocks {block-uuid replacement}}))
        (let [snapshot (subs/block-snapshot block-uuid)]
          (is (= {:status :ready :value replacement} snapshot))
          (is (not (contains? (:value snapshot) :block/format)))
          (is (not (contains? (:value snapshot) :user.property/priority)))
          (is (= 1 @notifications))
          (is (identical? snapshot (subs/block-snapshot block-uuid))
              "A ready slot returns the same snapshot until that UUID changes."))
        (unsubscribe)))))

(deftest equal-block-tx-id-is-an-application-no-op-test
  (let [block-uuid (random-uuid)
        original (block block-uuid 10 "authoritative")
        pending-load (p/deferred)]
    (with-redefs [subs/<load-block (fn [_graph-id _block-uuid] pending-load)]
      (let [notifications (atom 0)
            unsubscribe (subs/subscribe-block! block-uuid #(swap! notifications inc))]
        (subs/apply-delta! (delta 1 {:blocks {block-uuid original}}))
        (let [original-snapshot (subs/block-snapshot block-uuid)]
          (reset! notifications 0)
          (subs/apply-delta!
           (delta 2 {:blocks {block-uuid (block block-uuid 10 "same revision, wrong value")}}))
          (is (zero? @notifications))
          (is (identical? original-snapshot (subs/block-snapshot block-uuid)))
          (is (= original (:value (subs/block-snapshot block-uuid)))))
        (unsubscribe)))))

(deftest tombstones-win-over-late-block-loaders-test
  (async done
         (let [block-uuid (random-uuid)
               request (p/deferred)
               loader-calls (atom [])
               notifications (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [graph-id requested-uuid]
                              (swap! loader-calls conj [graph-id requested-uuid])
                              request)]
              (let [unsubscribe (subs/subscribe-block! block-uuid #(swap! notifications inc))]
                (p/let [_ (p/delay 0)
                        _ (is (= [[test-graph-id block-uuid]] @loader-calls))
                        _ (subs/apply-delta!
                           (delta 2 {:deleted {block-uuid {:rev 2}}}))
                        _ (is (= {:status :missing}
                                 (subs/block-snapshot block-uuid)))
                        _ (p/resolve! request
                                      {:basis-rev 1
                                       :blocks {block-uuid
                                                (block block-uuid 1 "late")}})
                        _ (p/delay 0)]
                  (is (= {:status :missing}
                         (subs/block-snapshot block-uuid)))
                  (is (= 1 @notifications)
                      "Discarding the late result must not notify the listener again.")
                  (let [second-unsubscribe
                        (subs/subscribe-block! block-uuid #(swap! notifications inc))]
                    (is (= 1 (count @loader-calls))
                        "A known tombstone must not start another block request.")
                    (second-unsubscribe))
                  (unsubscribe))))))))

(deftest loader-basis-cannot-overwrite-a-newer-delta-test
  (async done
         (let [block-uuid (random-uuid)
               request (p/deferred)
               current (block block-uuid 5 "from delta")]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block (fn [_graph-id _block-uuid] request)]
              (let [unsubscribe (subs/subscribe-block! block-uuid (fn []))]
                (p/let [_ (p/delay 0)
                        _ (subs/apply-delta! (delta 5 {:blocks {block-uuid current}}))
                        current-snapshot (subs/block-snapshot block-uuid)
                        _ (p/resolve! request
                                      {:basis-rev 4
                                       :blocks {block-uuid
                                                (block block-uuid 99 "stale basis")}})
                        _ (p/delay 0)]
                  (is (identical? current-snapshot
                                  (subs/block-snapshot block-uuid)))
                  (is (= current (:value (subs/block-snapshot block-uuid))))
                  (unsubscribe))))))))

(deftest loader-basis-does-not-advance-the-delta-watermark-test
  (async done
         (let [loaded-uuid (random-uuid)
               changed-uuid (random-uuid)
               request (p/deferred)
               changed-request (p/deferred)
               changed (block changed-uuid 5 "intermediate delta")]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id block-uuid]
                              (if (= loaded-uuid block-uuid)
                                request
                                changed-request))]
              (let [unsubscribe (subs/subscribe-block! loaded-uuid (fn []))]
                (p/let [_ (p/delay 0)
                        _ (p/resolve! request
                                      {:basis-rev 10
                                       :blocks {loaded-uuid
                                                (block loaded-uuid 10 "loaded")}})
                        _ (p/delay 0)
                        unsubscribe-changed
                        (subs/subscribe-block! changed-uuid (fn []))]
                  (is (true? (subs/apply-delta!
                              (delta 5 {:blocks {changed-uuid changed}})))
                      "A loader basis is not the renderer delta cursor.")
                  (is (= {:status :ready :value changed}
                         (subs/block-snapshot changed-uuid))
                      "An unrelated intermediate delta must still apply.")
                  (unsubscribe-changed)
                  (unsubscribe))))))))

(deftest stale-load-error-cannot-overwrite-a-delta-ready-block-test
  (async done
         (let [block-uuid (random-uuid)
               request (p/deferred)
               replacement (block block-uuid 2 "from delta")]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block (fn [_graph-id _block-uuid] request)]
              (let [unsubscribe (subs/subscribe-block! block-uuid (fn []))]
                (p/let [_ (p/delay 0)
                        _ (subs/apply-delta!
                           (delta 2 {:blocks {block-uuid replacement}}))
                        ready-snapshot (subs/block-snapshot block-uuid)
                        _ (p/reject! request (js/Error. "stale load failed"))
                        _ (p/delay 0)]
                  (is (identical? ready-snapshot
                                  (subs/block-snapshot block-uuid)))
                  (is (= {:status :ready :value replacement}
                         (subs/block-snapshot block-uuid)))
                  (unsubscribe))))))))

(deftest graph-generation-rejects-an-old-completion-test
  (async done
         (let [block-uuid (random-uuid)
               old-request (p/deferred)
               new-request (p/deferred)
               loader-calls (atom 0)
               notifications (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id _block-uuid]
                              (if (= 1 (swap! loader-calls inc))
                                old-request
                                new-request))]
              (let [unsubscribe (subs/subscribe-block! block-uuid #(swap! notifications inc))]
                (p/let [_ (p/delay 0)
                        _ (subs/reset-graph! test-graph-id)
                        _ (p/delay 0)
                        notification-count-after-reset @notifications
                        _ (p/resolve! old-request
                                      {:basis-rev 100
                                       :blocks {block-uuid
                                                (block block-uuid 100 "old generation")}})
                        _ (p/delay 0)]
                  (is (= {:status :loading}
                         (subs/block-snapshot block-uuid)))
                  (is (= notification-count-after-reset @notifications)
                      "An old generation completion must not notify cleared listeners.")
                  (p/resolve! new-request
                              {:basis-rev 101
                               :blocks {block-uuid
                                        (block block-uuid 101 "new generation")}})
                  (p/let [_ (p/delay 0)]
                    (is (= {:status :ready
                            :value (block block-uuid 101 "new generation")}
                           (subs/block-snapshot block-uuid))))
                  (unsubscribe))))))))

(deftest one-block-delta-notifies-only-that-uuid-test
  (async done
         (let [subscriber-count 10000
               block-uuids (vec (repeatedly subscriber-count random-uuid))
               target-uuid (nth block-uuids (quot subscriber-count 2))
               blocks (into {}
                            (map (fn [block-uuid]
                                   [block-uuid (block block-uuid 1 "before")]))
                            block-uuids)
               notifications (atom [])
               pending-load (p/deferred)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [& _] pending-load)]
              (let [unsubscribes
                    (mapv (fn [block-uuid]
                            (subs/subscribe-block!
                             block-uuid
                             #(swap! notifications conj block-uuid)))
                          block-uuids)
                    untouched-uuids (subvec block-uuids 0 20)]
                (p/let [_ (subs/apply-delta! (delta 1 {:blocks blocks}))
                        _ (reset! notifications [])
                        untouched-snapshots
                        (mapv (fn [block-uuid]
                                [block-uuid (subs/block-snapshot block-uuid)])
                              untouched-uuids)
                        _ (subs/apply-delta!
                           (delta 2 {:blocks {target-uuid
                                              (block target-uuid 2 "after")}}))]
                  (is (= [target-uuid] @notifications))
                  (doseq [[block-uuid snapshot] untouched-snapshots]
                    (when (not= target-uuid block-uuid)
                      (is (identical? snapshot (subs/block-snapshot block-uuid))
                          "Untouched exact-key snapshots must retain identity.")))
                  (run! (fn [unsubscribe] (unsubscribe)) unsubscribes))))))))

(deftest direct-response-and-broadcast-apply-one-graph-revision-once-test
  (let [block-uuid (random-uuid)
        before (block block-uuid 1 "before")
        after (block block-uuid 2 "after")
        commit (delta 2 {:blocks {block-uuid after}})
        pending-load (p/deferred)]
    (with-redefs [subs/<load-block (fn [_graph-id _block-uuid] pending-load)]
      (let [notifications (atom 0)
            unsubscribe (subs/subscribe-block! block-uuid #(swap! notifications inc))]
        (subs/apply-delta! (delta 1 {:blocks {block-uuid before}}))
        (reset! notifications 0)
        (subs/apply-delta! commit)
        (let [snapshot-after-response (subs/block-snapshot block-uuid)]
          (subs/apply-delta! commit)
          (is (= 1 @notifications))
          (is (identical? snapshot-after-response
                          (subs/block-snapshot block-uuid))))
        (subs/apply-delta! (delta 1 {:blocks {block-uuid before}}))
        (is (= after (:value (subs/block-snapshot block-uuid)))
            "An older graph revision must also be ignored.")
        (unsubscribe)))))

(deftest matching-child-patch-applies-atomically-and-orders-membership-test
  (async done
         (let [parent-uuid (random-uuid)
               child-a (random-uuid)
               child-b (random-uuid)
               child-c (random-uuid)
               parent-before (block parent-uuid 10 "parent before")
               parent-after (block parent-uuid 11 "parent after")
               pending-block-load (p/deferred)
               loader-calls (atom [])]
           (subs/apply-delta! (delta 1 {:blocks {parent-uuid parent-before}}))
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id _block-uuid] pending-block-load)
                            subs/<load-children
                            (fn [graph-id requested-parent]
                              (swap! loader-calls conj [graph-id requested-parent])
                              (p/resolved {:basis-rev 1
                                           :parent-tx-id 10
                                           :items [[child-a "a"]
                                                   [child-b "c"]]}))]
              (let [children-notifications (atom 0)
                    observations (atom [])
                    unsubscribe-children
                    (subs/subscribe-children! parent-uuid
                                              #(swap! children-notifications inc))]
                (p/let [_ (p/delay 0)
                        _ (is (= {:status :ready :value [child-a child-b]}
                                 (subs/children-snapshot parent-uuid)))
                        unsubscribe-block
                        (subs/subscribe-block!
                         parent-uuid
                         #(swap! observations conj
                                 [(subs/block-snapshot parent-uuid)
                                  (subs/children-snapshot parent-uuid)]))
                        _ (subs/apply-delta!
                           (delta 2
                                  {:blocks {parent-uuid parent-after}
                                   :children
                                   {parent-uuid
                                    {:base-tx-id 10
                                     :tx-id 11
                                     :remove [[child-a "a"]]
                                     :upsert [[child-c "b"]]}}}))]
                  (is (= {:status :ready :value [child-c child-b]}
                         (subs/children-snapshot parent-uuid)))
                  (is (= #{[{:status :ready :value parent-after}
                            {:status :ready :value [child-c child-b]}]}
                         (set @observations))
                      "Every listener observes the complete delta, never a half-applied state.")
                  (is (= 2 @children-notifications)
                      "Initial hydration and the matching patch each notify once.")
                  (reset! children-notifications 0)
                  (subs/apply-delta!
                   (delta 3
                          {:children
                           {parent-uuid
                            {:base-tx-id 10
                             :tx-id 11
                             :remove [[child-a "a"]]
                             :upsert [[child-c "b"]]}}}))
                  (is (zero? @children-notifications)
                      "An equal child transaction ID is a duplicate no-op.")
                  (is (= [[test-graph-id parent-uuid]] @loader-calls)
                      "A matching incremental patch does not reload the parent membership.")
                  (unsubscribe-block)
                  (unsubscribe-children))))))))

(deftest child-patch-before-initial-load-rejects-only-that-parent-stale-response-test
  (async done
         (let [parent-uuid (random-uuid)
               unrelated-parent-uuid (random-uuid)
               old-child-uuid (random-uuid)
               new-child-uuid (random-uuid)
               unrelated-child-uuid (random-uuid)
               parent-initial-request (p/deferred)
               unrelated-request (p/deferred)
               loader-calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-children
                            (fn [graph-id requested-parent]
                              (swap! loader-calls conj [graph-id requested-parent])
                              (cond
                                (= parent-uuid requested-parent)
                                (if (= 1 (count (filter #(= parent-uuid (second %))
                                                       @loader-calls)))
                                  parent-initial-request
                                  (p/resolved {:basis-rev 2
                                               :parent-tx-id 11
                                               :items [[new-child-uuid "b"]]}))

                                (= unrelated-parent-uuid requested-parent)
                                unrelated-request

                                :else
                                (p/rejected
                                 (js/Error. "unexpected children load"))))]
              (let [unsubscribe-parent
                    (subs/subscribe-children! parent-uuid (fn []))
                    unsubscribe-unrelated
                    (subs/subscribe-children! unrelated-parent-uuid (fn []))]
                (p/let [_ (p/delay 0)
                        _ (is (= #{[test-graph-id parent-uuid]
                                   [test-graph-id unrelated-parent-uuid]}
                                 (set @loader-calls)))
                        _ (subs/apply-delta!
                           (delta 2
                                  {:blocks
                                   {parent-uuid
                                    (block parent-uuid 11 "parent changed")}
                                   :children
                                   {parent-uuid
                                    {:base-tx-id 10
                                     :tx-id 11
                                     :remove [[old-child-uuid "a"]]
                                     :upsert [[new-child-uuid "b"]]}}}))
                        _ (is (= {:status :loading}
                                 (subs/children-snapshot parent-uuid)))
                        _ (is (= {:status :loading}
                                 (subs/children-snapshot unrelated-parent-uuid))
                              "The delta must not invalidate an unrelated pending parent.")
                        _ (p/resolve! parent-initial-request
                                      {:basis-rev 1
                                       :parent-tx-id 10
                                       :items [[old-child-uuid "a"]]})
                        _ (p/resolve! unrelated-request
                                      {:basis-rev 1
                                       :parent-tx-id 20
                                       :items [[unrelated-child-uuid "a"]]})
                        _ (p/delay 0)
                        _ (p/delay 0)]
                  (is (= {parent-uuid 2
                          unrelated-parent-uuid 1}
                         (frequencies (map second @loader-calls)))
                      "Only the patched parent schedules one follow-up load.")
                  (is (= {:status :ready :value [new-child-uuid]}
                         (subs/children-snapshot parent-uuid))
                      "The old initial response cannot overwrite the newer patch revision.")
                  (is (= {:status :ready :value [unrelated-child-uuid]}
                         (subs/children-snapshot unrelated-parent-uuid))
                      "The unrelated in-flight response remains valid.")
                  (unsubscribe-unrelated)
                  (unsubscribe-parent))))))))

(deftest child-base-mismatch-starts-one-typed-parent-reload-test
  (async done
         (let [parent-uuid (random-uuid)
               child-a (random-uuid)
               child-b (random-uuid)
               reload-request (p/deferred)
               loader-calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-children
                            (fn [graph-id requested-parent]
                              (swap! loader-calls conj [graph-id requested-parent])
                              (if (= 1 (count @loader-calls))
                                (p/resolved {:basis-rev 1
                                             :parent-tx-id 10
                                             :items [[child-a "a"]]})
                                reload-request))]
              (let [unsubscribe (subs/subscribe-children! parent-uuid (fn []))]
                (p/let [_ (p/delay 0)
                        _ (is (= {:status :ready :value [child-a]}
                                 (subs/children-snapshot parent-uuid)))
                        _ (subs/apply-delta!
                           (delta 2
                                  {:blocks {parent-uuid
                                            (block parent-uuid 11 "parent")}
                                   :children
                                   {parent-uuid
                                    {:base-tx-id 9
                                     :tx-id 11
                                     :remove [[child-a "a"]]
                                     :upsert [[child-b "b"]]}}}))
                        _ (p/delay 0)
                        _ (is (= [[test-graph-id parent-uuid]
                                  [test-graph-id parent-uuid]]
                                 @loader-calls))
                        _ (subs/apply-delta!
                           (delta 3
                                  {:children
                                   {parent-uuid
                                    {:base-tx-id 9
                                     :tx-id 11
                                     :remove [[child-a "a"]]
                                     :upsert [[child-b "b"]]}}}))
                        _ (p/delay 0)
                        _ (is (= 2 (count @loader-calls))
                              "Repeated invalidation shares the in-flight typed reload.")
                        _ (p/resolve! reload-request
                                      {:basis-rev 3
                                       :parent-tx-id 11
                                       :items [[child-b "b"]]})
                        _ (p/delay 0)]
                  (is (= {:status :ready :value [child-b]}
                         (subs/children-snapshot parent-uuid)))
                  (unsubscribe))))))))

(deftest parent-revision-without-child-patch-reloads-mounted-children-once-test
  (async done
         (let [parent-uuid (random-uuid)
               child-before (random-uuid)
               child-after (random-uuid)
               reload-request (p/deferred)
               loader-calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-children
                            (fn [graph-id requested-parent]
                              (swap! loader-calls conj [graph-id requested-parent])
                              (case (count @loader-calls)
                                1 (p/resolved {:basis-rev 1
                                               :parent-tx-id 10
                                               :items [[child-before "a"]]})
                                2 reload-request
                                (p/rejected
                                 (js/Error. "unexpected extra children reload"))))]
              (let [unsubscribe-first
                    (subs/subscribe-children! parent-uuid (fn []))
                    unsubscribe-second
                    (subs/subscribe-children! parent-uuid (fn []))]
                (p/let [_ (p/delay 0)
                        _ (is (= {:status :ready :value [child-before]}
                                 (subs/children-snapshot parent-uuid)))
                        _ (subs/apply-delta!
                           (delta 2
                                  {:blocks
                                   {parent-uuid
                                    (block parent-uuid 11 "parent changed")}}))
                        _ (p/delay 0)
                        _ (is (= [[test-graph-id parent-uuid]
                                  [test-graph-id parent-uuid]]
                                 @loader-calls)
                              "All mounted subscribers share one membership reload.")
                        _ (p/resolve! reload-request
                                      {:basis-rev 2
                                       :parent-tx-id 11
                                       :items [[child-after "b"]]})
                        _ (p/delay 0)]
                  (is (= 2 (count @loader-calls)))
                  (is (= {:status :ready :value [child-after]}
                         (subs/children-snapshot parent-uuid)))
                  (unsubscribe-second)
                  (unsubscribe-first))))))))

(deftest first-subscription-starts-one-typed-load-and-shares-it-test
  (async done
         (let [block-uuid (random-uuid)
               parent-uuid (random-uuid)
               child-uuid (random-uuid)
               journal-uuid (random-uuid)
               resource-key [:page-identity journal-uuid]
               block-request (p/deferred)
               children-request (p/deferred)
               resource-request (p/deferred)
               calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [graph-id requested-uuid]
                              (swap! calls conj [:block graph-id requested-uuid])
                              block-request)
                            subs/<load-children
                            (fn [graph-id requested-parent]
                              (swap! calls conj [:children graph-id requested-parent])
                              children-request)
                            subs/<load-resource
                            (fn [graph-id requested-key]
                              (swap! calls conj [:resource graph-id requested-key])
                              resource-request)]
              (let [unsubscribes
                    [(subs/subscribe-block! block-uuid (fn []))
                     (subs/subscribe-block! block-uuid (fn []))
                     (subs/subscribe-children! parent-uuid (fn []))
                     (subs/subscribe-children! parent-uuid (fn []))
                     (subs/subscribe-resource! resource-key (fn []))
                     (subs/subscribe-resource! resource-key (fn []))]]
                (p/let [_ (p/delay 0)
                        _ (is (= #{[:block test-graph-id block-uuid]
                                   [:children test-graph-id parent-uuid]
                                   [:resource test-graph-id resource-key]}
                                 (set @calls)))
                        _ (is (= 3 (count @calls))
                              "Two subscribers share one in-flight request per typed key.")
                        _ (is (= {:status :loading}
                                 (subs/block-snapshot block-uuid)))
                        _ (is (= {:status :loading}
                                 (subs/children-snapshot parent-uuid)))
                        _ (is (= {:status :loading}
                                 (subs/resource-snapshot resource-key)))
                        _ (p/resolve! block-request
                                      {:basis-rev 1
                                       :blocks {block-uuid
                                                (block block-uuid 1 "loaded")}})
                        _ (p/resolve! children-request
                                      {:basis-rev 1
                                       :parent-tx-id 1
                                       :items [[child-uuid "a"]]})
                        _ (p/resolve! resource-request
                                      {:basis-rev 1
                                       :key resource-key
                                       :watch-keys #{[:journal journal-uuid]}
                                       :value {:journal-uuid journal-uuid}})
                        _ (p/delay 0)]
                  (is (= {:status :ready
                          :value (block block-uuid 1 "loaded")}
                         (subs/block-snapshot block-uuid)))
                  (is (= {:status :ready :value [child-uuid]}
                         (subs/children-snapshot parent-uuid)))
                  (is (= {:status :ready
                          :value {:journal-uuid journal-uuid}}
                         (subs/resource-snapshot resource-key)))
                  (is (identical? (subs/resource-snapshot resource-key)
                                  (subs/resource-snapshot resource-key)))
                  (run! (fn [unsubscribe] (unsubscribe)) unsubscribes))))))))

(deftest reset-graph-restarts-every-mounted-typed-load-test
  (async done
         (let [next-graph-id "subs-test-next-graph"
               block-uuid (random-uuid)
               parent-uuid (random-uuid)
               child-uuid (random-uuid)
               resource-key [:page-identity (random-uuid)]
               calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [graph-id requested-uuid]
                              (swap! calls conj [:block graph-id requested-uuid])
                              (p/resolved
                               {:basis-rev 1
                                :blocks {requested-uuid
                                         (block requested-uuid 1 "loaded")}}))
                            subs/<load-children
                            (fn [graph-id requested-parent]
                              (swap! calls conj [:children graph-id requested-parent])
                              (p/resolved
                               {:basis-rev 1
                                :parent-tx-id 1
                                :items [[child-uuid "a"]]}))
                            subs/<load-resource
                            (fn [graph-id requested-key]
                              (swap! calls conj [:resource graph-id requested-key])
                              (p/resolved
                               {:basis-rev 1
                                :key requested-key
                                :watch-keys #{[:graph]}
                                :value :loaded}))]
              (let [unsubscribes
                    [(subs/subscribe-block! block-uuid (fn []))
                     (subs/subscribe-children! parent-uuid (fn []))
                     (subs/subscribe-resource! resource-key (fn []))]]
                (p/let [_ (p/delay 0)
                        _ (reset! calls [])
                        _ (subs/reset-graph! next-graph-id)
                        _ (p/delay 0)]
                  (is (= #{[:block next-graph-id block-uuid]
                           [:children next-graph-id parent-uuid]
                           [:resource next-graph-id resource-key]}
                         (set @calls)))
                  (is (= 3 (count @calls))
                      "Each mounted typed key restarts exactly once on the new graph.")
                  (run! (fn [unsubscribe] (unsubscribe)) unsubscribes))))))))

(deftest resource-invalidation-reloads-only-mounted-intersections-test
  (async done
         (let [journal-a (random-uuid)
               journal-b (random-uuid)
               journal-c (random-uuid)
               key-a [:page-identity journal-a]
               key-b [:page-identity journal-b]
               key-c [:page-identity journal-c]
               watch-a [:journal journal-a]
               watch-b [:journal journal-b]
               watch-c [:journal journal-c]
               reload-a (p/deferred)
               calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id resource-key]
                              (swap! calls conj resource-key)
                              (let [[watch-key value]
                                    (condp = resource-key
                                      key-a [watch-a :a]
                                      key-b [watch-b :b]
                                      key-c [watch-c :c])]
                                (if (and (= key-a resource-key)
                                         (> (count (filter #{key-a} @calls)) 1))
                                  reload-a
                                  (p/resolved {:basis-rev 1
                                               :key resource-key
                                               :watch-keys #{watch-key}
                                               :value value}))))]
              (let [unsubscribe-a (subs/subscribe-resource! key-a (fn []))
                    unsubscribe-b (subs/subscribe-resource! key-b (fn []))
                    unsubscribe-c (subs/subscribe-resource! key-c (fn []))]
                (p/let [_ (p/delay 0)
                        snapshot-b (subs/resource-snapshot key-b)
                        _ (unsubscribe-c)
                        _ (p/delay 0)
                        _ (subs/apply-delta!
                           (delta 2 {:affected-keys #{watch-a}}))
                        _ (p/delay 0)
                        _ (is (= 2 (count (filter #{key-a} @calls))))
                        _ (is (= 1 (count (filter #{key-b} @calls))))
                        _ (is (= 1 (count (filter #{key-c} @calls))))
                        _ (is (identical? snapshot-b
                                          (subs/resource-snapshot key-b)))
                        _ (subs/apply-delta!
                           (delta 3 {:affected-keys #{watch-a}}))
                        _ (p/delay 0)
                        _ (is (= 2 (count (filter #{key-a} @calls)))
                              "A mounted stale resource shares its in-flight reload.")
                        _ (p/resolve! reload-a
                                      {:basis-rev 3
                                       :key key-a
                                       :watch-keys #{watch-a}
                                       :value :a-reloaded})
                        _ (p/delay 0)]
                  (is (= {:status :ready :value :a-reloaded}
                         (subs/resource-snapshot key-a)))
                  (unsubscribe-a)
                  (unsubscribe-b)
                  (p/let [_ (p/delay 0)
                          calls-before @calls
                          _ (subs/apply-delta!
                             (delta 4 {:affected-keys #{watch-a watch-b watch-c}}))
                          _ (p/delay 0)]
                    (is (= calls-before @calls)
                        "Invalidated unmounted resources never start requests.")))))))))

(deftest invalidation-during-an-in-flight-request-schedules-one-follow-up-test
  (async done
         (let [resource-key [:page-identity (random-uuid)]
               watch-key [:journal (random-uuid)]
               first-reload (p/deferred)
               follow-up (p/deferred)
               calls (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id requested-key]
                              (is (= resource-key requested-key))
                              (case (swap! calls inc)
                                1 (p/resolved {:basis-rev 1
                                               :key resource-key
                                               :watch-keys #{watch-key}
                                               :value :initial})
                                2 first-reload
                                3 follow-up
                                (p/rejected
                                 (js/Error. "unexpected extra resource reload"))))]
              (let [unsubscribe (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)
                        _ (subs/apply-delta!
                           (delta 2 {:affected-keys #{watch-key}}))
                        _ (subs/apply-delta!
                           (delta 3 {:affected-keys #{watch-key}}))
                        _ (subs/apply-delta!
                           (delta 4 {:affected-keys #{watch-key}}))
                        _ (p/delay 0)
                        _ (is (= 2 @calls)
                              "Repeated invalidations share the current request.")
                        _ (p/resolve! first-reload
                                      {:basis-rev 2
                                       :key resource-key
                                       :watch-keys #{watch-key}
                                       :value :stale-reload})
                        _ (p/delay 0)
                        _ (is (= 3 @calls)
                              "Invalidation during the request schedules one follow-up.")
                        _ (p/resolve! follow-up
                                      {:basis-rev 4
                                       :key resource-key
                                       :watch-keys #{watch-key}
                                       :value :fresh})
                        _ (p/delay 0)]
                  (is (= 3 @calls))
                  (is (= {:status :ready :value :fresh}
                         (subs/resource-snapshot resource-key)))
                  (unsubscribe))))))))

(deftest block-subscriptions-coalesce-default-loads-in-batches-of-25-test
  (async done
         (let [block-uuids (vec (repeatedly 100 random-uuid))
               worker-calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [state/<invoke-db-worker
                            (fn [api graph-id payload]
                              (swap! worker-calls conj [api graph-id payload])
                              (p/resolved
                               {:basis-rev 1
                                :blocks
                                (into {}
                                      (map (fn [block-uuid]
                                             [block-uuid
                                              (block block-uuid 1 "loaded")]))
                                      payload)}))]
              (let [unsubscribes
                    (mapv #(subs/subscribe-block! % (fn [])) block-uuids)]
                (p/let [_ (p/delay 0)
                        calls @worker-calls
                        payloads (mapv #(nth % 2) calls)]
                  (is (<= (count calls) 4)
                      "One tick of 100 UUID subscriptions needs at most four worker calls.")
                  (is (every? #(= :thread-api/get-canonical-blocks (first %)) calls))
                  (is (every? #(= test-graph-id (second %)) calls))
                  (is (every? vector? payloads)
                      "The typed worker API receives plain UUID vectors.")
                  (is (every? #(<= (count %) 25) payloads))
                  (is (= (set block-uuids) (set (mapcat identity payloads))))
                  (is (every? #(= :ready (:status (subs/block-snapshot %)))
                              block-uuids))
                  (run! (fn [unsubscribe] (unsubscribe)) unsubscribes))))))))

(deftest duplicate-block-subscriptions-share-one-default-request-test
  (async done
         (let [block-uuid (random-uuid)
               worker-calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [state/<invoke-db-worker
                            (fn [api graph-id payload]
                              (swap! worker-calls conj [api graph-id payload])
                              (p/resolved
                               {:basis-rev 1
                                :blocks {block-uuid
                                         (block block-uuid 1 "loaded")}}))]
              (let [unsubscribes
                    (mapv (fn [_]
                            (subs/subscribe-block! block-uuid (fn [])))
                          (range 100))]
                (p/let [_ (p/delay 0)]
                  (is (= [[:thread-api/get-canonical-blocks
                           test-graph-id
                           [block-uuid]]]
                         @worker-calls))
                  (is (= {:status :ready
                          :value (block block-uuid 1 "loaded")}
                         (subs/block-snapshot block-uuid)))
                  (run! (fn [unsubscribe] (unsubscribe)) unsubscribes))))))))

(deftest children-subscriptions-coalesce-default-loads-without-a-ui-batch-api-test
  (async done
         (let [parent-uuids (vec (repeatedly 100 random-uuid))
               child-by-parent (into {}
                                     (map (fn [parent-uuid]
                                            [parent-uuid (random-uuid)]))
                                     parent-uuids)
               worker-calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [state/<invoke-db-worker
                            (fn [api graph-id payload]
                              (swap! worker-calls conj [api graph-id payload])
                              (if (vector? payload)
                                (p/resolved
                                 {:basis-rev 1
                                  :children
                                  (into {}
                                        (map (fn [parent-uuid]
                                               [parent-uuid
                                                {:parent-tx-id 1
                                                 :items [[(get child-by-parent parent-uuid)
                                                          "a"]]}]))
                                        payload)})
                                (p/resolved
                                 {:basis-rev 1
                                  :parent-tx-id 1
                                  :items [[(get child-by-parent payload) "a"]]})))]
              (let [unsubscribes
                    (mapv #(subs/subscribe-children! % (fn [])) parent-uuids)]
                (p/let [_ (p/delay 0)
                        calls @worker-calls
                        payloads (mapv #(nth % 2) calls)]
                  (is (<= (count calls) 4)
                      "Direct-child loads use the same bounded one-tick batching policy.")
                  (is (every? #(= :thread-api/get-direct-children (first %)) calls))
                  (is (every? #(= test-graph-id (second %)) calls))
                  (is (every? vector? payloads)
                      "Batching stays internal; the worker receives parent UUID vectors.")
                  (is (every? #(<= (count %) 25) payloads))
                  (is (= (set parent-uuids) (set (mapcat identity payloads))))
                  (doseq [parent-uuid parent-uuids]
                    (is (= {:status :ready
                            :value [(get child-by-parent parent-uuid)]}
                           (subs/children-snapshot parent-uuid))))
                  (run! (fn [unsubscribe] (unsubscribe)) unsubscribes))))))))

(deftest resource-subscriptions-coalesce-default-loads-in-unique-batches-of-25-test
  (async done
         (let [resource-keys
               (mapv (fn [index]
                       [:page-identity (str "page-" index)])
                     (range 100))
               worker-calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [state/<invoke-db-worker
                            (fn [api graph-id requested-keys]
                              (swap! worker-calls conj
                                     [api graph-id requested-keys])
                              (p/resolved
                               {:basis-rev 1
                                :resources
                                (into {}
                                      (map (fn [resource-key]
                                             [resource-key
                                              {:watch-keys #{[:graph]}
                                               :value resource-key}]))
                                      requested-keys)}))]
              (let [unsubscribes
                    (mapv #(subs/subscribe-resource! % (fn [])) resource-keys)]
                (p/let [_ (p/delay 0)
                        calls @worker-calls
                        payloads (mapv #(nth % 2) calls)]
                  (is (= 4 (count calls)))
                  (is (every? #(= :thread-api/get-render-resources (first %))
                              calls))
                  (is (every? #(= test-graph-id (second %)) calls))
                  (is (every? vector? payloads))
                  (is (every? #(<= (count %) 25) payloads))
                  (is (every? #(= % (vec (distinct %))) payloads))
                  (is (= (set resource-keys)
                         (set (mapcat identity payloads))))
                  (doseq [resource-key resource-keys]
                    (is (= {:status :ready :value resource-key}
                           (subs/resource-snapshot resource-key))))
                  (run! (fn [unsubscribe] (unsubscribe)) unsubscribes))))))))

(deftest duplicate-resource-subscribers-share-one-batch-entry-test
  (async done
         (let [resource-key [:page-identity "shared-page"]
               worker-calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [state/<invoke-db-worker
                            (fn [api graph-id requested-keys]
                              (swap! worker-calls conj
                                     [api graph-id requested-keys])
                              (p/resolved
                               {:basis-rev 1
                                :resources
                                {resource-key {:watch-keys #{[:graph]}
                                               :value :shared}}}))]
              (let [unsubscribes
                    (mapv (fn [_]
                            (subs/subscribe-resource! resource-key (fn [])))
                          (range 100))]
                (p/let [_ (p/delay 0)]
                  (is (= [[:thread-api/get-render-resources
                           test-graph-id
                           [resource-key]]]
                         @worker-calls))
                  (is (= {:status :ready :value :shared}
                         (subs/resource-snapshot resource-key)))
                  (run! (fn [unsubscribe] (unsubscribe)) unsubscribes))))))))

(deftest missing-resource-batch-result-fails-the-whole-batch-test
  (async done
         (let [present-key [:page-identity "present"]
               missing-key [:page-identity "missing"]]
           (finish-async!
            done
            (p/with-redefs [state/<invoke-db-worker
                            (fn [_api _graph-id _requested-keys]
                              (p/resolved
                               {:basis-rev 1
                                :resources
                                {present-key {:watch-keys #{[:graph]}
                                              :value :present}}}))]
              (let [unsubscribe-present
                    (subs/subscribe-resource! present-key (fn []))
                    unsubscribe-missing
                    (subs/subscribe-resource! missing-key (fn []))]
                (p/let [_ (p/delay 0)
                        present-snapshot (subs/resource-snapshot present-key)
                        missing-snapshot (subs/resource-snapshot missing-key)]
                  (is (= :error (:status present-snapshot)))
                  (is (= :error (:status missing-snapshot)))
                  (doseq [error [(:error present-snapshot)
                                 (:error missing-snapshot)]]
                    (is (re-find #"Missing renderer resource batch result"
                                 (ex-message error)))
                    (is (= missing-key (:resource-key (ex-data error)))))
                  (unsubscribe-missing)
                  (unsubscribe-present))))))))

(deftest reset-rejects-queued-resource-load-before-worker-dispatch-test
  (async done
         (let [resource-key [:page-identity "queued"]
               worker-calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [state/<invoke-db-worker
                            (fn [& args]
                              (swap! worker-calls conj args)
                              (p/resolved :unexpected-dispatch))]
              (let [outcome
                    (-> (subs/<load-resource test-graph-id resource-key)
                        (p/then (fn [value] [:resolved value]))
                        (p/catch (fn [error] [:rejected error])))]
                (subs/reset-graph! nil)
                (p/let [[status value] outcome]
                  (is (= :rejected status))
                  (is (re-find #"Graph changed during renderer load"
                               (ex-message value)))
                  (is (empty? @worker-calls)
                      "Reset rejects queued work before the worker API runs."))))))))

(deftest nil-graph-pauses-mounted-loads-until-resume-test
  (async done
         (let [next-graph-id "subs-test-resumed-graph"
               block-uuid (random-uuid)
               parent-uuid (random-uuid)
               child-uuid (random-uuid)
               resource-key [:page-identity "paused page"]
               calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [graph-id requested-uuid]
                              (swap! calls conj [:block graph-id requested-uuid])
                              (p/resolved
                               {:basis-rev 1
                                :blocks {requested-uuid
                                         (block requested-uuid 1 "loaded")}}))
                            subs/<load-children
                            (fn [graph-id requested-parent]
                              (swap! calls conj [:children graph-id requested-parent])
                              (p/resolved {:basis-rev 1
                                           :parent-tx-id 1
                                           :items [[child-uuid "a"]]}))
                            subs/<load-resource
                            (fn [graph-id requested-key]
                              (swap! calls conj [:resource graph-id requested-key])
                              (p/resolved {:basis-rev 1
                                           :key requested-key
                                           :watch-keys #{[:page-lookup "paused page"]}
                                           :value block-uuid}))]
              (subs/reset-graph! nil)
              (let [unsubscribes
                    [(subs/subscribe-block! block-uuid (fn []))
                     (subs/subscribe-children! parent-uuid (fn []))
                     (subs/subscribe-resource! resource-key (fn []))]]
                (p/let [_ (p/delay 0)
                        _ (is (empty? @calls)
                              "Subscriptions stay mounted while no graph is current.")
                        _ (is (= {:status :loading}
                                 (subs/block-snapshot block-uuid)))
                        _ (is (= {:status :loading}
                                 (subs/children-snapshot parent-uuid)))
                        _ (is (= {:status :loading}
                                 (subs/resource-snapshot resource-key)))
                        _ (subs/reset-graph! next-graph-id)
                        _ (p/delay 0)]
                  (is (= #{[:block next-graph-id block-uuid]
                           [:children next-graph-id parent-uuid]
                           [:resource next-graph-id resource-key]}
                         (set @calls)))
                  (is (= 3 (count @calls))
                      "Resume starts one request for each mounted exact key.")
                  (run! (fn [unsubscribe] (unsubscribe)) unsubscribes))))))))

(deftest unmounted-deltas-do-not-create-exact-slots-test
  (async done
         (let [changed-uuid (random-uuid)
               deleted-uuid (random-uuid)
               calls (atom [])]
           (subs/apply-delta!
            (delta 1 {:blocks {changed-uuid (block changed-uuid 1 "broadcast")}
                      :deleted {deleted-uuid {:rev 1}}}))
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [graph-id requested-uuid]
                              (swap! calls conj [graph-id requested-uuid])
                              (p/resolved
                               {:basis-rev 2
                                :blocks
                                (if (= changed-uuid requested-uuid)
                                  {changed-uuid
                                   (block changed-uuid 2 "canonical load")}
                                  {})}))]
              (let [unsubscribe-changed
                    (subs/subscribe-block! changed-uuid (fn []))
                    unsubscribe-deleted
                    (subs/subscribe-block! deleted-uuid (fn []))]
                (p/let [_ (p/delay 0)]
                  (is (= #{[test-graph-id changed-uuid]
                           [test-graph-id deleted-uuid]}
                         (set @calls))
                      "A later mount loads canonical data instead of retaining an unmounted delta.")
                  (is (= {:status :ready
                          :value (block changed-uuid 2 "canonical load")}
                         (subs/block-snapshot changed-uuid)))
                  (is (= {:status :missing}
                         (subs/block-snapshot deleted-uuid)))
                  (unsubscribe-changed)
                  (unsubscribe-deleted))))))))

(deftest last-unsubscribe-gc-is-deferred-for-a-same-tick-remount-test
  (async done
         (let [block-uuid (random-uuid)
               calls (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id requested-uuid]
                              (let [call (swap! calls inc)]
                                (p/resolved
                                 {:basis-rev call
                                  :blocks {requested-uuid
                                           (block requested-uuid call
                                                  (str "load " call))}})))]
              (let [unsubscribe-first
                    (subs/subscribe-block! block-uuid (fn []))]
                (p/let [_ (p/delay 0)
                        first-snapshot (subs/block-snapshot block-uuid)
                        unsubscribe-same-tick
                        (do
                          (unsubscribe-first)
                          (subs/subscribe-block! block-uuid (fn [])))
                        _ (p/delay 0)]
                  (is (= 1 @calls))
                  (is (identical? first-snapshot
                                  (subs/block-snapshot block-uuid))
                      "A same-tick remount cancels last-subscriber collection.")
                  (unsubscribe-same-tick)
                  (p/let [_ (p/delay 0)
                          _ (is (= {:status :loading}
                                   (subs/block-snapshot block-uuid))
                                "The unmounted slot is collected on the next microtask.")
                          unsubscribe-after-gc
                          (subs/subscribe-block! block-uuid (fn []))
                          _ (p/delay 0)]
                    (is (= 2 @calls))
                    (is (= {:status :ready
                            :value (block block-uuid 2 "load 2")}
                           (subs/block-snapshot block-uuid)))
                    (unsubscribe-after-gc)))))))))

(deftest collected-request-token-cannot-complete-a-remounted-slot-test
  (async done
         (let [block-uuid (random-uuid)
               first-request (p/deferred)
               second-request (p/deferred)
               calls (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id _requested-uuid]
                              (case (swap! calls inc)
                                1 first-request
                                2 second-request
                                (p/rejected
                                 (js/Error. "unexpected extra block request"))))]
              (let [unsubscribe-first
                    (subs/subscribe-block! block-uuid (fn []))]
                (p/let [_ (p/delay 0)
                        _ (unsubscribe-first)
                        _ (p/delay 0)
                        unsubscribe-second
                        (subs/subscribe-block! block-uuid (fn []))
                        _ (p/delay 0)
                        _ (is (= 2 @calls))
                        _ (p/resolve! first-request
                                      {:basis-rev 10
                                       :blocks {block-uuid
                                                (block block-uuid 10 "old token")}})
                        _ (p/delay 0)
                        _ (is (= {:status :loading}
                                 (subs/block-snapshot block-uuid))
                              "A collected request cannot write into the remounted slot.")
                        _ (p/resolve! second-request
                                      {:basis-rev 11
                                       :blocks {block-uuid
                                                (block block-uuid 11 "current token")}})
                        _ (p/delay 0)]
                  (is (= {:status :ready
                          :value (block block-uuid 11 "current token")}
                         (subs/block-snapshot block-uuid)))
                  (unsubscribe-second))))))))

(deftest journal-bundle-seeds-blocks-and-memberships-atomically-test
  (async done
         (let [journal-uuid (random-uuid)
               child-uuid (random-uuid)
               resource-key [:journal-bundle journal-uuid]
               journal (block journal-uuid 10 "Journal")
               child (block child-uuid 10 "Child")
               bundle {:root-uuid journal-uuid
                       :blocks {journal-uuid journal
                                child-uuid child}
                       :children
                       {journal-uuid {:parent-tx-id 10
                                      :items [[child-uuid "a"]]}
                        child-uuid {:parent-tx-id 10
                                    :items []}}}
               calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [graph-id requested-key]
                              (swap! calls conj [:resource graph-id requested-key])
                              (p/resolved {:basis-rev 1
                                           :key resource-key
                                           :watch-keys #{}
                                           :value bundle}))
                            subs/<load-block
                            (fn [graph-id requested-uuid]
                              (swap! calls conj [:block graph-id requested-uuid])
                              (p/rejected
                               (js/Error. "seeded block must not reload")))
                            subs/<load-children
                            (fn [graph-id requested-uuid]
                              (swap! calls conj [:children graph-id requested-uuid])
                              (p/rejected
                               (js/Error. "seeded membership must not reload")))]
              (let [unsubscribe-resource
                    (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)
                        unsubscribe-journal
                        (subs/subscribe-block! journal-uuid (fn []))
                        unsubscribe-child
                        (subs/subscribe-block! child-uuid (fn []))
                        unsubscribe-journal-children
                        (subs/subscribe-children! journal-uuid (fn []))
                        unsubscribe-child-children
                        (subs/subscribe-children! child-uuid (fn []))
                        _ (p/delay 0)]
                  (is (= [[:resource test-graph-id resource-key]] @calls))
                  (is (= {:status :ready :value bundle}
                         (subs/resource-snapshot resource-key)))
                  (is (= {:status :ready :value journal}
                         (subs/block-snapshot journal-uuid)))
                  (is (= {:status :ready :value child}
                         (subs/block-snapshot child-uuid)))
                  (is (= {:status :ready :value [child-uuid]}
                         (subs/children-snapshot journal-uuid)))
                  (is (= {:status :ready :value []}
                         (subs/children-snapshot child-uuid)))
                  (run! (fn [unsubscribe] (unsubscribe))
                        [unsubscribe-child-children
                         unsubscribe-journal-children
                         unsubscribe-child
                         unsubscribe-journal
                         unsubscribe-resource]))))))))

(deftest journal-bundle-unmount-collects-never-mounted-seeded-descendants-test
  (async done
         (let [journal-uuid (random-uuid)
               collapsed-child-uuid (random-uuid)
               resource-key [:journal-bundle journal-uuid]
               journal (block journal-uuid 10 "Journal")
               collapsed-child (block collapsed-child-uuid 10 "Collapsed child")
               bundle
               {:root-uuid journal-uuid
                :blocks {journal-uuid journal
                         collapsed-child-uuid collapsed-child}
                :children
                {journal-uuid {:parent-tx-id 10
                               :items [[collapsed-child-uuid "a"]]}
                 collapsed-child-uuid {:parent-tx-id 10
                                       :items []}}}]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id _requested-key]
                              (p/resolved {:basis-rev 1
                                           :key resource-key
                                           :watch-keys #{}
                                           :value bundle}))
                            subs/<load-block
                            (fn [& _]
                              (p/rejected
                               (js/Error. "seeded block must not reload")))
                            subs/<load-children
                            (fn [& _]
                              (p/rejected
                               (js/Error. "seeded membership must not reload")))]
              (let [unsubscribe-resource
                    (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)
                        unsubscribe-mounted-block
                        (subs/subscribe-block! journal-uuid (fn []))
                        unsubscribe-mounted-children
                        (subs/subscribe-children! journal-uuid (fn []))
                        _ (is (= {:status :ready :value collapsed-child}
                                 (subs/block-snapshot collapsed-child-uuid)))
                        _ (is (= {:status :ready :value []}
                                 (subs/children-snapshot collapsed-child-uuid)))
                        _ (unsubscribe-resource)
                        _ (p/delay 0)]
                  (is (= {:status :ready :value journal}
                         (subs/block-snapshot journal-uuid))
                      "A mounted exact descendant survives bundle collection.")
                  (is (= {:status :ready :value [collapsed-child-uuid]}
                         (subs/children-snapshot journal-uuid)))
                  (is (= {:status :loading}
                         (subs/block-snapshot collapsed-child-uuid))
                      "A never-mounted seeded block is collected with its bundle.")
                  (is (= {:status :loading}
                         (subs/children-snapshot collapsed-child-uuid))
                      "A never-mounted seeded membership is collected with its bundle.")
                  (unsubscribe-mounted-children)
                  (unsubscribe-mounted-block))))))))

(deftest malformed-journal-bundle-is-rejected-without-partial-seeding-test
  (async done
         (let [journal-uuid (random-uuid)
               child-uuid (random-uuid)
               resource-key [:journal-bundle journal-uuid]
               journal (block journal-uuid 10 "Journal")
               child (block child-uuid 10 "Child")
               malformed-bundle
               {:root-uuid journal-uuid
                :blocks {journal-uuid journal
                         child-uuid child}
                :children
                {journal-uuid {:parent-tx-id 10
                               :items [[child-uuid "a"]]}}}
               calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [graph-id requested-key]
                              (swap! calls conj [:resource graph-id requested-key])
                              (p/resolved {:basis-rev 1
                                           :key resource-key
                                           :watch-keys #{}
                                           :value malformed-bundle}))
                            subs/<load-block
                            (fn [graph-id requested-uuid]
                              (swap! calls conj [:block graph-id requested-uuid])
                              (p/resolved
                               {:basis-rev 1
                                :blocks {requested-uuid
                                         (if (= journal-uuid requested-uuid)
                                           journal
                                           child)}}))
                            subs/<load-children
                            (fn [graph-id requested-uuid]
                              (swap! calls conj [:children graph-id requested-uuid])
                              (p/resolved
                               {:basis-rev 1
                                :parent-tx-id 10
                                :items (if (= journal-uuid requested-uuid)
                                         [[child-uuid "a"]]
                                         [])}))]
              (let [unsubscribe-resource
                    (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)
                        _ (is (= :error
                                 (:status (subs/resource-snapshot resource-key))))
                        unsubscribe-journal
                        (subs/subscribe-block! journal-uuid (fn []))
                        unsubscribe-child
                        (subs/subscribe-block! child-uuid (fn []))
                        unsubscribe-journal-children
                        (subs/subscribe-children! journal-uuid (fn []))
                        unsubscribe-child-children
                        (subs/subscribe-children! child-uuid (fn []))
                        _ (p/delay 0)]
                  (is (= #{[:resource test-graph-id resource-key]
                           [:block test-graph-id journal-uuid]
                           [:block test-graph-id child-uuid]
                           [:children test-graph-id journal-uuid]
                           [:children test-graph-id child-uuid]}
                         (set @calls))
                      "No exact slot from an invalid bundle is retained.")
                  (run! (fn [unsubscribe] (unsubscribe))
                        [unsubscribe-child-children
                         unsubscribe-journal-children
                         unsubscribe-child
                         unsubscribe-journal
                         unsubscribe-resource]))))))))

(deftest stale-seeded-membership-reloads-on-later-mount-test
  (async done
         (let [journal-uuid (random-uuid)
               old-child-uuid (random-uuid)
               new-child-uuid (random-uuid)
               resource-key [:journal-bundle journal-uuid]
               reload-request (p/deferred)
               children-calls (atom [])
               bundle
               {:root-uuid journal-uuid
                :blocks {journal-uuid (block journal-uuid 10 "Journal")
                         old-child-uuid (block old-child-uuid 10 "Old child")}
                :children
                {journal-uuid {:parent-tx-id 10
                               :items [[old-child-uuid "a"]]}
                 old-child-uuid {:parent-tx-id 10
                                 :items []}}}]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id _requested-key]
                              (p/resolved {:basis-rev 1
                                           :key resource-key
                                           :watch-keys #{}
                                           :value bundle}))
                            subs/<load-children
                            (fn [graph-id requested-parent]
                              (swap! children-calls conj [graph-id requested-parent])
                              reload-request)]
              (let [unsubscribe-resource
                    (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)
                        _ (is (= {:status :ready :value [old-child-uuid]}
                                 (subs/children-snapshot journal-uuid)))
                        _ (subs/apply-delta!
                           (delta 2
                                  {:children
                                   {journal-uuid
                                    {:base-tx-id 9
                                     :tx-id 11
                                     :remove [[old-child-uuid "a"]]
                                     :upsert [[new-child-uuid "b"]]}}}))
                        _ (is (empty? @children-calls)
                              "An unmounted stale membership does not reload eagerly.")
                        unsubscribe-children
                        (subs/subscribe-children! journal-uuid (fn []))
                        _ (p/delay 0)
                        _ (is (= [[test-graph-id journal-uuid]]
                                 @children-calls))
                        _ (p/resolve! reload-request
                                      {:basis-rev 2
                                       :parent-tx-id 11
                                       :items [[new-child-uuid "b"]]})
                        _ (p/delay 0)]
                  (is (= {:status :ready :value [new-child-uuid]}
                         (subs/children-snapshot journal-uuid)))
                  (unsubscribe-children)
                  (unsubscribe-resource))))))))

(deftest initial-resource-behind-global-revision-starts-one-follow-up-test
  (async done
         (let [resource-key [:page-identity "late page"]
               watch-key [:page-lookup "late page"]
               first-request (p/deferred)
               follow-up-request (p/deferred)
               calls (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id _requested-key]
                              (case (swap! calls inc)
                                1 first-request
                                2 follow-up-request
                                (p/rejected
                                 (js/Error. "unexpected extra resource request"))))]
              (let [unsubscribe
                    (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)
                        _ (subs/apply-delta!
                           (delta 5 {:affected-keys #{[:unrelated]}}))
                        _ (p/resolve! first-request
                                      {:basis-rev 4
                                       :key resource-key
                                       :watch-keys #{watch-key}
                                       :value :stale})
                        _ (p/delay 0)
                        _ (is (= 2 @calls)
                              "A stale initial response schedules exactly one fresh request.")
                        _ (is (= {:status :loading}
                                 (subs/resource-snapshot resource-key))
                              "The stale initial value is never published.")
                        _ (p/resolve! follow-up-request
                                      {:basis-rev 5
                                       :key resource-key
                                       :watch-keys #{watch-key}
                                       :value :fresh})
                        _ (p/delay 0)]
                  (is (= 2 @calls))
                  (is (= {:status :ready :value :fresh}
                         (subs/resource-snapshot resource-key)))
                  (unsubscribe))))))))

(deftest resolve-blocks-loads-shared-canonical-rows-in-input-order-test
  (async done
         (let [block-a-uuid (random-uuid)
               block-b-uuid (random-uuid)
               block-a (block block-a-uuid 1 "A")
               block-b (block block-b-uuid 1 "B")
               requests (atom {})
               calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [graph-id requested-uuid]
                              (swap! calls conj [graph-id requested-uuid])
                              (let [request (p/deferred)]
                                (swap! requests assoc requested-uuid request)
                                request))]
              (let [result (subs/resolve-blocks!
                            [block-b-uuid block-a-uuid block-b-uuid])]
                (p/let [_ (p/delay 0)
                        _ (is (= [[test-graph-id block-b-uuid]
                                  [test-graph-id block-a-uuid]]
                                 @calls)
                              "Duplicate UUIDs share the same exact in-flight request.")
                        _ (p/resolve! (get @requests block-a-uuid)
                                      {:basis-rev 1
                                       :blocks {block-a-uuid block-a}})
                        _ (p/resolve! (get @requests block-b-uuid)
                                      {:basis-rev 1
                                       :blocks {block-b-uuid block-b}})
                        rows result]
                  (is (= [block-b block-a block-b] rows)))))))))

(deftest resolve-blocks-reuses-a-ready-canonical-row-test
  (async done
         (let [block-uuid (random-uuid)
               canonical-block (block block-uuid 1 "Ready")
               calls (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id requested-uuid]
                              (swap! calls inc)
                              (p/resolved {:basis-rev 1
                                           :blocks {requested-uuid
                                                    canonical-block}}))]
              (let [unsubscribe
                    (subs/subscribe-block! block-uuid (fn []))]
                (p/let [_ (p/delay 0)
                        rows (subs/resolve-blocks! [block-uuid block-uuid])]
                  (is (= [canonical-block canonical-block] rows))
                  (is (= 1 @calls)
                      "Resolving ready rows does not invoke the worker again.")
                  (unsubscribe))))))))

(deftest resolve-blocks-rejects-tombstones-and-loader-errors-test
  (async done
         (let [missing-uuid (random-uuid)
               error-uuid (random-uuid)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id requested-uuid]
                              (if (= missing-uuid requested-uuid)
                                (p/resolved {:basis-rev 1 :blocks {}})
                                (p/rejected
                                 (ex-info "canonical load failed"
                                          {:code :canonical-load-failed}))))]
              (p/all
               [(-> (subs/resolve-blocks! [missing-uuid])
                    (p/then (fn [_rows]
                              (is false "A tombstone must reject resolution.")))
                    (p/catch (fn [error]
                               (is (= :missing (:status (ex-data error))))
                               (is (= missing-uuid
                                      (:block-uuid (ex-data error)))))))
                (-> (subs/resolve-blocks! [error-uuid])
                    (p/then (fn [_rows]
                              (is false "A load error must reject resolution.")))
                    (p/catch (fn [error]
                               (is (= :canonical-load-failed
                                      (:code (ex-data error)))))))]))))))
