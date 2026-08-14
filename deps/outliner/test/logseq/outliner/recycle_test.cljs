(ns logseq.outliner.recycle-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.recycle :as recycle]))

(deftest restore-recycled-page-removes-recycle-parent
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        page (ldb/get-page @conn "page1")]
    (recycle/recycle-page-tx-data @conn page {})
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn page {}) {:outliner-op :delete-page})
    (recycle/restore! conn (:block/uuid page))
    (let [page' (ldb/get-page @conn "page1")]
      (is (nil? (:block/parent page')))
      (is (nil? (:logseq.property/deleted-at page')))
      (is (nil? (:logseq.property.recycle/original-parent page'))))))

(deftest apply-ops-restore-recycled-page-removes-recycle-parent
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        page (ldb/get-page @conn "page1")
        page-uuid (:block/uuid page)]
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn page {}) {:outliner-op :delete-page})
    (is (true? (ldb/recycled? (d/entity @conn [:block/uuid page-uuid]))))
    (outliner-op/apply-ops! conn [[:restore-recycled [page-uuid]]] {})
    (let [page' (ldb/get-page @conn "page1")]
      (is (nil? (:block/parent page')))
      (is (nil? (:logseq.property/deleted-at page')))
      (is (nil? (:logseq.property.recycle/original-parent page'))))))

(deftest permanently-delete-recycled-page-removes-page-and-descendants
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        page (ldb/get-page @conn "page1")
        block (db-test/find-block-by-content @conn "b1")
        page-uuid (:block/uuid page)
        block-uuid (:block/uuid block)]
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn page {}) {:outliner-op :delete-page})
    (is (true? (ldb/recycled? (d/entity @conn [:block/uuid page-uuid]))))
    (is (true? (recycle/permanently-delete! conn page-uuid)))
    (is (nil? (d/entity @conn [:block/uuid page-uuid])))
    (is (nil? (d/entity @conn [:block/uuid block-uuid])))))

(deftest permanently-delete-recycled-page-removes-blocks-parented-by-page
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}
               {:page {:block/title "page2"}}])
        page1 (ldb/get-page @conn "page1")
        page2 (ldb/get-page @conn "page2")
        block-uuid (random-uuid)
        now (common-util/time-ms)]
    (d/transact! conn [{:block/uuid block-uuid
                        :block/title "parented by page1"
                        :block/created-at now
                        :block/updated-at now
                        :block/parent (:db/id page1)
                        :block/page (:db/id page2)
                        :block/order "a0"}])
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn page1 {}) {:outliner-op :delete-page})
    (is (true? (ldb/recycled? (d/entity @conn (:db/id page1)))))
    (is (true? (recycle/permanently-delete! conn (:block/uuid page1))))
    (is (nil? (d/entity @conn [:block/uuid block-uuid])))))

(deftest permanently-delete-recycled-converted-page-removes-property-value-blocks
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "outer"}
                :blocks [{:block/title "target"
                          :build/properties {:default "value"}}]}])
        target (db-test/find-block-by-content @conn "target")
        target-id (:db/id target)
        target-uuid (:block/uuid target)
        value-id (d/q '[:find ?value .
                        :in $ ?target
                        :where
                        [?value :block/parent ?target]
                        [?value :logseq.property/created-from-property]]
                      @conn target-id)]
    (d/transact! conn [[:db/retract target-id :block/page]
                       [:db/add target-id :block/name "target"]
                       [:db/add target-id :block/tags :logseq.class/Page]])
    (let [page (d/entity @conn target-id)]
      (ldb/transact! conn (recycle/recycle-page-tx-data @conn page {}) {:outliner-op :delete-page}))
    (is (true? (recycle/permanently-delete! conn target-uuid)))
    (is (nil? (d/entity @conn target-id)))
    (is (nil? (d/entity @conn value-id)))))

(deftest gc-recycled-converted-page-removes-property-value-blocks
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "outer"}
                :blocks [{:block/title "target"
                          :build/properties {:default "value"}}
                         {:block/title "unrelated"}]}])
        outer (ldb/get-page @conn "outer")
        target (db-test/find-block-by-content @conn "target")
        unrelated (db-test/find-block-by-content @conn "unrelated")
        target-id (:db/id target)
        value-id (d/q '[:find ?value .
                        :in $ ?target
                        :where
                        [?value :block/parent ?target]
                        [?value :logseq.property/created-from-property]]
                      @conn target-id)]
    (d/transact! conn [[:db/retract target-id :block/page]
                       [:db/add target-id :block/name "target"]
                       [:db/add target-id :block/tags :logseq.class/Page]])
    (let [page (d/entity @conn target-id)]
      (ldb/transact! conn
                     (recycle/recycle-page-tx-data @conn page {:now-ms 0})
                     {:outliner-op :delete-page}))
    (is (true? (recycle/gc! conn {:now-ms (* 31 24 3600 1000)})))
    (is (nil? (d/entity @conn target-id)))
    (is (nil? (d/entity @conn value-id)))
    (is (some? (d/entity @conn (:db/id outer))))
    (is (some? (d/entity @conn (:db/id unrelated))))))

