(ns logseq.outliner.recycle-restore-duplicate-name-test
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

(defn- restore-error
  [conn page-uuid]
  (try
    (recycle/restore! conn page-uuid)
    nil
    (catch :default e e)))

(deftest restore-page-onto-a-live-name-is-refused-test
  (testing "restoring P after another page was renamed to P is refused"
    (let [conn (db-test/create-conn)
          [_ p-uuid] (outliner-page/create! conn "P" {})
          [_ x-uuid] (outliner-page/create! conn "X" {})]
      (outliner-page/delete! conn p-uuid)
      (let [x (d/entity @conn [:block/uuid x-uuid])]
        ;; the rename `save-block` writes once the title is validated
        (outliner-validate/validate-block-title @conn "P" x)
        (ldb/transact! conn [{:db/id (:db/id x) :block/title "P" :block/name "p"}]))
      (is (= :notification (:type (ex-data (restore-error conn p-uuid)))))
      (is (true? (ldb/recycled? (d/entity @conn [:block/uuid p-uuid]))))
      (is (= 1 (count (live-pages-named @conn "p"))))))

  (testing "restoring Foo/Bar while Foo is recycled is refused when a top-level Bar exists"
    (let [conn (db-test/create-conn)
          [_ bar-uuid] (outliner-page/create! conn "Bar" {})
          [_ foo-bar-uuid] (outliner-page/create! conn "Foo/Bar" {:split-namespace? true})
          foo-uuid (:block/uuid (:block/parent (d/entity @conn [:block/uuid foo-bar-uuid])))]
      (is (not= bar-uuid foo-bar-uuid))
      (outliner-page/delete! conn foo-bar-uuid)
      (outliner-page/delete! conn foo-uuid)
      (is (= :notification (:type (ex-data (restore-error conn foo-bar-uuid)))))
      (is (true? (ldb/recycled? (d/entity @conn [:block/uuid foo-bar-uuid]))))
      (is (= 1 (count (live-pages-named @conn "bar"))))
      (testing "and restoring Foo first still brings both back"
        (is (true? (recycle/restore! conn foo-uuid)))
        (is (true? (recycle/restore! conn foo-bar-uuid)))
        (is (= foo-uuid (:block/uuid (:block/parent (d/entity @conn [:block/uuid foo-bar-uuid])))))))))

(deftest restore-namespace-page-onto-a-sibling-name-is-refused-test
  (testing "restoring Foo/Qux after a sibling under Foo took the name Qux is refused"
    (let [conn (db-test/create-conn)
          [_ qux-uuid] (outliner-page/create! conn "Foo/Qux" {:split-namespace? true})
          [_ other-uuid] (outliner-page/create! conn "Foo/Other" {:split-namespace? true})
          _ (outliner-page/delete! conn qux-uuid)
          other (d/entity @conn [:block/uuid other-uuid])]
      ;; the rename `save-block` writes once the title is validated
      (outliner-validate/validate-block-title @conn "Qux" other)
      (ldb/transact! conn [{:db/id (:db/id other) :block/title "Qux" :block/name "qux"}])
      (is (= :notification (:type (ex-data (restore-error conn qux-uuid)))))
      (is (true? (ldb/recycled? (d/entity @conn [:block/uuid qux-uuid]))))
      (is (= 1 (count (live-pages-named @conn "qux")))))))
