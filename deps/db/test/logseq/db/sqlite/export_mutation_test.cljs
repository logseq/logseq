(ns logseq.db.sqlite.export-mutation-test
  "Tests for logseq.db.sqlite.export found by mutation testing"
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.test.helper :as db-test]))

(deftest page-export-includes-alias-pages
  (let [alias-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "alias page" :block/uuid alias-uuid :build/keep-uuid? true}}
                {:page {:block/title "page1"
                        :block/alias #{[:block/uuid alias-uuid]}}
                 :blocks [{:block/title "b1"}]}]})
        page (db-test/find-page-by-title @conn "page1")
        export-map (sqlite-export/build-export @conn {:export-type :page :page-id (:db/id page)})
        import-conn (sqlite-export/create-conn)
        {:keys [init-tx block-props-tx]} (sqlite-export/build-import export-map @import-conn {})
        _ (d/transact! import-conn (concat init-tx block-props-tx))
        page2 (db-test/find-page-by-title @import-conn "page1")]
    (is (some #(= {:block/title "alias page" :block/uuid alias-uuid :build/keep-uuid? true} (:page %))
              (:pages-and-blocks export-map))
        "Alias page is defined in the page export")
    (is (= #{"alias page"} (set (map :block/title (:block/alias page2))))
        "Alias survives import into another graph")))

(defn- page-round-trip
  "Exports page-title from conn, imports it into a new graph and returns the new db"
  [conn page-title]
  (let [page (db-test/find-page-by-title @conn page-title)
        export-map (sqlite-export/build-export @conn {:export-type :page :page-id (:db/id page)})
        import-conn (sqlite-export/create-conn)
        {:keys [init-tx block-props-tx]} (sqlite-export/build-import export-map @import-conn {})]
    (d/transact! import-conn (concat init-tx block-props-tx))
    {:export-map export-map :db @import-conn}))

(deftest page-export-keeps-user-closed-values
  (let [closed-uuid (random-uuid)
        multi-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:properties {:user.property/status {:logseq.property/type :default
                                                   :build/closed-values [{:value "open" :uuid closed-uuid}
                                                                         {:value "done" :uuid (random-uuid)}]}
                            :user.property/labels {:logseq.property/type :default
                                                   :db/cardinality :db.cardinality/many
                                                   :build/closed-values [{:value "red" :uuid multi-uuid}
                                                                         {:value "blue" :uuid (random-uuid)}]}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"
                                             :build/properties {:user.property/status [:block/uuid closed-uuid]
                                                                :user.property/labels #{[:block/uuid multi-uuid]}}}]}]})
        {:keys [export-map db]} (page-round-trip conn "page1")
        b1 (db-test/find-block-by-content db "b1")]
    (is (= {:user.property/status [:block/uuid closed-uuid]
            :user.property/labels #{[:block/uuid multi-uuid]}}
           (-> export-map :pages-and-blocks first :blocks first :build/properties)))
    (is (= "open" (:block/title (:user.property/status b1))))
    (is (= #{"red"} (set (map :block/title (:user.property/labels b1)))))))

(deftest page-export-keeps-property-value-children
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"
                                             :build/properties {:user.property/p1 {:build/property-value :block
                                                                                    :block/title "value"
                                                                                    :build/children [{:block/title "value child"}]}}}]}]})
        {:keys [export-map db]} (page-round-trip conn "page1")]
    (is (= {:user.property/p1 {:build/property-value :block
                               :block/title "value"
                               :build/children [{:block/title "value child"}]}}
           (-> export-map :pages-and-blocks first :blocks first :build/properties)))
    (is (some? (db-test/find-block-by-content db "value child")))))

(deftest view-nodes-export-excludes-children
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "parent"
                           :build/children [{:block/title "child"}]}]}]})
        parent (db-test/find-block-by-content @conn "parent")
        export-map (sqlite-export/build-export @conn {:export-type :view-nodes
                                                      :rows [[:block/uuid (:block/uuid parent)]]})]
    (is (= [{:block/title "parent"}]
           (mapcat :blocks (:pages-and-blocks export-map))))))

