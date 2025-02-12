(ns logseq.db.sqlite.export-test
  (:require [cljs.pprint]
            [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.test.helper :as db-test]))

(defn- export-block-and-import-to-another-block
  "Exports given block from one graph/conn, imports it to a 2nd block and then
   exports the 2nd block. The two blocks do not have to be in the same graph"
  [export-conn import-conn export-block-content import-block-content]
  (let [export-block (db-test/find-block-by-content @export-conn export-block-content)
        import-block (db-test/find-block-by-content @import-conn import-block-content)
        {:keys [init-tx block-props-tx] :as _txs}
        (-> (sqlite-export/build-export @export-conn {:export-type :block
                                                      :block-id [:block/uuid (:block/uuid export-block)]})
            (sqlite-export/build-import @import-conn {:current-block import-block}))
        ;; _ (cljs.pprint/pprint _txs)
        _ (d/transact! import-conn init-tx)
        _ (d/transact! import-conn block-props-tx)
        validation (db-validate/validate-db! @import-conn)
        _ (when (seq (:errors validation)) (cljs.pprint/pprint {:validate (:errors validation)}))
        _  (is (empty? (map :entity (:errors validation))) "Imported graph has no validation errors")]
    (sqlite-export/build-export @import-conn {:export-type :block
                                              :block-id (:db/id import-block)})))

(deftest import-block-in-same-graph
  (let [original-data
        {:properties {:user.property/default-many
                      {:block/title "default-many" :logseq.property/type :default :db/cardinality :db.cardinality/many}}
         :classes {:user.class/MyClass
                   {:block/title "MyClass" :build/class-properties [:user.property/default-many]}}
         :pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title "export"
                     :build/properties {:user.property/default-many #{"foo" "bar" "baz"}}
                     :build/tags [:user.class/MyClass]}
                    {:block/title "import"}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        imported-block (export-block-and-import-to-another-block conn conn "export" "import")]

    (is (= (get-in original-data [:pages-and-blocks 0 :blocks 0])
           (::sqlite-export/block imported-block))
        "Imported block equals exported block")
    (is (= (:properties original-data) (:properties imported-block)))
    (is (= (:classes original-data) (:classes imported-block)))))

(deftest import-block-in-different-graph
  (let [original-data
        {:properties {:user.property/num-many
                      {:logseq.property/type :number
                       :db/cardinality :db.cardinality/many
                       :block/title "Num Many"
                       :logseq.property/hide? true}
                      :user.property/p1
                      {:db/cardinality :db.cardinality/one,
                       :logseq.property/type :default,
                       :block/title "p1"}}
         :classes {:user.class/MyClass
                   {:block/title "My Class"
                    :build/class-properties [:user.property/num-many :user.property/p1]}}
         :pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title "export"
                     :build/properties {:user.property/num-many #{3 6 9}}
                     :build/tags [:user.class/MyClass]}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn-with-blocks
               {:pages-and-blocks [{:page {:block/title "page2"}
                                    :blocks [{:block/title "import"}
                                             {:block/title "import2"}]}]})
        imported-block (export-block-and-import-to-another-block conn conn2 "export" "import")]

    (is (= (get-in original-data [:pages-and-blocks 0 :blocks 0])
           (::sqlite-export/block imported-block))
        "Imported block equals exported block")
    (is (= (:properties original-data) (:properties imported-block)))
    (is (= (:classes original-data) (:classes imported-block)))

    (testing "same import in another block"
      (let [imported-block (export-block-and-import-to-another-block conn conn2 "export" "import2")]
        (is (= (get-in original-data [:pages-and-blocks 0 :blocks 0])
               (::sqlite-export/block imported-block))
            "Imported block equals exported block")
        (is (= (:properties original-data) (:properties imported-block)))
        (is (= (:classes original-data) (:classes imported-block)))))))

(deftest import-block-with-block-ref
  (let [page-uuid (random-uuid)
        original-data
        {:pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title (str "page ref to " (page-ref/->page-ref page-uuid))}]}
          {:page {:block/title "another page" :block/uuid page-uuid :build/keep-uuid? true}}]}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn-with-blocks
               {:pages-and-blocks [{:page {:block/title "page2"}
                                    :blocks [{:block/title "import"}]}]})
        imported-block (export-block-and-import-to-another-block conn conn2 #"page ref" "import")]

    (is (= (get-in original-data [:pages-and-blocks 0 :blocks 0])
           (::sqlite-export/block imported-block))
        "Imported block equals exported block")
    (is (= (second (:pages-and-blocks original-data))
           (first (:pages-and-blocks imported-block)))
        "Imported page equals exported page of page ref")))

