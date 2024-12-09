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
  (let [default-value-deps #{:property-default-value
                             :property-missing-value
                             :existing-property-value
                             :object-has-class-property}
        property-value-deps (conj default-value-deps :property-value :property-scalar-default-value)
        property-deps (conj property-value-deps :simple-query-property)
        task-deps #{:property :task}
        priority-deps #{:property :priority}
        task-priority-deps  #{:property :task :priority}]
    (are [x y] (= (#'rules/get-full-deps x rules/rules-dependencies) y)
      [:property-default-value] default-value-deps
      [:property-value] property-value-deps
      [:simple-query-property] property-deps
      [:task] task-deps
      [:priority] priority-deps
      [:task :priority] task-priority-deps)))

(deftest has-property-rule
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:foo {:block/schema {:type :default}}
                            :foo2 {:block/schema {:type :default}}}
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
    (is (= [:user.property/foo :block/tags]
           (q-with-rules '[:find [?p ...]
                           :where (has-property ?b ?p) [?b :block/title "Page1"]]
                         @conn))
        "has-property can bind to property arg")))

(deftest property-rule
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:foo {:block/schema {:type :default}}
                            :foo2 {:block/schema {:type :default}}
                            :number-many {:block/schema {:type :number :cardinality :many}}
                            :page-many {:block/schema {:type :node :cardinality :many}}}
               :pages-and-blocks
               [{:page {:block/title "Page1"
                        :build/properties {:foo "bar" :number-many #{5 10} :page-many #{[:page "Page A"]}}}}
                {:page {:block/title "Page A"
                        :build/properties {:foo "bar A"}}}]})]
    (testing "cardinality :one property"
      (is (= ["Page1"]
             (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (property ?b :user.property/foo "bar")]
                                @conn)
                  (map (comp :block/title first))))
          "property returns result when page has property")
      (is (= []
             (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (property ?b :user.property/foo "baz")]
                                @conn)
                  (map (comp :block/title first))))
          "property returns no result when page doesn't have property value")
      (is (= #{:user.property/foo}
             (->> (q-with-rules '[:find [?p ...]
                                  :where (property ?b ?p "bar") [?b :block/title "Page1"]]
                                @conn)
                  set))
          "property can bind to property arg with bound property value"))

    (testing "cardinality :many property"
      (is (= ["Page1"]
             (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (property ?b :user.property/number-many 5)]
                                @conn)
                  (map (comp :block/title first))))
          "property returns result when page has property")
      (is (= []
             (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (property ?b :user.property/number-many 20)]
                                @conn)
                  (map (comp :block/title first))))
          "property returns no result when page doesn't have property value")
      (is (= #{:user.property/number-many}
             (->> (q-with-rules '[:find [?p ...]
                                  :where (property ?b ?p 5) [?b :block/title "Page1"]]
                                @conn)
                  set))
          "property can bind to property arg with bound property value"))

    ;; NOTE: Querying a ref's name is different than before and requires more than just the rule
    (testing ":ref property"
      (is (= ["Page1"]
             (->> (q-with-rules '[:find (pull ?b [:block/title])
                                  :where (property ?b :user.property/page-many "Page A")]
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