(deftest selected-nodes-export-shallow-copies-selected-class-pages
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}}
               :classes {:user.class/C1 {:build/class-properties [:user.property/p1]}}})
        class-ent (d/entity @conn :user.class/C1)
        export-map (sqlite-export/build-export @conn {:export-type :selected-nodes
                                                      :node-ids [[:block/uuid (:block/uuid class-ent)]]})]
    (is (= {:user.class/C1 {:block/title "C1"}} (:classes export-map)))))

(deftest graph-export-keeps-property-uuids
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1" :build/properties {:user.property/p1 "v"}}]}]})
        property-uuid (:block/uuid (d/entity @conn :user.property/p1))
        export-map (sqlite-export/build-export @conn {:export-type :graph-human})
        import-conn (sqlite-export/create-conn)
        {:keys [init-tx block-props-tx misc-tx]} (sqlite-export/build-import export-map @import-conn {})
        _ (d/transact! import-conn (concat init-tx block-props-tx misc-tx))]
    (is (= property-uuid (:block/uuid (d/entity @import-conn :user.property/p1))))))

(deftest graph-export-excludes-namespaces
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}
                            :plugin.property.foo/p2 {:logseq.property/type :default}}
               :classes {:user.class/C1 {}
                         :plugin.class.foo/C2 {}}})
        export-map (sqlite-export/build-export @conn {:export-type :graph-human
                                                      :graph-options {:exclude-namespaces #{:plugin}}})]
    (is (= #{:user.property/p1} (set (keys (:properties export-map)))))
    (is (= #{:user.class/C1} (set (keys (:classes export-map)))))))

(deftest graph-export-patches-invalid-keywords-only-for-old-graphs
  (let [invalid-kw (keyword "user.property" "2ndprop")
        patched-kw (keyword "user.property" "NUM-2ndprop")
        new-conn (db-test/create-conn-with-blocks
                  {:properties {invalid-kw {:logseq.property/type :default}}})
        old-conn (db-test/create-conn-with-blocks
                  {:properties {invalid-kw {:logseq.property/type :default}}})
        _ (d/transact! old-conn [{:db/ident :logseq.kv/graph-initial-schema-version
                                  :kv/value {:major 64 :minor 2}}])]
    (testing "Graphs created after 64.8 keep their keywords"
      (is (contains? (:properties (sqlite-export/build-export @new-conn {:export-type :graph-human})) invalid-kw)))
    (testing "Graphs created before 64.9 get invalid keywords patched"
      (let [properties (:properties (sqlite-export/build-export @old-conn {:export-type :graph-human}))]
        (is (contains? properties patched-kw))
        (is (not (contains? properties invalid-kw)))))))

(deftest validate-import-txs-keeps-data-and-reports-real-errors
  (let [conn (db-test/create-conn-with-import-map
              {:properties {:plugin.property.foo/p1 {:logseq.property/type :json}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        property-ent (d/entity @conn :plugin.property.foo/p1)]
    (testing "Disallowed keys are dropped and the rest of the import is kept"
      (d/transact! conn [{:db/id (:db/id property-ent) :hide? true}])
      (let [import-conn (sqlite-export/create-conn)
            validation (sqlite-export/validate-import-txs
                        (sqlite-export/build-import (sqlite-export/build-export @conn {:export-type :graph}) @import-conn {})
                        @import-conn
                        {:edn-label "exported EDN"})]
        (is (nil? (:error validation)))
        (is (some? (db-test/find-block-by-content (:db validation) "b1")))))
    (testing "An invalid value that is not a disallowed key is reported, not dropped"
      (d/transact! conn [{:db/id (:db/id (db-test/find-block-by-content @conn "b1")) :block/collapsed? "yes"}])
      (let [import-conn (sqlite-export/create-conn)
            validation (sqlite-export/validate-import-txs
                        (sqlite-export/build-import (sqlite-export/build-export @conn {:export-type :graph}) @import-conn {})
                        @import-conn
                        {:edn-label "exported EDN"})]
        (is (some? (:error validation)))))))

(deftest page-export-keeps-referenced-recycled-closed-values
  (let [recycled-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:properties {:user.property/status {:logseq.property/type :default
                                                   :build/closed-values [{:value "old" :uuid recycled-uuid}
                                                                         {:value "new" :uuid (random-uuid)}]}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"
                                             :build/properties {:user.property/status [:block/uuid recycled-uuid]}}]}]})
        _ (d/transact! conn [{:db/id (:db/id (d/entity @conn [:block/uuid recycled-uuid]))
                              :logseq.property/deleted-at 1}])
        {:keys [export-map db]} (page-round-trip conn "page1")]
    (is (= #{"old" "new"}
           (set (map :value (get-in export-map [:properties :user.property/status :build/closed-values]))))
        "A recycled closed value that a block still uses stays in the property's closed values")
    (is (= "old" (:block/title (:user.property/status (db-test/find-block-by-content db "b1")))))))

(defn- graph-human-round-trip
  "Exports conn as :graph-human with graph-options, imports it into target-conn and returns both"
  [conn target-conn graph-options]
  (let [export-map (sqlite-export/build-export @conn {:export-type :graph-human :graph-options graph-options})
        {:keys [init-tx block-props-tx misc-tx]} (sqlite-export/build-import export-map @target-conn {})]
    (d/transact! target-conn (concat init-tx block-props-tx misc-tx))
    {:export-map export-map :db @target-conn}))

(deftest graph-export-keeps-user-closed-values-of-blocks
  (let [closed-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:properties {:user.property/status {:logseq.property/type :default
                                                   :build/closed-values [{:value "open" :uuid closed-uuid}
                                                                         {:value "done" :uuid (random-uuid)}]}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"
                                             :build/properties {:user.property/status [:block/uuid closed-uuid]}}]}]})
        {:keys [db]} (graph-human-round-trip conn (sqlite-export/create-conn) {})]
    (is (= "open" (:block/title (:user.property/status (db-test/find-block-by-content db "b1")))))))

