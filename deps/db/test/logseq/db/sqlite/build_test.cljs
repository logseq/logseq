(ns logseq.db.sqlite.build-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.test.helper :as db-test]))

(deftest build-tags
  (let [conn (db-test/create-conn)
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/title "page1"}
             :blocks [{:block/title "Jrue Holiday" :build/tags [:Person]}
                      {:block/title "some task" :build/tags [:logseq.class/Task]}]}
            {:page {:block/title "Jayson Tatum" :build/tags [:Person]}}])]
    (is (= [:user.class/Person]
           (mapv :db/ident (:block/tags (db-test/find-block-by-content @conn "Jrue Holiday"))))
        "Person class is created and correctly associated to a block")

    (is (contains?
         (set (map :db/ident (:block/tags (db-test/find-page-by-title @conn "Jayson Tatum"))))
         :user.class/Person)
        "Person class is created and correctly associated to a page")

    (is (= [:logseq.class/Task]
           (mapv :db/ident (:block/tags (db-test/find-block-by-content @conn "some task"))))
        "Built-in class is associatedly correctly")))

(deftest build-properties-user
  (let [conn (db-test/create-conn)
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/title "page1"}
             :blocks [{:block/title "Jrue Holiday" :build/properties {:description "Clutch defense"}}]}
            {:page {:block/title "Jayson Tatum" :build/properties {:description "Awesome selfless basketball"}}}])]
    (is (= "Clutch defense"
           (->> (db-test/find-block-by-content @conn "Jrue Holiday")
                :user.property/description
                db-property/property-value-content))
        "description property is created and correctly associated to a block")

    (is (= "Awesome selfless basketball"
           (->> (db-test/find-page-by-title @conn "Jayson Tatum")
                :user.property/description
                db-property/property-value-content))
        "description property is created and correctly associated to a page")))

(deftest build-properties-built-in
  (let [conn (db-test/create-conn)
        _ (sqlite-build/create-blocks
           conn
           [{:page {:block/title "page1"}
             :blocks [{:block/title "some todo"
                       :build/properties {:logseq.property/status :logseq.property/status.doing}}
                      {:block/title "rojo"
                       :build/properties {:logseq.property/background-color "red"}}]}])]
    (is (= :logseq.property/status.doing
           (->> (db-test/find-block-by-content @conn "some todo")
                :logseq.property/status
                :db/ident))
        "built-in property with closed value is created and correctly associated to a block")

    (is (= "red"
           (->> (db-test/find-block-by-content @conn "rojo")
                :logseq.property/background-color
                db-property/property-value-content))
        "built-in :default property is created and correctly associated to a block")))

(deftest build-properties-with-build-page
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"
                       :build/properties
                       {:date [:build/page {:build/journal 20250223}]
                        :page #{[:build/page {:block/title "page object"
                                              :build/properties {:p1 "foo"
                                                                 :date [:build/page {:build/journal 20250224}]}}]}}}}])]
    (is (= "foo"
           (->> (db-test/find-page-by-title @conn "page object")
                :user.property/p1
                db-property/property-value-content))
        ":build/page page can have a :default property")
    (is (= 20250224
           (->> (db-test/find-page-by-title @conn "page object")
                :user.property/date
                :block/journal-day))
        ":build/page page can have a :date property defined by another :build/page")))

