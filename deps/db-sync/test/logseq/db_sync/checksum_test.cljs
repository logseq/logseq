(ns logseq.db-sync.checksum-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db-sync.checksum :as checksum]
            [logseq.db.frontend.schema :as db-schema]))

(defn- sample-db
  []
  (let [page-a-uuid (random-uuid)
        page-b-uuid (random-uuid)
        parent-uuid (random-uuid)
        child-uuid (random-uuid)]
    (-> (d/empty-db db-schema/schema)
        (d/db-with [{:db/id 1
                     :block/uuid page-a-uuid
                     :block/name "page-a"
                     :block/title "Page A"}
                    {:db/id 2
                     :block/uuid page-b-uuid
                     :block/name "page-b"
                     :block/title "Page B"}
                    {:db/id 3
                     :block/uuid parent-uuid
                     :block/title "Parent"
                     :block/parent 1
                     :block/page 1}
                    {:db/id 4
                     :block/uuid child-uuid
                     :block/title "Child"
                     :block/parent 3
                     :block/page 1}]))))

(defn- assert-incremental=full!
  [db-before checksum-before tx-data]
  (let [tx-report (d/with db-before tx-data)
        full (checksum/recompute-checksum (:db-after tx-report))
        incremental (checksum/update-checksum checksum-before tx-report)]
    (is (= full incremental)
        (str "Expected checksum parity for tx-data: " (pr-str tx-data)))
    {:db (:db-after tx-report)
     :checksum incremental}))

(deftest checksum-ignores-unrelated-datoms-test
  (testing "recompute and incremental checksums ignore unrelated datoms"
    (let [db-before (sample-db)
          checksum-before (checksum/recompute-checksum db-before)
          tx-data [[:db/add 4 :block/updated-at 1773661308002]
                   [:db/add 4 :logseq.property/created-by-ref 99]]
          tx-report (d/with db-before tx-data)]
      (is (= checksum-before
             (checksum/recompute-checksum (:db-after tx-report))))
      (is (= checksum-before
             (checksum/update-checksum checksum-before tx-report))))))

(deftest incremental-checksum-matches-recompute-on-replace-datom-test
  (testing "incremental checksum matches full recompute when replacing existing values"
    (let [db-before (sample-db)
          tx-report (d/with db-before [[:db/add 4 :block/title "Child updated"]
                                       [:db/add 1 :block/name "page-a-updated"]])]
      (is (= (checksum/recompute-checksum (:db-after tx-report))
             (checksum/update-checksum (checksum/recompute-checksum db-before) tx-report))))))

(deftest incremental-checksum-matches-recompute-across-mixed-mutations-test
  (testing "incremental checksum stays equal to full recompute across typical tx sequences"
    (let [db0 (sample-db)
          new-block-uuid (random-uuid)
          {:keys [db checksum]} (reduce
                                 (fn [{:keys [db checksum]} {:keys [tx-data]}]
                                   (assert-incremental=full! db checksum tx-data))
                                 {:db db0
                                  :checksum (checksum/recompute-checksum db0)}
                                 [{:tx-data [[:db/add 4 :block/title "Child edited"]]}
                                  {:tx-data [[:db/add 1 :block/name "page-a-renamed"]
                                             [:db/add 1 :block/title "Page A Renamed"]]}
                                  {:tx-data [[:db/add 4 :block/parent 2]
                                             [:db/add 4 :block/page 2]]}
                                  {:tx-data [[:db/add -1 :block/uuid new-block-uuid]
                                             [:db/add -1 :block/title "New block"]
                                             [:db/add -1 :block/parent 2]
                                             [:db/add -1 :block/page 2]]}
                                  {:tx-data [[:db/retract 3 :block/title "Parent"]]}
                                  {:tx-data [[:db/retractEntity [:block/uuid new-block-uuid]]]}
                                  {:tx-data [[:db/add 4 :block/updated-at 1773661308002]]}])]
      (is (= checksum (checksum/recompute-checksum db))))))

(deftest incremental-checksum-uses-recompute-when-initial-checksum-missing-test
  (testing "nil initial checksum uses db-before recompute as baseline"
    (let [db-before (sample-db)
          tx-report (d/with db-before [[:db/add 4 :block/title "Child updated"]])]
      (is (= (checksum/recompute-checksum (:db-after tx-report))
             (checksum/update-checksum nil tx-report))))))

(deftest checksum-e2ee-ignores-title-and-name-test
  (testing "with E2EE enabled, checksum ignores title/name changes for both modes"
    (let [db-before (-> (sample-db)
                        (d/db-with [{:db/ident :logseq.kv/graph-rtc-e2ee?
                                     :kv/value true}]))
          checksum-before (checksum/recompute-checksum db-before)
          tx-report (d/with db-before [[:db/add 4 :block/title "Encrypted title update"]
                                       [:db/add 1 :block/name "encrypted-name-update"]])]
      (is (= checksum-before
             (checksum/recompute-checksum (:db-after tx-report))))
      (is (= checksum-before
             (checksum/update-checksum checksum-before tx-report))))))

