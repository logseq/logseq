(ns logseq.outliner.core-edges-test
  "Cases of the outliner core that no other test checks: a change to any of
   these lines left every test passing."
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(deftest orphaned-page-refs-retract-only-the-page-no-longer-referenced
  ;; a block's title held [[Kept]] [[Dropped]] (by uuid, as the editor saves
  ;; it), both empty pages referenced only there; the new title keeps Kept
  (let [block-uuid (random-uuid)
        kept-uuid (random-uuid)
        dropped-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks [{:page {:block/title "Kept" :block/uuid kept-uuid} :blocks []}
                                               {:page {:block/title "Dropped" :block/uuid dropped-uuid} :blocks []}
                                               {:page {:block/title "page1"}
                                                :blocks [{:block/title (str "[[" kept-uuid "]] [[" dropped-uuid "]]")
                                                          :block/uuid block-uuid}]}])
        db @conn
        block (d/entity db [:block/uuid block-uuid])
        kept (d/entity db [:block/uuid kept-uuid])
        dropped (d/entity db [:block/uuid dropped-uuid])
        retracts (fn [new-refs]
                   (let [txs (atom [])]
                     (#'outliner-core/remove-orphaned-page-refs! db block txs [kept dropped] new-refs)
                     @txs))]
    (testing "a new ref given by its db id alone keeps its page"
      (is (= [[:db/retractEntity (:db/id dropped)]] (retracts [{:db/id (:db/id kept)}]))))
    (testing "a new ref given by its name keeps its page"
      (is (= [[:db/retractEntity (:db/id dropped)]] (retracts [{:block/name "kept"}]))))
    (testing "unchanged refs retract nothing"
      (let [txs (atom [])]
        (#'outliner-core/remove-orphaned-page-refs! db block txs [kept dropped] [kept dropped])
        (is (empty? @txs))))))

(deftest orphaned-page-refs-keep-a-page-another-block-references
  (let [block-uuid (random-uuid)
        shared-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks [{:page {:block/title "Shared" :block/uuid shared-uuid} :blocks []}
                                               {:page {:block/title "page1"}
                                                :blocks [{:block/title (str "[[" shared-uuid "]]") :block/uuid block-uuid}
                                                         {:block/title (str "also [[" shared-uuid "]]")}]}])
        db @conn
        block (d/entity db [:block/uuid block-uuid])
        shared (d/entity db [:block/uuid shared-uuid])
        txs (atom [])]
    (#'outliner-core/remove-orphaned-page-refs! db block txs [shared] [])
    (is (empty? @txs))))

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

(deftest compare-order-paths-cases
  (let [cmp #'outliner-core/compare-order-paths]
    (is (zero? (cmp [] [])))
    (is (zero? (cmp ["a" "b"] ["a" "b"])))
    (is (= -1 (cmp [] ["a"])))
    (is (= 1 (cmp ["a"] [])))
    (is (= -1 (cmp ["a"] ["a" "b"])) "a parent sorts before its child")
    (is (neg? (cmp ["a" "b"] ["a" "c"])))
    (is (pos? (cmp ["b"] ["a" "z"])))))

(deftest outline-order-path-cases
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "p" :build/children [{:block/title "c1"}]}
                         {:block/title "b1" :build/properties {:default "the value"}}]}])
        path #'outliner-core/outline-order-path
        p (db-test/find-block-by-content @conn "p")
        c1 (db-test/find-block-by-content @conn "c1")]
    (is (= [(:block/order p) (:block/order c1)] (take-last 2 (path c1))))
    (is (nil? (path (db-test/find-block-by-content @conn "the value"))) "a property value has no outline path")))