(deftest build-for-existing-blocks
  (let [conn (db-test/create-conn)
        _ (sqlite-build/create-blocks
           conn
           {:properties {:p1 {}}
            :classes {:MyClass {}}
            :pages-and-blocks
            [{:page {:block/title "page1"}
              :blocks [{:block/title "block 1"}
                       {:block/title "block 2"}]}]})
        block (db-test/find-block-by-content @conn "block 1")
        block2 (db-test/find-block-by-content @conn "block 2")
        page1 (db-test/find-page-by-title @conn "page1")
        built-in-page (db-test/find-page-by-title @conn "Quick add")
        {:keys [init-tx block-props-tx]}
        (sqlite-build/build-blocks-tx
         {:pages-and-blocks [{:page
                              {:block/uuid (:block/uuid built-in-page)
                               :build/keep-uuid? true
                               :build/properties {:logseq.property/description "foo"}
                               :block/title "Quick add"}
                              :blocks []}
                             {:page (select-keys (:block/page block) [:block/uuid])
                              :blocks [(merge {:block/title "imported task" :block/uuid (:block/uuid block)}
                                              {:build/properties {:logseq.property/status :logseq.property/status.todo}
                                               :build/tags [:logseq.class/Task]})]}]
          :build-existing-tx? true})
        _ (d/transact! conn init-tx)
        _ (d/transact! conn block-props-tx)
        updated-block (d/entity @conn [:block/uuid (:block/uuid block)])
        {init-tx2 :init-tx block-props-tx2 :block-props-tx :as _tx}
        (sqlite-build/build-blocks-tx
         {:pages-and-blocks [{:page (select-keys (:block/page block2) [:block/uuid])
                              :blocks [(merge {:block/title "imported block" :block/uuid (:block/uuid block2)}
                                              {:build/properties {:user.property/p1 "foo"}
                                               :build/tags [:user.class/MyClass]})]}]
          :properties {:user.property/p1 (select-keys (d/entity @conn :user.property/p1)
                                                      [:logseq.property/type :block/uuid])}
          :build-existing-tx? true})
        _ (d/transact! conn init-tx2)
        _ (d/transact! conn block-props-tx2)
        updated-block2 (d/entity @conn [:block/uuid (:block/uuid block2)])]
;;     (cljs.pprint/pprint _tx)
    (testing "existing page cases"
      (is (= (:block/updated-at page1)
             (:block/updated-at (db-test/find-page-by-title @conn "page1")))
          "Existing page with no property changes didn't get updated")
      (is (not= (:block/updated-at built-in-page)
                (:block/updated-at (db-test/find-page-by-title @conn "Quick add")))
          "Existing page with property changes does get updated"))

    (testing "block with built-in properties and tags"
      (is (= []
             (filter #(and (not= (:block/uuid %) (:block/uuid built-in-page))
                           (or (:db/id %) (:db/ident %)))
                     (concat init-tx block-props-tx)))
          "Tx doesn't try to create new blocks or modify existing idents")
      (is (= "imported task" (:block/title updated-block)))
      (is (= {:block/tags [:logseq.class/Task]
              :logseq.property/status :logseq.property/status.todo}
             (db-test/readable-properties updated-block))
          "Block's properties and tags are updated"))

    (testing "block with existing user properties and tags"
      (is (= "imported block" (:block/title updated-block2)))
      (is (= {:block/tags [:user.class/MyClass]
              :user.property/p1 "foo"}
             (db-test/readable-properties updated-block2))
          "Block's properties and tags are updated"))))

(deftest build-blocks-with-refs
  (let [block-uuid (random-uuid)
        class-uuid (random-uuid)
        page-uuid (random-uuid)
        property-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:classes {:C1 {:block/uuid class-uuid :build/keep-uuid? true}}
               :properties {:p1 {:block/uuid property-uuid :build/keep-uuid? true}}
               :build-existing-tx? true
               :pages-and-blocks
               [{:page {:block/title "page 1"}
                 :blocks [{:block/title "named page ref to [[named page]]"}
                          {:block/title (str "page ref to " (page-ref/->page-ref page-uuid))}
                          {:block/title (str "block ref to " (page-ref/->page-ref block-uuid))}
                          {:block/title (str "class ref to " (page-ref/->page-ref class-uuid))}
                          {:block/title (str "inline class ref to #" (page-ref/->page-ref class-uuid))}
                          {:block/title (str "property ref to " (page-ref/->page-ref property-uuid))}
                          {:block/title "hi" :block/uuid block-uuid :build/keep-uuid? true}]}
                {:page {:block/title "another page" :block/uuid page-uuid :build/keep-uuid? true}}]})
        block-with-named-page-ref (db-test/find-block-by-content @conn #"^named page ref")
        block-with-page-ref (db-test/find-block-by-content @conn #"^page ref")
        block-with-class-ref (db-test/find-block-by-content @conn #"^class ref")
        block-with-inline-class-ref (db-test/find-block-by-content @conn #"^inline class ref")
        block-with-property-ref (db-test/find-block-by-content @conn #"^property ref")
        block-with-block-ref (db-test/find-block-by-content @conn #"^block ref")]
    (is (ldb/internal-page? (db-test/find-page-by-title @conn "named page")))
    (is (contains? (:block/refs block-with-named-page-ref) (db-test/find-page-by-title @conn "named page")))

    (is (= page-uuid (:block/uuid (db-test/find-page-by-title @conn "another page"))))
    (is (contains? (:block/refs block-with-page-ref) (db-test/find-page-by-title @conn "another page")))

    (is (= class-uuid (:block/uuid (d/entity @conn :user.class/C1))))
    (is (contains? (:block/refs block-with-class-ref) (d/entity @conn :user.class/C1)))
    (is (contains? (:block/refs block-with-inline-class-ref) (d/entity @conn :user.class/C1)))

    (is (= property-uuid (:block/uuid (d/entity @conn :user.property/p1))))
    (is (contains? (:block/refs block-with-property-ref) (d/entity @conn :user.property/p1)))

    (is (= block-uuid (:block/uuid (db-test/find-block-by-content @conn "hi"))))
    (is (contains? (:block/refs block-with-block-ref) (db-test/find-block-by-content @conn "hi")))))

(deftest build-class-and-property-pages
  (let [class-uuid (random-uuid)
        property-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:classes {:C1 {:block/uuid class-uuid :build/keep-uuid? true}}
               :properties {:p1 {:block/uuid property-uuid :build/keep-uuid? true}}
               :pages-and-blocks
               [{:page {:block/uuid class-uuid}
                 :blocks [{:block/title "b1"
                           :build/children [{:block/title "b2"}]}]}
                {:page {:block/uuid property-uuid}
                 :blocks [{:block/title "b3"
                           :build/children [{:block/title "b4"}]}]}]
               :build-existing-tx? true})]
    (is (= ["b1" "b2"]
           (->> (d/q '[:find [?b ...] :in $ ?page-id :where [?b :block/page ?page-id]]
                     @conn [:block/uuid class-uuid])
                (map #(:block/title (d/entity @conn %)))))
        "Class page has correct blocks")

    (is (= ["b3" "b4"]
           (->> (d/q '[:find [?b ...] :in $ ?page-id :where [?b :block/page ?page-id]]
                     @conn [:block/uuid property-uuid])
                (map #(:block/title (d/entity @conn %)))))
        "Property page has correct blocks")))

(deftest property-value-with-properties-and-tags
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}}
               :classes {:C1 {}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "block has pvalue with built-in tag"
                           :build/properties
                           {:p1 {:build/property-value :block
                                 :block/title "t1"
                                 :build/tags [:logseq.class/Task]}}}
                          {:block/title "block has pvalue with user tag"
                           :build/properties
                           {:p1 {:build/property-value :block
                                 :block/title "u1"
                                 :build/tags [:C1]}}}
                          {:block/title "Todo query",
                           :build/tags [:logseq.class/Query],
                           :build/properties
                           {:logseq.property/query
                            {:build/property-value :block
                             :block/title "{:query (task Todo)}"
                             :build/properties
                             {:logseq.property.code/lang "clojure"
                              :logseq.property.node/display-type :code}}}}]}]})]
    (is (= {:logseq.property.node/display-type :code
            :logseq.property.code/lang "clojure"}
           (-> (db-test/find-block-by-content @conn "{:query (task Todo)}")
               db-test/readable-properties
               (dissoc :logseq.property/created-from-property))))
    (is (= {:block/tags [:logseq.class/Task]}
           (-> (db-test/find-block-by-content @conn "t1")
               db-test/readable-properties
               (dissoc :logseq.property/created-from-property))))
    (is (= {:block/tags [:user.class/C1]}
           (-> (db-test/find-block-by-content @conn "u1")
               db-test/readable-properties
               (dissoc :logseq.property/created-from-property))))))

