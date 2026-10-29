(ns logseq.outliner.page-create-recycled-parent-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.recycle :as recycle]))

(def ^:private day-ms (* 24 3600 1000))

(defn- assert-created-outside-recycle
  [conn foo-uuid]
  (let [[_ baz-uuid] (outliner-page/create! conn "Foo/Baz" {:split-namespace? true})
        baz (d/entity @conn [:block/uuid baz-uuid])]
    (is (= foo-uuid (:block/uuid (:block/parent baz))))
    (is (false? (ldb/recycled? baz)))
    (is (false? (ldb/hidden? baz)))
    (recycle/gc! conn {:now-ms (* 31 day-ms)})
    (is (some? (d/entity @conn [:block/uuid baz-uuid])))
    (is (some? (d/entity @conn [:block/uuid foo-uuid])))))

(deftest create-namespace-page-under-recycled-parent-test
  (testing "creating Foo/Baz while the namespace root Foo is in the Recycle restores Foo"
    (let [conn (db-test/create-conn)
          [_ bar-uuid] (outliner-page/create! conn "Foo/Bar" {:split-namespace? true})
          foo-uuid (:block/uuid (:block/parent (d/entity @conn [:block/uuid bar-uuid])))]
      (outliner-page/delete! conn foo-uuid {:now-ms 0})
      (is (true? (ldb/recycled? (d/entity @conn [:block/uuid foo-uuid]))))
      (assert-created-outside-recycle conn foo-uuid)))

  (testing "creating Foo/Baz while the plain page Foo is in the Recycle restores Foo"
    (let [conn (db-test/create-conn)
          [_ foo-uuid] (outliner-page/create! conn "Foo" {})]
      (outliner-page/delete! conn foo-uuid {:now-ms 0})
      (is (true? (ldb/recycled? (d/entity @conn [:block/uuid foo-uuid]))))
      (assert-created-outside-recycle conn foo-uuid))))
