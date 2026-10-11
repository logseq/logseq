(ns logseq.outliner.core-edges-test
  "Cases of the outliner core that no other test checks: a change to any of
   these lines left every test passing."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(defn- children-titles
  [db block]
  (map :block/title (sort-by :block/order (:block/_parent (d/entity db (:db/id block))))))

(defn- parent-title
  [db title]
  (:block/title (:block/parent (db-test/find-block-by-content db title))))

(deftest indent-goes-after-the-last-child-of-the-block-above
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}
                         {:block/title "b2" :build/children [{:block/title "c"}]}
                         {:block/title "b3"}]}])]
    (outliner-core/indent-outdent-blocks! conn [(db-test/find-block-by-content @conn "b3")] true)
    (is (= ["c" "b3"] (children-titles @conn (db-test/find-block-by-content @conn "b2"))))))

(deftest indent-of-two-blocks-goes-under-the-block-above-the-first
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1" :build/children [{:block/title "c"}]}
                         {:block/title "b2"}
                         {:block/title "b3"}]}])]
    (outliner-core/indent-outdent-blocks! conn [(db-test/find-block-by-content @conn "b2")
                                               (db-test/find-block-by-content @conn "b3")] true)
    (is (= ["c" "b2" "b3"] (children-titles @conn (db-test/find-block-by-content @conn "b1"))))))

(deftest indent-into-a-collapsed-block-expands-it
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b2" :block/collapsed? true :build/children [{:block/title "c"}]}
                         {:block/title "b3"}]}])]
    (outliner-core/indent-outdent-blocks! conn [(db-test/find-block-by-content @conn "b3")] true)
    (is (false? (:block/collapsed? (db-test/find-block-by-content @conn "b2"))))
    (is (= "b2" (parent-title @conn "b3")))))

(deftest indent-under-a-block-with-no-children
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"} {:block/title "b2"}]}])]
    (outliner-core/indent-outdent-blocks! conn [(db-test/find-block-by-content @conn "b2")] true)
    (is (= "b1" (parent-title @conn "b2")))
    (is (= ["b2"] (children-titles @conn (db-test/find-block-by-content @conn "b1"))))))

(deftest indent-of-a-non-consecutive-selection-does-nothing
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b0"} {:block/title "b1"} {:block/title "b2"} {:block/title "b3"}]}])]
    (outliner-core/indent-outdent-blocks! conn [(db-test/find-block-by-content @conn "b1")
                                               (db-test/find-block-by-content @conn "b3")] true)
    (is (= "page1" (parent-title @conn "b1")))
    (is (= "page1" (parent-title @conn "b3")))))

(deftest outdent-to-the-original-parent-goes-after-it
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "p" :build/children [{:block/title "c1"} {:block/title "c2"}]}
                         {:block/title "q"}]}])
        q (db-test/find-block-by-content @conn "q")]
    (outliner-core/indent-outdent-blocks! conn [(db-test/find-block-by-content @conn "c1")] false
                                          {:parent-original q})
    (is (= "page1" (parent-title @conn "c1")))
    (is (= ["c2"] (children-titles @conn (db-test/find-block-by-content @conn "p"))))))

(deftest direct-outdent-takes-the-right-siblings-after-its-own-children
  ;; p [c1 c2 [g] c3]: outdenting c2 makes c3 c2's child, after g
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "p" :build/children [{:block/title "c1"}
                                                            {:block/title "c2" :build/children [{:block/title "g"}]}
                                                            {:block/title "c3"}]}]}])]
    (outliner-core/indent-outdent-blocks! conn [(db-test/find-block-by-content @conn "c2")] false)
    (is (= "page1" (parent-title @conn "c2")))
    (is (= ["g" "c3"] (children-titles @conn (db-test/find-block-by-content @conn "c2"))))))

(deftest a-property-value-block-is-not-outdented
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1" :build/properties {:default "the value"}}]}])
        value (db-test/find-block-by-content @conn "the value")
        parent-before (:db/id (:block/parent value))]
    (is (some? (:logseq.property/created-from-property value)))
    (outliner-core/indent-outdent-blocks! conn [value] false)
    (is (= parent-before (:db/id (:block/parent (db-test/find-block-by-content @conn "the value")))))))

(deftest matching-ref-for-tag-prefers-the-exact-title-then-the-first
  (let [match #'outliner-core/matching-ref-for-tag
        lower {:block/uuid 1 :block/title "foo"}
        upper {:block/uuid 2 :block/title "Foo"}]
    (testing "a ref whose title is the tag's, in the same case, wins"
      (is (= upper (match {:block/title "Foo"} [lower upper]))))
    (testing "with no exact title, the first ref"
      (is (= lower (match {:block/title "FOO"} [lower upper]))))))