(deftest get-block-orders-cases
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "t" :build/children [{:block/title "first child"}]}
                         {:block/title "r"}]}])
        orders #'outliner-core/get-block-orders
        t (db-test/find-block-by-content @conn "t")
        r (db-test/find-block-by-content @conn "r")
        ot (:block/order t)
        or' (:block/order r)
        mid (str ot "V")
        between? #(and (pos? (compare % ot)) (neg? (compare % or')))]
    (is (between? mid))
    (testing "kept orders that fall at the target stay, children's too"
      (is (= [mid "child"] (vec (orders [{:block/level 1 :block/order mid} {:block/level 2 :block/order "child"}] t true true)))))
    (testing "a kept top-level order below the target gets a new one at the target; a child keeps its own"
      (let [[o child] (orders [{:block/level 1 :block/order "0"} {:block/level 2 :block/order "child"}] t true true)]
        (is (between? o))
        (is (= "child" child))))
    (testing "a kept top-level order above the right sibling gets a new one at the target"
      (is (between? (first (orders [{:block/level 1 :block/order "~~"}] t true true)))))
    (testing "without keep, every block gets a new order at the target"
      (let [os (orders [{:block/level 1 :block/order mid} {:block/level 1 :block/order mid}] t true false)]
        (is (every? between? os))
        (is (apply distinct? os) "two blocks that had the same order get two")))
    (testing "two kept top-level orders below the target get new ones at the target, in their order"
      (let [[o1 o2] (orders [{:block/level 1 :block/order "0"} {:block/level 1 :block/order "1"}] t true true)]
        (is (between? o1))
        (is (neg? (compare o1 o2)))))
    (testing "as children, the orders go before the first child"
      (let [first-child (db-test/find-block-by-content @conn "first child")]
        (is (every? #(neg? (compare % (:block/order first-child)))
                    (orders [{:block/level 1}] t false false)))))))

(deftest blocks-inserted-next-to-a-numbered-list-item-are-numbered
  (let [f #'outliner-core/blocks-with-ordered-list-props
        numbered {:logseq.property/order-list-type {:db/id 42}}
        list-type #(let [v (:logseq.property/order-list-type %)] (if (map? v) (:db/id v) v))
        u1 (random-uuid)
        u2 (random-uuid)
        blocks [{:block/uuid u1}
                {:block/uuid u2 :logseq.property/order-list-type {:db/id 7}}
                {:block/title "no uuid"}]]
    (testing "as siblings of a numbered item: new blocks take its list type, a block with its own keeps it"
      (is (= [42 7 nil] (map list-type (f blocks numbered true)))))
    (testing "as siblings of a plain block nothing changes"
      (is (= blocks (f blocks {:block/title "plain"} true))))
    (testing "as children of a numbered item with no children nothing changes (the list type comes from the first child)"
      (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"} :blocks [{:block/title "t"}]}])
            t (db-test/find-block-by-content @conn "t")
            _ (d/transact! conn [[:db/add (:db/id t) :logseq.property/order-list-type (:db/id (:block/page t))]])
            t (d/entity @conn (:db/id t))]
        (is (some? (list-type t)))
        (is (= blocks (f blocks t false)))))
    (testing "as children of a block whose first child is numbered: new blocks take that child's list type"
      (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"}
                                                    :blocks [{:block/title "t" :build/children [{:block/title "c"}]}]}])
            c (db-test/find-block-by-content @conn "c")
            type-id (:db/id (:block/page c))
            _ (d/transact! conn [[:db/add (:db/id c) :logseq.property/order-list-type type-id]])
            t (db-test/find-block-by-content @conn "t")]
        (is (= type-id (list-type (first (f [{:block/uuid (random-uuid)}] t false)))))))))

(deftest template-insert-points-refs-inside-the-template-at-the-new-blocks
  (let [a-uuid (random-uuid)
        b-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              [{:page {:block/title "template"}
                :blocks [{:block/title "b" :block/uuid b-uuid}
                         {:block/title (str "see [[" b-uuid "]]") :block/uuid a-uuid}]}
               {:page {:block/title "page1"} :blocks [{:block/title "target"}]}])
        _ (d/transact! conn [[:db/add [:block/uuid a-uuid] :block/refs [:block/uuid b-uuid]]])
        a (d/entity @conn [:block/uuid a-uuid])
        b (d/entity @conn [:block/uuid b-uuid])
        target (db-test/find-block-by-content @conn "target")]
    (is (= [b-uuid] (map :block/uuid (:block/refs a))))
    (let [{:keys [blocks]} (outliner-core/insert-blocks @conn [b a] target {:sibling? true :insert-template? true})
          [new-b new-a] blocks]
      (is (not= b-uuid (:block/uuid new-b)))
      (is (= (str "see [[" (:block/uuid new-b) "]]") (:block/title new-a))))))

