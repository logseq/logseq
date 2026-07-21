(ns frontend.worker.render-delta-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.render-delta :as render-delta]))

(def ^:private schema
  {:block/uuid {:db/unique :db.unique/identity}
   :block/parent {:db/valueType :db.type/ref}
   :block/closed-value-property {:db/valueType :db.type/ref
                                 :db/cardinality :db.cardinality/many}
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
                        [:unlinked-index]}
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
    (is (= {parent-uuid {:base-tx-id 10
                         :tx-id 11
                         :remove [[child-uuid "a0"]]
                         :upsert []}}
           (:children delta)))))

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

(deftest direct-child-visibility-builds-remove-and-upsert-patches-test
  (doseq [[label attr value]
          [["recycled child" :logseq.property/deleted-at 1000]
           ["closed property value" :block/closed-value-property 3]]]
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
        (is (= {parent-uuid {:base-tx-id 10
                             :tx-id 11
                             :remove [[child-uuid "a0"]]
                             :upsert []}}
               (:children hide-delta)))
        (is (= {parent-uuid {:base-tx-id 11
                             :tx-id 12
                             :remove []
                             :upsert [[child-uuid "a0"]]}}
               (:children show-delta)))))))

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
    (is (= {parent-uuid {:base-tx-id 10
                         :tx-id 11
                         :remove []
                         :upsert [[child-uuid "a1"]]}}
           (:children delta)))))

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
    (is (= {parent-uuid {:base-tx-id 10
                         :tx-id 11
                         :remove [[child-uuid "a0"]]
                         :upsert [[child-uuid "a2"]]}}
           (:children (build-delta report
                                   {:blocks {parent-uuid
                                             (block parent-uuid 11 "parent")}}))))))

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
    (is (= {old-parent-uuid {:base-tx-id 17
                             :tx-id 20
                             :remove [[child-uuid "a0"]]
                             :upsert []}
            new-parent-uuid {:base-tx-id 18
                             :tx-id 20
                             :remove []
                             :upsert [[child-uuid "a3"]]}}
           (:children (build-delta
                       report
                       {:blocks {old-parent-uuid
                                 (block old-parent-uuid 20 "old parent")
                                 new-parent-uuid
                                 (block new-parent-uuid 20 "new parent")}}))))))

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

(deftest structural-owner-without-a-transaction-id-fails-fast-test
  (let [parent-uuid (random-uuid)
        child-uuid (random-uuid)
        db-before (db-with-blocks [{:db/id 1
                                    :block/uuid parent-uuid
                                    :block/tx-id 10}])
        report (tx-report db-before [{:block/uuid child-uuid
                                      :block/parent [:block/uuid parent-uuid]
                                      :block/order "a1"
                                      :block/tx-id 11}])]
    (is (thrown-with-msg? js/Error
                          #"Invalid parent transaction ID"
                          (build-delta report
                                       {:blocks {child-uuid
                                                 (block child-uuid 11 "child")}})))))
