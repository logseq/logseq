(ns logseq.outliner.core-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(deftest test-delete-block-with-default-property
  (testing "Delete block with default property moves the block to recycle"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:default "test block"}}]}])
          block (db-test/find-block-by-content @conn "b1")]
      (outliner-core/delete-blocks! conn [block] {})
      (let [block' (db-test/find-block-by-content @conn "b1")
            property-value (:user.property/default block')
            recycle-page (ldb/get-built-in-page @conn "Recycle")]
        (is (some? block'))
        (is (some? property-value))
        (is (integer? (:logseq.property/deleted-at block')))
        (is (= (:db/id recycle-page) (:db/id (:block/page block'))))
        (is (= (:db/id recycle-page) (:db/id (:block/page property-value))))))))

(deftest test-delete-page-with-outliner-core
  (testing "Pages shouldn't be deleted through outliner-core/delete-blocks"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1"}]}
                 {:page {:block/title "page2"}
                  :blocks [{:block/title "b3"}
                           {:block/title "b4"}]}])
          page1 (ldb/get-page @conn "page1")
          page2 (ldb/get-page @conn "page2")
          _ (d/transact! conn [{:db/id (:db/id page2)
                                :block/order "a1"
                                :block/parent (:db/id page1)}])
          b3 (db-test/find-block-by-content @conn "b3")
          b4 (db-test/find-block-by-content @conn "b4")]
      (outliner-core/delete-blocks! conn [b3 b4 page2] {})
      (is (some? (db-test/find-block-by-content @conn "b3")))
      (is (some? (db-test/find-block-by-content @conn "b4")))
      (let [page2' (ldb/get-page @conn "page2")]
        (is (= "page2" (:block/title page2')))
        (is (= (:db/id page1) (:db/id (:block/parent page2'))))
        (is (= "a1" (:block/order page2')))))))

(deftest delete-blocks-moves-subtree-to-recycle
  (let [user-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        page (ldb/get-page @conn "page1")
        parent (db-test/find-block-by-content @conn "parent")
        original-order (:block/order parent)]
    (d/transact! conn [{:block/uuid user-uuid
                        :block/title "Alice"}])
    (outliner-core/delete-blocks! conn [parent] {:deleted-by-uuid user-uuid})
    (let [parent' (db-test/find-block-by-content @conn "parent")
          child' (db-test/find-block-by-content @conn "child")
          properties (entity-plus/lookup-kv-then-entity parent' :block/properties)
          recycle-page (ldb/get-built-in-page @conn "Recycle")]
      (is (some? parent'))
      (is (some? child'))
      (is (= (:block/uuid recycle-page) (:block/uuid (:block/parent parent'))))
      (is (= (:block/uuid recycle-page) (:block/uuid (:block/page parent'))))
      (is (integer? (:logseq.property/deleted-at parent')))
      (is (= user-uuid
             (:block/uuid (:logseq.property/deleted-by-ref properties))))
      (is (= (:block/uuid page)
             (:block/uuid (:logseq.property.recycle/original-page properties))))
      (is (= original-order (:logseq.property.recycle/original-order parent')))
      (is (= (:block/uuid parent') (:block/uuid (:block/parent child'))))
      (is (= (:block/uuid recycle-page) (:block/uuid (:block/page child'))))
      (is (nil? (:logseq.property/deleted-at child'))))))
