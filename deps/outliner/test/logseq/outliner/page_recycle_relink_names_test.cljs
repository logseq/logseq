(ns logseq.outliner.page-recycle-relink-names-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.recycle :as recycle]
            [logseq.outliner.validate :as outliner-validate]))

(defn- live-pages-named
  [db page-name]
  (->> (d/q '[:find [?p ...] :in $ ?name :where [?p :block/name ?name]] db page-name)
       (map #(d/entity db %))
       (remove ldb/recycled?)))

(defn- create-foo-bar!
  [conn]
  (let [[_ bar-uuid] (outliner-page/create! conn "Foo/Bar" {:split-namespace? true})
        foo-uuid (:block/uuid (:block/parent (d/entity @conn [:block/uuid bar-uuid])))]
    [foo-uuid bar-uuid]))

(defn- assert-bar-back-under-foo
  [conn foo-uuid bar-uuid created-uuid]
  (let [bar (d/entity @conn [:block/uuid bar-uuid])]
    (is (= bar-uuid created-uuid))
    (is (false? (ldb/recycled? bar)))
    (is (= foo-uuid (:block/uuid (:block/parent bar))))
    (is (false? (ldb/recycled? (d/entity @conn [:block/uuid foo-uuid]))))
    (is (= 1 (count (live-pages-named @conn "bar"))))))

(deftest create-namespace-page-whose-child-waits-on-recycled-parent-test
  (testing "Bar restored ahead of recycled Foo: creating Foo/Bar restores Foo and returns the waiting Bar"
    (let [conn (db-test/create-conn)
          [foo-uuid bar-uuid] (create-foo-bar! conn)]
      (outliner-page/delete! conn bar-uuid)
      (outliner-page/delete! conn foo-uuid)
      (is (true? (recycle/restore! conn bar-uuid)))
      (let [[_ created-uuid] (outliner-page/create! conn "Foo/Bar" {:split-namespace? true})]
        (assert-bar-back-under-foo conn foo-uuid bar-uuid created-uuid)))))

(deftest create-namespace-page-whose-parent-and-child-are-recycled-test
  (testing "Bar and Foo recycled separately: creating Foo/Bar restores both, Bar under Foo"
    (let [conn (db-test/create-conn)
          [foo-uuid bar-uuid] (create-foo-bar! conn)]
      (outliner-page/delete! conn bar-uuid)
      (outliner-page/delete! conn foo-uuid)
      (let [[_ created-uuid] (outliner-page/create! conn "Foo/Bar" {:split-namespace? true})]
        (assert-bar-back-under-foo conn foo-uuid bar-uuid created-uuid)))))

(deftest restore-ancestor-refuses-relinking-a-child-onto-a-sibling-name-test
  (testing "restoring Foo is refused when it would relink the waiting Baz next to a sibling named Baz"
    (let [conn (db-test/create-conn)
          [_ baz-uuid] (outliner-page/create! conn "Foo/Bar/Baz" {:split-namespace? true})
          [_ other-uuid] (outliner-page/create! conn "Foo/Bar/Other" {:split-namespace? true})
          bar (:block/parent (d/entity @conn [:block/uuid baz-uuid]))
          foo-uuid (:block/uuid (:block/parent bar))]
      (outliner-page/delete! conn baz-uuid)
      (let [other (d/entity @conn [:block/uuid other-uuid])]
        ;; the rename `save-block` writes once the title is validated
        (outliner-validate/validate-block-title @conn "Baz" other)
        (ldb/transact! conn [{:db/id (:db/id other) :block/title "Baz" :block/name "baz"}]))
      (outliner-page/delete! conn foo-uuid)
      (is (true? (recycle/restore! conn baz-uuid)))
      (let [error (try (recycle/restore! conn foo-uuid) nil (catch :default e e))]
        (is (= :notification (:type (ex-data error)))))
      (is (true? (ldb/recycled? (d/entity @conn [:block/uuid foo-uuid]))))
      (is (nil? (:block/parent (d/entity @conn [:block/uuid baz-uuid])))))))