(defn- export-page-and-import-to-another-graph
  "Exports given page from one graph/conn, imports it to a 2nd graph, validates
  it and then exports the page from the 2nd graph"
  [export-conn import-conn page-title]
  (let [page (db-test/find-page-by-title @export-conn page-title)
        {:keys [init-tx block-props-tx] :as _txs}
        (-> (sqlite-export/build-export @export-conn {:export-type :page :page-id (:db/id page)})
            ;; ((fn [x] (cljs.pprint/pprint {:export x}) x))
            (sqlite-export/build-import @import-conn {}))
        ;; _ (cljs.pprint/pprint _txs)
        _ (d/transact! import-conn init-tx)
        _ (d/transact! import-conn block-props-tx)
        validation (db-validate/validate-db! @import-conn)
        _ (when (seq (:errors validation)) (cljs.pprint/pprint {:validate (:errors validation)}))
        _  (is (empty? (map :entity (:errors validation))) "Imported graph has no validation errors")
        page2 (db-test/find-page-by-title @import-conn page-title)]
    (sqlite-export/build-export @import-conn {:export-type :page :page-id (:db/id page2)})))

(defn- import-second-time-assertions [conn conn2 page-title original-data]
  (let [page (db-test/find-page-by-title @conn2 page-title)
        imported-page (export-page-and-import-to-another-graph conn conn2 page-title)
        updated-page (db-test/find-page-by-title @conn2 page-title)
        expected-page-and-blocks
        (update-in (:pages-and-blocks original-data) [0 :blocks]
                   (fn [blocks] (into blocks blocks)))]

    (is (= expected-page-and-blocks (:pages-and-blocks imported-page))
        "Blocks are appended to existing page blocks")
    (is (= (:block/created-at page) (:block/created-at updated-page))
        "Existing page didn't get re-created")
    (is (= (:block/updated-at page) (:block/updated-at updated-page))
        "Existing page didn't get updated")))

;; Tests a variety of blocks including block children with new properties, blocks with users classes
;; and blocks with built-in properties and classes
(deftest import-page-with-different-blocks
  (let [original-data
        {:properties {:user.property/default {:logseq.property/type :default
                                              :db/cardinality :db.cardinality/one
                                              :block/title "Default"}
                      :user.property/num {:logseq.property/type :number
                                          :db/cardinality :db.cardinality/one
                                          :block/title "num"}}
         :classes {:user.class/MyClass {:block/title "My Class"}}
         :pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title "b1"
                     :build/properties {:user.property/default "woot"}
                     :build/children [{:block/title "b1a"
                                       :build/children
                                       [{:block/title "b1aa"
                                         :build/properties {:user.property/num 2}}
                                        {:block/title "b1ab"}]}
                                      {:block/title "b1b"}]}
                    {:block/title "b2"
                     :build/tags [:user.class/MyClass]}
                    {:block/title "some task"
                     :build/properties {:logseq.task/status :logseq.task/status.doing}
                     :build/tags [:logseq.class/Task]}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn)
        imported-page (export-page-and-import-to-another-graph conn conn2 "page1")]

    (is (= (:properties original-data) (:properties imported-page))
        "Page's properties are imported")
    (is (= (:classes original-data) (:classes imported-page))
        "Page's classes are imported")
    (is (= (:pages-and-blocks original-data) (:pages-and-blocks imported-page))
        "Page's blocks are imported")

    (import-second-time-assertions conn conn2 "page1" original-data)))

