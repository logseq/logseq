(ns logseq.outliner.recycle-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
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
