(ns logseq.db-sync.worker-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db-sync.worker-core :as worker-core]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.schema :as db-schema]))

(defn- new-conn []
  (d/create-conn db-schema/schema))

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
          fixed (worker-core/fix-duplicate-orders! @conn tx)
          db' (d/db-with @conn fixed)
          order-a' (:block/order (d/entity db' [:block/uuid block-a]))
          order-b' (:block/order (d/entity db' [:block/uuid block-b]))]
      (is (= order-a order-a'))
      (is (not= order-a' order-b')))))
