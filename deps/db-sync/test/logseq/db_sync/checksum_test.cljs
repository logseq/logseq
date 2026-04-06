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
