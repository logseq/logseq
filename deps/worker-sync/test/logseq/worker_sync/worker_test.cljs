(ns logseq.worker-sync.worker-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util.date-time :as date-time]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.worker-sync.common :as common]
            [logseq.worker-sync.worker-core :as worker-core]))

(defn- new-conn []
  (d/create-conn db-schema/schema))

(deftest missing-parent-fallback-test
  (let [conn (new-conn)
        child (random-uuid)
        missing (random-uuid)
        fixed-ms 1700000000000
        journal-day (date-time/ms->journal-day fixed-ms)
        journal-uuid (common-uuid/gen-uuid :journal-page-uuid journal-day)
        tx [[:db/add [:block/uuid child] :block/parent [:block/uuid missing]]]]
    (with-redefs [common/now-ms (constantly fixed-ms)]
      (let [fixed (worker-core/fix-missing-parent @conn tx)
            db' (d/db-with @conn fixed)
            child-entity (d/entity db' [:block/uuid child])
            journal-entity (d/entity db' [:block/uuid journal-uuid])]
        (testing "missing parent moves block to today's journal"
          (is (= journal-uuid (:block/uuid (:block/parent child-entity))))
          (is (= journal-uuid (:block/uuid (:block/page child-entity))))
          (is (string? (:block/order child-entity))))
        (testing "journal page exists"
          (is (= journal-day (:block/journal-day journal-entity)))
          (is (= journal-uuid (:block/uuid journal-entity))))))))

(deftest duplicate-order-fix-test
  (let [conn (new-conn)
        parent (random-uuid)
        block-a (random-uuid)
        block-b (random-uuid)
        order-a (db-order/gen-key nil nil)
        order-b (db-order/gen-key order-a nil)]
    (d/transact! conn [{:block/uuid parent}
                       {:block/uuid block-a
                        :block/parent [:block/uuid parent]
                        :block/order order-a}
                       {:block/uuid block-b
                        :block/parent [:block/uuid parent]
                        :block/order order-b}])
    (let [tx [[:db/add [:block/uuid block-b] :block/order order-a]]
          fixed (worker-core/fix-duplicate-orders @conn tx)
          db' (d/db-with @conn fixed)
          order-a' (:block/order (d/entity db' [:block/uuid block-a]))
          order-b' (:block/order (d/entity db' [:block/uuid block-b]))]
      (is (= order-a order-a'))
      (is (not= order-a' order-b')))))