(deftest a-copied-block-does-not-take-the-source-db-id
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"} :blocks [{:block/title "src"} {:block/title "target"}]}])
        src (db-test/find-block-by-content @conn "src")
        {:keys [tx-data]} (outliner-core/insert-blocks @conn [src] (db-test/find-block-by-content @conn "target") {:sibling? true})]
    (is (not-any? #(and (map? %) (= (:db/id src) (:db/id %))) tx-data))))

(deftest remove-tags-when-title-changed-cases
  (let [f #'outliner-core/remove-tags-when-title-changed
        u (random-uuid)
        tag {:db/id 5 :block/uuid u}
        block {:db/id 9 :block/raw-title (str "x #[[" u "]]") :block/tags [tag]}]
    (is (= [[:db/retract 9 :block/tags 5]] (f block "x")) "an inline tag deleted from the title goes")
    (is (empty? (f block (str "y #[[" u "]]"))) "an inline tag still in the title stays")
    (is (empty? (f (assoc block :block/raw-title "x") "x")) "a tag that was never inline stays")
    (is (nil? (f block nil)) "no new title, nothing to do")))

(deftest fix-tag-ids-drops-a-tag-whose-ref-differs-only-in-case
  (let [conn (db-test/create-conn)
        m {:block/refs [{:block/name "foo" :block/title "Foo" :block/uuid (random-uuid)}]
           :block/tags [{:block/name "foo" :block/title "foo"}]}]
    (is (empty? (:block/tags (#'outliner-core/fix-tag-ids m @conn))))))

(deftest inline-tag-disallowed-for-a-class-given-by-ident-alone
  (let [conn (db-test/create-conn)]
    (is (true? (#'outliner-core/inline-tag-disallowed? @conn {:db/ident :logseq.class/Page})))))

(deftest leaf-property-values-take-no-child
  (let [forbidden? #'outliner-core/leaf-property-value-forbidden-target?
        url-many {:logseq.property/created-from-property {:logseq.property/type :url
                                                          :db/cardinality :db.cardinality/many}}
        default-block {:db/id 3}
        default-value-block {:db/id 3 :block/parent {:logseq.property/default-value default-block}}]
    (is (false? (boolean (forbidden? url-many true))) "a sibling of a URL value of a many-valued property is allowed")
    (is (true? (boolean (forbidden? default-value-block false))) "a property's default value takes no child")
    (is (false? (boolean (forbidden? {:db/id 4 :block/parent {:logseq.property/default-value default-block}} false)))
        "another block under that property takes children")))

(deftest a-block-moved-to-another-page-takes-its-children-along
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "from"}
                :blocks [{:block/title "p" :build/children [{:block/title "c" :build/children [{:block/title "g"}]}]}]}
               {:page {:block/title "to"} :blocks [{:block/title "t"}]}])
        to (db-test/find-page-by-title @conn "to")]
    (outliner-core/move-blocks! conn [(db-test/find-block-by-content @conn "p")] (db-test/find-block-by-content @conn "t") {:sibling? true})
    (is (= #{(:db/id to)} (set (map #(:db/id (:block/page (db-test/find-block-by-content @conn %))) ["p" "c" "g"]))))))

(deftest moving-property-values-up
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:many {:logseq.property/type :default :db/cardinality :many}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b" :build/properties {:many #{"v1" "v2"}}}]}]})
        values #(map :block/title (sort-by :block/order (:user.property/many (db-test/find-block-by-content @conn "b"))))
        [first-value second-value] (values)]
    (outliner-core/move-blocks-up-down! conn [(db-test/find-block-by-content @conn first-value)] true)
    (is (= [first-value second-value] (values)) "the first value does not move up out of the property")
    (is (= "b" (:block/title (:block/parent (db-test/find-block-by-content @conn first-value)))))))

(deftest a-paste-through-insert-blocks!-keeps-its-op
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"} :blocks [{:block/title "target"}]}])]
    (outliner-core/insert-blocks! conn [{:block/uuid (random-uuid) :block/title "pic" :logseq.property.asset/type "png"}
                                       {:block/uuid (random-uuid) :block/title "plain"}]
                                  (db-test/find-block-by-content @conn "target") {:sibling? true :outliner-op :paste})
    (is (nil? (db-test/find-block-by-content @conn "pic")))
    (is (some? (db-test/find-block-by-content @conn "plain")))))

(deftest resolve-refs-dedup-cases
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "Existing"} :blocks []}])
        db @conn
        dedup #'outliner-core/resolve-refs-dedup
        page-ref (fn [title] {:block/type "page" :block/title title
                              :block/name (string/lower-case title) :block/uuid (random-uuid)})]
    (testing "two refs to one new page create it once"
      (let [[[r1 tx1] [r2 tx2]] (dedup db [(page-ref "Fresh") (page-ref "Fresh")] #{})]
        (is (seq tx1))
        (is (nil? tx2))
        (is (= (:block/uuid r1) (:block/uuid r2)))))
    (testing "#Movie and #movie are two classes"
      (let [[[r1 tx1] [r2 tx2]] (dedup db [(page-ref "Movie") (page-ref "movie")] #{"movie"})]
        (is (seq tx1))
        (is (seq tx2))
        (is (not= (:block/uuid r1) (:block/uuid r2)))))
    (testing "a ref to an existing page reuses it"
      (let [[[r tx]] (dedup db [(page-ref "Existing")] #{})]
        (is (nil? tx))
        (is (= (:block/uuid (db-test/find-page-by-title db "Existing")) (:block/uuid r)))))
    (testing "a new journal ref creates a journal"
      (let [[[_ tx]] (dedup db [(assoc (page-ref "Dec 16th, 2024") :block/type "journal")] #{})]
        (is (some :block/journal-day tx))))))

(deftest get-top-level-blocks-puts-a-selection-in-page-order
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "p" :build/children [{:block/title "last child"}]}
                         {:block/title "next"}]}])
        f #'outliner-core/get-top-level-blocks
        b #(db-test/find-block-by-content @conn %)
        titles #(map :block/title %)]
    (is (= ["p" "next"] (titles (f [(b "next") (b "p")] false))) "two siblings given back to front")
    (is (= ["last child" "next"] (titles (f [(b "next") (b "last child")] false)))
        "a last child and its parent's next sibling given back to front")))

(deftest insert-blocks-pages-uuids-and-history
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Existing"} :blocks []}
               {:page {:block/title "page1"} :blocks [{:block/title "target"}]}])
        target (db-test/find-block-by-content @conn "target")
        existing (db-test/find-page-by-title @conn "Existing")
        insert (fn [blocks opts] (outliner-core/insert-blocks @conn blocks target (merge {:sibling? true} opts)))]
    (testing "pasting a copied page links to the existing page instead of making another"
      (let [{:keys [blocks]} (insert [{:block/uuid (random-uuid) :block/name "existing" :block/title "Existing"}] {:outliner-op :paste})]
        (is (= (:db/id existing) (:block/link (first blocks))))
        (is (= "" (:block/title (first blocks))))))
    (testing "a map with a page name is inserted as a page, with no :block/page"
      (let [{:keys [blocks]} (insert [{:block/uuid (random-uuid) :block/name "another" :block/title "another"}] {})]
        (is (not (contains? (first blocks) :block/page)))))
    (testing "without keep-uuid? an inserted block gets a new uuid"
      (let [u (random-uuid)
            {:keys [blocks]} (insert [{:block/uuid u :block/title "x"}] {})]
        (is (not= u (:block/uuid (first blocks))))))
    (testing "the insert's history carries the pages it creates in the refs"
      (let [page-uuid (random-uuid)
            {:keys [tx-meta]} (insert [{:block/uuid (random-uuid)
                                        :block/title (str "[[" page-uuid "]]")
                                        :block/refs [{:block/uuid page-uuid :block/type "page"
                                                      :block/name "fresh page" :block/title "fresh page"}]}] {})
            ref (first (:block/refs (first (get-in tx-meta [:outliner-ops 0 1 0]))))]
        (is (= "fresh page" (:block/title ref)))
        (is (some? (:block/tags ref)) "the page's tags from the page it creates")))))

