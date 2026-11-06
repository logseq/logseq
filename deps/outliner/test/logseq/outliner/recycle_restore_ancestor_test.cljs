(ns logseq.outliner.recycle-restore-ancestor-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.recycle :as recycle]))

(def ^:private day-ms (* 24 3600 1000))

(defn- recycle-page!
  [conn page-uuid now-ms]
  (ldb/transact! conn (recycle/recycle-page-tx-data @conn (d/entity @conn [:block/uuid page-uuid])
                                                    {:now-ms now-ms})
                 {:outliner-op :delete-page}))

(deftest restore-page-whose-ancestor-is-recycled-test
  (testing "a page restored while an ancestor of its parent is in the Recycle comes back visible and survives GC"
    (let [conn (db-test/create-conn)
          [_ baz-uuid] (outliner-page/create! conn "Foo/Bar/Baz" {:split-namespace? true})
          baz (d/entity @conn [:block/uuid baz-uuid])
          bar (:block/parent baz)
          foo-uuid (:block/uuid (:block/parent bar))]
      (recycle-page! conn baz-uuid 0)
      (recycle-page! conn foo-uuid day-ms)
      (is (true? (recycle/restore! conn baz-uuid)))
      (let [baz' (d/entity @conn [:block/uuid baz-uuid])]
        (is (false? (ldb/recycled? baz')))
        (is (false? (ldb/hidden? baz')))
        (is (= (:db/id bar) (:db/id (:logseq.property.recycle/original-parent baz')))))
      (recycle/gc! conn {:now-ms (* 33 day-ms)})
      (is (some? (d/entity @conn [:block/uuid baz-uuid])))))

  (testing "restoring the recycled ancestor puts the page back under its original parent"
    (let [conn (db-test/create-conn)
          [_ baz-uuid] (outliner-page/create! conn "Foo/Bar/Baz" {:split-namespace? true})
          baz (d/entity @conn [:block/uuid baz-uuid])
          bar (:block/parent baz)
          foo-uuid (:block/uuid (:block/parent bar))]
      (recycle-page! conn baz-uuid 0)
      (recycle-page! conn foo-uuid day-ms)
      (recycle/restore! conn baz-uuid)
      (is (true? (recycle/restore! conn foo-uuid)))
      (let [baz' (d/entity @conn [:block/uuid baz-uuid])]
        (is (= (:db/id bar) (:db/id (:block/parent baz'))))
        (is (false? (ldb/recycled? baz')))
        (is (nil? (:logseq.property.recycle/original-parent baz')))))))