(deftest graph-export-keeps-property-and-class-aliases
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}}
               :classes {:user.class/C1 {}}
               :pages-and-blocks [{:page {:block/title "p1 alias"}}
                                  {:page {:block/title "C1 alias"}}]})
        _ (d/transact! conn [{:db/id (:db/id (d/entity @conn :user.property/p1))
                              :block/alias [(:db/id (db-test/find-page-by-title @conn "p1 alias"))]}
                             {:db/id (:db/id (d/entity @conn :user.class/C1))
                              :block/alias [(:db/id (db-test/find-page-by-title @conn "C1 alias"))]}])
        {:keys [db]} (graph-human-round-trip conn (sqlite-export/create-conn) {})]
    (is (= #{"p1 alias"} (set (map :block/title (:block/alias (d/entity db :user.property/p1))))))
    (is (= #{"C1 alias"} (set (map :block/title (:block/alias (d/entity db :user.class/C1))))))))

(deftest class-page-export-shallow-copies-class-properties
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :node
                                               :build/property-classes #{:user.class/C2}}}
               :classes {:user.class/C1 {:build/class-properties [:user.property/p1]}
                         :user.class/C2 {}}})
        class-ent (d/entity @conn :user.class/C1)
        export-map (sqlite-export/build-export @conn {:export-type :page :page-id (:db/id class-ent)})]
    (is (= {:logseq.property/type :node :db/cardinality :db.cardinality/one :block/title "p1"}
           (select-keys (get-in export-map [:properties :user.property/p1])
                        [:logseq.property/type :db/cardinality :block/title :build/property-classes])))))

(deftest property-page-export-imports-the-property
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}}})
        property (d/entity @conn :user.property/p1)
        export-map (sqlite-export/build-export @conn {:export-type :page :page-id (:db/id property)})
        import-conn (sqlite-export/create-conn)
        {:keys [init-tx block-props-tx]} (sqlite-export/build-import export-map @import-conn {})
        _ (d/transact! import-conn (concat init-tx block-props-tx))]
    (is (= (:block/uuid property) (:block/uuid (d/entity @import-conn :user.property/p1))))))