(deftest container-page-of-a-page-nested-under-a-block
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"} :blocks [{:block/title "b1"}]}
               {:page {:block/title "nested"} :blocks []}
               {:page {:block/title "child page"} :blocks []}])
        b1 (db-test/find-block-by-content @conn "b1")
        page1 (db-test/find-page-by-title @conn "page1")
        _ (d/transact! conn [[:db/add (:db/id (db-test/find-page-by-title @conn "nested")) :block/parent (:db/id b1)]
                             [:db/add (:db/id (db-test/find-page-by-title @conn "child page")) :block/parent (:db/id page1)]])
        f #'outliner-core/container-page-eid]
    (is (nil? (f (db-test/find-page-by-title @conn "nested"))) "a page under a block is in no page")
    (is (= (:db/id page1) (f (db-test/find-page-by-title @conn "child page"))))
    (is (= (:db/id page1) (f b1)))))

(deftest a-move-up-onto-a-collapsed-block-targets-the-block
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "p" :block/collapsed? true :build/children [{:block/title "c"}]}
                         {:block/title "x"}]}])
        p (db-test/find-block-by-content @conn "p")
        x (db-test/find-block-by-content @conn "x")
        [target sibling?] (#'outliner-core/get-target-block @conn [x] p
                                                            {:outliner-op :move-blocks-up-down :up? true :sibling? false})]
    (is (= "p" (:block/title target)))
    (is (false? sibling?))))

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

