(ns logseq.db.common.order-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.test.helper :as db-test]))

(def ^:private child-a-uuid #uuid "11111111-1111-4111-8111-111111111111")
(def ^:private child-b-uuid #uuid "22222222-2222-4222-8222-222222222222")

(defn- transact-nested-pages-without-order!
  [conn child-uuids]
  (let [library (ldb/get-built-in-page @conn "Library")
        parent-uuid (random-uuid)
        class-uuid (random-uuid)
        child-title {child-a-uuid ["Australia" "australia"]
                     child-b-uuid ["Canada" "canada"]}
        child-txs (map (fn [child-uuid]
                         (let [[title name] (child-title child-uuid)]
                           {:block/uuid child-uuid
                            :block/title title
                            :block/name name
                            :block/tags :logseq.class/Page
                            :block/parent "parent"}))
                       child-uuids)]
    (d/transact! conn
                 (into [{:db/id "parent"
                         :block/uuid parent-uuid
                         :block/title "Country"
                         :block/name "country"
                         :block/tags :logseq.class/Page
                         :block/parent (:db/id library)
                         :block/order "a0"}]
                       (concat child-txs
                               [{:block/uuid (random-uuid)
                                 :block/title "Overview"
                                 :block/page "parent"
                                 :block/parent "parent"
                                 :block/order "a0"}
                                {:block/uuid class-uuid
                                 :block/title "Place"
                                 :block/name "place"
                                 :block/tags :logseq.class/Tag
                                 :db/ident :user.class/place
                                 :logseq.property.class/extends :logseq.class/Root
                                 :block/parent "parent"}])))
    {:parent-uuid parent-uuid
     :class-uuid class-uuid}))

(defn- repaired-child-orders
  [conn]
  (let [child-a (d/entity @conn [:block/uuid child-a-uuid])
        child-b (d/entity @conn [:block/uuid child-b-uuid])]
    {:child-a (:block/order child-a)
     :child-b (:block/order child-b)}))

(deftest missing-internal-page-parent-order-tx-repairs-nested-pages
  (let [conn (db-test/create-conn)
        {:keys [class-uuid]} (transact-nested-pages-without-order!
                              conn [child-a-uuid child-b-uuid])]
    (d/transact! conn (db-order/missing-internal-page-parent-order-tx @conn))
    (let [child-a (d/entity @conn [:block/uuid child-a-uuid])
          child-b (d/entity @conn [:block/uuid child-b-uuid])
          overview (db-test/find-block-by-content @conn "Overview")
          class (d/entity @conn [:block/uuid class-uuid])]
      (is (string? (:block/order child-a)))
      (is (string? (:block/order child-b)))
      (is (not= (:block/order child-a) (:block/order child-b)))
      (is (neg? (compare (:block/order child-a) (:block/order child-b)))
          "Smaller :block/uuid is assigned the earlier fractional-index key.")
      (is (pos? (compare (:block/order child-a) (:block/order overview))))
      (is (pos? (compare (:block/order child-b) (:block/order overview))))
      (is (nil? (:block/order class))))))

(deftest missing-internal-page-parent-order-tx-is-deterministic-across-scan-order
  (let [conn-ab (db-test/create-conn)
        conn-ba (db-test/create-conn)]
    (transact-nested-pages-without-order! conn-ab [child-a-uuid child-b-uuid])
    (transact-nested-pages-without-order! conn-ba [child-b-uuid child-a-uuid])
    (d/transact! conn-ab (db-order/missing-internal-page-parent-order-tx @conn-ab))
    (d/transact! conn-ba (db-order/missing-internal-page-parent-order-tx @conn-ba))
    (is (= (repaired-child-orders conn-ab)
           (repaired-child-orders conn-ba))
        "Peers assign the same orders even when children were inserted in opposite order.")))

(deftest missing-internal-page-parent-order-tx-is-idempotent
  (let [conn (db-test/create-conn)]
    (transact-nested-pages-without-order! conn [child-b-uuid child-a-uuid])
    (d/transact! conn (db-order/missing-internal-page-parent-order-tx @conn))
    (let [orders-after-first (repaired-child-orders conn)
          second-tx (db-order/missing-internal-page-parent-order-tx @conn)]
      (is (empty? second-tx)
          "Validate/migrate repair does not rewrite orders that are already strings.")
      (is (= orders-after-first (repaired-child-orders conn))))))