(deftest page-export-exports-property-value-children-only-inside-the-value
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"
                                             :build/properties {:user.property/p1 {:build/property-value :block
                                                                                    :block/title "value"
                                                                                    :build/children [{:block/title "value child"}]}}}]}]})
        {:keys [export-map]} (page-round-trip conn "page1")]
    (is (= ["b1"] (map :block/title (-> export-map :pages-and-blocks first :blocks))))))

(deftest graph-export-excluding-namespaces-imports-their-used-properties
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}
                            :plugin.property.foo/p2 {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"
                                             :build/properties {:user.property/p1 "v1"
                                                                :plugin.property.foo/p2 "v2"}}]}]})
        target-conn (db-test/create-conn-with-blocks
                     {:properties {:plugin.property.foo/p2 {:logseq.property/type :default}}})
        {:keys [export-map db]} (graph-human-round-trip conn target-conn {:exclude-namespaces #{:plugin}})
        b1 (db-test/find-block-by-content db "b1")]
    (is (= #{:user.property/p1} (set (keys (:properties export-map))))
        "Excluded namespace's property is not exported and the export is not rejected for it")
    (is (= "v1" (db-property/property-value-content (:user.property/p1 b1))))
    (is (= "v2" (db-property/property-value-content (:plugin.property.foo/p2 b1)))
        "Excluded property is taken from the graph imported into")))

(deftest page-export-imported-with-current-block-imports-the-page
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}]}]})
        export-map (sqlite-export/build-export @conn {:export-type :page
                                                      :page-id (:db/id (db-test/find-page-by-title @conn "page1"))})
        target-conn (db-test/create-conn-with-blocks
                     {:pages-and-blocks [{:page {:block/title "other"}
                                          :blocks [{:block/title "current"}]}]})
        current-block (db-test/find-block-by-content @target-conn "current")
        {:keys [init-tx block-props-tx]} (sqlite-export/build-import export-map @target-conn {:current-block current-block})
        _ (d/transact! target-conn (concat init-tx block-props-tx))]
    (is (some? (db-test/find-block-by-content @target-conn "b1")))
    (is (= "current" (:block/title (d/entity @target-conn (:db/id current-block)))))
    (is (= "other" (:block/title (:block/page (d/entity @target-conn (:db/id current-block))))))))

(deftest page-export-allows-node-values-that-are-property-value-blocks
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}
                            :user.property/p2 {:logseq.property/type :node}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"
                                             :build/properties {:user.property/p1 "value"}}
                                            {:block/title "b2"}]}]})
        value-block (:user.property/p1 (db-test/find-block-by-content @conn "b1"))
        _ (d/transact! conn [[:db/add (:db/id (db-test/find-block-by-content @conn "b2")) :user.property/p2 (:db/id value-block)]])
        page (db-test/find-page-by-title @conn "page1")
        export-map (sqlite-export/build-export @conn {:export-type :page :page-id (:db/id page)})]
    (is (= {:user.property/p2 [:block/uuid (:block/uuid value-block)]}
           (:build/properties (second (:blocks (first (:pages-and-blocks export-map)))))))))

(deftest graph-export-of-undefined-property-is-rejected-unless-errors-are-caught
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"
                                             :build/properties {:user.property/p1 "v1"}}]}]})
        ;; A damaged graph: the property is no longer tagged as a property, so the ontology export misses it
        _ (d/transact! conn [[:db/retract (:db/id (d/entity @conn :user.property/p1)) :block/tags :logseq.class/Property]])]
    (is (thrown? js/Error (sqlite-export/build-export @conn {:export-type :graph-human})))
    (is (map? (sqlite-export/build-export @conn {:export-type :graph-human
                                                 :graph-options {:catch-validation-errors? true}})))))
