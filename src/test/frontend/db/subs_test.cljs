(ns frontend.db.subs-test
  (:require [cljs.test :refer [async deftest is testing use-fixtures]]
            [datascript.core :as d]
            [frontend.db.subs :as subs]
            [frontend.state :as state]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.handler.render-resource.engine :as render-engine]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
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

(defn- block-patch
  [basis-rev blocks]
  {:basis-rev basis-rev
   :slots (into {}
                (map (fn [[block-uuid block-value]]
                       [[:block block-uuid] {:value block-value}]))
                blocks)})

(defn- missing-block-patch
  [basis-rev block-uuid]
  {:basis-rev basis-rev
   :slots {[:block block-uuid] {:missing? true}}})

(defn- children-patch
  [basis-rev parent-uuid tx-id items]
  {:basis-rev basis-rev
   :slots {[:children parent-uuid] {:tx-id tx-id :items items}}})

(defn- subtree-patch
  [basis-rev blocks children]
  {:basis-rev basis-rev
   :slots (merge
           (:slots (block-patch basis-rev blocks))
           (into {}
                 (map (fn [[parent-uuid {:keys [parent-tx-id items]}]]
                        [[:children parent-uuid]
                         {:tx-id parent-tx-id :items items}]))
                 children))})

(defn- resource-patch
  [basis-rev resource-key watch value]
  {:basis-rev basis-rev
   :slots {[:resource resource-key] {:watch watch :value value}}})

(defn- exact-resource-patch
  [basis-rev resource-key watch-keys value]
  (resource-patch basis-rev resource-key
                  {:keys watch-keys :all? false}
                  value))

(defn- all-resource-patch
  [basis-rev resource-key value]
  (resource-patch basis-rev resource-key
                  {:keys #{} :all? true}
                  value))

(defn- grouped-patch
  [patch slot-keys]
  (assoc patch :groups
         (into {} (map (fn [slot-key] [slot-key #{slot-key}])) slot-keys)))

(defn- finish-async!
  [done promise]
  (-> promise
      (p/catch (fn [error]
                 (is false (str error))))
      (p/finally done)))

(def ^:private previous-worker (atom nil))

(use-fixtures :each
  {:before #(do
              (reset! previous-worker @state/*db-worker)
              (reset! state/*db-worker (fn [& _args] nil))
              (subs/reset-graph! test-graph-id))
   :after #(do
             (subs/reset-graph! test-graph-id)
             (reset! state/*db-worker @previous-worker))})

(deftest subscriptions-mounted-before-db-worker-start-load-when-it-is-ready-test
  (async done
         (let [resource-key [:journals]
               previous-db-worker @state/*db-worker
               worker-calls (atom [])
               scheduled-load (atom nil)
               unsubscribe (atom nil)]
           (reset! state/*db-worker nil)
           (finish-async!
            done
            (p/with-redefs [subs/schedule-load-batch!
                            #(reset! scheduled-load %)]
              (->
               (p/let [_ (reset! unsubscribe
                                 (subs/subscribe-resource! resource-key (fn [])))
                       flush-error (try
                                     (@scheduled-load)
                                     nil
                                     (catch :default error error))
                       _ (is (nil? flush-error)
                             "A scheduled load must remain pending until the DB worker is ready.")
                       _ (reset! state/*db-worker
                                 (fn [api graph-id request]
                                   (swap! worker-calls conj [api graph-id request])
                                   (p/resolved
                                    {:basis-rev 1
                                     :slots
                                     {[:resource resource-key]
                                      {:watch {:keys #{[:journals]} :all? false}
                                       :value []}}
                                     :groups
                                     {[:resource resource-key]
                                      #{[:resource resource-key]}}})))
                       _ (p/delay 0)]
                 (is (= [[test-graph-id
                          {:blocks [] :children [] :resources [resource-key]}]]
                        (->> @worker-calls
                             (keep (fn [[api graph-id request]]
                                     (when (= :thread-api/get-render-snapshots api)
                                       [graph-id request])))
                             vec)))
                 (is (= {:status :ready
                         :value []}
                        (subs/resource-snapshot resource-key))))
               (p/finally
                 (fn []
                   (when-let [unsubscribe! @unsubscribe]
                     (unsubscribe!))
                   (reset! state/*db-worker previous-db-worker)))))))))

(deftest mounted-error-snapshot-retries-when-worker-recovers-test
  (async done
         (let [resource-key [:journals]
               calls (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id requested-key]
                              (if (= 1 (swap! calls inc))
                                (p/rejected (js/Error. "temporary worker failure"))
                                (p/resolved
                                 (exact-resource-patch
                                  1 requested-key #{[:journals]} [:ready]))))]
              (let [unsubscribe (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)
                        _ (is (= :error
                                 (:status (subs/resource-snapshot resource-key))))
                        _ (reset! state/*db-worker nil)
                        _ (reset! state/*db-worker (fn [& _args] nil))
                        _ (p/delay 0)]
                  (is (= 2 @calls))
                  (is (= {:status :ready :value [:ready]}
                         (subs/resource-snapshot resource-key)))
                  (unsubscribe))))))))

(deftest worker-snapshot-and-delta-roundtrip-update-mounted-block-test
  (async done
         (let [conn (db-test/create-conn)
               block-uuid (random-uuid)
               _ (d/transact! conn [{:block/uuid block-uuid
                                     :block/tx-id 1
                                     :block/title "before"}])
               worker (fn [api & args]
                        (case api
                          :thread-api/update-thread-atom
                          (p/resolved nil)

                          :thread-api/get-render-snapshots
                          (let [[graph-id request] args]
                            (is (= test-graph-id graph-id))
                            (p/resolved
                             (render-engine/render-snapshots @conn request
                                                             {:repo graph-id})))

                          (p/rejected
                           (ex-info "Unexpected worker API" {:api api :args args}))))
               unsubscribe (atom nil)]
            (finish-async!
             done
             (->
              (p/let [_ (reset! state/*db-worker worker)
                      _ (reset! unsubscribe
                                (subs/subscribe-block! block-uuid (fn [])))
                      _ (p/delay 0)
                      _ (is (= "before"
                               (:block/title
                                (:value (subs/block-snapshot block-uuid)))))
                      report (d/transact! conn
                                          [[:db/add [:block/uuid block-uuid]
                                            :block/title "after"]
                                           [:db/add [:block/uuid block-uuid]
                                            :block/tx-id 2]])
                      render-delta (-> (#'db-listener/build-render-delta
                                        test-graph-id report
                                        {:affected-keys #{}
                                         :deleted-block-uuids #{}})
                                       ldb/write-transit-str
                                       ldb/read-transit-str)
                      _ (subs/apply-delta! render-delta)]
                (is (= {:status :ready
                        :value (block block-uuid 2 "after")}
                       (update (subs/block-snapshot block-uuid)
                               :value select-keys
                               [:block/uuid :block/tx-id :block/title]))))
              (p/finally
                (fn []
                  (when-let [unsubscribe! @unsubscribe]
                    (unsubscribe!)))))))))

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
                                      (block-patch
                                       1 {block-uuid
                                          (block block-uuid 1 "late")}))
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
                                      (block-patch
                                       4 {block-uuid
                                          (block block-uuid 99 "stale basis")}))
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
                                      (block-patch
                                       10 {loaded-uuid
                                           (block loaded-uuid 10 "loaded")}))
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
              (let [unsubscribe-old (subs/subscribe-block! block-uuid #(swap! notifications inc))
                    unsubscribe-new (atom nil)]
                (p/let [_ (p/delay 0)
                        _ (subs/reset-graph! test-graph-id)
                        _ (unsubscribe-old)
                        _ (reset! unsubscribe-new
                                  (subs/subscribe-block! block-uuid
                                                         #(swap! notifications inc)))
                        _ (p/delay 0)
                        notification-count-after-reset @notifications
                        _ (p/resolve! old-request
                                      (block-patch
                                       100 {block-uuid
                                            (block block-uuid 100 "old generation")}))
                        _ (p/delay 0)]
                  (is (= {:status :loading}
                         (subs/block-snapshot block-uuid)))
                  (is (= notification-count-after-reset @notifications)
                      "An old generation completion must not notify cleared listeners.")
                  (p/resolve! new-request
                              (block-patch
                               101 {block-uuid
                                    (block block-uuid 101 "new generation")}))
                  (p/let [_ (p/delay 0)]
                    (is (= {:status :ready
                            :value (block block-uuid 101 "new generation")}
                           (subs/block-snapshot block-uuid))))
                  (@unsubscribe-new))))))))

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

(deftest mounted-resource-index-excludes-block-slots-test
  (let [block-uuids (vec (repeatedly 1000 random-uuid))
        resource-key [:page-identity "indexed resource"]
        pending (p/deferred)]
    (with-redefs [subs/<load-block (fn [& _] pending)
                  subs/<load-resource (fn [& _] pending)]
      (let [unsubscribes (conj (mapv #(subs/subscribe-block! % (fn []))
                                     block-uuids)
                               (subs/subscribe-resource! resource-key (fn [])))]
        (is (= #{[:resource resource-key]}
               (:resource-slot-keys @@#'subs/*store)))
        (run! (fn [unsubscribe] (unsubscribe)) unsubscribes)
        (is (empty? (:resource-slot-keys @@#'subs/*store)))))))

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
                              (p/resolved
                               (children-patch 1 requested-parent 10
                                               [[child-a "a"]
                                                [child-b "c"]])))]
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
                                    {:base-rev 1
                                     :rev 2
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
                   (delta 2
                          {:children
                           {parent-uuid
                            {:base-rev 1
                             :rev 2
                             :remove [[child-a "a"]]
                             :upsert [[child-c "b"]]}}}))
                  (is (zero? @children-notifications)
                      "An equal renderer revision is a duplicate no-op.")
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
                                  (p/resolved
                                   (children-patch 2 requested-parent 11
                                                   [[new-child-uuid "b"]])))

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
                                    {:base-rev 1
                                     :rev 2
                                     :remove [[old-child-uuid "a"]]
                                     :upsert [[new-child-uuid "b"]]}}}))
                        _ (is (= {:status :loading}
                                 (subs/children-snapshot parent-uuid)))
                        _ (is (= {:status :loading}
                                 (subs/children-snapshot unrelated-parent-uuid))
                              "The delta must not invalidate an unrelated pending parent.")
                        _ (p/resolve! parent-initial-request
                                      (children-patch 1 parent-uuid 10
                                                      [[old-child-uuid "a"]]))
                        _ (p/resolve! unrelated-request
                                      (children-patch 1 unrelated-parent-uuid 20
                                                      [[unrelated-child-uuid "a"]]))
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
                                (p/resolved
                                 (children-patch 1 requested-parent 10
                                                 [[child-a "a"]]))
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
                                    {:base-rev 0
                                     :rev 2
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
                                    {:base-rev 1
                                     :rev 3
                                     :remove [[child-a "a"]]
                                     :upsert [[child-b "b"]]}}}))
                        _ (p/delay 0)
                        _ (is (= 2 (count @loader-calls))
                              "Repeated invalidation shares the in-flight typed reload.")
                        _ (p/resolve! reload-request
                                      (children-patch 3 parent-uuid 11
                                                      [[child-b "b"]]))
                        _ (p/delay 0)]
                  (is (= {:status :ready :value [child-b]}
                         (subs/children-snapshot parent-uuid)))
                  (unsubscribe))))))))

(deftest parent-content-revision-without-child-patch-keeps-membership-test
  (async done
         (let [parent-uuid (random-uuid)
               child-before (random-uuid)
               loader-calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-children
                            (fn [graph-id requested-parent]
                              (swap! loader-calls conj [graph-id requested-parent])
                              (p/resolved
                               (children-patch 1 requested-parent 10
                                               [[child-before "a"]])))]
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
                        _ (is (= [[test-graph-id parent-uuid]] @loader-calls)
                              "A block-only revision cannot change membership.")]
                  (is (= {:status :ready :value [child-before]}
                         (subs/children-snapshot parent-uuid)))
                  (unsubscribe-second)
                  (unsubscribe-first))))))))

(deftest mounted-children-apply-patches-after-unrelated-revision-gap-test
  (async done
         (let [page-uuid (random-uuid)
               parent-uuid (random-uuid)
               moved-uuid (random-uuid)
               sibling-uuid (random-uuid)
               loader-calls (atom [])
               pending-reload (p/deferred)]
           (subs/apply-delta! (delta 1 {}))
           (finish-async!
            done
            (p/with-redefs [subs/<load-children
                            (fn [graph-id requested-parent]
                              (swap! loader-calls conj [graph-id requested-parent])
                              (cond
                                (and (= page-uuid requested-parent)
                                     (= 1 (count (filter #(= page-uuid (second %))
                                                         @loader-calls))))
                                (p/resolved
                                 (children-patch 1 page-uuid 10
                                                 [[parent-uuid "a"]
                                                  [sibling-uuid "c"]]))

                                (and (= parent-uuid requested-parent)
                                     (= 1 (count (filter #(= parent-uuid (second %))
                                                         @loader-calls))))
                                (p/resolved
                                 (children-patch 1 parent-uuid 11
                                                 [[moved-uuid "a"]]))

                                :else
                                pending-reload))]
              (let [unsubscribe-page
                    (subs/subscribe-children! page-uuid (fn []))
                    unsubscribe-parent
                    (subs/subscribe-children! parent-uuid (fn []))]
                (p/let [_ (p/delay 0)
                        _ (is (= {:status :ready
                                  :value [parent-uuid sibling-uuid]}
                                 (subs/children-snapshot page-uuid)))
                        _ (is (= {:status :ready :value [moved-uuid]}
                                 (subs/children-snapshot parent-uuid)))
                        _ (subs/apply-delta! (delta 2 {}))
                        _ (subs/apply-delta!
                           (delta 3
                                  {:blocks
                                   {moved-uuid
                                    (block moved-uuid 3 "moved")}
                                   :children
                                   {parent-uuid
                                    {:base-rev 2
                                     :rev 3
                                     :remove [[moved-uuid "a"]]
                                     :upsert []}
                                    page-uuid
                                    {:base-rev 2
                                     :rev 3
                                     :remove []
                                     :upsert [[moved-uuid "b"]]}}}))]
                  (is (= {:status :ready :value []}
                         (subs/children-snapshot parent-uuid)))
                  (is (= {:status :ready
                          :value [parent-uuid moved-uuid sibling-uuid]}
                         (subs/children-snapshot page-uuid)))
                  (is (= 2 (count @loader-calls))
                      "Both mounted memberships apply the move without reloading.")
                  (unsubscribe-parent)
                  (unsubscribe-page))))))))

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
                                      (block-patch
                                       1 {block-uuid
                                          (block block-uuid 1 "loaded")}))
                        _ (p/resolve! children-request
                                      (children-patch 1 parent-uuid 1
                                                      [[child-uuid "a"]]))
                        _ (p/resolve! resource-request
                                      (exact-resource-patch
                                       1 resource-key #{[:journal journal-uuid]}
                                       {:journal-uuid journal-uuid}))
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

(deftest children-load-seeds-the-open-subtree-atomically-test
  (async done
         (let [parent-uuid (random-uuid)
               child-uuid (random-uuid)
               grandchild-uuid (random-uuid)
               parent (block parent-uuid 10 "parent")
               child (block child-uuid 11 "child")
               grandchild (block grandchild-uuid 12 "grandchild")]
           (finish-async!
            done
            (p/with-redefs [subs/<load-children
                            (fn [_graph-id _parent-uuid]
                              (p/resolved
                               (subtree-patch
                                12
                                {parent-uuid parent
                                 child-uuid child
                                 grandchild-uuid grandchild}
                                {parent-uuid {:parent-tx-id 10
                                              :items [[child-uuid "a"]]}
                                 child-uuid {:parent-tx-id 11
                                             :items [[grandchild-uuid "a"]]}
                                 grandchild-uuid {:parent-tx-id 12
                                                  :items []}})))]
              (let [unsubscribe (subs/subscribe-children! parent-uuid (fn []))]
                (p/let [_ (p/delay 0)]
                  (is (= {:status :ready :value child}
                         (subs/block-snapshot child-uuid)))
                  (is (= {:status :ready :value grandchild}
                         (subs/block-snapshot grandchild-uuid)))
                  (is (= {:status :ready :value [grandchild-uuid]}
                         (subs/children-snapshot child-uuid))
                      "Open descendants must be ready with their parent membership.")
                  (unsubscribe))))))))

(deftest reset-graph-does-not-replay-old-graph-slot-keys-test
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
                               (block-patch
                                1 {requested-uuid
                                   (block requested-uuid 1 "loaded")})))
                            subs/<load-children
                            (fn [graph-id requested-parent]
                              (swap! calls conj [:children graph-id requested-parent])
                              (p/resolved
                               (children-patch 1 requested-parent 1
                                               [[child-uuid "a"]])))
                            subs/<load-resource
                            (fn [graph-id requested-key]
                              (swap! calls conj [:resource graph-id requested-key])
                              (p/resolved
                               (all-resource-patch 1 requested-key :loaded)))]
              (let [unsubscribes
                    [(subs/subscribe-block! block-uuid (fn []))
                     (subs/subscribe-children! parent-uuid (fn []))
                     (subs/subscribe-resource! resource-key (fn []))]]
                (p/let [_ (p/delay 0)
                        _ (reset! calls [])
                        _ (subs/reset-graph! next-graph-id)
                        _ (p/delay 0)]
                  (is (empty? @calls)
                      "Old graph-local subscription keys must not be replayed against a new graph.")
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
                                  (p/resolved
                                   (exact-resource-patch
                                    1 resource-key #{watch-key} value)))))]
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
                                      (exact-resource-patch
                                       3 key-a #{watch-a} :a-reloaded))
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

(deftest equal-resource-reload-retains-snapshot-identity-test
  (async done
         (let [resource-key [:page-identity "same page"]
               watch-key [:page-lookup "same page"]
               calls (atom 0)
               notifications (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id requested-key]
                              (p/resolved
                               (exact-resource-patch
                                (swap! calls inc) requested-key #{watch-key}
                                :same-value)))]
              (let [unsubscribe
                    (subs/subscribe-resource! resource-key
                                              #(swap! notifications inc))]
                (p/let [_ (p/delay 0)
                        snapshot (subs/resource-snapshot resource-key)
                        _ (subs/apply-delta!
                           (delta 2 {:affected-keys #{watch-key}}))
                        _ (p/delay 0)]
                  (is (= 2 @calls))
                  (is (= 1 @notifications))
                  (is (identical? snapshot
                                  (subs/resource-snapshot resource-key)))
                  (unsubscribe))))))))

(deftest custom-query-reload-is-not-postponed-by-repeated-invalidations-test
  (async done
         (let [resource-key [:query {:kind :datalog :query [:find '?b]}]
               watch-key [:tasks]
               calls (atom [])
               timers (atom [])
               cleared (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id requested-key]
                              (swap! calls conj requested-key)
                              (p/resolved
                               (exact-resource-patch
                                (if (= 1 (count @calls)) 1 3)
                                requested-key #{watch-key} :result)))
                            subs/set-query-reload-timeout!
                            (fn [callback delay-ms]
                              (let [timer-id (count @timers)]
                                (swap! timers conj {:callback callback
                                                    :delay-ms delay-ms})
                                timer-id))
                            subs/clear-query-reload-timeout!
                            (fn [timer-id]
                              (swap! cleared conj timer-id))]
              (let [unsubscribe (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)
                        _ (reset! calls [])
                        _ (subs/apply-delta!
                           (delta 2 {:affected-keys #{watch-key}}))
                        _ (p/delay 0)
                        _ (is (= [] @calls))
                        _ (is (= 2000 (:delay-ms (first @timers))))
                        _ (subs/apply-delta!
                           (delta 3 {:affected-keys #{watch-key}}))
                        _ (p/delay 0)
                        _ (is (empty? @cleared)
                              "Repeated invalidation must not postpone the pending reload.")
                        _ (is (= 1 (count @timers)))
                        _ (is (= [] @calls))
                        _ ((:callback (first @timers)))
                        _ (p/delay 0)]
                  (is (= [resource-key] @calls))
                  (unsubscribe))))))))

(deftest deleted-resource-owner-becomes-missing-without-reload-test
  (async done
         (let [block-uuid (random-uuid)
               resource-key [:block-positioned-properties block-uuid :block-left]
               watch-key [:entity block-uuid]
               calls (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id requested-key]
                              (swap! calls inc)
                              (p/resolved
                               (exact-resource-patch
                                1 requested-key #{watch-key} [])))]
              (let [unsubscribe (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)
                        _ (subs/apply-delta!
                           (delta 2 {:deleted {block-uuid {:rev 2}}
                                     :affected-keys #{watch-key}}))
                        _ (p/delay 0)]
                  (is (= 1 @calls)
                      "Deleting a resource owner must not query the missing entity.")
                  (is (= {:status :missing}
                         (subs/resource-snapshot resource-key)))
                  (unsubscribe))))))))

(deftest canonical-block-load-seeds-direct-reference-blocks-test
  (async done
         (let [source-uuid (random-uuid)
               reference-uuid (random-uuid)
               calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id requested-uuid]
                              (swap! calls conj requested-uuid)
                              (p/resolved
                               (block-patch
                                1
                                {source-uuid (block source-uuid 1 "Source")
                                 reference-uuid
                                 (block reference-uuid 1 "Reference")})))]
              (let [unsubscribe-source
                    (subs/subscribe-block! source-uuid (fn []))]
                (p/let [_ (p/delay 0)
                        unsubscribe-reference
                        (subs/subscribe-block! reference-uuid (fn []))
                        _ (p/delay 0)]
                  (is (= [source-uuid] @calls)
                      "A direct reference seeded with its source is synchronous.")
                  (is (= {:status :ready
                          :value (block reference-uuid 1 "Reference")}
                         (subs/block-snapshot reference-uuid)))
                  (unsubscribe-reference)
                  (unsubscribe-source))))))))

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
                                1 (p/resolved
                                   (exact-resource-patch
                                    1 resource-key #{watch-key} :initial))
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
                                      (exact-resource-patch
                                       2 resource-key #{watch-key} :stale-reload))
                        _ (p/delay 0)
                        _ (is (= 3 @calls)
                              "Invalidation during the request schedules one follow-up.")
                        _ (p/resolve! follow-up
                                      (exact-resource-patch
                                       4 resource-key #{watch-key} :fresh))
                        _ (p/delay 0)]
                  (is (= 3 @calls))
                  (is (= {:status :ready :value :fresh}
                         (subs/resource-snapshot resource-key)))
                  (unsubscribe))))))))

(deftest block-subscriptions-coalesce-view-prefetch-in-one-batch-test
  (async done
         (let [block-uuids (vec (repeatedly 100 random-uuid))
               worker-calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [state/<invoke-db-worker
                            (fn [api graph-id payload]
                              (swap! worker-calls conj [api graph-id payload])
                              (p/resolved
                               (grouped-patch
                                (block-patch
                                 1 (into {}
                                         (map (fn [block-uuid]
                                                [block-uuid
                                                 (block block-uuid 1 "loaded")]))
                                         (:blocks payload)))
                                (mapv #(vector :block %) (:blocks payload)))))]
              (let [unsubscribes
                    (mapv #(subs/subscribe-block! % (fn [])) block-uuids)]
                (p/let [_ (p/delay 0)
                        calls @worker-calls
                        payloads (mapv #(get-in % [2 :blocks]) calls)]
                  (is (= 1 (count calls))
                      "One view prefetch tick produces one canonical block response.")
                  (is (every? #(= :thread-api/get-render-snapshots (first %)) calls))
                  (is (every? #(= test-graph-id (second %)) calls))
                  (is (every? vector? payloads)
                      "The typed worker API receives plain UUID vectors.")
                  (is (every? #(<= (count %) 1000) payloads))
                  (is (= (set block-uuids) (set (mapcat identity payloads))))
                  (is (every? #(= :ready (:status (subs/block-snapshot %)))
                              block-uuids))
                  (run! (fn [unsubscribe] (unsubscribe)) unsubscribes))))))))

(deftest batched-block-load-cannot-overwrite-a-newer-sibling-slot-test
  (async done
         (let [block-a (random-uuid)
               block-b (random-uuid)
               request (p/deferred)
               worker-calls (atom [])
               stale-a (block block-a 1 "A from load")
               stale-b (block block-b 1 "B from load")
               current-b (block block-b 2 "B from delta")]
           (finish-async!
            done
            (p/with-redefs [state/<invoke-db-worker
                            (fn [api graph-id payload]
                              (swap! worker-calls conj [api graph-id payload])
                              request)]
              (let [unsubscribe-a (subs/subscribe-block! block-a (fn []))
                    unsubscribe-b (subs/subscribe-block! block-b (fn []))]
                (p/let [_ (p/delay 0)
                        _ (is (= 1 (count @worker-calls)))
                        _ (subs/apply-delta!
                           (delta 2 {:blocks {block-b current-b}}))
                        current-b-snapshot (subs/block-snapshot block-b)
                        _ (p/resolve! request
                                      (grouped-patch
                                       (block-patch 1 {block-a stale-a
                                                       block-b stale-b})
                                       [[:block block-a] [:block block-b]]))
                        _ (p/delay 0)]
                  (is (= {:status :ready :value stale-a}
                         (subs/block-snapshot block-a)))
                  (is (identical? current-b-snapshot
                                  (subs/block-snapshot block-b))
                      "Applying A's batch result must not replay stale B data.")
                  (is (= current-b (:value (subs/block-snapshot block-b))))
                  (unsubscribe-b)
                  (unsubscribe-a))))))))

(deftest block-subscriptions-coalesce-loads-across-microtasks-test
  (async done
         (let [block-a (random-uuid)
               block-b (random-uuid)
               scheduled (atom [])
               worker-calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/schedule-load-batch!
                            (fn [callback]
                              (swap! scheduled conj callback))
                            state/<invoke-db-worker
                            (fn [api graph-id payload]
                              (swap! worker-calls conj [api graph-id payload])
                              (p/resolved
                               (grouped-patch
                                (block-patch
                                 1 (into {}
                                         (map (fn [block-uuid]
                                                [block-uuid
                                                 (block block-uuid 1 "loaded")]))
                                         (:blocks payload)))
                                (mapv #(vector :block %) (:blocks payload)))))]
              (p/let [unsubscribe-a (subs/subscribe-block! block-a (fn []))
                      _ (p/resolved nil)
                      unsubscribe-b (subs/subscribe-block! block-b (fn []))
                      _ (is (empty? @worker-calls)
                            "Promise microtasks must not split a renderer batch.")
                      _ ((first @scheduled))
                      _ (p/delay 0)]
                (is (= [[:thread-api/get-render-snapshots
                         test-graph-id
                         {:blocks [block-a block-b]
                          :children []
                          :resources []}]]
                       @worker-calls))
                (unsubscribe-a)
                (unsubscribe-b)))))))

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
                               (grouped-patch
                                (block-patch
                                 1 {block-uuid (block block-uuid 1 "loaded")})
                                [[:block block-uuid]])))]
              (let [unsubscribes
                    (mapv (fn [_]
                            (subs/subscribe-block! block-uuid (fn [])))
                          (range 100))]
                (p/let [_ (p/delay 0)]
                  (is (= [[:thread-api/get-render-snapshots
                           test-graph-id
                           {:blocks [block-uuid]
                            :children []
                            :resources []}]]
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
                              (let [parents (:children payload)]
                                (p/resolved
                                 (grouped-patch
                                  (subtree-patch
                                   1 {}
                                   (into {}
                                         (map (fn [parent-uuid]
                                                [parent-uuid
                                                 {:parent-tx-id 1
                                                  :items [[(get child-by-parent parent-uuid)
                                                           "a"]]}]))
                                         parents))
                                  (mapv #(vector :children %) parents)))))]
              (let [unsubscribes
                    (mapv #(subs/subscribe-children! % (fn [])) parent-uuids)]
                (p/let [_ (p/delay 0)
                        calls @worker-calls
                        payloads (mapv #(get-in % [2 :children]) calls)]
                  (is (<= (count calls) 4)
                      "Direct-child loads use the same bounded one-tick batching policy.")
                  (is (every? #(= :thread-api/get-render-snapshots (first %)) calls))
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
                            (fn [api graph-id request]
                              (swap! worker-calls conj
                                     [api graph-id request])
                              (let [resource-keys (:resources request)
                                    slots (into {}
                                                (map (fn [resource-key]
                                                       [[:resource resource-key]
                                                        {:watch {:keys #{} :all? true}
                                                         :value resource-key}]))
                                                resource-keys)]
                                (p/resolved
                                 (grouped-patch {:basis-rev 1 :slots slots}
                                                (keys slots)))))]
              (let [unsubscribes
                    (mapv #(subs/subscribe-resource! % (fn [])) resource-keys)]
                (p/let [_ (p/delay 0)
                        calls @worker-calls
                        payloads (mapv #(get-in % [2 :resources]) calls)]
                  (is (= 4 (count calls)))
                  (is (every? #(= :thread-api/get-render-snapshots (first %))
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
                               (grouped-patch
                                (all-resource-patch 1 resource-key :shared)
                                [[:resource resource-key]])))]
              (let [unsubscribes
                    (mapv (fn [_]
                            (subs/subscribe-resource! resource-key (fn [])))
                          (range 100))]
                (p/let [_ (p/delay 0)]
                  (is (= [[:thread-api/get-render-snapshots
                           test-graph-id
                           {:blocks []
                            :children []
                            :resources [resource-key]}]]
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
                                :slots
                                {[:resource present-key]
                                 {:watch {:keys #{} :all? true}
                                  :value :present}}
                                :groups
                                {[:resource present-key]
                                 #{[:resource present-key]}}}))]
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
                    (is (re-find #"Missing renderer snapshot group"
                                 (ex-message error)))
                    (is (= [:resource missing-key]
                           (:slot-key (ex-data error)))))
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
                               (block-patch
                                1 {requested-uuid
                                   (block requested-uuid 1 "loaded")})))
                            subs/<load-children
                            (fn [graph-id requested-parent]
                              (swap! calls conj [:children graph-id requested-parent])
                              (p/resolved
                               (children-patch 1 requested-parent 1
                                               [[child-uuid "a"]])))
                            subs/<load-resource
                            (fn [graph-id requested-key]
                              (swap! calls conj [:resource graph-id requested-key])
                              (p/resolved
                               (exact-resource-patch
                                1 requested-key #{[:page-lookup "paused page"]}
                                block-uuid)))]
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
                        _ (run! (fn [unsubscribe] (unsubscribe)) unsubscribes)
                        resumed-unsubscribes
                        [(subs/subscribe-block! block-uuid (fn []))
                         (subs/subscribe-children! parent-uuid (fn []))
                         (subs/subscribe-resource! resource-key (fn []))]
                        _ (p/delay 0)]
                  (is (= #{[:block next-graph-id block-uuid]
                           [:children next-graph-id parent-uuid]
                           [:resource next-graph-id resource-key]}
                         (set @calls)))
                  (is (= 3 (count @calls))
                      "Resume starts one request for each mounted exact key.")
                  (run! (fn [unsubscribe] (unsubscribe)) resumed-unsubscribes))))))))

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
                               (if (= changed-uuid requested-uuid)
                                 (block-patch
                                  2 {changed-uuid
                                     (block changed-uuid 2 "canonical load")})
                                 (missing-block-patch 2 requested-uuid))))]
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

(deftest inserted-child-delta-seeds-canonical-block-before-row-mount-test
  (async done
         (let [parent-uuid (random-uuid)
               inserted-uuid (random-uuid)
               inserted-block (block inserted-uuid 2 "inserted")
               calls (atom [])]
           (subs/apply-delta!
            (delta 2
                   {:blocks {inserted-uuid inserted-block}
                    :children {parent-uuid
                               {:base-rev 1
                                :rev 2
                                :remove []
                                :upsert [[inserted-uuid "a"]]}}}))
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [graph-id requested-uuid]
                              (swap! calls conj [graph-id requested-uuid])
                              (p/resolved
                               (missing-block-patch 2 requested-uuid)))]
              (let [unsubscribe
                    (subs/subscribe-block! inserted-uuid (fn []))]
                (p/let [_ (p/delay 0)]
                  (is (empty? @calls)
                      "The row consumes the canonical block already carried by its insert delta.")
                  (is (= {:status :ready :value inserted-block}
                         (subs/block-snapshot inserted-uuid)))
                  (unsubscribe))))))))

(deftest inserted-parent-delta-seeds-children-before-subtree-mount-test
  (async done
         (let [root-uuid (random-uuid)
               parent-uuid (random-uuid)
               child-uuid (random-uuid)
               parent (block parent-uuid 2 "parent")
               child (block child-uuid 2 "child")
               calls (atom [])]
           (subs/apply-delta!
            (delta 2
                   {:blocks {parent-uuid parent
                             child-uuid child}
                    :children {root-uuid
                               {:base-rev 1
                                :rev 2
                                :remove []
                                :upsert [[parent-uuid "a"]]}
                               parent-uuid
                               {:base-rev 1
                                :rev 2
                                :remove []
                                :upsert [[child-uuid "a"]]}}}))
           (finish-async!
            done
            (p/with-redefs [subs/<load-children
                            (fn [graph-id requested-uuid]
                              (swap! calls conj [graph-id requested-uuid])
                              (p/resolved
                               (children-patch 2 requested-uuid 2 [])))]
              (let [unsubscribe
                    (subs/subscribe-children! parent-uuid (fn []))]
                (p/let [_ (p/delay 0)]
                  (is (empty? @calls)
                      "The subtree consumes membership carried by its insert delta.")
                  (is (= {:status :ready :value [child-uuid]}
                         (subs/children-snapshot parent-uuid)))
                  (unsubscribe))))))))

(deftest recently-unmounted-block-remains-warm-for-navigation-test
  (async done
         (let [block-uuid (random-uuid)
               calls (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-block
                            (fn [_graph-id requested-uuid]
                              (let [call (swap! calls inc)]
                                (p/resolved
                                 (block-patch
                                  call {requested-uuid
                                        (block requested-uuid call
                                               (str "load " call))}))))]
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
                          _ (is (identical? first-snapshot
                                           (subs/block-snapshot block-uuid))
                                "A recently unmounted block remains in the warm cache.")
                          unsubscribe-after-unmount
                          (subs/subscribe-block! block-uuid (fn []))
                          _ (p/delay 0)]
                    (is (= 1 @calls))
                    (is (= {:status :ready
                            :value (block block-uuid 1 "load 1")}
                           (subs/block-snapshot block-uuid)))
                    (unsubscribe-after-unmount)))))))))

(deftest unmounted-children-remain-warm-for-page-navigation-test
  (async done
         (let [parent-uuid (random-uuid)
               first-child-uuid (random-uuid)
               second-child-uuid (random-uuid)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-children
                            (fn [_graph-id requested-parent]
                              (p/resolved
                               (children-patch 1 requested-parent 1
                                               [[first-child-uuid "a"]])))]
              (let [unsubscribe (subs/subscribe-children! parent-uuid (fn []))]
                (p/let [_ (p/delay 0)
                        _ (unsubscribe)
                        _ (p/delay 0)]
                  (is (= {:status :ready :value [first-child-uuid]}
                         (subs/children-snapshot parent-uuid))
                      "A recently visited page retains its direct children.")
                  (subs/apply-delta!
                   (delta 2
                          {:children
                           {parent-uuid {:base-rev 1
                                         :rev 2
                                         :remove []
                                         :upsert [[second-child-uuid "b"]]}}}))
                  (is (= {:status :ready
                          :value [first-child-uuid second-child-uuid]}
                         (subs/children-snapshot parent-uuid))
                      "An unmounted warm page still receives direct-child patches."))))))))

(deftest stale-unmounted-children-reload-on-next-navigation-test
  (async done
         (let [parent-uuid (random-uuid)
               first-child-uuid (random-uuid)
               current-child-uuid (random-uuid)
               calls (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-children
                            (fn [_graph-id requested-parent]
                              (case (swap! calls inc)
                                1 (p/resolved
                                   (children-patch 1 requested-parent 1
                                                   [[first-child-uuid "a"]]))
                                2 (p/resolved
                                   (children-patch 3 requested-parent 3
                                                   [[current-child-uuid "b"]]))
                                (p/rejected
                                 (js/Error. "unexpected extra children request"))))]
              (let [unsubscribe (subs/subscribe-children! parent-uuid (fn []))]
                (p/let [_ (p/delay 0)
                        _ (unsubscribe)
                        _ (p/delay 0)
                        _ (subs/apply-delta! (delta 2 {}))
                        _ (subs/apply-delta!
                           (delta 3
                                  {:children
                                   {parent-uuid {:base-rev 2
                                                 :rev 3
                                                 :remove [first-child-uuid]
                                                 :upsert [[current-child-uuid "b"]]}}}))
                        unsubscribe-current
                        (subs/subscribe-children! parent-uuid (fn []))
                        _ (p/delay 0)]
                  (is (= 2 @calls)
                      "A warm children slot that missed a revision reloads when remounted.")
                  (is (= {:status :ready :value [current-child-uuid]}
                         (subs/children-snapshot parent-uuid)))
                  (unsubscribe-current))))))))

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
                                      (block-patch
                                       10 {block-uuid
                                           (block block-uuid 10 "old token")}))
                        _ (p/delay 0)
                        _ (is (= {:status :loading}
                                 (subs/block-snapshot block-uuid))
                              "A collected request cannot write into the remounted slot.")
                        _ (p/resolve! second-request
                                      (block-patch
                                       11 {block-uuid
                                           (block block-uuid 11 "current token")}))
                        _ (p/delay 0)]
                  (is (= {:status :ready
                          :value (block block-uuid 11 "current token")}
                         (subs/block-snapshot block-uuid)))
                  (unsubscribe-second))))))))

(deftest normalized-resource-patch-seeds-slots-atomically-test
  (async done
         (let [journal-uuid (random-uuid)
               child-uuid (random-uuid)
               resource-key [:test-resource journal-uuid]
               journal (block journal-uuid 10 "Journal")
               child (block child-uuid 10 "Child")
               calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [graph-id requested-key]
                              (swap! calls conj [:resource graph-id requested-key])
                              (p/resolved
                               {:basis-rev 1
                                :slots
                                {[:resource resource-key]
                                 {:watch {:keys #{} :all? false}
                                  :value [journal-uuid]}
                                 [:block journal-uuid] {:value journal}
                                 [:block child-uuid] {:value child}
                                 [:children journal-uuid]
                                 {:tx-id 10 :items [[child-uuid "a"]]}
                                 [:children child-uuid]
                                 {:tx-id 10 :items []}}}))
                            subs/<load-block
                            (fn [& _]
                              (p/rejected (js/Error. "seeded block reloaded")))
                            subs/<load-children
                            (fn [& _]
                              (p/rejected (js/Error. "seeded membership reloaded")))]
              (let [unsubscribe-resource
                    (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)
                        unsubscribe-journal
                        (subs/subscribe-block! journal-uuid (fn []))
                        unsubscribe-child
                        (subs/subscribe-block! child-uuid (fn []))
                        unsubscribe-children
                        (subs/subscribe-children! journal-uuid (fn []))]
                  (is (= [[:resource test-graph-id resource-key]] @calls))
                  (is (= {:status :ready
                          :value [journal-uuid]}
                         (subs/resource-snapshot resource-key)))
                  (is (= {:status :ready :value journal}
                         (subs/block-snapshot journal-uuid)))
                  (is (= {:status :ready :value child}
                         (subs/block-snapshot child-uuid)))
                  (is (= {:status :ready :value [child-uuid]}
                         (subs/children-snapshot journal-uuid)))
                  (run! (fn [unsubscribe] (unsubscribe))
                        [unsubscribe-children unsubscribe-child
                         unsubscribe-journal unsubscribe-resource]))))))))

(deftest stale-resource-hydration-cannot-seed-slots-after-a-newer-delta-test
  (async done
         (let [resource-key [:test-resource (random-uuid)]
               block-uuid (random-uuid)
               first-request (p/deferred)
               second-request (p/deferred)
               stale-block (block block-uuid 1 "stale")
               current-block (block block-uuid 2 "current")
               calls (atom 0)
               response (fn [basis-rev block-value]
                          {:basis-rev basis-rev
                           :slots
                           {[:resource resource-key]
                            {:watch {:keys #{} :all? false}
                             :value []}
                            [:block block-uuid] {:value block-value}}})]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id _requested-key]
                              (case (swap! calls inc)
                                1 first-request
                                2 second-request
                                (p/rejected
                                 (js/Error. "unexpected extra resource request"))))]
              (let [unsubscribe (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)
                        _ (subs/apply-delta!
                           (delta 2 {:blocks {block-uuid current-block}}))
                        _ (p/resolve! first-request (response 1 stale-block))
                        _ (p/delay 0)
                        _ (is (= 2 @calls)
                              "A resource response that missed a hydrated slot change reloads once.")
                        _ (is (= {:status :loading}
                                 (subs/resource-snapshot resource-key))
                              "The stale resource value is never published.")
                        _ (is (= {:status :loading}
                                 (subs/block-snapshot block-uuid))
                              "The stale hydrated block is never published.")
                        _ (p/resolve! second-request (response 2 current-block))
                        _ (p/delay 0)]
                  (is (= {:status :ready :value current-block}
                         (subs/block-snapshot block-uuid)))
                  (unsubscribe))))))))

(deftest stale-resource-hydration-cannot-seed-children-after-a-newer-patch-test
  (async done
         (let [parent-uuid (random-uuid)
               old-child-uuid (random-uuid)
               current-child-uuid (random-uuid)
               resource-key [:test-resource parent-uuid]
               first-request (p/deferred)
               second-request (p/deferred)
               calls (atom 0)
               response (fn [basis-rev tx-id items]
                          {:basis-rev basis-rev
                           :slots
                           {[:resource resource-key]
                            {:watch {:keys #{} :all? false}
                             :value [parent-uuid]}
                            [:children parent-uuid]
                            {:tx-id tx-id :items items}}})]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id _requested-key]
                              (case (swap! calls inc)
                                1 first-request
                                2 second-request
                                (p/rejected
                                 (js/Error. "unexpected extra resource request"))))]
              (let [unsubscribe (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)
                        _ (subs/apply-delta!
                           (delta 2
                                  {:children
                                   {parent-uuid
                                    {:base-rev 1
                                     :rev 2
                                     :remove [[old-child-uuid "a"]]
                                     :upsert [[current-child-uuid "b"]]}}}))
                        _ (p/resolve! first-request
                                      (response 1 1 [[old-child-uuid "a"]]))
                        _ (p/delay 0)
                        _ (is (= 2 @calls))
                        _ (is (= {:status :loading}
                                 (subs/children-snapshot parent-uuid))
                              "The stale hydrated membership is never published.")
                        _ (p/resolve! second-request
                                      (response 2 2 [[current-child-uuid "b"]]))
                        _ (p/delay 0)]
                  (is (= {:status :ready :value [current-child-uuid]}
                         (subs/children-snapshot parent-uuid)))
                  (unsubscribe))))))))

(deftest mixed-slot-kinds-have-independent-worker-failure-domains-test
  (async done
         (let [block-uuid (random-uuid)
               resource-key [:page-identity "failing resource"]
               calls (atom [])]
           (finish-async!
            done
            (p/with-redefs [state/<invoke-db-worker
                            (fn [_api _graph-id payload]
                              (swap! calls conj payload)
                              (if (seq (:resources payload))
                                (p/rejected (js/Error. "resource failed"))
                                (p/resolved
                                 (grouped-patch
                                  (block-patch
                                   1 {block-uuid
                                      (block block-uuid 1 "loaded")})
                                  [[:block block-uuid]]))))]
              (let [unsubscribe-block
                    (subs/subscribe-block! block-uuid (fn []))
                    unsubscribe-resource
                    (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)]
                  (is (= 2 (count @calls)))
                  (is (= {:status :ready
                          :value (block block-uuid 1 "loaded")}
                         (subs/block-snapshot block-uuid)))
                  (is (= :error (:status (subs/resource-snapshot resource-key))))
                  (unsubscribe-resource)
                  (unsubscribe-block))))))))


(deftest unrelated-delta-does-not-reload-an-in-flight-resource-test
  (async done
         (let [resource-key [:page-identity "late page"]
               watch-key [:page-lookup "late page"]
               first-request (p/deferred)
               calls (atom 0)]
           (finish-async!
            done
            (p/with-redefs [subs/<load-resource
                            (fn [_graph-id _requested-key]
                              (swap! calls inc)
                              first-request)]
              (let [unsubscribe
                    (subs/subscribe-resource! resource-key (fn []))]
                (p/let [_ (p/delay 0)
                        _ (subs/apply-delta!
                           (delta 5 {:affected-keys #{[:unrelated]}}))
                        _ (p/resolve! first-request
                                      (exact-resource-patch
                                       4 resource-key #{watch-key} :current))
                        _ (p/delay 0)
                        _ (is (= 1 @calls)
                              "Only intersecting dependencies invalidate an in-flight request.")
                        _ (is (= {:status :ready :value :current}
                                 (subs/resource-snapshot resource-key))
                              "An unrelated newer graph revision does not stale the result.")]
                  (is (= 1 @calls))
                  (unsubscribe))))))))
