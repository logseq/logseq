(ns logseq.outliner.recycle-mutation2-app-test
  "Second-run mutation survivors in logseq.outliner.recycle that only the app
  build reaches: :block/_parent hides property-value children and
  :block/_raw-parent exists only through entity-plus (nbb lacks it)."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.recycle :as recycle]))

(defn- recycle-page
  [db]
  (ldb/get-built-in-page db common-config/recycle-page-name))

(defn- next-order
  [order]
  (db-order/gen-key order nil))

(defn- order-of
  [conn id]
  (:block/order (d/entity @conn id)))

(defn- add-property-value-child!
  "Adds a child that :block/_parent hides (created from a property) but :block/_raw-parent shows."
  [conn parent-id order]
  (d/transact! conn [{:block/uuid (random-uuid)
                      :block/title "property value"
                      :block/parent parent-id
                      :block/page parent-id
                      :block/order order
                      :logseq.property/created-from-property (:db/id (d/entity @conn :logseq.property/status))}]))

(defn- recycle-block!
  [conn id]
  (ldb/transact! conn
                 (recycle/recycle-blocks-tx-data @conn [(d/entity @conn id)] {})
                 {:outliner-op :delete-blocks}))

(defn- recycle-page!
  [conn id]
  (ldb/transact! conn
                 (recycle/recycle-page-tx-data @conn (d/entity @conn id) {})
                 {:outliner-op :delete-page}))

(deftest recycle-blocks-ignores-property-value-children-of-recycle-page
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"} {:block/title "b2"}]}])
        b1 (:db/id (db-test/find-block-by-content @conn "b1"))
        b2 (:db/id (db-test/find-block-by-content @conn "b2"))]
    (recycle-block! conn b2)
    (let [o2 (order-of conn b2)]
      (add-property-value-child! conn (:db/id (recycle-page @conn)) (next-order (next-order o2)))
      (recycle-block! conn b1)
      (is (= (next-order o2) (order-of conn b1))))))

(deftest recycle-page-ignores-property-value-children-of-recycle-page
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "p1"}}
               {:page {:block/title "p2"}}])
        p1 (:db/id (ldb/get-page @conn "p1"))
        p2 (:db/id (ldb/get-page @conn "p2"))]
    (recycle-page! conn p1)
    (let [o1 (order-of conn p1)]
      (add-property-value-child! conn (:db/id (recycle-page @conn)) (next-order (next-order o1)))
      (recycle-page! conn p2)
      (is (= (next-order o1) (order-of conn p2))))))

(deftest restore-page-orders-waiting-child-ignoring-property-value-children
  (let [conn (db-test/create-conn)
        [_ bar-uuid] (outliner-page/create! conn "Foo/Bar" {:split-namespace? true})
        [_ baz-uuid] (outliner-page/create! conn "Foo/Baz" {:split-namespace? true})
        id-of (fn [uuid] (:db/id (d/entity @conn [:block/uuid uuid])))
        parent-uuid (:block/uuid (:block/parent (d/entity @conn [:block/uuid bar-uuid])))
        parent-id (id-of parent-uuid)
        bar-id (id-of bar-uuid)
        order-high (next-order (db-order/gen-key nil nil))]
    (d/transact! conn [[:db/add (id-of baz-uuid) :block/order order-high]])
    (recycle-page! conn bar-id)
    (recycle-page! conn parent-id)
    (is (true? (recycle/restore! conn bar-uuid)))
    (d/transact! conn [[:db/retract bar-id :logseq.property.recycle/original-order]])
    (add-property-value-child! conn parent-id (next-order order-high))
    (is (true? (recycle/restore! conn parent-uuid)))
    (is (= (next-order order-high) (:block/order (d/entity @conn bar-id))))))
