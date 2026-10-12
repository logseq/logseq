(ns logseq.db.common.order-mutation2-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.test.helper :as db-test]))

(def ^:private page-a-uuid #uuid "11111111-1111-4111-8111-111111111111")

(defn- transact-parent-with-siblings!
  "Parent page whose content children are transacted in the given order
  (highest order first, so datom scan order differs from sort order), plus
  one internal page child without :block/order."
  [conn sibling-orders]
  (let [library (ldb/get-built-in-page @conn "Library")]
    (d/transact! conn
                 (concat
                  [{:db/id "parent"
                    :block/uuid (random-uuid)
                    :block/title "Country"
                    :block/name "country"
                    :block/tags :logseq.class/Page
                    :block/parent (:db/id library)
                    :block/order "a0"}]
                  (map (fn [order]
                         {:block/uuid (random-uuid)
                          :block/title (str "sibling " order)
                          :block/page "parent"
                          :block/parent "parent"
                          :block/order order})
                       sibling-orders)
                  [{:block/uuid page-a-uuid
                    :block/title "Australia"
                    :block/name "australia"
                    :block/tags :logseq.class/Page
                    :block/parent "parent"}]))))

(deftest get-max-order-returns-the-greatest-order
  (let [conn (db-test/create-conn)]
    (transact-parent-with-siblings! conn ["zz" "zb"])
    (is (= "zz" (db-order/get-max-order @conn))
        "get-max-order returns the largest :block/order in the db.")))

(deftest missing-internal-page-parent-order-tx-ignores-non-string-sibling-orders
  (let [conn (db-test/create-conn)]
    (transact-parent-with-siblings! conn ["a5" 7 "a1"])
    (let [tx (db-order/missing-internal-page-parent-order-tx @conn)]
      (is (= 1 (count tx)))
      (is (pos? (compare (:block/order (first tx)) "a5"))))))

(deftest missing-internal-page-parent-order-tx-sorts-above-the-greatest-sibling-order
  (let [conn (db-test/create-conn)]
    (transact-parent-with-siblings! conn ["a5" "a3" "a1"])
    (let [tx (db-order/missing-internal-page-parent-order-tx @conn)
          page (d/entity @conn [:block/uuid page-a-uuid])
          repaired (first (filter #(= (:db/id page) (:db/id %)) tx))]
      (is (= 1 (count tx)))
      (is (pos? (compare (:block/order repaired) "a5"))
          "Repaired order sorts after the greatest sibling order, wherever it is in scan order."))))
