(ns logseq.outliner.recycle-test
  (:require [cljs.test :refer [deftest is]]
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