(deftest incremental-checksum-recomputes-when-e2ee-mode-toggles-test
  (testing "incremental checksum falls back to full recompute when E2EE mode changes"
    (let [db-before (sample-db)
          tx-report (d/with db-before [{:db/ident :logseq.kv/graph-rtc-e2ee?
                                        :kv/value true}])]
      (is (= (checksum/recompute-checksum (:db-after tx-report))
             (checksum/update-checksum (checksum/recompute-checksum db-before) tx-report))))))

(deftest incremental-checksum-matches-recompute-when-referenced-entity-disappears-test
  (testing "incremental checksum tracks blocks whose parent/page UUID becomes unresolved after retracting referenced entities"
    (let [db-before (sample-db)
          before-checksum (checksum/recompute-checksum db-before)
          tx-report (d/with db-before [[:db/retractEntity 3]
                                       [:db/retractEntity 1]])
          db-after (:db-after tx-report)
          full (checksum/recompute-checksum db-after)
          incremental (checksum/update-checksum before-checksum tx-report)]
      (is (not= before-checksum full))
      (is (= full incremental)))))

(deftest incremental-checksum-matches-recompute-when-parent-uuid-is-retracted-test
  (testing "incremental checksum updates referrers when parent uuid is removed"
    (let [db-before (sample-db)
          before-checksum (checksum/recompute-checksum db-before)
          parent-uuid (:block/uuid (d/entity db-before 3))
          tx-report (d/with db-before [[:db/retract 3 :block/uuid parent-uuid]])
          db-after (:db-after tx-report)
          full (checksum/recompute-checksum db-after)
          incremental (checksum/update-checksum before-checksum tx-report)]
      (is (not= before-checksum full))
      (is (= full incremental)))))

(deftest incremental-checksum-matches-recompute-when-block-is-readded-test
  (testing "incremental checksum remains equal to recompute when a block is deleted and re-added with the same UUID"
    (let [db0 (sample-db)
          checksum0 (checksum/recompute-checksum db0)
          child-uuid (:block/uuid (d/entity db0 4))
          parent-uuid (:block/uuid (d/entity db0 3))
          page-uuid (:block/uuid (d/entity db0 1))
          {:keys [db checksum]} (assert-incremental=full! db0 checksum0 [[:db/retractEntity [:block/uuid child-uuid]]])]
      (assert-incremental=full! db checksum [{:db/id -1
                                              :block/uuid child-uuid
                                              :block/title "Child"
                                              :block/parent [:block/uuid parent-uuid]
                                              :block/page [:block/uuid page-uuid]}]))))

(deftest incremental-checksum-matches-recompute-when-delete-tree-undo-and-delete-again-test
  (testing "incremental checksum matches recompute across delete-tree, undo-all, then delete-tree-again"
    (let [db0 (sample-db)
          parent-uuid (:block/uuid (d/entity db0 3))
          child-uuid (:block/uuid (d/entity db0 4))
          page-uuid (:block/uuid (d/entity db0 1))
          tx-seq [{:tx-data [[:db/retractEntity [:block/uuid child-uuid]]
                             [:db/retractEntity [:block/uuid parent-uuid]]]}
                  {:tx-data [{:db/id -1
                              :block/uuid parent-uuid
                              :block/title "Parent"
                              :block/parent [:block/uuid page-uuid]
                              :block/page [:block/uuid page-uuid]}
                             {:db/id -2
                              :block/uuid child-uuid
                              :block/title "Child"
                              :block/parent [:block/uuid parent-uuid]
                              :block/page [:block/uuid page-uuid]}]}
                  {:tx-data [[:db/retractEntity [:block/uuid child-uuid]]
                             [:db/retractEntity [:block/uuid parent-uuid]]]}]
          {:keys [db checksum]} (reduce
                                 (fn [{:keys [db checksum]} {:keys [tx-data]}]
                                   (assert-incremental=full! db checksum tx-data))
                                 {:db db0
                                  :checksum (checksum/recompute-checksum db0)}
                                 tx-seq)]
      (is (= checksum (checksum/recompute-checksum db))))))

