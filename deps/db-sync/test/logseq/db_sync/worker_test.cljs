(ns logseq.db-sync.worker-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db-sync.order :as sync-order]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.schema :as db-schema]))

(defn- new-conn []
  (d/create-conn db-schema/schema))

(deftest duplicate-order-fix-test
  (let [parent #uuid "00000000-0000-0000-0000-000000000001"
        block-ids (mapv #(uuid (str "00000000-0000-0000-0000-00000000000" %)) (range 2 9))
        orders (db-order/gen-n-keys 4 nil nil)
        results (for [allocation [[4 1 0 3 2 6 5] [0 1 2 3 4 5 6]]]
                  (let [conn (new-conn)
                        _ (d/transact! conn (into [{:block/uuid parent}]
                                                 (map (fn [idx]
                                                        {:block/uuid (nth block-ids idx)
                                                         :block/parent [:block/uuid parent]})
                                                      allocation)))
                        tx-report (d/transact! conn
                                               (mapv (fn [block-id order]
                                                       [:db/add [:block/uuid block-id] :block/order order])
                                                     block-ids
                                                     [(orders 0) (orders 0) (orders 1) (orders 1)
                                                      (orders 2) (orders 3) (orders 3)]))
                        repair (sync-order/fix-duplicate-orders! conn (:tx-data tx-report) {:outliner-op :fix})
                        repaired-orders (mapv #(:block/order (d/entity @conn [:block/uuid %])) block-ids)]
                    (is (= (sort repaired-orders) repaired-orders))
                    (is (= (count block-ids) (count (distinct repaired-orders))))
                    (is (every? #(neg? (compare (orders 0) %)) (take 2 repaired-orders)))
                    (is (every? #(neg? (compare % (orders 1))) (take 2 repaired-orders)))
                    (is (every? #(neg? (compare (orders 1) %)) (take 2 (drop 2 repaired-orders))))
                    (is (every? #(neg? (compare % (orders 2))) (take 2 (drop 2 repaired-orders))))
                    (is (= (orders 2) (nth repaired-orders 4)))
                    (is (every? #(pos? (compare % (orders 3))) (drop 5 repaired-orders)))
                    (is (= {:outliner-op :fix :op :fix-duplicate-order} (:tx-meta repair)))
                    (is (nil? (sync-order/fix-duplicate-orders! conn (:tx-data repair) {})))
                    (is (nil? (sync-order/fix-duplicate-orders! conn (:tx-data tx-report) {})))
                    repaired-orders))]
    (is (apply = results))))