(deftest get-target-block-cases
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "t" :build/children [{:block/title "p" :build/children [{:block/title "c1"}]}]}
                         {:block/title "x"}
                         {:block/title "leaf"}
                         {:block/title "l" :build/children [{:block/title "l1"} {:block/title "l2"}]}
                         {:block/title "linked"}]}])
        b #(db-test/find-block-by-content @conn %)
        target (fn [blocks t opts]
                 (let [[block sibling?] (#'outliner-core/get-target-block @conn blocks t opts)]
                   [(:block/title block) sibling?]))]
    (d/transact! conn [[:db/add (:db/id (b "linked")) :block/link (:db/id (b "l"))]])
    (testing "a target given by its uuid alone"
      (is (= ["leaf" true] (target [] {:block/uuid (:block/uuid (b "leaf"))}
                                    {:outliner-op :insert-blocks :sibling? true}))))
    (testing "a move up whose target is the first block's grandparent stays under it"
      (is (= ["t" false] (target [(b "c1") (b "x")] (b "t")
                                 {:outliner-op :move-blocks-up-down :up? true :sibling? false}))))
    (testing "an insert at the top of a block goes in as its first child"
      (is (= ["l" false] (target [] (b "l") {:outliner-op :insert-blocks :top? true :sibling? true}))))
    (testing "an insert at the bottom of a block with no children goes in as its child"
      (is (= ["leaf" false] (target [] (b "leaf") {:outliner-op :insert-blocks :bottom? true :sibling? false}))))
    (testing "an indent onto a linked block goes after the last child of the block it links"
      (is (= ["l2" true] (target [] (b "linked") {:outliner-op :indent-outdent-blocks :indent? true :sibling? false}))))
    (testing "an outdent onto a linked block takes the linked block itself"
      (is (= ["linked" true] (target [] (b "linked") {:outliner-op :indent-outdent-blocks :indent? false :sibling? true}))))))

