(ns logseq.outliner.recycle-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.recycle :as recycle]))

(deftest restore-recycled-block-returns-subtree-to-original-location
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}
                         {:block/title "sibling"}]}])
        page (ldb/get-page @conn "page1")
        parent (db-test/find-block-by-content @conn "parent")]
    (outliner-core/delete-blocks! conn [parent] {})
    (recycle/restore! conn (:block/uuid parent))
    (let [parent' (db-test/find-block-by-content @conn "parent")
          child' (db-test/find-block-by-content @conn "child")]
      (is (= (:block/uuid page) (:block/uuid (:block/parent parent'))))
      (is (= (:block/uuid page) (:block/uuid (:block/page parent'))))
      (is (= (:block/uuid parent') (:block/uuid (:block/parent child'))))
      (is (= (:block/uuid page) (:block/uuid (:block/page child'))))
      (is (nil? (:logseq.property/deleted-at parent')))
      (is (nil? (:logseq.property/deleted-by-ref parent')))
      (is (nil? (:logseq.property.recycle/original-parent parent')))
      (is (nil? (:logseq.property.recycle/original-page parent')))
      (is (nil? (:logseq.property.recycle/original-order parent'))))))

(deftest restore-recycled-block-falls-back-to-page-root-when-original-parent-is-unavailable
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}
                         {:block/title "sibling"}]}])
        page (ldb/get-page @conn "page1")
        parent (db-test/find-block-by-content @conn "parent")
        child (db-test/find-block-by-content @conn "child")]
    (outliner-core/delete-blocks! conn [child] {})
    (outliner-core/delete-blocks! conn [parent] {})
    (recycle/restore! conn (:block/uuid child))
    (let [child' (db-test/find-block-by-content @conn "child")]
      (is (= (:block/uuid page) (:block/uuid (:block/parent child'))))
      (is (= (:block/uuid page) (:block/uuid (:block/page child'))))
      (is (nil? (:logseq.property/deleted-at child'))))))

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

(deftest gc-retracts-recycled-subtrees-older-than-retention-window
  (let [now-ms 1000
        old-ms (- now-ms (* 61 24 3600 1000))
        conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        parent (db-test/find-block-by-content @conn "parent")
        child (db-test/find-block-by-content @conn "child")]
    (outliner-core/delete-blocks! conn [parent] {})
    (d/transact! conn [{:db/id (:db/id (db-test/find-block-by-content @conn "parent"))
                        :logseq.property/deleted-at old-ms}])
    (recycle/gc! conn {:now-ms now-ms})
    (is (nil? (d/entity @conn [:block/uuid (:block/uuid parent)])))
    (is (nil? (d/entity @conn [:block/uuid (:block/uuid child)])))))
