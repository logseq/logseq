(ns logseq.outliner.page-create-recycled-namespace-leaf-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]))

(deftest create-recycled-namespace-page-restores-it-test
  (testing "creating Foo/Qux while Foo/Qux is in the Recycle restores it under Foo"
    (let [conn (db-test/create-conn)
          [_ qux-uuid] (outliner-page/create! conn "Foo/Qux" {:split-namespace? true})
          foo-uuid (:block/uuid (:block/parent (d/entity @conn [:block/uuid qux-uuid])))
          _ (outliner-page/delete! conn qux-uuid)
          [_ qux-uuid'] (outliner-page/create! conn "Foo/Qux" {:split-namespace? true})
          qux (d/entity @conn [:block/uuid qux-uuid])]
      (is (= qux-uuid qux-uuid'))
      (is (false? (ldb/recycled? qux)))
      (is (= foo-uuid (:block/uuid (:block/parent qux))))
      (is (= 1 (count (d/q '[:find [?p ...] :where [?p :block/name "qux"]] @conn))))))

  (testing "creating Foo/Qux/Z while Foo/Qux is in the Recycle restores Foo/Qux as its parent"
    (let [conn (db-test/create-conn)
          [_ qux-uuid] (outliner-page/create! conn "Foo/Qux" {:split-namespace? true})
          _ (outliner-page/delete! conn qux-uuid)
          [_ z-uuid] (outliner-page/create! conn "Foo/Qux/Z" {:split-namespace? true})
          z (d/entity @conn [:block/uuid z-uuid])]
      (is (= qux-uuid (:block/uuid (:block/parent z))))
      (is (false? (ldb/recycled? z))))))
