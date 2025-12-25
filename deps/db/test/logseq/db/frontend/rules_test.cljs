(ns logseq.db.frontend.rules-test
  (:require [cljs.test :refer [deftest is testing are]]
            [datascript.core :as d]
            [logseq.db.frontend.rules :as rules]
            [logseq.db.test.helper :as db-test]))

(defn q-with-rules [query db]
  ;; query assumes no :in given
  (d/q (into query [:in '$ '%])
       db
       (rules/extract-rules rules/db-query-dsl-rules)))

(deftest get-full-deps
  (let [property-value-deps #{:ref->val :class-extends :object-has-class-property :property-missing-value :ref-property-value :ref-property-value-with-default}
        property-deps (conj property-value-deps :ref-property-with-default)
        task-deps (conj property-deps :task)
        priority-deps (conj property-deps :priority)
        task-priority-deps (into priority-deps task-deps)]
    (are [x y] (= y (#'rules/get-full-deps x rules/rules-dependencies))
      [:ref-property-value-with-default] property-value-deps
      [:ref-property-with-default] property-deps
      [:task] task-deps
      [:priority] priority-deps
      [:task :priority] task-priority-deps)))

(deftest has-property-rule
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:foo {:logseq.property/type :default}
                            :foo2 {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "Page1"
                        :build/properties {:foo "bar"}}}]})]

    (is (= ["Page1"]
           (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (has-property ?b :user.property/foo)]
                              @conn)
                (map (comp :block/title first))))
        "has-property returns result when block has property")
    (is (= []
           (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (has-property ?b :user.property/foo2)]
                              @conn)
                (map (comp :block/title first))))
        "has-property returns no result when block doesn't have property")
    (is (= [:block/tags :user.property/foo]
           (q-with-rules '[:find [?p ...]
                           :where (has-property ?b ?p) [?b :block/title "Page1"]]
                         @conn))
        "has-property can bind to property arg")))

(deftest ref-property-rule
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:foo {:logseq.property/type :default}
                            :foo2 {:logseq.property/type :default}
                            :number-many {:logseq.property/type :number
                                          :db/cardinality :many}
                            :page-many {:logseq.property/type :node
                                        :db/cardinality :many}}
               :pages-and-blocks
               [{:page {:block/title "Page1"
                        :build/properties {:foo "bar" :number-many #{5 10} :page-many #{[:build/page {:block/title "Page A"}]}}}}
                {:page {:block/title "Page A"
                        :build/properties {:foo "bar A"}}}]})]
    (testing "cardinality :one property"
      (is (= ["Page1"]
             (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (ref-property ?b :user.property/foo "bar")]
                                @conn)
                  (map (comp :block/title first))))
          "property returns result when page has property")
      (is (= []
             (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (ref-property ?b :user.property/foo "baz")]
                                @conn)
                  (map (comp :block/title first))))
          "property returns no result when page doesn't have property value")
      (is (= #{:user.property/foo}
             (->> (q-with-rules '[:find [?p ...]
                                  :where (ref-property ?b ?p "bar") [?b :block/title "Page1"]]
                                @conn)
                  set))
          "property can bind to property arg with bound property value"))

    (testing "cardinality :many property"
      (is (= ["Page1"]
             (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (ref-property ?b :user.property/number-many 5)]
                                @conn)
                  (map (comp :block/title first))))
          "property returns result when page has property")
      (is (= []
             (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (ref-property ?b :user.property/number-many 20)]
                                @conn)
                  (map (comp :block/title first))))
          "property returns no result when page doesn't have property value")
      (is (= #{:user.property/number-many}
             (->> (q-with-rules '[:find [?p ...]
                                  :where (ref-property ?b ?p 5) [?b :block/title "Page1"]]
                                @conn)
                  set))
          "property can bind to property arg with bound property value"))

    ;; NOTE: Querying a ref's name is different than before and requires more than just the rule
    (testing ":ref property"
      (is (= ["Page1"]
             (->> (q-with-rules '[:find (pull ?b [:block/title])
                                  :where (ref-property ?b :user.property/page-many "Page A")]
                                @conn)
                  (map (comp :block/title first))))
          "property returns result when page has property")
      (is (= []
             (->> (q-with-rules '[:find (pull ?b [:block/title])
                                  :where [?b :user.property/page-many ?pv] [?pv :block/title "Page B"]]
                                @conn)
                  (map (comp :block/title first))))
          "property returns no result when page doesn't have property value"))

    (testing "bindings with property value"
      (is (= #{:user.property/foo :user.property/number-many :user.property/page-many :block/tags}
             (->> (q-with-rules '[:find [?p ...]
                                  :where (property ?b ?p _) [?b :block/title "Page1"]]
                                @conn)
                  set))
          "property can bind to property arg with unbound property value")
      (is (= #{[:user.property/number-many 10]
               [:user.property/number-many 5]
               [:user.property/foo "bar"]
               [:user.property/page-many "Page A"]
               [:block/tags "Page"]}
             (->> (q-with-rules '[:find ?p ?val
                                  :where (property ?b ?p ?val) [?b :block/title "Page1"]]
                                @conn)
                  set))
          "property can bind to property and property value args")
      (is (= #{"Page1"}
             (->> (q-with-rules '[:find (pull ?b [:block/title])
                                  :where
                                  [?b :user.property/page-many ?pv]
                                  (property ?pv :user.property/foo "bar A")]
                                @conn)
                  (map (comp :block/title first))
                  set))
          "property can be used multiple times to query a property value's property"))))

(deftest tags-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Page1"
                        :build/tags [:Person]}}
                {:page {:block/title "Page2"
                        :build/tags [:Person]}}
                {:page {:block/title "Page3"
                        :build/tags [:Employee]}}]})
        person-eid (:db/id (d/entity @conn :user.class/Person))]
    (d/transact! conn [{:db/ident :user.class/Employee
                        :logseq.property.class/extends :user.class/Person}])
    (testing "tags query with eid"
      (is (= #{"Page1" "Page2" "Page3"}
             (->> (d/q
                   '[:find (pull ?b [:block/title])
                     :in $ % ?tag-ids
                     :where (tags ?b ?tag-ids)]
                   @conn
                   (rules/extract-rules rules/db-query-dsl-rules)
                   #{person-eid})
                  (map (comp :block/title first))
                  set))))
    (testing "tags query with db/ident"
      (is (= #{"Page1" "Page2" "Page3"}
             (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (tags ?b #{:user.class/Person})]
                                @conn)
                  (map (comp :block/title first))
                  set))))
    (testing "tags query with block/title"
      (is (= #{"Page1" "Page2" "Page3"}
             (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (tags ?b #{"Person"})]
                                @conn)
                  (map (comp :block/title first))
                  set))))))