(deftest gc-keeps-unexpired-recycled-page
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}])
        page (ldb/get-page @conn "page1")
        page-id (:db/id page)]
    (ldb/transact! conn
                   (recycle/recycle-page-tx-data @conn page {:now-ms 0})
                   {:outliner-op :delete-page})
    (is (nil? (recycle/gc! conn {:now-ms (* 29 24 3600 1000)})))
    (is (some? (d/entity @conn page-id)))))

(deftest apply-ops-permanently-delete-recycled-page-removes-page-and-descendants
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        page (ldb/get-page @conn "page1")
        block (db-test/find-block-by-content @conn "b1")
        page-uuid (:block/uuid page)
        block-uuid (:block/uuid block)]
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn page {}) {:outliner-op :delete-page})
    (is (true? (ldb/recycled? (d/entity @conn [:block/uuid page-uuid]))))
    (outliner-op/apply-ops! conn [[:recycle-delete-permanently [page-uuid]]] {})
    (is (nil? (d/entity @conn [:block/uuid page-uuid])))
    (is (nil? (d/entity @conn [:block/uuid block-uuid])))))

(deftest permanently-delete-recycled-block-removes-subtree-only
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        page (ldb/get-page @conn "page1")
        parent (db-test/find-block-by-content @conn "parent")
        child (db-test/find-block-by-content @conn "child")
        parent-uuid (:block/uuid parent)
        child-uuid (:block/uuid child)]
    (ldb/transact! conn (recycle/recycle-blocks-tx-data @conn [parent] {}) {:outliner-op :delete-blocks})
    (is (true? (ldb/recycled? (d/entity @conn [:block/uuid parent-uuid]))))
    (is (true? (recycle/permanently-delete! conn parent-uuid)))
    (is (some? (d/entity @conn [:block/uuid (:block/uuid page)])))
    (is (nil? (d/entity @conn [:block/uuid parent-uuid])))
    (is (nil? (d/entity @conn [:block/uuid child-uuid])))))

(deftest apply-ops-permanently-delete-recycled-block-removes-subtree-only
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        parent (db-test/find-block-by-content @conn "parent")
        child (db-test/find-block-by-content @conn "child")
        parent-uuid (:block/uuid parent)
        child-uuid (:block/uuid child)]
    (ldb/transact! conn (recycle/recycle-blocks-tx-data @conn [parent] {}) {:outliner-op :delete-blocks})
    (is (true? (ldb/recycled? (d/entity @conn [:block/uuid parent-uuid]))))
    (outliner-op/apply-ops! conn [[:recycle-delete-permanently [parent-uuid]]] {})
    (is (nil? (d/entity @conn [:block/uuid parent-uuid])))
    (is (nil? (d/entity @conn [:block/uuid child-uuid])))))

(deftest permanently-delete-recycled-block-removes-corresponding-view-history
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "target"}]}])
        target (db-test/find-block-by-content @conn "target")
        target-uuid (:block/uuid target)
        view-uuid (random-uuid)
        target-history-uuid (random-uuid)
        view-history-uuid (random-uuid)
        now (common-util/time-ms)
        _ (d/transact! conn [{:block/uuid view-uuid
                              :block/title "target view"
                              :block/created-at now
                              :block/updated-at now
                              :logseq.property/view-for (:db/id target)
                              :logseq.property.view/type :logseq.property.view/type.table
                              :logseq.property.view/feature-type :linked-references}
                             {:block/uuid target-history-uuid
                              :block/created-at now
                              :block/updated-at now
                              :logseq.property.history/block (:db/id target)
                              :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))
                              :logseq.property.history/scalar-value "Todo"}
                             {:block/uuid view-history-uuid
                              :block/created-at now
                              :block/updated-at now
                              :logseq.property.history/block [:block/uuid view-uuid]
                              :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))
                              :logseq.property.history/scalar-value "List"}])]
    (ldb/transact! conn (recycle/recycle-blocks-tx-data @conn [target] {}) {:outliner-op :delete-blocks})
    (is (true? (recycle/permanently-delete! conn target-uuid)))
    (is (nil? (d/entity @conn [:block/uuid target-uuid])))
    (is (nil? (d/entity @conn [:block/uuid view-uuid])))
    (is (nil? (d/entity @conn [:block/uuid target-history-uuid])))
    (is (nil? (d/entity @conn [:block/uuid view-history-uuid])))))
