(ns logseq.outliner.page-mutation-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]))

(defn- message-of
  [f]
  (try (f) nil (catch :default e (.-message e))))

(deftest build-page-retract-tx-honours-include-page-retract
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "p1"}}]})
        db @conn
        page (db-test/find-page-by-title db "p1")
        retract [:db/retractEntity (:db/id page)]]
    (is (not (some #{retract} (outliner-page/build-page-retract-tx
                               db page {:include-page-retract? false}))))
    (is (some #{retract} (outliner-page/build-page-retract-tx db page {})))))

(deftest delete-page-asserts-on-a-non-uuid-test
  (let [conn (db-test/create-conn)]
    (is (re-find #"wrong page-uuid: nil" (message-of #(outliner-page/delete! conn nil))))
    (is (re-find #"wrong page-uuid: abc" (message-of #(outliner-page/delete! conn "abc"))))))

(deftest resolved-tag-ident-reads-every-tag-shape-test
  (let [conn (db-test/create-conn-with-blocks {:classes {:Foo {}}})
        db @conn
        f #'outliner-page/resolved-tag-ident
        foo (d/entity db :user.class/Foo)]
    (is (= :a/b (f db :a/b)))
    (is (= :user.class/Foo (f db (:db/id foo))))
    (is (= :a/b (f db {:db/ident :a/b})))
    (is (= :user.class/Foo (f db {:db/id (:db/id foo)})))
    (is (= :user.class/Foo (f db {:block/uuid (:block/uuid foo)})))
    (is (nil? (f db "str")))))

(deftest resolve-create-page-tags-accepts-uuids-and-maps-test
  (let [conn (db-test/create-conn-with-blocks {:classes {:Foo {}}})
        db @conn
        foo (d/entity db :user.class/Foo)]
    (is (= [(:db/id foo)] (#'outliner-page/resolve-create-page-tags db [(:block/uuid foo)])))
    (is (= [] (#'outliner-page/resolve-create-page-tags db nil)))
    (is (= [(:db/id foo)]
           (#'outliner-page/resolve-create-page-tags db [{:db/ident :user.class/Foo}])))))

(deftest create-with-a-tag-map-reuses-the-class-by-uuid-test
  (let [conn (db-test/create-conn-with-blocks {:classes {:Foo {}}})
        foo (d/entity @conn :user.class/Foo)
        [_ page-uuid] (outliner-page/create! conn "tagged"
                                             {:tags [{:block/uuid (:block/uuid foo)
                                                      :block/title (:block/title foo)}]})
        page (d/entity @conn [:block/uuid page-uuid])]
    (is (contains? (set (map :db/ident (:block/tags page))) :user.class/Foo))
    (is (= 1 (count (d/q '[:find [?e ...] :where [?e :block/title "Foo"]] @conn))))))

(deftest create-journal-page-keeps-given-tags-test
  (let [conn (db-test/create-conn-with-blocks {:classes {:Foo {}}})
        foo (d/entity @conn :user.class/Foo)
        [_ page-uuid] (outliner-page/create! conn "Jan 1st, 2024" {:tags [(:block/uuid foo)]})
        page (d/entity @conn [:block/uuid page-uuid])]
    (is (some? (:block/journal-day page)))
    (is (contains? (set (map :db/ident (:block/tags page))) :user.class/Foo))))

(deftest create-page-with-built-in-ref-property-builds-a-value-block-test
  (let [conn (db-test/create-conn)
        [_ page-uuid] (outliner-page/create! conn "pdf page" {:properties {:logseq.property/description "about"}})
        page (d/entity @conn [:block/uuid page-uuid])]
    (is (= "about" (:block/title (:logseq.property/description page))))))

(deftest create-split-namespace-page-keeps-the-requested-uuid-test
  (let [conn (db-test/create-conn)
        uuid' (random-uuid)
        [_ page-uuid] (outliner-page/create! conn "ns1/ns2" {:uuid uuid' :split-namespace? true})]
    (is (= uuid' page-uuid))
    (is (= "ns2" (:block/title (d/entity @conn [:block/uuid uuid']))))))

(deftest create-existing-tags-and-pages-are-reused-or-converted-test
  (let [conn (db-test/create-conn)]
    (testing "a class ident namespace picks the class created in that namespace"
      (let [[_ u1] (outliner-page/create! conn "Thing" {:class? true :class-ident-namespace "ns.class"})
            [_ u2] (outliner-page/create! conn "Thing" {:class? true :class-ident-namespace "ns.class"})]
        (is (= u1 u2))))
    (testing "an existing journal page is found by its journal uuid"
      (let [[_ j1] (outliner-page/create! conn "Jan 1st, 2024" {:journal? true})
            again (outliner-page/create @conn "Jan 1st, 2024" {})]
        (is (= j1 (:page-uuid again)))
        (is (nil? (:tx-data again)))))))

(deftest create-journal-page-skips-title-character-validation-test
  (let [conn (db-test/create-conn)
        [_ page-uuid] (outliner-page/create! conn "a/b" {:journal? true})]
    (is (some? page-uuid))
    (is (some? (d/entity @conn [:block/uuid page-uuid])))))

(deftest create-with-a-uuid-only-tag-map-tags-the-existing-class-test
  (let [conn (db-test/create-conn-with-blocks {:classes {:Foo {}}})
        foo (d/entity @conn :user.class/Foo)
        class-count #(count (d/q '[:find [?c ...] :where [?c :block/tags :logseq.class/Tag]] @conn))
        classes-before (class-count)
        [_ page-uuid] (outliner-page/create! conn "tagged by uuid" {:tags [{:block/uuid (:block/uuid foo)}]})
        page (d/entity @conn [:block/uuid page-uuid])
        foo-after (d/entity @conn [:block/uuid (:block/uuid foo)])]
    (is (contains? (set (map :block/uuid (:block/tags page))) (:block/uuid foo)))
    (is (= :user.class/Foo (:db/ident foo-after)))
    (is (= "Foo" (:block/title foo-after)))
    (is (= classes-before (class-count)))))

(deftest create-namespaced-title-finds-a-tag-of-that-title-that-extends-another-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Bar {}
                         :FooBaz {:block/title "Foo/Baz" :build/class-extends [:Bar]}}})
        foo-baz (d/entity @conn :user.class/FooBaz)
        [_ page-uuid] (outliner-page/create! conn "Foo/Baz" {:class? true})]
    (is (= (:block/uuid foo-baz) page-uuid))
    (is (= 1 (count (d/q '[:find [?c ...] :where [?c :block/title "Foo/Baz"]] @conn))))))

(deftest create-titled-with-a-block-uuid-creates-nothing-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"} :blocks [{:block/title "b1"}]}])
        b1 (db-test/find-block-by-content @conn "b1")]
    (is (nil? (outliner-page/create @conn (str (:block/uuid b1)) {})))
    (is (= [nil nil] (outliner-page/create! conn (str (:block/uuid b1)) {})))))
