(ns logseq.db-sync.order-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db-sync.order :as sync-order]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.schema :as db-schema]))

;; Fails if, in `fix-duplicate-orders!`, `and` becomes `or`.
(deftest fix-duplicate-orders-ignores-order-without-parent-test
  (let [conn (d/create-conn db-schema/schema)
        [parent-1 parent-2 block-1 block-2 no-parent] (repeatedly 5 random-uuid)
        order (db-order/gen-key nil nil)]
    (d/transact! conn [{:block/uuid parent-1}
                       {:block/uuid parent-2}
                       {:block/uuid block-1 :block/parent [:block/uuid parent-1] :block/order order}
                       {:block/uuid block-2 :block/parent [:block/uuid parent-2] :block/order order}])
    (let [report (d/transact! conn [{:block/uuid no-parent :block/order order}])]
      (sync-order/fix-duplicate-orders! conn (:tx-data report) {})
      (is (= [order order order]
             (mapv #(:block/order (d/entity @conn [:block/uuid %])) [block-1 block-2 no-parent]))
          "an order on an entity without parent does not reorder blocks under other parents"))))