(deftest fix-tag-ids-takes-the-uuid-of-the-ref-with-the-tag-name
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"} :blocks []}])
        foo-uuid (random-uuid)
        bar-uuid (random-uuid)
        refs [{:block/name "bar" :block/title "Bar" :block/uuid bar-uuid}
              {:block/name "foo" :block/title "Foo" :block/uuid foo-uuid}]
        fix #'outliner-core/fix-tag-ids]
    (testing "a tag map takes the uuid of the ref with its name, not another ref's"
      (is (= [foo-uuid]
             (map :block/uuid (:block/tags (fix {:block/refs refs
                                                 :block/tags [{:block/name "foo" :block/title "Foo"}]}
                                                @conn))))))
    (testing "a tag given as a db id is looked up, then takes the ref's uuid"
      (d/transact! conn [{:db/ident :user.class/foo
                          :block/name "foo"
                          :block/title "Foo"
                          :block/uuid (random-uuid)
                          :block/tags :logseq.class/Tag}])
      (let [tag-id (:db/id (d/entity @conn :user.class/foo))]
        (is (= [foo-uuid]
               (map :block/uuid (:block/tags (fix {:block/refs refs
                                                   :block/tags [{:db/id tag-id}]}
                                                  @conn)))))))))

(deftest add-missing-tag-idents-only-for-new-tags
  (let [conn (db-test/create-conn)
        add #'outliner-core/add-missing-tag-idents]
    (testing "an existing tag (it has a db id and an ident) is left alone"
      (is (empty? (add @conn [{:db/id 10
                               :db/ident :user.class/existing
                               :block/uuid (random-uuid)
                               :block/title "Existing"}]))))
    (testing "a new tag gets an ident, extends Root and is no longer a page"
      (let [new-uuid (random-uuid)
            eid [:block/uuid new-uuid]
            tx (add @conn [{:block/uuid new-uuid :block/title "Brand new"}])]
        (is (= 3 (count tx)))
        (is (= [[:db/add eid :logseq.property.class/extends :logseq.class/Root]
                [:db/retract eid :block/tags :logseq.class/Page]]
               (rest tx)))))))

(deftest inline-tag-disallowed-for-a-built-in-page-named-by-title
  (let [conn (db-test/create-conn)
        disallowed? #'outliner-core/inline-tag-disallowed?]
    (is (true? (disallowed? @conn {:block/title "Contents"})))
    (is (not (disallowed? @conn {:block/title "Ordinary"})))))

(deftest url-property-value-takes-no-child
  (let [forbidden? #'outliner-core/url-property-value-forbidden-target?
        url-value {:logseq.property/created-from-property {:logseq.property/type :url
                                                           :db/cardinality :db.cardinality/one}}]
    (is (true? (forbidden? url-value false)) "a child of a URL value")
    (is (true? (forbidden? url-value true)) "a sibling of a single URL value")
    (is (false? (forbidden? {:block/title "plain"} false)))))

(deftest page-updated-at-keeps-the-created-at-a-page-has
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"} :blocks []}])
        page (db-test/find-page-by-title @conn "page1")
        tx-for #(#'outliner-core/page-updated-at-tx @conn (:db/id page))]
    (is (some? (:block/created-at page)))
    (is (not (contains? (tx-for) :block/created-at)) "the page has one: it stays")
    (d/transact! conn [[:db/retract (:db/id page) :block/created-at]])
    (is (contains? (tx-for) :block/created-at) "the page has none: it gets one")))

(deftest a-sibling-of-a-nested-page-lands-on-the-page-it-is-nested-in
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "parent page"} :blocks []}
                                               {:page {:block/title "nested page"} :blocks []}])
        parent (db-test/find-page-by-title @conn "parent page")
        nested (db-test/find-page-by-title @conn "nested page")
        _ (d/transact! conn [[:db/add (:db/id nested) :block/parent (:db/id parent)]])
        nested (d/entity @conn (:db/id nested))]
    (is (= (:db/id parent) (#'outliner-core/get-target-block-page nested true)))))

(deftest insert-at-the-bottom-goes-after-the-last-child
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "c1"} {:block/title "c2"}]}]}])
        parent (db-test/find-block-by-content @conn "parent")
        [target sibling?] (#'outliner-core/get-target-block @conn [] {:db/id (:db/id parent)}
                                                            {:outliner-op :insert-blocks
                                                             :bottom? true
                                                             :sibling? false})]
    (is (= "c2" (:block/title target)))
    (is (true? sibling?))))

(deftest move-up-into-the-parent-of-the-first-moved-block
  ;; c1 is the first child of p, x comes after p: moving [c1 x] up with p as
  ;; the target goes before p, not into p after its last child
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "p" :build/children [{:block/title "c1"}]}
                         {:block/title "x"}]}])
        p (db-test/find-block-by-content @conn "p")
        c1 (db-test/find-block-by-content @conn "c1")
        x (db-test/find-block-by-content @conn "x")
        [target sibling?] (#'outliner-core/get-target-block @conn [c1 x] p
                                                            {:outliner-op :move-blocks-up-down
                                                             :up? true
                                                             :sibling? false})]
    (is (= "p" (:block/title target)))
    (is (false? sibling?))))