(deftest import-page-with-different-ref-types
  (let [block-uuid (random-uuid)
        class-uuid (random-uuid)
        page-uuid (random-uuid)
        property-uuid (random-uuid)
        journal-uuid (random-uuid)
        original-data
        {:classes {:user.class/C1 {:block/title "C1" :block/uuid class-uuid :build/keep-uuid? true}}
         :properties {:user.property/p1
                      {:db/cardinality :db.cardinality/one, :logseq.property/type :default
                       :block/uuid property-uuid :block/title "p1" :build/keep-uuid? true}}
         :pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title (str "page ref to " (page-ref/->page-ref page-uuid))}
                    {:block/title (str "block ref to " (page-ref/->page-ref block-uuid))}
                    {:block/title (str "class ref to " (page-ref/->page-ref class-uuid))}
                    {:block/title (str "inline class ref to #" (page-ref/->page-ref class-uuid))}
                    {:block/title (str "property ref to " (page-ref/->page-ref property-uuid))}
                    {:block/title (str "journal ref to " (page-ref/->page-ref journal-uuid))}]}
          {:page {:block/title "page with block ref"}
           :blocks [{:block/title "hi" :block/uuid block-uuid :build/keep-uuid? true}]}
          {:page {:block/title "another page" :block/uuid page-uuid :build/keep-uuid? true}}
          {:page {:build/journal 20250207 :block/uuid journal-uuid :build/keep-uuid? true}}]}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn)
        imported-page (export-page-and-import-to-another-graph conn conn2 "page1")]

    (is (= (:properties original-data) (:properties imported-page))
        "Page's properties are imported")
    (is (= (:classes original-data) (:classes imported-page))
        "Page's classes are imported")
    (is (= (:pages-and-blocks original-data) (:pages-and-blocks imported-page))
        "Page's blocks are imported")

    (import-second-time-assertions conn conn2 "page1" original-data)))

