(ns logseq.db.frontend.rules-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.rules :as rules]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.build :as sqlite-build]))

(defn- new-db-conn []
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
        _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))]
    conn))

(defn q-with-rules [query db]
  ;; query assumes no :in given
  (d/q (into query [:in '$ '%])
       db
       (rules/extract-rules rules/db-query-dsl-rules)))

(deftest has-page-property-rule
  (let [conn (new-db-conn)
        _ (sqlite-build/create-blocks
           conn
           {:properties {:foo {:block/schema {:type :default}}
                         :foo2 {:block/schema {:type :default}}}
            :pages-and-blocks
            [{:page {:block/title "Page"
                     :build/properties {:foo "bar"}}}]})]

    (is (= ["Page"]
           (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (has-page-property ?b :user.property/foo)]
                              @conn)
                (map (comp :block/title first))))
        "has-page-property returns result when page has property")
    (is (= []
           (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (has-page-property ?b :user.property/foo2)]
                              @conn)
                (map (comp :block/title first))))
        "has-page-property returns no result when page doesn't have property")
    (is (= [:user.property/foo]
           (q-with-rules '[:find [?p ...]
                           :where (has-page-property ?b ?p) [?b :block/title "Page"]]
                         @conn))
        "has-page-property can bind to property arg")))

(deftest page-property-rule
  (let [conn (new-db-conn)
        _ (sqlite-build/create-blocks
           conn
           {:properties {:foo {:block/schema {:type :default}}
                         :foo2 {:block/schema {:type :default}}
                         :number-many {:block/schema {:type :number :cardinality :many}}
                         :page-many {:block/schema {:type :node :cardinality :many}}}
            :pages-and-blocks
            [{:page {:block/title "Page"
                     :build/properties {:foo "bar" :number-many #{5 10} :page-many #{[:page "Page A"]}}}}
             {:page {:block/title "Page A"
                     :build/properties {:foo "bar A"}}}]})]
    (testing "cardinality :one property"
        (is (= ["Page"]
               (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (page-property ?b :user.property/foo "bar")]
                                  @conn)
                    (map (comp :block/title first))))
            "page-property returns result when page has property")
        (is (= []
               (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (page-property ?b :user.property/foo "baz")]
                                  @conn)
                    (map (comp :block/title first))))
            "page-property returns no result when page doesn't have property value")
        (is (= #{:user.property/foo}
               (->> (q-with-rules '[:find [?p ...]
                                    :where (page-property ?b ?p "bar") [?b :block/title "Page"]]
                                  @conn)
                    set))
            "page-property can bind to property arg with bound property value"))

    (testing "cardinality :many property"
      (is (= ["Page"]
             (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (page-property ?b :user.property/number-many 5)]
                                @conn)
                  (map (comp :block/title first))))
          "page-property returns result when page has property")
      (is (= []
             (->> (q-with-rules '[:find (pull ?b [:block/title]) :where (page-property ?b :user.property/number-many 20)]
                                @conn)
                  (map (comp :block/title first))))
          "page-property returns no result when page doesn't have property value")
      (is (= #{:user.property/number-many}
             (->> (q-with-rules '[:find [?p ...]
                                  :where (page-property ?b ?p 5) [?b :block/title "Page"]]
                                @conn)
                  set))
          "page-property can bind to property arg with bound property value"))

    ;; NOTE: Querying a ref's name is different than before and requires more than just the rule
    (testing ":ref property"
        (is (= ["Page"]
               (->> (q-with-rules '[:find (pull ?b [:block/title])
                                    :where (page-property ?b :user.property/page-many "Page A")]
                                  @conn)
                    (map (comp :block/title first))))
            "page-property returns result when page has property")
        (is (= []
               (->> (q-with-rules '[:find (pull ?b [:block/title])
                                    :where [?b :user.property/page-many ?pv] [?pv :block/title "Page B"]]
                                  @conn)
                    (map (comp :block/title first))))
            "page-property returns no result when page doesn't have property value"))

    (testing "bindings with property value"
        (is (= #{:user.property/foo :user.property/number-many :user.property/page-many}
               (->> (q-with-rules '[:find [?p ...]
                                    :where (page-property ?b ?p _) [?b :block/title "Page"]]
                                  @conn)
                    set))
            "page-property can bind to property arg with unbound property value")
        (is (= #{[:user.property/number-many 10]
                 [:user.property/number-many 5]
                 [:user.property/foo "bar"]
                 [:user.property/page-many "Page A"]}
               (->> (q-with-rules '[:find ?p ?v
                                    :where (page-property ?b ?p ?v) [?b :block/title "Page"]]
                                  @conn)
                    set))
            "page-property can bind to property and property value args")
        (is (= #{"Page"}
               (->> (q-with-rules '[:find (pull ?b [:block/title])
                                    :where
                                    [?b :user.property/page-many ?pv]
                                    (page-property ?pv :user.property/foo "bar A")]
                                  @conn)
                    (map (comp :block/title first))
                    set))
            "page-property can be used multiple times to query a property value's property"))))
