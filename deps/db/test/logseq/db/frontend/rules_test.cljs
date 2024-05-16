(ns logseq.db.frontend.rules-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.rules :as rules]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.property.build :as db-property-build]))

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
        page (sqlite-util/build-new-page "Page")
        prop-vals-tx-m (db-property-build/build-property-values-tx-m page {:user.property/foo "bar"})
        _ (d/transact! conn
                       (concat
                        [(sqlite-util/build-new-property :user.property/foo {})
                         (sqlite-util/build-new-property :user.property/foo2 {})
                         page]
                        (vals prop-vals-tx-m)
                        [(merge {:block/uuid (:block/uuid page)}
                                (db-property-build/build-properties-with-ref-values prop-vals-tx-m))]))]
    (is (= ["Page"]
           (->> (q-with-rules '[:find (pull ?b [:block/original-name]) :where (has-page-property ?b :user.property/foo)]
                              @conn)
                (map (comp :block/original-name first))))
        "has-page-property returns result when page has property")
    (is (= []
           (->> (q-with-rules '[:find (pull ?b [:block/original-name]) :where (has-page-property ?b :user.property/foo2)]
                              @conn)
                (map (comp :block/original-name first))))
        "has-page-property returns no result when page doesn't have property")
    (is (= [:user.property/foo]
           (q-with-rules '[:find [?p ...]
                           :where (has-page-property ?b ?p) [?b :block/original-name "Page"]]
                         @conn))
        "has-page-property can bind to property arg")))

(deftest page-property-rule
  (let [conn (new-db-conn)
        page (sqlite-util/build-new-page "Page")
        page-a (sqlite-util/build-new-page "Page A")
        page-prop-vals-tx-m (db-property-build/build-property-values-tx-m page {:user.property/foo "bar" :user.property/number-many #{5 10}})
        page-a-prop-vals-tx-m (db-property-build/build-property-values-tx-m page-a {:user.property/foo "bar A"})
        _ (d/transact! conn
                       (concat [(sqlite-util/build-new-property :user.property/foo {})
                                (sqlite-util/build-new-property :user.property/foo2 {})
                                (sqlite-util/build-new-property :user.property/number-many {:type :number :cardinality :many})
                                (sqlite-util/build-new-property :user.property/page-many {:type :page :cardinality :many})
                                page
                                page-a]
                               (mapcat #(if (set? %) % [%]) (vals page-prop-vals-tx-m))
                               (mapcat #(if (set? %) % [%]) (vals page-a-prop-vals-tx-m))
                               [(merge {:block/uuid (:block/uuid page)}
                                       (db-property-build/build-properties-with-ref-values page-prop-vals-tx-m))
                                {:block/uuid (:block/uuid page) :user.property/page-many #{[:block/uuid (:block/uuid page-a)]}}
                                (merge {:block/uuid (:block/uuid page-a)}
                                       (db-property-build/build-properties-with-ref-values page-a-prop-vals-tx-m))]))]

    (testing "cardinality :one property"
      (is (= ["Page"]
             (->> (q-with-rules '[:find (pull ?b [:block/original-name]) :where (page-property ?b :user.property/foo "bar")]
                                @conn)
                  (map (comp :block/original-name first))))
          "page-property returns result when page has property")
      (is (= []
             (->> (q-with-rules '[:find (pull ?b [:block/original-name]) :where (page-property ?b :user.property/foo "baz")]
                                @conn)
                  (map (comp :block/original-name first))))
          "page-property returns no result when page doesn't have property value")
      (is (= #{:user.property/foo}
             (->> (q-with-rules '[:find [?p ...]
                                  :where (page-property ?b ?p "bar") [?b :block/original-name "Page"]]
                                @conn)
                  set))
          "page-property can bind to property arg with bound property value"))

    (testing "cardinality :many property"
      (is (= ["Page"]
             (->> (q-with-rules '[:find (pull ?b [:block/original-name]) :where (page-property ?b :user.property/number-many 5)]
                                @conn)
                  (map (comp :block/original-name first))))
          "page-property returns result when page has property")
      (is (= []
             (->> (q-with-rules '[:find (pull ?b [:block/original-name]) :where (page-property ?b :user.property/number-many 20)]
                                @conn)
                  (map (comp :block/original-name first))))
          "page-property returns no result when page doesn't have property value")
      (is (= #{:user.property/number-many}
             (->> (q-with-rules '[:find [?p ...]
                                  :where (page-property ?b ?p 5) [?b :block/original-name "Page"]]
                                @conn)
                  set))
          "page-property can bind to property arg with bound property value"))

    ;; NOTE: Querying a ref's name is different than before and requires more than just the rule
    (testing ":ref property"
      (is (= ["Page"]
             (->> (q-with-rules '[:find (pull ?b [:block/original-name])
                                  :where (page-property ?b :user.property/page-many "Page A")]
                                @conn)
                  (map (comp :block/original-name first))))
          "page-property returns result when page has property")
      (is (= []
             (->> (q-with-rules '[:find (pull ?b [:block/original-name])
                                  :where (page-property ?b :user.property/page-many ?pv) [?pv :block/original-name "Page B"]]
                                @conn)
                  (map (comp :block/original-name first))))
          "page-property returns no result when page doesn't have property value"))

    (testing "bindings with property value"
      (is (= #{:user.property/foo :user.property/number-many :user.property/page-many}
             (->> (q-with-rules '[:find [?p ...]
                                  :where (page-property ?b ?p _) [?b :block/original-name "Page"]]
                                @conn)
                  set))
          "page-property can bind to property arg with unbound property value")
      (is (= #{[:user.property/number-many 10]
               [:user.property/number-many 5]
               [:user.property/foo "bar"]
               [:user.property/page-many "Page A"]}
             (->> (q-with-rules '[:find ?p ?v
                                  :where (page-property ?b ?p ?v) [?b :block/original-name "Page"]]
                                @conn)
                  set))
          "page-property can bind to property and property value args")
      (is (= #{"Page"}
             (->> (q-with-rules '[:find (pull ?b [:block/original-name])
                                  :where
                                  [?b :user.property/page-many ?pv]
                                  (page-property ?pv :user.property/foo "bar A")]
                                @conn)
                  (map (comp :block/original-name first))
                  set))
          "page-property can be used multiple times to query a property value's property"))))
