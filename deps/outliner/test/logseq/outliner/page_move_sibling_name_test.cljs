(ns logseq.outliner.page-move-sibling-name-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.page :as outliner-page]))

(defn- children-named
  [db parent-uuid page-name]
  (->> (:block/_parent (d/entity db [:block/uuid parent-uuid]))
       (filter #(= page-name (:block/name %)))))

(deftest move-page-next-to-a-sibling-with-its-name-is-refused-test
  (testing "moving page Bar under Foo, which already has a child page Bar, is refused"
    (let [conn (db-test/create-conn)
          [_ bar-uuid] (outliner-page/create! conn "Bar" {})
          [_ foo-bar-uuid] (outliner-page/create! conn "Foo/Bar" {:split-namespace? true})
          foo-uuid (:block/uuid (:block/parent (d/entity @conn [:block/uuid foo-bar-uuid])))
          error (try
                  (outliner-op/apply-ops! conn [[:move-blocks [[bar-uuid] foo-uuid {:sibling? false}]]] {})
                  nil
                  (catch :default e e))]
      (is (= :notification (:type (ex-data error))))
      (is (= 1 (count (children-named @conn foo-uuid "bar"))))
      (is (nil? (:block/parent (d/entity @conn [:block/uuid bar-uuid]))))))

  (testing "moving page Baz under Foo, which has no child named Baz, still works"
    (let [conn (db-test/create-conn)
          [_ baz-uuid] (outliner-page/create! conn "Baz" {})
          [_ foo-bar-uuid] (outliner-page/create! conn "Foo/Bar" {:split-namespace? true})
          foo-uuid (:block/uuid (:block/parent (d/entity @conn [:block/uuid foo-bar-uuid])))]
      (outliner-op/apply-ops! conn [[:move-blocks [[baz-uuid] foo-uuid {:sibling? false}]]] {})
      (is (= foo-uuid (:block/uuid (:block/parent (d/entity @conn [:block/uuid baz-uuid]))))))))