(deftest insert-blocks-cases
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "src"} {:block/title ""} {:block/title "full"}]}])
        b #(db-test/find-block-by-content @conn %)
        insert (fn [blocks target opts] (outliner-core/insert-blocks @conn blocks target opts))]
    (testing "an inserted block gets new timestamps"
      (let [{:keys [blocks]} (insert [{:block/uuid (random-uuid) :block/title "new" :block/created-at 1 :block/updated-at 1}]
                                     (b "src") {:sibling? true})]
        (is (< 1 (:block/created-at (first blocks))))))
    (testing "an existing block given by its db id alone brings its content"
      (let [{:keys [blocks]} (insert [{:db/id (:db/id (b "src"))}] (b "full") {:sibling? true})]
        (is (= "src" (:block/title (first blocks))))))
    (testing "a paste drops an asset block, an insert keeps it"
      (let [asset {:block/uuid (random-uuid) :block/title "pic" :logseq.property.asset/type "png"}
            plain {:block/uuid (random-uuid) :block/title "plain"}]
        (is (= ["plain"] (map :block/title (:blocks (insert [asset plain] (b "src") {:sibling? true :outliner-op :paste})))))
        (is (= ["pic" "plain"] (map :block/title (:blocks (insert [asset plain] (b "src") {:sibling? true})))))))
    (testing "one block inserted after an empty block keeps the empty block"
      (let [empty-block (b "")
            {:keys [blocks]} (insert [{:block/uuid (random-uuid) :block/title "one"}] empty-block {:sibling? true})]
        (is (not= (:db/id empty-block) (:db/id (first blocks))))))
    (testing "asking to replace a target that is not empty does not replace it"
      (let [full (b "full")
            {:keys [blocks]} (insert [{:block/uuid (random-uuid) :block/title "x"}
                                      {:block/uuid (random-uuid) :block/title "y"}]
                                     full {:sibling? true :replace-empty-target? true})]
        (is (not-any? #(= (:db/id full) (:db/id %)) blocks))))
    (testing "the insert's history keeps the inserted uuids"
      (let [{:keys [tx-meta]} (insert [{:block/uuid (random-uuid) :block/title "h"}] (b "src") {:sibling? true})]
        (is (true? (get-in tx-meta [:outliner-ops 0 1 2 :keep-uuid?])))))))

(deftest deleting-the-value-of-a-property-with-a-default-empties-the-property
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:default {:logseq.property/type :default
                                      :build/properties {:logseq.property/default-value "foo"}}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b2" :build/properties {:default "bar"}}]}]})
        b2 (db-test/find-block-by-content @conn "b2")
        bar (:user.property/default b2)]
    (is (= "bar" (:block/title bar)))
    (outliner-core/delete-blocks! conn [bar] {})
    (is (= :logseq.property/empty-placeholder
           (:db/ident (:user.property/default (d/entity @conn (:db/id b2))))))))

(deftest deleting-two-values-of-a-property-with-a-default-deletes-both
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:many {:logseq.property/type :default
                                   :db/cardinality :many
                                   :build/properties {:logseq.property/default-value "foo"}}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b2" :build/properties {:many #{"bar" "baz"}}}]}]})
        b2 (db-test/find-block-by-content @conn "b2")
        values (sort-by :block/order (:user.property/many b2))]
    (is (= #{"bar" "baz"} (set (map :block/title values))))
    (outliner-core/delete-blocks! conn values {})
    (is (every? #(nil? (d/entity @conn (:db/id %))) values))))

(deftest delete-of-a-non-consecutive-selection-deletes-each-block
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"} {:block/title "b2"} {:block/title "b3"}]}])]
    (outliner-core/delete-blocks! conn [(db-test/find-block-by-content @conn "b1")
                                       (db-test/find-block-by-content @conn "b3")] {})
    (is (nil? (db-test/find-block-by-content @conn "b1")))
    (is (nil? (db-test/find-block-by-content @conn "b3")))
    (is (some? (db-test/find-block-by-content @conn "b2")))))

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