(deftest import-page-with-different-page-and-classes
  (let [original-data
        {:properties {:user.property/p1 {:db/cardinality :db.cardinality/one, :logseq.property/type :default, :block/title "p1"}
                      :user.property/p2 {:db/cardinality :db.cardinality/one, :logseq.property/type :default, :block/title "p2"}
                      :user.property/p3 {:db/cardinality :db.cardinality/one, :logseq.property/type :default, :block/title "p3"}}
         :classes {:user.class/MyClass {:block/title "My Class"
                                        :build/class-properties [:user.property/p1 :user.property/p2]}
                   :user.class/MyClass2 {:block/title "MyClass2"}
                   :user.class/ChildClass {:block/title "ChildClass"
                                           :build/class-parent :user.class/MyClass
                                           :build/class-properties [:user.property/p3]}
                   :user.class/ChildClass2 {:block/title "ChildClass2"
                                            :build/class-parent :user.class/MyClass2}}
         :pages-and-blocks
         [{:page {:block/title "page1"
                  :build/properties {:user.property/p1 "woot"}
                  :build/tags [:user.class/ChildClass]}
           :blocks [{:block/title "child object"
                     :build/tags [:user.class/ChildClass2]}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn)
        imported-page (export-page-and-import-to-another-graph conn conn2 "page1")]

    (is (= (:properties original-data) (:properties imported-page))
        "Page's properties are imported")
    (is (= (:classes original-data) (:classes imported-page))
        "Page's classes are imported")
    (is (= (:pages-and-blocks original-data) (:pages-and-blocks imported-page))
        "Page's blocks are imported")

    (import-second-time-assertions conn conn2 "page1" original-data)))

(deftest import-journal-page
  (let [original-data
        {:pages-and-blocks
         [{:page {:build/journal 20250210}
           :blocks [{:block/title "b1"} {:block/title "b2"}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn)
        journal-title (date-time-util/int->journal-title 20250210 "MMM do, yyyy")
        imported-page (export-page-and-import-to-another-graph conn conn2 journal-title)]

    (is (= (:pages-and-blocks original-data) (:pages-and-blocks imported-page))
        "Page's blocks are imported")

    (import-second-time-assertions conn conn2 journal-title original-data)))

(deftest import-page-with-different-property-types
  (let [block-object-uuid (random-uuid)
        original-data
        {:properties {:user.property/num {:logseq.property/type :number
                                          :db/cardinality :db.cardinality/one
                                          :block/title "num"}
                      :user.property/checkbox {:logseq.property/type :checkbox
                                               :db/cardinality :db.cardinality/one
                                               :block/title "checkbox"}
                      :user.property/date {:logseq.property/type :date
                                           :db/cardinality :db.cardinality/one
                                           :block/title "date"}
                      :user.property/node {:logseq.property/type :node
                                           :db/cardinality :db.cardinality/many
                                           :block/title "node"
                                           :build/property-classes [:user.class/MyClass]}}
         :classes {:user.class/MyClass {:block/title "MyClass"}}
         :pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title "num block"
                     :build/properties {:user.property/num 2}}
                    {:block/title "checkbox block"
                     :build/properties {:user.property/checkbox false}}
                    {:block/title "date block"
                     :build/properties {:user.property/date [:build/page {:build/journal 20250203}]}}
                    {:block/title "node block"
                     :build/properties {:user.property/node #{[:build/page {:block/title "page object"
                                                                            :build/tags [:user.class/MyClass]}]
                                                              [:block/uuid block-object-uuid]}}}]}
          {:page {:block/title "Blocks"}
           :blocks [{:block/title "myclass object"
                     :build/tags [:user.class/MyClass]
                     :block/uuid block-object-uuid
                     :build/keep-uuid? true}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn)
        imported-page (export-page-and-import-to-another-graph conn conn2 "page1")]

    (is (= (:properties original-data) (:properties imported-page))
        "Page's properties are imported")
    (is (= (:classes original-data) (:classes imported-page))
        "Page's classes are imported")
    (is (= (:pages-and-blocks original-data) (:pages-and-blocks imported-page))
        "Page's blocks are imported")))

(deftest import-graph-ontology
  (let [original-data
        {:properties
         {:user.property/num {:logseq.property/type :number
                              :db/cardinality :db.cardinality/one
                              :block/title "num"}
          :user.property/checkbox {:logseq.property/type :checkbox
                                   :db/cardinality :db.cardinality/one
                                   :block/title "checkbox"}
          :user.property/url {:logseq.property/type :url
                              :db/cardinality :db.cardinality/one
                              :block/title "url"
                              :build/properties {:logseq.property/description "desc for url"}}
          :user.property/node {:logseq.property/type :node
                               :db/cardinality :db.cardinality/many
                               :block/title "node"
                               :build/property-classes [:user.class/MyClass]}}
         :classes
         {:user.class/MyClass {:block/title "MyClass"
                               :build/properties {:user.property/url "https://example.com/MyClass"}}
          :user.class/MyClass2 {:block/title "MyClass2"
                                :build/class-parent :user.class/MyClass
                                :build/properties {:logseq.property/description "tests child class"}}}}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn)
        {:keys [init-tx block-props-tx] :as _txs}
        (-> (sqlite-export/build-export @conn {:export-type :graph-ontology})
            (sqlite-export/build-import @conn2 {}))
        ;; _ (cljs.pprint/pprint _txs)
        _ (d/transact! conn2 init-tx)
        _ (d/transact! conn2 block-props-tx)
        imported-ontology (sqlite-export/build-export @conn2 {:export-type :graph-ontology})]

    (is (= (:properties original-data) (:properties imported-ontology)))
    (is (= (:classes original-data) (:classes imported-ontology)))))
