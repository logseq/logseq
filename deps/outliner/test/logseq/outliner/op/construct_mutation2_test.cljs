(ns logseq.outliner.op.construct-mutation2-test
  "Second-run mutation survivors of logseq.outliner.op.construct."
  (:require [clojure.string :as string]
            [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op.construct :as op-construct]))

(defn- tree-conn
  []
  (db-test/create-conn-with-blocks
   {:classes {:Movie {}}
    :properties {:rating {:logseq.property/type :number}
                 :note {:logseq.property/type :default}}
    :pages-and-blocks
    [{:page {:block/title "page"}
      :blocks [{:block/title "a"
                :build/children [{:block/title "a1"}]}
               {:block/title "b"
                :build/children [{:block/title "b1"}
                                 {:block/title "b2"}]}
               {:block/title "d"}]}
     {:page {:block/title "tplpage"}
      :blocks [{:block/title "tpl"
                :build/children [{:block/title "c1"
                                  :build/properties {:note "hello"}}
                                 {:block/title "c2"}]}]}]}))

(defn- blk
  [conn title]
  (db-test/find-block-by-content @conn title))

;; stable-entity-ref

(deftest stable-entity-ref-returns-ident-of-entity-without-uuid-test
  (let [conn (tree-conn)
        _ (d/transact! conn [{:db/id -1 :db/ident :mutation2/ident-only}])
        eid (:db/id (d/entity @conn :mutation2/ident-only))]
    (is (= :mutation2/ident-only
           (#'op-construct/stable-entity-ref @conn eid)))))

;; sanitize-block-refs / sanitize-block-payload

(deftest sanitize-block-refs-keeps-identity-keys-as-vector-test
  (let [u (random-uuid)
        r (#'op-construct/sanitize-block-refs
           [{:block/uuid u :block/title "T" :db/ident :a/b :block/name "t"}
            {:block/title "no uuid"}])]
    (is (vector? r))
    (is (= [{:block/uuid u :block/title "T" :db/ident :a/b}] r))))

(deftest sanitize-block-payload-collects-created-refs-test
  (let [conn (tree-conn)
        a (random-uuid)
        b (random-uuid)
        block {:block/uuid (random-uuid)
               :block/title "x"
               :block/refs [{:block/uuid a :block/title "A"}
                            {:block/uuid b :block/title "B"}
                            {:block/uuid a :block/title "A"}]}
        r (#'op-construct/sanitize-block-payload @conn block {:created-uuids [a]})
        created (get r op-construct/rebase-created-refs-key)]
    (is (vector? created))
    (is (= [a] created))
    (is (= 3 (count (get r op-construct/rebase-refs-key))))))

(deftest sanitize-block-payload-two-arity-sanitizes-block-test
  (let [conn (tree-conn)
        u (random-uuid)
        r (#'op-construct/sanitize-block-payload @conn {:block/uuid u :block/title "x" :db/id 5})]
    (is (= {:block/uuid u :block/title "x"} r))))

(deftest sanitize-insert-block-payload-drops-page-and-order-only-test
  (let [conn (tree-conn)
        u (random-uuid)
        p (random-uuid)
        r (#'op-construct/sanitize-insert-block-payload
           @conn []
           {:block/uuid u :block/title "x" :block/page 1 :block/order "a0"
            :block/parent [:block/uuid p]})]
    (is (not (contains? r :block/page)))
    (is (not (contains? r :block/order)))
    (is (= [:block/uuid p] (:block/parent r)))))

;; get-missing-ref-by-lookup / rewrite-block-title-with-retracted-refs

(deftest get-missing-ref-by-lookup-builds-page-and-tag-entities-test
  (let [pu (random-uuid)
        tu (random-uuid)
        r (#'op-construct/get-missing-ref-by-lookup
           [{:block/uuid pu :block/title "Plain"}
            {:block/uuid tu :block/title "Tagged" :db/ident :user.class/Tagged}]
           #{[:block/uuid tu]})
        plain (get r [:block/uuid pu])
        tagged (get r [:block/uuid tu])]
    (is (= :logseq.class/Page (:block/tags plain)))
    (is (nil? (:logseq.property.class/extends plain)))
    (is (= "plain" (:block/name plain)))
    (is (= :logseq.class/Tag (:block/tags tagged)))
    (is (= :logseq.class/Root (:logseq.property.class/extends tagged)))
    (is (= :user.class/Tagged (:db/ident tagged)))))

(deftest rewrite-block-title-with-retracted-refs-test
  (let [conn (tree-conn)
        existing (:block/uuid (blk conn "a"))
        gone (random-uuid)
        created (random-uuid)
        block {:block/title (str "x [[" gone "]] y [[" existing "]] z [[" created "]]")
               op-construct/rebase-refs-key [{:block/uuid gone :block/title "Gone"}
                                             {:block/uuid existing :block/title "Exists"}
                                             {:block/uuid created :block/title "Created"}]
               op-construct/rebase-created-refs-key [created]
               :block/refs [[:block/uuid gone]]
               :block/tags [[:block/uuid gone]]}
        r (op-construct/rewrite-block-title-with-retracted-refs @conn block)]
    (testing "only refs missing from the db and not created in this batch are rewritten"
      (is (= (str "x Gone y [[" existing "]] z [[" created "]]")
             (:block/title r))))
    (testing "the rebase keys are removed"
      (is (not (contains? r op-construct/rebase-refs-key)))
      (is (not (contains? r op-construct/rebase-created-refs-key))))
    (testing "missing refs and tags are replaced by entity maps"
      (is (= gone (:block/uuid (first (:block/refs r)))))
      (is (= gone (:block/uuid (first (:block/tags r)))))
      (is (= :logseq.class/Tag (:block/tags (first (:block/tags r))))))))

;; created-block-uuids-from-tx-data / created-db-ident-from-tx-data

(deftest created-block-uuids-from-tx-data-distinct-vector-test
  (let [u (random-uuid)
        u2 (random-uuid)
        r (#'op-construct/created-block-uuids-from-tx-data
           [{:block/uuid u} {:block/uuid u} [:db/add 1 :block/uuid u2]])]
    (is (vector? r))
    (is (= [u u2] r))))

(deftest created-db-ident-from-tx-data-every-form-test
  (let [f #'op-construct/created-db-ident-from-tx-data]
    (is (= :a/map (f [{:db/ident :a/map}])))
    (is (nil? (f [{:db/ident :unqualified}])))
    (is (= :a/datom (f [{:e 1 :a :db/ident :v :a/datom}])))
    (is (= :a/vec (f [[1 :db/ident :a/vec]])))
    (is (= :a/add (f [[:db/add 1 :db/ident :a/add]])))
    (is (nil? (f [[:db/cardinality 1 :db/ident :a/wrong]])))
    (is (nil? (f [])))))

(deftest property-ident-by-title-requires-qualified-ident-test
  (let [conn (tree-conn)
        _ (d/transact! conn [{:db/id -1 :block/title "Odd" :block/tags :logseq.class/Property
                              :db/ident :oddprop}
                             {:db/id -2 :block/title "Good" :block/tags :logseq.class/Property
                              :db/ident :user.property/good}])]
    (is (= :user.property/good (#'op-construct/property-ident-by-title @conn "Good")))
    (is (nil? (#'op-construct/property-ident-by-title @conn "Odd")))))

;; maybe-rewrite-delete-block-ids

(deftest maybe-rewrite-delete-block-ids-from-tx-data-test
  (let [conn (tree-conn)
        b (blk conn "d")
        bid (:db/id b)
        buuid (:block/uuid b)
        f #'op-construct/maybe-rewrite-delete-block-ids]
    (testing "retractEntity ids are distinct, stable and a vector"
      (let [r (f @conn [[:db/retractEntity bid] [:db/retractEntity bid]] [])]
        (is (vector? r))
        (is (= [[:block/uuid buuid]] r))))
    (testing "retracted uuid datom maps"
      (is (= [[:block/uuid buuid]]
             (f @conn [{:e bid :a :block/uuid :v buuid :added false}] []))))
    (testing "retracted uuid Datom records"
      (let [tx-data (:tx-data (d/with @conn [[:db/retractEntity bid]] {}))
            r (f @conn tx-data [])]
        (is (vector? r))
        (is (= [[:block/uuid buuid]] r))))))

(deftest moved-block-ids-from-tx-data-distinct-vector-test
  (let [r (#'op-construct/moved-block-ids-from-tx-data
           [[5 :block/parent 1 100 true] [5 :block/parent 2 100 true]
            [6 :block/parent 1 100 true] [7 :block/parent 1 100 false]
            [8 :block/title "x" 100 true]])]
    (is (vector? r))
    (is (= [5 6] r))))

;; template-children-blocks-for-history

(deftest template-children-blocks-for-history-test
  (let [conn (tree-conn)
        tpl (blk conn "tpl")
        c1 (blk conn "c1")
        c2 (blk conn "c2")
        r (#'op-construct/template-children-blocks-for-history @conn (:db/id tpl))]
    (is (vector? r))
    (testing "property value blocks are included"
      (is (= 3 (count r))))
    (testing "every block keeps its db/id"
      (is (every? some? (map :db/id r)))
      (is (= #{(:db/id c1) (:db/id c2)}
             (set (filter #{(:db/id c1) (:db/id c2)} (map :db/id r))))))
    (testing "only the first block refers to the template"
      (is (= (:db/id tpl) (:logseq.property/used-template (first r))))
      (is (every? nil? (map :logseq.property/used-template (rest r)))))))

;; inserted-block-uuids-from-tx-data / canonicalize-insert-blocks-op

(deftest inserted-block-uuids-from-tx-data-entity-id-test
  (let [u (random-uuid)
        r (#'op-construct/inserted-block-uuids-from-tx-data
           [{:db/id 5 :block/parent 1}
            {:e 5 :a :block/uuid :v u :added true}])]
    (is (= [u] r))))

(deftest canonicalize-insert-blocks-op-three-arity-test
  (let [conn (tree-conn)
        target (blk conn "d")
        u (random-uuid)
        tx-data [{:e 99999 :a :block/uuid :v u :added true}
                 {:e 99999 :a :block/parent :v 1 :added true}]
        r (#'op-construct/canonicalize-insert-blocks-op
           @conn tx-data [[{:block/uuid u :block/title "n"}] (:db/id target) {:sibling? true}])]
    (is (= [:block/uuid (:block/uuid target)] (second r)))
    (is (= u (:block/uuid (ffirst r))))
    (is (true? (:keep-uuid? (nth r 2))))
    (is (true? (:sibling? (nth r 2))))))

(deftest canonicalize-insert-blocks-op-leaves-unchanged-blocks-alone-test
  (let [conn (tree-conn)
        target (blk conn "d")
        u (random-uuid)
        r (#'op-construct/canonicalize-insert-blocks-op
           @conn [] [[{:block/uuid u :block/title "n" :foo '(1 2)}] (:db/id target) {}] [])]
    (is (= '(1 2) (:foo (ffirst r))))))

(deftest canonicalize-template-op-falls-back-on-empty-template-blocks-test
  (let [conn (tree-conn)
        tpl (blk conn "tpl")
        target (blk conn "d")
        [op [_template-ref _target-ref opts]]
        (#'op-construct/canonicalize-template-op
         @conn [] [(:db/id tpl) (:db/id target) {:template-blocks [] :sibling? true}] [])]
    (is (= :apply-template op))
    (is (= 3 (count (:template-blocks opts))))))

(deftest canonicalize-indent-outdent-op-returns-vector-test
  (let [conn (tree-conn)
        a1 (blk conn "a1")
        r (#'op-construct/canonicalize-indent-outdent-op
           @conn [[(:db/id a1) :block/parent (:db/id (:block/parent a1)) 1 true]]
           [(:db/id a1)] false {})]
    (is (vector? r))
    (is (= :move-blocks (ffirst r)))))

;; save-block-keys / block-entity / inverse payloads

(deftest save-block-keys-drops-transient-other-tx-and-nil-test
  (is (= [:block/title]
         (vec (#'op-construct/save-block-keys
               {:db/id 1 :block/title "t" :db/other-tx 3 nil 4 :block/tx-id 9})))))

(deftest block-entity-resolves-map-with-only-db-id-test
  (let [conn (tree-conn)
        b (blk conn "d")
        ent (#'op-construct/block-entity @conn {:db/id (:db/id b)})]
    (is (= (:block/uuid b) (:block/uuid ent)))))

(deftest build-inverse-save-block-keeps-uuid-without-uuid-in-block-test
  (let [conn (tree-conn)
        b (blk conn "d")
        [op [inverse opts]] (#'op-construct/build-inverse-save-block
                             @conn {:db/id (:db/id b) :block/order "zz"} {:x 1})]
    (is (= :save-block op))
    (is (= {:block/uuid (:block/uuid b) :block/order (:block/order b)} inverse))
    (is (= {:x 1} opts))))

(deftest build-insert-block-payload-drops-reverse-attributes-test
  (let [conn (tree-conn)
        b (d/touch (blk conn "b"))
        r (#'op-construct/build-insert-block-payload @conn b)]
    (is (= (:block/uuid b) (:block/uuid r)))
    (is (= "b" (:block/title r)))
    (is (not-any? #(string/starts-with? (name %) "_") (keys r)))))

(deftest build-insert-block-payload-skips-underscore-keys-of-plain-map-test
  (let [conn (tree-conn)
        u (random-uuid)
        r (#'op-construct/build-insert-block-payload
           @conn {:block/uuid u :block/title "x" :block/_parent [1 2] :foo/_bar 3 :foo/baz 4})]
    (is (= {:block/uuid u :block/title "x" :foo/baz 4} r))))

(deftest stale-numeric-id-in-schema-ops-test
  (let [f #'op-construct/stale-numeric-id-in-schema-ops?]
    (is (true? (f :upsert-property [5 {} {}])))
    (is (not (f :upsert-property [:user.property/p {} {}])))
    (is (nil? (f :save-block [5])))))

;; selected-block-roots

(deftest selected-block-roots-test
  (let [conn (tree-conn)
        b (blk conn "b")
        b1 (blk conn "b1")
        d-blk (blk conn "d")
        f #'op-construct/selected-block-roots]
    (testing "duplicate ids give one root"
      (let [{:keys [roots incomplete?]} (f @conn [(:db/id d-blk) (:db/id d-blk)])]
        (is (= [(:db/id d-blk)] (mapv :db/id roots)))
        (is (false? incomplete?))))
    (testing "descendants of a selected block are not roots"
      (let [{:keys [roots]} (f @conn [(:db/id b) (:db/id b1) (:db/id d-blk)])]
        (is (vector? roots))
        (is (= [(:db/id b) (:db/id d-blk)] (mapv :db/id roots)))))
    (testing "an unresolved id makes the selection incomplete"
      (is (true? (:incomplete? (f @conn [(:db/id d-blk) (random-uuid)])))))))

;; block-restore-target / delete-root->restore-plan

(deftest block-restore-target-falls-back-to-page-test
  (let [conn (tree-conn)
        a1 (blk conn "a1")
        page-id (:db/id (:block/page a1))
        _ (d/transact! conn [[:db/retract (:db/id a1) :block/parent (:db/id (:block/parent a1))]])
        ent (d/entity @conn (:db/id a1))]
    (is (nil? (:block/parent ent)))
    (with-redefs [ldb/get-left-sibling (fn [_] nil)]
      (is (= [page-id false] (#'op-construct/block-restore-target ent))))))

(deftest delete-root->restore-plan-self-target-falls-back-to-page-test
  (let [conn (tree-conn)
        a1 (blk conn "a1")
        page (:block/page a1)
        _ (d/transact! conn [[:db/retract (:db/id a1) :block/parent (:db/id (:block/parent a1))]])
        ent (d/entity @conn (:db/id a1))]
    (with-redefs [ldb/get-left-sibling (fn [_] ent)]
      (let [plan (#'op-construct/delete-root->restore-plan @conn ent)]
        (is (= [:block/uuid (:block/uuid page)] (:target-id plan)))
        (is (false? (:sibling? plan)))))))

(deftest delete-root->restore-plan-blocks-vector-test
  (let [conn (tree-conn)
        b (blk conn "b")
        plan (#'op-construct/delete-root->restore-plan @conn b)]
    (is (vector? (:blocks plan)))
    (is (= 3 (count (:blocks plan))))))

(deftest to-insert-op-options-test
  (let [conn (tree-conn)
        target (blk conn "d")]
    (is (= [:insert-blocks [[] [:block/uuid (:block/uuid target)]
                            {:sibling? false :keep-uuid? true :keep-block-order? true}]]
           (#'op-construct/to-insert-op @conn {:blocks [] :target-id (:db/id target)})))))

;; document order and move helpers

(deftest document-order-path-test
  (let [conn (tree-conn)
        b (blk conn "b")
        b2 (blk conn "b2")]
    (is (= (list (:db/id (:block/page b)) (:block/order b) (:block/order b2))
           (#'op-construct/document-order-path b2)))))

(deftest opposite-move-restores-ignores-selected-descendants-test
  (let [conn (tree-conn)
        b (blk conn "b")
        b1 (blk conn "b1")
        f #'op-construct/opposite-move-restores?]
    (is (true? (f @conn [(:db/id b) (:db/id b1)] true)))
    (is (true? (f @conn [(:db/id b) (:db/id b1)] false)))))

(deftest page-top-level-blocks-sorted-by-order-test
  (let [conn (tree-conn)
        a (blk conn "a")
        b (blk conn "b")
        a-order (:block/order a)
        b-order (:block/order b)
        _ (d/transact! conn [[:db/add (:db/id a) :block/order b-order]
                             [:db/add (:db/id b) :block/order a-order]])
        page (d/entity @conn (:db/id (:block/page a)))
        r (#'op-construct/page-top-level-blocks page)]
    (is (vector? r))
    (is (= ["b" "a" "d"] (mapv :block/title r))
        "top-level blocks only, sorted by order")))

;; delete-page inverse for class and property pages

(deftest delete-page-inverse-for-class-and-property-ops-test
  (let [conn (tree-conn)
        class-page (ldb/get-page @conn "Movie")
        property-page (d/entity @conn :user.property/rating)
        inverse (fn [page]
                  (:inverse-outliner-ops
                   (op-construct/derive-history-outliner-ops
                    @conn @conn [] {:outliner-op :delete-page
                                    :outliner-ops [[:delete-page [(:block/uuid page) {}]]]})))
        class-inverse (inverse class-page)
        property-inverse (inverse property-page)]
    (testing "class page is recreated with its namespace and options"
      (is (= [:create-page
              [(:block/title class-page)
               {:uuid (:block/uuid class-page)
                :class? true
                :redirect? false
                :split-namespace? true
                :class-ident-namespace (namespace (:db/ident class-page))}]]
             (first class-inverse))))
    (testing "property page is recreated with its ident and name"
      (let [[op [ident _schema opts]] (first property-inverse)]
        (is (= :upsert-property op))
        (is (= (:db/ident property-page) ident))
        (is (= {:property-name (:block/title property-page)} opts))))))

;; replace-empty-target inverse

(deftest replace-empty-target-inverse-restores-sibling-position-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page"}
                 :blocks [{:block/title "first"}
                          {:block/title ""}]}]})
        first-block (blk conn "first")
        empty-target (blk conn "")
        tx-meta {:outliner-op :insert-blocks
                 :outliner-ops [[:insert-blocks [[{:block/uuid (random-uuid)
                                                   :block/title "pasted"}]
                                                 (:db/id empty-target)
                                                 {:sibling? true
                                                  :replace-empty-target? true
                                                  :outliner-op :paste}]]]}
        {:keys [inverse-outliner-ops]}
        (op-construct/derive-history-outliner-ops @conn @conn [] tx-meta)
        insert-op (some #(when (= :insert-blocks (first %)) %) inverse-outliner-ops)]
    (is (some? insert-op))
    (is (= (:block/uuid first-block) (get-in insert-op [1 1])))
    (is (true? (get-in insert-op [1 2 :sibling?])))))

;; build-strict-inverse-outliner-ops

(deftest build-strict-inverse-outliner-ops-returns-seq-test
  (let [conn (tree-conn)
        page-uuid (random-uuid)
        r (#'op-construct/build-strict-inverse-outliner-ops
           @conn @conn [] [[:create-page ["P" {:uuid page-uuid}]]] [1])]
    (is (seq? r))
    (is (= [[:delete-page [page-uuid {}]]] r))))

(deftest has-replace-empty-target-insert-op-test
  (let [f #'op-construct/has-replace-empty-target-insert-op?]
    (is (f [[:insert-blocks [[] 1 {:replace-empty-target? true}]]]))
    (is (f [[:apply-template [1 2 {:replace-empty-target? true}]]]))
    (is (not (f [[:insert-blocks [[] 1 {}]]])))
    (is (not (f [[:save-block [{} {:replace-empty-target? true}]]])))))

(deftest contains-transact-op-test
  (is (nil? (op-construct/contains-transact-op? nil)))
  (is (true? (op-construct/contains-transact-op? [[:save-block [{} {}]] [:transact [[]]]])))
  (is (true? (op-construct/contains-transact-op? [:transact [[]]])))
  (is (not (op-construct/contains-transact-op? [[:save-block [{} {}]]]))))

;; normalization

(deftest normalize-op-entries-test
  (let [f #'op-construct/normalize-op-entries]
    (is (nil? (f nil)))
    (is (nil? (f [])))
    (let [single (f [:save-block [{:a 1} {}]])]
      (is (vector? single))
      (is (vector? (first single)))
      (is (= [[:save-block [{:a 1} {}]]] single)))
    (let [several (f '([:save-block [{:a 1} {}]] [:delete-page [1 {}]]))]
      (is (vector? several))
      (is (= 2 (count several))))))

(deftest canonical-property-id-resolves-numeric-id-to-ident-test
  (let [conn (tree-conn)
        property (d/entity @conn :user.property/rating)
        f #'op-construct/canonical-property-id]
    (is (= :user.property/rating (f @conn (:db/id property))))
    (is (= :user.property/rating (f @conn :user.property/rating)))
    (is (= "x" (f @conn "x")))))

(deftest normalize-block-op-entry-ids-test
  (let [id (fn [x] [:id x])
        ids (fn [xs] (mapv id xs))
        f #'op-construct/normalize-block-op-entry-ids]
    (is (= [:insert-blocks [[:b] [:id 5] {:o 1}]] (f id ids :insert-blocks [[:b] 5 {:o 1}])))
    (is (= [:delete-blocks [[[:id 1]] {:o 1}]] (f id ids :delete-blocks [[1] {:o 1}])))
    (is (nil? (f id ids :unknown [])))))

(deftest normalize-property-op-entry-ids-test
  (let [id (fn [x] [:id x])
        ids (fn [xs] (mapv id xs))
        property-id (fn [x] [:prop x])
        f #'op-construct/normalize-property-op-entry-ids]
    (is (= [:create-property-text-block [[:id 5] [:prop 6] 7 8]]
           (f id ids property-id :create-property-text-block [5 6 7 8])))
    (is (= [:create-property-text-block [nil [:prop 6] 7 8]]
           (f id ids property-id :create-property-text-block [nil 6 7 8])))
    (is (= [:upsert-property [[:prop 5] :schema :opts]]
           (f id ids property-id :upsert-property [5 :schema :opts])))
    (is (= [:upsert-property [nil :schema :opts]]
           (f id ids property-id :upsert-property [nil :schema :opts])))))

(deftest canonicalize-explicit-outliner-ops-returns-vector-test
  (let [conn (tree-conn)
        u (:block/uuid (blk conn "d"))
        r (#'op-construct/canonicalize-explicit-outliner-ops
           @conn [] [[:rename-page [u "New"]]])]
    (is (vector? r))
    (is (= [[:save-block [{:block/uuid u :block/title "New"} {}]]] r))))

(deftest patch-inverse-delete-block-ops-uses-last-forward-insert-test
  (let [u1 (random-uuid)
        r (#'op-construct/patch-inverse-delete-block-ops
           [[:delete-blocks [[7] {:x 1}]]]
           [[:insert-blocks [[{:block/uuid u1}] 5 {}]]
            [:save-block [{} nil]]])]
    (is (= [[:delete-blocks [[[:block/uuid u1]] {:x 1}]]] r))
    (is (vector? (get-in r [0 1 0])))))

(deftest patch-forward-delete-block-op-ids-test
  (let [conn (tree-conn)
        b (blk conn "d")
        f #'op-construct/patch-forward-delete-block-op-ids]
    (is (nil? (f @conn [])))
    (let [r (f @conn [[:delete-blocks [[(:db/id b)] {}]] [:save-block [{} nil]]])]
      (is (vector? r))
      (is (= [[:delete-blocks [[[:block/uuid (:block/uuid b)]] {}]] [:save-block [{} nil]]] r)))))

(deftest stale-numeric-id-in-page-ops-test
  (let [conn (tree-conn)
        f #'op-construct/stale-numeric-id-in-page-ops?]
    (is (f @conn :rename-page [5 "x"]))
    (is (not (f @conn :rename-page [(random-uuid) "x"])))
    (is (f @conn :delete-page [5 {}]))
    (is (f @conn :restore-recycled [5]))
    (is (f @conn :recycle-delete-permanently [5]))
    (is (f @conn :create-page ["t" {:uuid 5}]))
    (is (f @conn :insert-blocks [[] 5 {}]))
    (is (f @conn :apply-template [5 (random-uuid) {}]))
    (is (f @conn :save-block [{:block/refs #{5}} {}]))
    (is (not (f @conn :save-block [{:block/title "x"} {}])))
    (is (nil? (f @conn :unknown [5])))))

;; derive-history-outliner-ops: explicit inverse ops

(deftest explicit-inverse-op-ids-resolve-in-db-after-then-db-before-test
  (let [conn (tree-conn)
        explicit-inverse (fn [db-before tx eid]
                           (let [{:keys [db-after tx-data]} (d/with db-before tx)]
                             (:inverse-outliner-ops
                              (op-construct/derive-history-outliner-ops
                               db-before db-after tx-data
                               {:db-sync/inverse-outliner-ops
                                [[:set-block-property [eid :logseq.property/heading 1]]]}))))]
    (testing "a block created by the tx resolves to its uuid in db-after"
      (let [page (ldb/get-page @conn "page")
            new-uuid (random-uuid)
            {:keys [db-after]} (d/with @conn [{:block/uuid new-uuid :block/title "new"
                                               :block/page (:db/id page) :block/parent (:db/id page)
                                               :block/order "a9"}])
            new-eid (:db/id (d/entity db-after [:block/uuid new-uuid]))]
        (is (= [[:set-block-property [new-uuid :logseq.property/heading 1]]]
               (explicit-inverse @conn
                                 [{:db/id new-eid :block/uuid new-uuid :block/title "new"
                                   :block/page (:db/id page) :block/parent (:db/id page)
                                   :block/order "a9"}]
                                 new-eid)))))
    (testing "a block retracted by the tx resolves to its uuid in db-before"
      (let [b (blk conn "d")]
        (is (= [[:set-block-property [(:block/uuid b) :logseq.property/heading 1]]]
               (explicit-inverse @conn [[:db/retractEntity (:db/id b)]] (:db/id b))))))))