(deftest recompute-checksum-diagnostics-includes-relevant-attrs-test
  (testing "diagnostics includes checksum attrs and block values used for checksum export"
    (let [db (sample-db)
          {:keys [checksum attrs blocks e2ee?]} (checksum/recompute-checksum-diagnostics db)
          child-uuid (:block/uuid (d/entity db 4))
          child-parent-uuid (:block/uuid (:block/parent (d/entity db 4)))
          child-page-uuid (:block/uuid (:block/page (d/entity db 4)))
          child (some #(when (= child-uuid (:block/uuid %)) %) blocks)]
      (is (false? e2ee?))
      (is (= (checksum/recompute-checksum db) checksum))
      (is (= #{:block/uuid :block/title :block/name :block/parent :block/page :block/order}
             (set attrs)))
      (is (= 4 (count blocks)))
      (is (= child-parent-uuid (:block/parent child)))
      (is (= child-page-uuid (:block/page child)))
      (is (string? (:block/title child))))))

(deftest recompute-checksum-diagnostics-omits-title-and-name-in-e2ee-test
  (testing "diagnostics for E2EE graphs omits title/name from checksum attrs and export blocks"
    (let [db (-> (sample-db)
                 (d/db-with [{:db/ident :logseq.kv/graph-rtc-e2ee?
                              :kv/value true}]))
          {:keys [checksum attrs blocks e2ee?]} (checksum/recompute-checksum-diagnostics db)]
      (is e2ee?)
      (is (= (checksum/recompute-checksum db) checksum))
      (is (= #{:block/uuid :block/parent :block/page :block/order}
             (set attrs)))
      (is (every? #(not (contains? % :block/title)) blocks))
      (is (every? #(not (contains? % :block/name)) blocks)))))

(deftest incremental-checksum-is-invariant-across-tx-partitioning-test
  (testing "incremental checksum converges to the same value regardless of tx partitioning"
    (let [db0 (sample-db)
          tx-a [[:db/add 4 :block/order "aBL"]
                [:db/add 4 :block/title "Child v2"]]
          tx-b [[:db/add 3 :block/order "aBK"]
                [:db/add 4 :block/parent 2]
                [:db/add 4 :block/page 2]]
          one-shot-report (d/with db0 (into tx-a tx-b))
          one-shot-checksum (checksum/update-checksum (checksum/recompute-checksum db0)
                                                      one-shot-report)
          checksum0 (checksum/recompute-checksum db0)
          report-a (d/with db0 tx-a)
          checksum-a (checksum/update-checksum checksum0 report-a)
          db-a (:db-after report-a)
          report-b (d/with db-a tx-b)
          checksum-b (checksum/update-checksum checksum-a report-b)
          db-final (:db-after report-b)
          full-final (checksum/recompute-checksum db-final)]
      (is (= full-final one-shot-checksum))
      (is (= full-final checksum-b))
      (is (= one-shot-checksum checksum-b)))))

(deftest incremental-checksum-is-invariant-across-commuting-batch-order-test
  (testing "incremental checksum converges when commuting tx batches are applied in different order"
    (let [db0 (sample-db)
          checksum0 (checksum/recompute-checksum db0)
          tx-a [[:db/add 3 :block/title "Parent v2"]
                [:db/add 4 :block/order "a9"]]
          tx-b [[:db/add 1 :block/name "page-a-v2"]
                [:db/add 2 :block/title "Page B v2"]]
          report-a (d/with db0 tx-a)
          checksum-a (checksum/update-checksum checksum0 report-a)
          db-a (:db-after report-a)
          report-b-after-a (d/with db-a tx-b)
          checksum-ab (checksum/update-checksum checksum-a report-b-after-a)
          db-ab (:db-after report-b-after-a)
          full-ab (checksum/recompute-checksum db-ab)

          report-b (d/with db0 tx-b)
          checksum-b (checksum/update-checksum checksum0 report-b)
          db-b (:db-after report-b)
          report-a-after-b (d/with db-b tx-a)
          checksum-ba (checksum/update-checksum checksum-b report-a-after-b)
          db-ba (:db-after report-a-after-b)
          full-ba (checksum/recompute-checksum db-ba)]
      (is (= full-ab full-ba))
      (is (= full-ab checksum-ab))
      (is (= full-ba checksum-ba))
      (is (= checksum-ab checksum-ba)))))

(deftest incremental-checksum-is-invariant-across-intra-batch-datom-order-test
  (testing "incremental checksum converges when same tx-data uses different datom order"
    (let [db0 (sample-db)
          checksum0 (checksum/recompute-checksum db0)
          uuid-a (random-uuid)
          uuid-b (random-uuid)
          tx-order-a [{:db/id -1
                       :block/uuid uuid-a
                       :block/title "Inserted A"
                       :block/order "a5"
                       :block/parent 3
                       :block/page 1}
                      {:db/id -2
                       :block/uuid uuid-b
                       :block/title "Inserted B"
                       :block/order "a6"
                       :block/parent 3
                       :block/page 1}]
          tx-order-b (vec (reverse tx-order-a))
          report-a (d/with db0 tx-order-a)
          db-a (:db-after report-a)
          full-a (checksum/recompute-checksum db-a)
          incremental-a (checksum/update-checksum checksum0 report-a)
          report-b (d/with db0 tx-order-b)
          db-b (:db-after report-b)
          full-b (checksum/recompute-checksum db-b)
          incremental-b (checksum/update-checksum checksum0 report-b)]
      (is (= full-a full-b))
      (is (= full-a incremental-a))
      (is (= full-b incremental-b))
      (is (= incremental-a incremental-b)))))

(deftest incremental-checksum-handles-rebase-like-toggle-churn-test
  (testing "incremental checksum uses net tuple delta when batch contains add/retract/add churn"
    (let [db0 (sample-db)
          checksum0 (checksum/recompute-checksum db0)
          ;; Simulate rebase churn on a tuple absent in db0: add -> retract -> add
          report-1 (d/with db0 [[:db/add 4 :block/order "aBL"]])
          db1 (:db-after report-1)
          report-2 (d/with db1 [[:db/retract 4 :block/order "aBL"]])
          db2 (:db-after report-2)
          report-3 (d/with db2 [[:db/add 4 :block/order "aBL"]])
          db3 (:db-after report-3)
          batch-report {:db-before db0
                        :db-after db3
                        :tx-data (vec (concat (:tx-data report-1)
                                              (:tx-data report-2)
                                              (:tx-data report-3)))}
          full-final (checksum/recompute-checksum db3)
          incremental (checksum/update-checksum checksum0 batch-report)]
      (is (not= checksum0 full-final))
      (is (= full-final incremental)))))

(deftest incremental-checksum-handles-transient-entity-churn-in-one-batch-test
  (testing "incremental checksum remains stable when a newly created block is retracted in the same batch"
    (let [db0 (sample-db)
          checksum0 (checksum/recompute-checksum db0)
          page-id 1
          parent-id 3
          transient-uuid (random-uuid)
          report-1 (d/with db0 [{:db/id -1
                                 :block/uuid transient-uuid
                                 :block/title "Transient"
                                 :block/parent parent-id
                                 :block/page page-id}])
          db1 (:db-after report-1)
          report-2 (d/with db1 [[:db/retractEntity [:block/uuid transient-uuid]]])
          db2 (:db-after report-2)
          batch-report {:db-before db0
                        :db-after db2
                        :tx-data (vec (concat (:tx-data report-1)
                                              (:tx-data report-2)))}
          full-final (checksum/recompute-checksum db2)
          incremental (checksum/update-checksum checksum0 batch-report)]
      (is (= checksum0 full-final))
      (is (= full-final incremental)))))

(deftest incremental-checksum-handles-new-entity-attr-replacement-in-one-batch-test
  (testing "incremental checksum cancels replaced attrs on entities created inside the same batch"
    (let [db0 (sample-db)
          checksum0 (checksum/recompute-checksum db0)
          page-id 1
          parent-id 3
          transient-uuid (random-uuid)
          report-1 (d/with db0 [{:db/id -1
                                 :block/uuid transient-uuid
                                 :block/title "Transient"
                                 :block/order "a1"
                                 :block/parent parent-id
                                 :block/page page-id}])
          db1 (:db-after report-1)
          report-2 (d/with db1 [[:db/add [:block/uuid transient-uuid] :block/order "a2"]])
          db2 (:db-after report-2)
          batch-report {:db-before db0
                        :db-after db2
                        :tx-data (vec (concat (:tx-data report-1)
                                              (:tx-data report-2)))}
          full-final (checksum/recompute-checksum db2)
          incremental (checksum/update-checksum checksum0 batch-report)]
      (is (= full-final incremental)))))

(deftest checksum-ignores-non-page-non-block-entities-test
  (testing "entities with uuid but without page semantics do not affect checksum"
    (let [db0 (sample-db)
          checksum0 (checksum/recompute-checksum db0)
          internal-uuid (random-uuid)
          tx-report (d/with db0 [{:db/id -1
                                  :block/uuid internal-uuid
                                  :block/order "zz"}])
          db1 (:db-after tx-report)
          full1 (checksum/recompute-checksum db1)
          incremental1 (checksum/update-checksum checksum0 tx-report)
          tx-report-2 (d/with db1 [[:db/add [:block/uuid internal-uuid] :block/order "aa"]])
          full2 (checksum/recompute-checksum (:db-after tx-report-2))
          incremental2 (checksum/update-checksum full1 tx-report-2)]
      (is (= checksum0 full1))
      (is (= checksum0 incremental1))
      (is (= checksum0 full2))
      (is (= full2 incremental2)))))
