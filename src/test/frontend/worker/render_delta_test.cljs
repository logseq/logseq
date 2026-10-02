(ns frontend.worker.render-delta-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.render-delta :as render-delta]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.recycle :as recycle]))

(def ^:private schema
  {:block/uuid {:db/unique :db.unique/identity}
   :block/parent {:db/valueType :db.type/ref}
   :block/closed-value-property {:db/valueType :db.type/ref
                                 :db/cardinality :db.cardinality/many}
   :logseq.property/created-from-property {:db/valueType :db.type/ref}
   :block/order {}
   :block/tx-id {}
   :logseq.property/deleted-at {}})

(defn- db-with-blocks
  [blocks]
  (d/db-with (d/empty-db schema) blocks))

(defn- tx-report
  [db-before tx-data]
  (d/with db-before tx-data))

(defn- block
  [block-uuid tx-id title]
  {:block/uuid block-uuid
   :block/tx-id tx-id
   :block/title title})

(defn- build-delta
  [report overrides]
  (render-delta/build
   (merge {:graph-id "graph"
           :rev 101
           :op-id "operation"
           :blocks {}
           :deleted-block-uuids #{}
           :affected-keys #{}
           :tx-report report}
          overrides)))

(defn- membership-operations
  [children]
  (update-vals children #(dissoc % :base-rev :rev)))

(deftest complete-block-replacements-and-delta-invariants-test
  (let [block-uuid (random-uuid)
        replacement (block block-uuid 42 "new")
        db (db-with-blocks [{:db/id 1
                             :block/uuid block-uuid
                             :block/tx-id 42
                             :block/title "new"}])
        delta (build-delta {:db-before db :db-after db :tx-data []}
                           {:blocks {block-uuid replacement}
                            :affected-keys #{[:graph] [:query :tasks]}})]
    (is (= {:graph-id "graph"
            :rev 101
            :op-id "operation"
            :blocks {block-uuid replacement}
            :deleted {}
            :children {}
            :affected-keys #{[:graph] [:query :tasks]}}
           delta))
    (is (= replacement (get-in delta [:blocks block-uuid]))
        "A delta transports the complete replacement provided by its caller.")))

(deftest affected-resource-keys-pass-through-without-delta-owned-invalidation-test
  (let [db (db-with-blocks [])
        affected-keys #{[:entity (random-uuid)]
                        [:refs (random-uuid)]}
        delta (build-delta {:db-before db :db-after db :tx-data []}
                           {:affected-keys affected-keys})]
    (is (= affected-keys (:affected-keys delta))
        "The affected-key derivation owns graph invalidation and the delta only transports it.")))

(deftest deleted-blocks-become-revisioned-tombstones-test
  (let [parent-uuid (random-uuid)
        child-uuid (random-uuid)
        db-before (db-with-blocks [{:db/id 1
                                    :block/uuid parent-uuid
                                    :block/tx-id 10}
                                   {:db/id 2
                                    :block/uuid child-uuid
                                    :block/parent 1
                                    :block/order "a0"
                                    :block/tx-id 10}])
        report (tx-report db-before [[:db/retractEntity [:block/uuid child-uuid]]
                                     [:db/add [:block/uuid parent-uuid]
                                      :block/tx-id 11]])
        parent (block parent-uuid 11 "parent")
        delta (build-delta report
                           {:rev 202
                            :blocks {parent-uuid parent}
                            :deleted-block-uuids #{child-uuid}})]
    (is (= {child-uuid {:rev 202 :db/id 2}} (:deleted delta))
        "Tombstones carry the pre-deletion db id so the renderer can drop sidebar entries without a database.")
    (is (= {parent-uuid {:remove [[child-uuid "a0"]]
                         :upsert []}}
           (membership-operations (:children delta))))
    (is (= 202 (get-in delta [:children parent-uuid :rev])))
    (is (nat-int? (get-in delta [:children parent-uuid :base-rev])))))

(deftest content-only-change-has-no-children-patch-test
  (let [parent-uuid (random-uuid)
        child-uuid (random-uuid)
        db-before (db-with-blocks [{:db/id 1
                                    :block/uuid parent-uuid
                                    :block/tx-id 10}
                                   {:db/id 2
                                    :block/uuid child-uuid
                                    :block/parent 1
                                    :block/order "a0"
                                    :block/tx-id 10
                                    :block/title "before"}])
        report (tx-report db-before [[:db/add [:block/uuid child-uuid]
                                      :block/title "after"]
                                     [:db/add [:block/uuid child-uuid]
                                      :block/tx-id 11]])
        delta (build-delta report
                           {:blocks {child-uuid (block child-uuid 11 "after")}})]
    (is (empty? (:children delta)))))

(deftest unordered-parent-reference-has-no-children-patch-test
  (let [parent-uuid (random-uuid)
        page-uuid (random-uuid)
        db-before (db-with-blocks [{:db/id 1
                                    :block/uuid parent-uuid
                                    :block/tx-id 10}])
        report (tx-report db-before [{:block/uuid page-uuid
                                      :block/name "nested page"
                                      :block/parent [:block/uuid parent-uuid]
                                      :block/tx-id 11}])
        delta (build-delta
               report
               {:blocks {page-uuid
                         (block page-uuid 11 "Nested page")}})]
    (is (empty? (:children delta))
        "A parent reference without outliner order is not child membership.")))

(deftest direct-child-visibility-builds-remove-and-upsert-patches-test
  (doseq [[label attr value]
          [["recycled child" :logseq.property/deleted-at 1000]
           ["closed property value" :block/closed-value-property 3]
           ["text property value" :logseq.property/created-from-property 3]]]
    (testing label
      (let [parent-uuid (random-uuid)
            child-uuid (random-uuid)
            property-uuid (random-uuid)
            visible-db (db-with-blocks [{:db/id 1
                                         :block/uuid parent-uuid
                                         :block/tx-id 10}
                                        {:db/id 2
                                         :block/uuid child-uuid
                                         :block/parent 1
                                         :block/order "a0"
                                         :block/tx-id 10}
                                        {:db/id 3
                                         :block/uuid property-uuid
                                         :block/tx-id 10}])
            hide-report (tx-report visible-db [[:db/add 2 attr value]
                                               [:db/add 1 :block/tx-id 11]])
            hide-delta (build-delta
                        hide-report
                        {:blocks {parent-uuid (block parent-uuid 11 "parent")}})
            hidden-db (:db-after hide-report)
            show-report (tx-report hidden-db [[:db/retract 2 attr value]
                                              [:db/add 1 :block/tx-id 12]])
            show-delta (build-delta
                        show-report
                        {:blocks {parent-uuid (block parent-uuid 12 "parent")}})]
        (is (= {parent-uuid {:remove [[child-uuid "a0"]]
                             :upsert []}}
               (membership-operations (:children hide-delta))))
        (is (= {parent-uuid {:remove []
                             :upsert [[child-uuid "a0"]]}}
               (membership-operations (:children show-delta))))))))

(deftest ancestor-recycle-state-refreshes-descendant-children-membership-test
  (let [ancestor-uuid (random-uuid)
        nested-page-uuid (random-uuid)
        content-uuid (random-uuid)
        live-db (db-with-blocks [{:db/id 1
                                  :block/uuid ancestor-uuid
                                  :block/tx-id 10
                                  :block/title "QA-E-Visibility"}
                                 {:db/id 2
                                  :block/uuid nested-page-uuid
                                  :block/parent 1
                                  :block/order "a0"
                                  :block/tx-id 10
                                  :block/title "QA visibility child"}
                                 {:db/id 3
                                  :block/uuid content-uuid
                                  :block/parent 2
                                  :block/order "a0"
                                  :block/tx-id 10
                                  :block/title "QA visibility content intact"}])
        hide-report (tx-report live-db [[:db/add 1 :logseq.property/deleted-at 1000]
                                        [:db/add 1 :block/tx-id 11]])
        hide-delta (build-delta
                    hide-report
                    {:blocks {ancestor-uuid (block ancestor-uuid 11 "QA-E-Visibility")}})
        show-report (tx-report (:db-after hide-report)
                               [[:db/retract 1 :logseq.property/deleted-at 1000]
                                [:db/add 1 :block/tx-id 12]])
        show-delta (build-delta
                    show-report
                    {:blocks {ancestor-uuid (block ancestor-uuid 12 "QA-E-Visibility")}})]
    (is (= {ancestor-uuid {:remove [[nested-page-uuid "a0"]]
                           :upsert []}
            nested-page-uuid {:remove [[content-uuid "a0"]]
                              :upsert []}}
           (membership-operations (:children hide-delta)))
        "Recycling an ancestor hides already-open descendant children, not just the ancestor's own row.")
    (is (= {ancestor-uuid {:remove []
                           :upsert [[nested-page-uuid "a0"]]}
            nested-page-uuid {:remove []
                              :upsert [[content-uuid "a0"]]}}
           (membership-operations (:children show-delta)))
        "Restoring an ancestor must republish the descendant children slot that reload emptied.")))

(deftest independently-recycled-descendant-stays-hidden-when-ancestor-is-restored-test
  (let [ancestor-uuid (random-uuid)
        nested-page-uuid (random-uuid)
        content-uuid (random-uuid)
        recycled-db (db-with-blocks [{:db/id 1
                                      :block/uuid ancestor-uuid
                                      :block/tx-id 10
                                      :block/title "Ancestor"
                                      :logseq.property/deleted-at 1000}
                                     {:db/id 2
                                      :block/uuid nested-page-uuid
                                      :block/parent 1
                                      :block/order "a0"
                                      :block/tx-id 10
                                      :block/title "Nested page"
                                      :logseq.property/deleted-at 1000}
                                     {:db/id 3
                                      :block/uuid content-uuid
                                      :block/parent 2
                                      :block/order "a0"
                                      :block/tx-id 10
                                      :block/title "Hidden content"}])
        show-report (tx-report recycled-db
                               [[:db/retract 1 :logseq.property/deleted-at 1000]
                                [:db/add 1 :block/tx-id 11]])
        show-delta (build-delta
                    show-report
                    {:blocks {ancestor-uuid (block ancestor-uuid 11 "Ancestor")}})]
    (is (nil? (get (membership-operations (:children show-delta))
                   nested-page-uuid))
        "An independently recycled descendant keeps an empty children slot after its ancestor is restored.")))

(deftest restore-tx-republishes-inherited-recycled-descendant-children-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "QA-E-Visibility"}
                :blocks [{:block/title "QA visibility child"
                          :build/tags [:logseq.class/Page]
                          :build/children [{:block/title "QA visibility content intact"}]}]}])
        ancestor (ldb/get-page @conn "QA-E-Visibility")
        nested-page (db-test/find-block-by-content @conn "QA visibility child")
        content (db-test/find-block-by-content @conn "QA visibility content intact")
        ancestor-uuid (:block/uuid ancestor)
        nested-page-uuid (:block/uuid nested-page)
        content-uuid (:block/uuid content)]
    (ldb/transact! conn
                   (recycle/recycle-page-tx-data @conn ancestor {})
                   {:outliner-op :delete-page})
    (let [recycled-ancestor (d/entity @conn [:block/uuid ancestor-uuid])
          restore-report (d/with @conn (recycle/restore-tx-data @conn recycled-ancestor))
          delta (build-delta restore-report {:blocks {}})]
      (is (some? (:logseq.property/deleted-at (d/entity @conn (:db/id ancestor)))))
      (is (nil? (:logseq.property/deleted-at
                 (d/entity (:db-after restore-report) (:db/id ancestor)))))
      (is (= [[content-uuid (:block/order content)]]
             (get-in (membership-operations (:children delta))
                     [nested-page-uuid :upsert]))
          "The restore transaction must upsert the nested page body that inherited recycle emptied.")
      (is (empty? (get-in (membership-operations (:children delta))
                          [nested-page-uuid :remove]))))))

(deftest moving-a-subtree-across-a-recycled-ancestor-refreshes-nested-children-test
  (let [live-parent-uuid (random-uuid)
        recycled-uuid (random-uuid)
        moved-uuid (random-uuid)
        nested-uuid (random-uuid)
        content-uuid (random-uuid)
        live-db (db-with-blocks [{:db/id 1
                                  :block/uuid live-parent-uuid
                                  :block/tx-id 10}
                                 {:db/id 2
                                  :block/uuid recycled-uuid
                                  :block/tx-id 10
                                  :logseq.property/deleted-at 1000}
                                 {:db/id 3
                                  :block/uuid moved-uuid
                                  :block/parent 1
                                  :block/order "a0"
                                  :block/tx-id 10}
                                 {:db/id 4
                                  :block/uuid nested-uuid
                                  :block/parent 3
                                  :block/order "a0"
                                  :block/tx-id 10}
                                 {:db/id 5
                                  :block/uuid content-uuid
                                  :block/parent 4
                                  :block/order "a0"
                                  :block/tx-id 10}])
        hide-report (tx-report live-db [[:db/add 3 :block/parent 2]])
        hide-delta (build-delta hide-report {:blocks {}})
        show-report (tx-report (:db-after hide-report)
                               [[:db/add 3 :block/parent 1]])
        show-delta (build-delta show-report {:blocks {}})]
    (is (= {nested-uuid {:remove [[content-uuid "a0"]]
                         :upsert []}}
           (select-keys (membership-operations (:children hide-delta))
                        [nested-uuid]))
        "Moving a live subtree under a recycled ancestor empties already-open nested children.")
    (is (= {nested-uuid {:remove []
                         :upsert [[content-uuid "a0"]]}}
           (select-keys (membership-operations (:children show-delta))
                        [nested-uuid]))
        "Moving that subtree back onto a live ancestor republishes the nested children.")))

(deftest live-parent-move-does-not-walk-nested-children-test
  (let [old-parent-uuid (random-uuid)
        new-parent-uuid (random-uuid)
        moved-uuid (random-uuid)
        nested-uuid (random-uuid)
        content-uuid (random-uuid)
        db-before (db-with-blocks [{:db/id 1
                                    :block/uuid old-parent-uuid
                                    :block/tx-id 10}
                                   {:db/id 2
                                    :block/uuid new-parent-uuid
                                    :block/tx-id 10}
                                   {:db/id 3
                                    :block/uuid moved-uuid
                                    :block/parent 1
                                    :block/order "a0"
                                    :block/tx-id 10}
                                   {:db/id 4
                                    :block/uuid nested-uuid
                                    :block/parent 3
                                    :block/order "a0"
                                    :block/tx-id 10}
                                   {:db/id 5
                                    :block/uuid content-uuid
                                    :block/parent 4
                                    :block/order "a0"
                                    :block/tx-id 10}])
        report (tx-report db-before [[:db/add 3 :block/parent 2]])
        delta (build-delta report {:blocks {}})]
    (is (= {old-parent-uuid {:remove [[moved-uuid "a0"]]
                             :upsert []}
            new-parent-uuid {:remove []
                             :upsert [[moved-uuid "a0"]]}}
           (membership-operations (:children delta)))
        "A live-to-live move must not emit descendant children patches.")))

(deftest insert-builds-a-minimal-child-upsert-test
  (let [parent-uuid (random-uuid)
        child-uuid (random-uuid)
        db-before (db-with-blocks [{:db/id 1
                                    :block/uuid parent-uuid
                                    :block/tx-id 10}])
        report (tx-report db-before [{:block/uuid child-uuid
                                      :block/parent [:block/uuid parent-uuid]
                                      :block/order "a1"
                                      :block/tx-id 11}
                                     [:db/add [:block/uuid parent-uuid]
                                      :block/tx-id 11]])
        delta (build-delta report
                           {:blocks {parent-uuid (block parent-uuid 11 "parent")
                                     child-uuid (block child-uuid 11 "child")}})]
    (is (= {parent-uuid {:remove []
                         :upsert [[child-uuid "a1"]]}}
           (membership-operations (:children delta))))))

(deftest same-parent-order-change-removes-old-order-and-upserts-new-order-test
  (let [parent-uuid (random-uuid)
        child-uuid (random-uuid)
        db-before (db-with-blocks [{:db/id 1
                                    :block/uuid parent-uuid
                                    :block/tx-id 10}
                                   {:db/id 2
                                    :block/uuid child-uuid
                                    :block/parent 1
                                    :block/order "a0"
                                    :block/tx-id 10}])
        report (tx-report db-before [[:db/add [:block/uuid child-uuid]
                                      :block/order "a2"]
                                     [:db/add [:block/uuid parent-uuid]
                                      :block/tx-id 11]])]
    (is (= {parent-uuid {:remove [[child-uuid "a0"]]
                         :upsert [[child-uuid "a2"]]}}
           (membership-operations
            (:children (build-delta report
                                    {:blocks {parent-uuid
                                              (block parent-uuid 11 "parent")}})))))))

(deftest move-builds-old-parent-removal-and-new-parent-upsert-test
  (let [old-parent-uuid (random-uuid)
        new-parent-uuid (random-uuid)
        child-uuid (random-uuid)
        db-before (db-with-blocks [{:db/id 1
                                    :block/uuid old-parent-uuid
                                    :block/tx-id 17}
                                   {:db/id 2
                                    :block/uuid new-parent-uuid
                                    :block/tx-id 18}
                                   {:db/id 3
                                    :block/uuid child-uuid
                                    :block/parent 1
                                    :block/order "a0"
                                    :block/tx-id 19}])
        report (tx-report db-before [[:db/add [:block/uuid child-uuid]
                                      :block/parent [:block/uuid new-parent-uuid]]
                                     [:db/add [:block/uuid child-uuid]
                                      :block/order "a3"]
                                     [:db/add [:block/uuid old-parent-uuid]
                                      :block/tx-id 20]
                                     [:db/add [:block/uuid new-parent-uuid]
                                      :block/tx-id 20]])]
    (is (= {old-parent-uuid {:remove [[child-uuid "a0"]]
                             :upsert []}
            new-parent-uuid {:remove []
                             :upsert [[child-uuid "a3"]]}}
           (membership-operations
            (:children (build-delta
                        report
                        {:blocks {old-parent-uuid
                                  (block old-parent-uuid 20 "old parent")
                                  new-parent-uuid
                                  (block new-parent-uuid 20 "new parent")}})))))))

(defn- insertion-report
  [parent-uuid child-uuid unrelated-count]
  (let [unrelated (mapv (fn [index]
                          {:db/id (+ 3 index)
                           :block/uuid (random-uuid)
                           :block/parent 1
                           :block/order (str "z" index)
                           :block/tx-id 10})
                        (range unrelated-count))
        db-before (db-with-blocks
                   (into [{:db/id 1
                           :block/uuid parent-uuid
                           :block/tx-id 10}]
                         unrelated))]
    (tx-report db-before [{:block/uuid child-uuid
                           :block/parent [:block/uuid parent-uuid]
                           :block/order "a1"
                           :block/tx-id 11}
                          [:db/add [:block/uuid parent-uuid]
                           :block/tx-id 11]])))

(deftest structural-delta-cardinality-is-independent-of-unrelated-siblings-test
  (let [parent-uuid (random-uuid)
        child-uuid (random-uuid)
        build #(build-delta
                (insertion-report parent-uuid child-uuid %)
                {:blocks {parent-uuid (block parent-uuid 11 "parent")
                          child-uuid (block child-uuid 11 "child")}})
        small-delta (build 10)
        large-delta (build 10000)]
    (is (= (:children small-delta) (:children large-delta)))
    (is (= 1 (count (:children large-delta))))
    (is (= 1 (count (get-in large-delta
                            [:children parent-uuid :upsert]))))))

(deftest malformed-identities-and-revisions-fail-fast-test
  (let [block-uuid (random-uuid)
        other-uuid (random-uuid)
        valid-block (block block-uuid 11 "block")
        db (db-with-blocks [{:db/id 1
                             :block/uuid block-uuid
                             :block/tx-id 11}])
        report {:db-before db :db-after db :tx-data []}]
    (testing "delta revision"
      (is (thrown-with-msg? js/Error
                            #"Invalid renderer revision"
                            (build-delta report {:rev nil}))))
    (testing "block map key"
      (is (thrown-with-msg? js/Error
                            #"Invalid block UUID"
                            (build-delta report
                                         {:blocks {"not-a-uuid" valid-block}}))))
    (testing "replacement identity"
      (is (thrown-with-msg? js/Error
                            #"Block UUID does not match its key"
                            (build-delta report
                                         {:blocks {other-uuid valid-block}}))))
    (testing "replacement revision"
      (is (thrown-with-msg? js/Error
                            #"Invalid block transaction ID"
                            (build-delta report
                                         {:blocks {block-uuid
                                                   (dissoc valid-block
                                                           :block/tx-id)}}))))
    (testing "deleted identity"
      (is (thrown-with-msg? js/Error
                            #"Invalid deleted block UUID"
                            (build-delta report
                                         {:deleted-block-uuids #{"not-a-uuid"}}))))
    (testing "one block cannot be replaced and deleted"
      (is (thrown-with-msg? js/Error
                            #"Block cannot be replaced and deleted"
                            (build-delta report
                                         {:blocks {block-uuid valid-block}
                                          :deleted-block-uuids #{block-uuid}}))))))

(deftest structural-owner-does-not-require-a-new-transaction-id-test
  (let [parent-uuid (random-uuid)
        child-uuid (random-uuid)
        db-before (db-with-blocks [{:db/id 1
                                    :block/uuid parent-uuid
                                    :block/tx-id 10}])
        report (tx-report db-before [{:block/uuid child-uuid
                                      :block/parent [:block/uuid parent-uuid]
                                      :block/order "a1"
                                      :block/tx-id 11}])]
    (is (= {parent-uuid {:remove []
                         :upsert [[child-uuid "a1"]]}}
           (membership-operations
            (:children
             (build-delta report
                          {:blocks {child-uuid
                                    (block child-uuid 11 "child")}})))))))