(deftest build-ontology-with-multiple-namespaces
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}
                            :other.property/p1 {:logseq.property/type :default}}
               :classes {:user.class/C1 {}
                         :other.class/C1 {}}})]
    (is (entity-util/property? (d/entity @conn :user.property/p1)))
    (is (entity-util/property? (d/entity @conn :other.property/p1)))
    (is (entity-util/class? (d/entity @conn :user.class/C1)))
    (is (entity-util/class? (d/entity @conn :other.class/C1)))))

(deftest build-preserves-class-property-ordering-for-export
  (let [class-properties-c1 [:user.property/p2 :user.property/p1 :user.property/p3]
        class-properties-c2 [:user.property/p4 :user.property/p2 :user.property/p3]
        another-class-properties-c1 [:user.property/p5]
        another-class-properties-c2 [:user.property/p6]
        another-class-properties-c3 [:user.property/p6 :user.property/p5]
        conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}
                            :user.property/p2 {:logseq.property/type :default}
                            :user.property/p3 {:logseq.property/type :default}
                            :user.property/p4 {:logseq.property/type :default}
                            :user.property/p5 {:logseq.property/type :default}
                            :user.property/p6 {:logseq.property/type :default}}
               :classes {:user.class/C1 {:build/class-properties class-properties-c1}
                         :user.class/C2 {:build/class-properties class-properties-c2}
                         :user.class/AnotherC1 {:build/class-properties another-class-properties-c1}
                         :user.class/AnotherC2 {:build/class-properties another-class-properties-c2}
                         :user.class/AnotherC3 {:build/class-properties another-class-properties-c3}}})
        export-map (sqlite-export/build-export @conn {:export-type :graph-ontology})]
    (is (= class-properties-c1
           (get-in export-map [:classes :user.class/C1 :build/class-properties])))
    (is (= class-properties-c2
           (get-in export-map [:classes :user.class/C2 :build/class-properties])))
    (is (= another-class-properties-c3
           (get-in export-map [:classes :user.class/AnotherC3 :build/class-properties]))
        "Later class-level ordering constraint :p6 before :p5 is preserved")))