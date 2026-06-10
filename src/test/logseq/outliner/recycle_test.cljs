(ns logseq.outliner.recycle-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.recycle :as recycle]))

(deftest permanently-delete-recycled-block-removes-uuid-missing-descendants
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        parent (db-test/find-block-by-content @conn "parent")
        child (db-test/find-block-by-content @conn "child")
        parent-uuid (:block/uuid parent)
        child-id (:db/id child)]
    (ldb/transact! conn (recycle/recycle-blocks-tx-data @conn [parent] {}) {:outliner-op :delete-blocks})
    (d/transact! conn [[:db/retract child-id :block/uuid (:block/uuid child)]])
    (is (true? (recycle/permanently-delete! conn parent-uuid)))
    (is (nil? (d/entity @conn child-id)))))

(deftest permanently-delete-recycled-descendant
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        parent (db-test/find-block-by-content @conn "parent")
        child (db-test/find-block-by-content @conn "child")
        child-uuid (:block/uuid child)]
    (ldb/transact! conn (recycle/recycle-blocks-tx-data @conn [parent] {}) {:outliner-op :delete-blocks})
    (is (true? (ldb/recycled? (d/entity @conn [:block/uuid child-uuid]))))
    (is (true? (recycle/permanently-delete! conn child-uuid)))
    (is (nil? (d/entity @conn [:block/uuid child-uuid])))))

(deftest permanently-delete-block-stuck-on-recycle-page
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        page (ldb/get-page @conn "page1")
        parent (db-test/find-block-by-content @conn "parent")
        child (db-test/find-block-by-content @conn "child")
        child-uuid (:block/uuid child)]
    (ldb/transact! conn (recycle/recycle-blocks-tx-data @conn [parent] {}) {:outliner-op :delete-blocks})
    (d/transact! conn [[:db/retract (:db/id parent) :logseq.property/deleted-at]
                       [:db/add (:db/id child) :logseq.property.recycle/original-page (:db/id page)]])
    (is (false? (ldb/recycled? (d/entity @conn [:block/uuid child-uuid]))))
    (is (true? (recycle/permanently-delete! conn child-uuid)))
    (is (nil? (d/entity @conn [:block/uuid child-uuid])))))

(deftest permanently-delete-invalid-recycled-block
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"}]}])
        parent (db-test/find-block-by-content @conn "parent")
        parent-uuid (:block/uuid parent)]
    (ldb/transact! conn (recycle/recycle-blocks-tx-data @conn [parent] {}) {:outliner-op :delete-blocks})
    (d/transact! conn [[:db/add (:db/id parent) :block/pre-block? true]])
    (is (true? (recycle/permanently-delete! conn parent-uuid)))
    (is (nil? (d/entity @conn [:block/uuid parent-uuid])))))
