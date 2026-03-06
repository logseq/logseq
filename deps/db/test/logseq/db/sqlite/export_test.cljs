(ns logseq.db.sqlite.export-test
  (:require [cljs.pprint]
            [cljs.test :refer [deftest is testing]]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.test.helper :as db-test]
            [medley.core :as medley]))

;; Test helpers
;; ============
(defn- validate-db
  "Validate db, usually after transacting an import"
  [db]
  (let [validation (db-validate/validate-local-db! db)]
    (when (seq (:errors validation)) (cljs.pprint/pprint {:validate (:errors validation)}))
    (is (empty? (map :entity (:errors validation))) "Imported graph has no validation errors")))

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
        _ (d/transact! import-conn (concat init-tx block-props-tx))]
    (validate-db @import-conn)
    (sqlite-export/build-export @import-conn {:export-type :block
                                              :block-id (:db/id import-block)})))

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
        _ (d/transact! import-conn (concat init-tx block-props-tx))
        _ (validate-db @import-conn)
        page2 (db-test/find-page-by-title @import-conn page-title)]
    (sqlite-export/build-export @import-conn {:export-type :page :page-id (:db/id page2)})))

(defn- import-second-time-assertions [conn conn2 page-title original-data
                                      & {:keys [transform-expected-blocks build-journal skip-updated-at?]
                                         :or {transform-expected-blocks (fn [bs] (into bs bs))}}]
  (let [page (db-test/find-page-by-title @conn2 page-title)
        imported-page (export-page-and-import-to-another-graph conn conn2 page-title)
        updated-page (db-test/find-page-by-title @conn2 page-title)
        expected-page-and-blocks
        (-> (:pages-and-blocks original-data)
            (update-in [0 :blocks] transform-expected-blocks))
        filter-imported-page (if build-journal
                               #(= build-journal (get-in % [:page :build/journal]))
                               #(= (get-in % [:page :block/title]) page-title))]

    (assert (first expected-page-and-blocks))
    ;; Assume first page is one being imported for now
    (is (= (first expected-page-and-blocks)
           (first (filter filter-imported-page (:pages-and-blocks imported-page))))
        "Blocks are appended to existing page")
    (is (= (:block/created-at page) (:block/created-at updated-page))
        "Existing page didn't get re-created")
    (when-not skip-updated-at?
      (is (= (:block/updated-at page) (:block/updated-at updated-page))
          "Existing page didn't get updated"))))

(defn- export-graph-and-import-to-another-graph
  "Exports graph and imports it to a 2nd graph, validates it and then exports the 2nd graph.
   This is similar to create-conn-with-import-map but works with existing conn"
  [export-conn import-conn export-options]
  (let [{:keys [init-tx block-props-tx misc-tx] :as _txs}
        (-> (sqlite-export/build-export @export-conn {:export-type :graph :graph-options export-options})
            (sqlite-export/build-import @import-conn {}))
        ;; _ (cljs.pprint/pprint _txs)
        _ (d/transact! import-conn (concat init-tx block-props-tx misc-tx))
        _ (validate-db @import-conn)
        imported-graph (sqlite-export/build-export @import-conn {:export-type :graph :graph-options export-options})]
    imported-graph))

(defn- expand-properties
  "Modify given properties so that they match properties exported from the imported graph"
  [properties]
  (->> properties
       (map (fn [[k m]]
              [k
               (cond->
                (merge {:db/cardinality :db.cardinality/one}
                       m)
                 (:build/property-classes m)
                 (update :build/property-classes set)
                 (not (:block/title m))
                 (assoc :block/title (name k)))]))
       (into {})))

(defn- expand-classes
  "Modify given classes so that they match classes exported from the imported graph"
  [classes]
  (->> classes
       (map (fn [[k m]]
              [k
               (cond-> m
                 (not (:block/title m))
                 (assoc :block/title (name k))
                 (:build/class-extends m)
                 (update :build/class-extends set))]))
       (into {})))

(def sort-pages-and-blocks sqlite-export/sort-pages-and-blocks)

;; Tests
;; =====

(deftest merge-export-maps
  (is (= {:pages-and-blocks
          [{:page {:block/title "page1"}
            :blocks [{:block/title "b1"}
                     {:block/title "b2"}]}
           {:page {:block/title "page2"}}]}
         (#'sqlite-export/merge-export-maps
          {:pages-and-blocks
           [{:page {:block/title "page1"}
             :blocks [{:block/title "b1"}]}]}
          {:pages-and-blocks
           [{:page {:block/title "page1"}
             :blocks [{:block/title "b2"}]}
            {:page {:block/title "page2"}}]}))
      "In :pages-and-blocks, identical pages and their :blocks are merged")

  (is (= {:pages-and-blocks
          [{:page {:build/journal 20250220}
            :blocks [{:block/title "b1"}]}
           {:page {:build/journal 20250221}}]}
         (#'sqlite-export/merge-export-maps
          {:pages-and-blocks
           [{:page {:build/journal 20250220}
             :blocks [{:block/title "b1"}]}]}
          {:pages-and-blocks
           [{:page {:build/journal 20250220}}
            {:page {:build/journal 20250221}}]}))
      "In :pages-and-blocks, identical journals and their :blocks are merged"))

(deftest import-block-in-same-graph
  (let [original-data
        {:properties {:user.property/default-many {:logseq.property/type :default :db/cardinality :db.cardinality/many}}
         :classes {:user.class/MyClass
                   {:build/class-properties [:user.property/default-many]}}
         :pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title "export"
                     :build/properties {:user.property/default-many #{"foo" "bar" "baz"}}
                     :build/tags #{:user.class/MyClass}}
                    {:block/title "import"}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        imported-block (export-block-and-import-to-another-block conn conn "export" "import")]

    (is (= (get-in original-data [:pages-and-blocks 0 :blocks 0])
           (::sqlite-export/block imported-block))
        "Imported block equals exported block")
    (is (= (expand-properties (:properties original-data)) (:properties imported-block)))
    (is (= (expand-classes (:classes original-data)) (:classes imported-block)))))

(deftest import-block-in-different-graph
  (let [original-data
        {:properties {:user.property/num-many
                      {:logseq.property/type :number
                       :db/cardinality :db.cardinality/many
                       :block/title "Num Many"
                       :logseq.property/hide? true}
                      :user.property/p1 {:logseq.property/type :default}}
         :classes {:user.class/MyClass
                   {:build/class-properties [:user.property/num-many :user.property/p1]}}
         :pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title "export"
                     :build/properties {:user.property/num-many #{3 6 9}}
                     :build/tags #{:user.class/MyClass}}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn-with-blocks
               {:pages-and-blocks [{:page {:block/title "page2"}
                                    :blocks [{:block/title "import"}
                                             {:block/title "import2"}]}]})
        imported-block (export-block-and-import-to-another-block conn conn2 "export" "import")]

    (is (= (get-in original-data [:pages-and-blocks 0 :blocks 0])
           (::sqlite-export/block imported-block))
        "Imported block equals exported block")
    (is (= (expand-properties (:properties original-data)) (:properties imported-block)))
    (is (= (expand-classes (:classes original-data)) (:classes imported-block)))

    (testing "same import in another block"
      (let [imported-block (export-block-and-import-to-another-block conn conn2 "export" "import2")]
        (is (= (get-in original-data [:pages-and-blocks 0 :blocks 0])
               (::sqlite-export/block imported-block))
            "Imported block equals exported block")
        (is (= (expand-properties (:properties original-data)) (:properties imported-block)))
        (is (= (expand-classes (:classes original-data)) (:classes imported-block)))))))

(deftest import-block-with-different-ref-types
  (let [page-uuid (random-uuid)
        block-uuid (random-uuid)
        original-data
        {:properties {:user.property/p1 {:logseq.property/type :default}}
         :pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title (str "page ref to " (page-ref/->page-ref page-uuid))
                     :build/properties {:user.property/p1 (str "block ref to " (page-ref/->page-ref block-uuid))}}]}
          {:page {:block/title "another page" :block/uuid page-uuid :build/keep-uuid? true}
           :blocks [{:block/title "b1" :block/uuid block-uuid :build/keep-uuid? true}]}]}
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

;; Tests a variety of blocks including block children with new properties, blocks with users classes
;; and blocks with built-in properties and classes
(deftest import-page-with-different-blocks
  (let [original-data
        {:properties {:user.property/default {:logseq.property/type :default
                                              :block/title "Default"}
                      :user.property/num {:logseq.property/type :number}}
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
                     :build/tags #{:user.class/MyClass}}
                    {:block/title "some task"
                     :build/properties {:logseq.property/status :logseq.property/status.doing}
                     :build/tags #{:logseq.class/Task}}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn)
        imported-page (export-page-and-import-to-another-graph conn conn2 "page1")]

    (is (= (expand-properties (:properties original-data)) (:properties imported-page))
        "Page's properties are imported")
    (is (= (:classes original-data) (:classes imported-page))
        "Page's classes are imported")
    (is (= (:pages-and-blocks original-data) (:pages-and-blocks imported-page))
        "Page's blocks are imported")

    (import-second-time-assertions conn conn2 "page1" original-data)))

(deftest import-page-with-different-ref-types
  (let [block-uuid (random-uuid)
        internal-block-uuid (random-uuid)
        class-uuid (random-uuid)
        page-uuid (random-uuid)
        pvalue-page-uuid (random-uuid)
        pvalue-block-uuid (random-uuid)
        property-uuid (random-uuid)
        journal-uuid (random-uuid)
        block-object-uuid (random-uuid)
        original-data
        {:classes {:user.class/C1 {:block/uuid class-uuid :build/keep-uuid? true}
                   :user.class/NodeClass {}}
         :properties {:user.property/p1
                      {:logseq.property/type :node
                       :block/uuid property-uuid
                       :build/keep-uuid? true
                       :build/property-classes [:user.class/NodeClass]}
                      :user.property/p2
                      {:logseq.property/type :default}
                      :user.property/p3
                      {:logseq.property/type :default}}
         :extract-content-refs? false
         :pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title (str "page ref to " (page-ref/->page-ref page-uuid))}
                    {:block/title (str "not a page ref `" (page-ref/->page-ref "foo") "`")}
                    {:block/title (str "block ref to " (page-ref/->page-ref block-uuid))}
                    {:block/title "ref in properties"
                     :build/properties {:user.property/p2 (str "pvalue ref to " (page-ref/->page-ref pvalue-page-uuid))}}
                    {:block/title "hola" :block/uuid internal-block-uuid :build/keep-uuid? true}
                    {:block/title (str "internal block ref to " (page-ref/->page-ref internal-block-uuid))}
                    {:block/title (str "class ref to " (page-ref/->page-ref class-uuid))}
                    {:block/title (str "inline class ref to #" (page-ref/->page-ref class-uuid))}
                    {:block/title (str "property ref to " (page-ref/->page-ref property-uuid))}
                    {:block/title (str "journal ref to " (page-ref/->page-ref journal-uuid))}
                    {:block/title (str "property block value ref to " (page-ref/->page-ref pvalue-block-uuid))}
                    {:block/title "block with a pvalue that has a :block/uuid"
                     :build/properties {:user.property/p2 {:build/property-value :block
                                                           :block/title "property value block"
                                                           :build/properties {:user.property/p3 "woot"}
                                                           :block/uuid pvalue-block-uuid
                                                           :build/keep-uuid? true}}}]}
          {:page {:block/title "page with block ref"}
           :blocks [{:block/title "hi" :block/uuid block-uuid :build/keep-uuid? true
                     :build/properties {:user.property/p1 [:block/uuid block-object-uuid]}}]}
          {:page {:block/title "page ref page" :block/uuid page-uuid :build/keep-uuid? true}}
          {:page {:block/title "pvalue ref page" :block/uuid pvalue-page-uuid :build/keep-uuid? true}}
          {:page {:build/journal 20250207 :block/uuid journal-uuid :build/keep-uuid? true}}
          {:page {:block/title "Blocks"}
           :blocks [{:block/title "myclass object"
                     :build/tags [:user.class/MyClass]
                     :block/uuid block-object-uuid
                     :build/keep-uuid? true}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn)
        imported-page (export-page-and-import-to-another-graph conn conn2 "page1")]

    (is (= (-> (expand-properties (:properties original-data))
               (medley/dissoc-in [:user.property/p1 :build/property-classes]))
           (:properties imported-page))
        "Page's properties are imported")
    (is (= (-> (expand-classes (:classes original-data))
               (dissoc :user.class/NodeClass))
           (:classes imported-page))
        "Page's classes are imported except for shallow property's class")
    (is (= (-> (:pages-and-blocks original-data)
               (medley/dissoc-in [1 :blocks 0 :build/properties])
               ;; shallow block means this page doesn't get included
               butlast
               sort-pages-and-blocks)
           (:pages-and-blocks imported-page))
        "Page's blocks are imported")

    (import-second-time-assertions conn conn2 "page1" original-data
                                   {:transform-expected-blocks
                                    (fn [bs]
                                      ;; internal referenced block doesn't get copied b/c it already exists
                                      (into (vec (remove #(= "hola" (:block/title %)) bs))
                                            bs))})))

(deftest import-page-with-block-links
  (let [block-uuid (random-uuid)
        original-data
        {:pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title "b1" :block/uuid block-uuid :build/keep-uuid? true}
                    {:block/title "" :block/link [:block/uuid block-uuid]}]}]}
        ;; add option to test out of order uuids
        conn (db-test/create-conn-with-blocks (assoc original-data :build-existing-tx? true))
        conn2 (db-test/create-conn)
        imported-page (export-page-and-import-to-another-graph conn conn2 "page1")]
    (is (= (:pages-and-blocks original-data) (:pages-and-blocks imported-page))
        "Page's blocks are imported")

    (import-second-time-assertions conn conn2 "page1" original-data
                                   {:transform-expected-blocks
                                    (fn [bs]
                                      ;; internal referenced block doesn't get copied b/c it already exists
                                      (into (vec (remove #(= "b1" (:block/title %)) bs))
                                            bs))})))

(deftest import-page-with-different-page-and-classes
  (let [original-data
        {:properties {:user.property/p1 {:logseq.property/type :default}
                      ;; shallow property b/c it's a property for a class' parent
                      :user.property/p2 {:logseq.property/type :node
                                         :build/property-classes [:user.class/NodeClass2]}
                      :user.property/p3 {:logseq.property/type :node
                                         :build/property-classes [:user.class/NodeClass]}
                      :user.property/node-p1 {:logseq.property/type :default}}
         :classes {:user.class/MyClass {:build/class-properties [:user.property/p1 :user.property/p2]}
                   :user.class/MyClass2 {:build/class-properties [:user.property/p2]}
                   :user.class/ChildClass {:build/class-extends [:user.class/MyClass]
                                           :build/class-properties [:user.property/p3]}
                   :user.class/ChildClass2 {:build/class-extends [:user.class/MyClass2]}
                   ;; shallow class b/c it's a property's class property
                   :user.class/NodeClass {:build/class-properties [:user.property/node-p1]}
                   :user.class/NodeClass2 {}}
         :pages-and-blocks
         [{:page {:block/title "page1"
                  :build/properties {:user.property/p1 "woot"}
                  :build/tags #{:user.class/ChildClass}}
           :blocks [{:block/title "child object"
                     :build/tags #{:user.class/ChildClass2}}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn)
        imported-page (export-page-and-import-to-another-graph conn conn2 "page1")]

    (is (= (-> (expand-properties (:properties original-data))
               (dissoc :user.property/node-p1)
               ;; Shallow property doesn't have class
               (medley/dissoc-in [:user.property/p2 :build/property-classes]))
           (:properties imported-page))
        "Page's properties are imported except for shallow class' property")
    (is (= (-> (expand-classes (:classes original-data))
               ;; Shallow class doesn't have properties
               (medley/dissoc-in [:user.class/NodeClass :build/class-properties])
               (dissoc :user.class/NodeClass2))
           (:classes imported-page))
        "Page's classes are imported except for shallow property's class")
    (is (= (:pages-and-blocks original-data) (:pages-and-blocks imported-page))
        "Page's blocks are imported")

    (import-second-time-assertions conn conn2 "page1" original-data {:skip-updated-at? true})))

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

    (import-second-time-assertions conn conn2 journal-title original-data {:build-journal 20250210})))

(deftest import-class-page
  (let [class-uuid (random-uuid)
        original-data
        {:classes {:user.class/C0 {}
                   :user.class/C1 {:build/class-extends [:user.class/C0]
                                   :build/class-properties [:user.property/p1]
                                   :block/uuid class-uuid
                                   :build/keep-uuid? true}}
         :properties {:user.property/p1 {:logseq.property/type :default}}
         :pages-and-blocks [{:page {:block/uuid class-uuid}
                             :blocks [{:block/title "class block"}]}]}
        conn (db-test/create-conn-with-blocks (assoc original-data :build-existing-tx? true))
        conn2 (db-test/create-conn)
        imported-page (export-page-and-import-to-another-graph conn conn2 "C1")]

    (is (= (expand-classes (:classes original-data)) (:classes imported-page))
        "Class page is imported")
    (is (= (expand-properties (:properties original-data)) (:properties imported-page))
        "Class page's properties are imported")
    (is (= (:pages-and-blocks original-data) (:pages-and-blocks imported-page))
        "Page's blocks are imported")))

(deftest import-page-with-different-property-types
  (let [block-object-uuid (random-uuid)
        original-data
        {:properties {:user.property/num {:logseq.property/type :number}
                      :user.property/checkbox {:logseq.property/type :checkbox}
                      :user.property/date {:logseq.property/type :date}
                      :user.property/node {:logseq.property/type :node
                                           :db/cardinality :db.cardinality/many
                                           :build/property-classes [:user.class/MyClass]}
                      :user.property/p1 {:logseq.property/type :default}
                      :user.property/map {:logseq.property/type :map}}
         :classes {:user.class/MyClass {:build/class-properties [:user.property/p1]}}
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
                                                                            :build/tags #{:user.class/MyClass}}]
                                                              [:block/uuid block-object-uuid]
                                                              :logseq.class/Task}}}
                    {:block/title "map block"
                     :build/properties {:user.property/map {:foo :bar :num 2}}}]}
          {:page {:block/title "Blocks"}
           :blocks [{:block/title "myclass object"
                     :build/tags #{:user.class/MyClass}
                     :block/uuid block-object-uuid
                     :build/keep-uuid? true}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn)
        imported-page (export-page-and-import-to-another-graph conn conn2 "page1")]

    (is (= (-> (expand-properties (:properties original-data))
               ;; Don't include shallow page object's property
               (dissoc :user.property/p1))
           (:properties imported-page))
        "Page's properties are imported")
    (is (= (-> (expand-classes (:classes original-data))
               (medley/dissoc-in [:user.class/MyClass :build/class-properties]))
           (:classes imported-page))
        "Page's classes are imported")
    (is (= (-> (:pages-and-blocks original-data)
               ;; adjust shallow block
               (medley/dissoc-in [1 :blocks 0 :build/tags])
               sort-pages-and-blocks)
           (:pages-and-blocks imported-page))
        "Page's blocks are imported")

    (import-second-time-assertions conn conn2 "page1" original-data)
    (is (= 1 (count (d/datoms @conn2 :avet :block/title "page object")))
        "Page property value is only created first time")
    (is (= 1 (count (d/datoms @conn2 :avet :block/journal-day 20250203)))
        "Journal property value is only created first time")))

(deftest import-graph-ontology
  (let [original-data
        {:properties
         {:user.property/num {:logseq.property/type :number}
          :user.property/checkbox {:logseq.property/type :checkbox}
          :user.property/url {:logseq.property/type :url
                              :build/properties {:logseq.property/description "desc for url"}}
          :user.property/node {:logseq.property/type :node
                               :db/cardinality :db.cardinality/many
                               :build/property-classes [:user.class/MyClass]}}
         :classes
         {:user.class/MyClass {:build/properties {:user.property/url "https://example.com/MyClass"}}
          :user.class/MyClass2 {:build/class-extends [:user.class/MyClass]
                                :build/properties {:logseq.property/description "tests child class"}}}}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn-with-import-map
               (sqlite-export/build-export @conn {:export-type :graph-ontology}))
        _ (validate-db @conn2)
        imported-ontology (sqlite-export/build-export @conn2 {:export-type :graph-ontology})]

    (is (= (expand-properties (:properties original-data)) (:properties imported-ontology)))
    (is (= (expand-classes (:classes original-data)) (:classes imported-ontology)))))

(deftest import-view-blocks
  (let [original-data
        ;; Test a mix of page and block types
        {:properties {:user.property/p1 {:logseq.property/type :default}
                      :user.property/p2 {:logseq.property/type :default}}
         :classes {:user.class/class1 {}}
         :pages-and-blocks [{:page {:block/title "page1"}}
                            {:page {:build/journal 20250226}}
                            {:page {:block/title "page2"}
                             :blocks [{:block/title "b1"
                                       :build/properties {:user.property/p2 "ok"}}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        get-node-ids (fn [db]
                       (->> [(d/entity db :user.property/p1)
                             (d/entity db :user.class/class1)
                             (db-test/find-page-by-title db "page1")
                             (db-test/find-journal-by-journal-day db 20250226)
                             (db-test/find-block-by-content db "b1")]
                            (remove nil?)
                            (mapv #(vector :block/uuid (:block/uuid %)))))
        conn2 (db-test/create-conn-with-import-map
               (sqlite-export/build-export @conn {:export-type :view-nodes :rows (get-node-ids @conn)}))
        _ (validate-db @conn2)
        imported-nodes (sqlite-export/build-export @conn2 {:export-type :view-nodes
                                                           :rows (get-node-ids @conn2)})]

    (is (= (sort-pages-and-blocks (:pages-and-blocks original-data)) (:pages-and-blocks imported-nodes)))
    (is (= (expand-properties (:properties original-data)) (:properties imported-nodes)))
    (is (= (expand-classes (:classes original-data)) (:classes imported-nodes)))))

(deftest import-selected-nodes
  (let [original-data
        ;; Test a mix of pages and blocks
        {:properties {:user.property/p1 {:logseq.property/type :default}}
         :classes {:user.class/class1 {}}
         :pages-and-blocks [{:page {:block/title "page1"}
                             :blocks [{:block/title "b1"
                                       :build/properties {:user.property/p1 "ok"}
                                       :build/children [{:block/title "b2"}]}
                                      {:block/title "b3"
                                       :build/tags #{:user.class/class1}
                                       :build/children [{:block/title "b4"}]}]}
                            {:page {:block/title "page2"}
                             :blocks [{:block/title "dont export"}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        get-node-ids (fn [db]
                       (->> [(db-test/find-block-by-content db "b1")
                             (db-test/find-page-by-title db "b3")
                             (db-test/find-page-by-title db "page2")]
                            (remove nil?)
                            (mapv #(vector :block/uuid (:block/uuid %)))))
        conn2 (db-test/create-conn-with-import-map
               (sqlite-export/build-export @conn {:export-type :selected-nodes :node-ids (get-node-ids @conn)}))
        _ (validate-db @conn2)
        imported-nodes (sqlite-export/build-export @conn2 {:export-type :selected-nodes :node-ids (get-node-ids @conn2)})]

    (is (= (->> (:pages-and-blocks original-data)
                (map #(if (= (get-in % [:page :block/title]) "page2") (dissoc % :blocks) %)))
           (:pages-and-blocks imported-nodes)))
    (is (= (expand-properties (:properties original-data)) (:properties imported-nodes)))
    (is (= (expand-classes (:classes original-data)) (:classes imported-nodes)))))

(defn- build-original-graph-data
  [& {:keys [exclude-namespaces? add-built-in-pages?]
      :or {add-built-in-pages? true}}]
  (let [internal-block-uuid (random-uuid)
        favorited-uuid (random-uuid)
        block-pvalue-uuid (random-uuid)
        property-pvalue-uuid (random-uuid)
        page-pvalue-uuid (random-uuid)
        page-object-uuid (random-uuid)
        page-alias-uuid (random-uuid)
        closed-value-uuid (random-uuid)
        property-uuid (random-uuid)
        class-uuid (random-uuid)
        class-alias-uuid (random-uuid)
        class2-uuid (random-uuid)
        journal-uuid (common-uuid/gen-uuid :journal-page-uuid 19650201)
        original-data
        {:properties
         {:user.property/num {:logseq.property/type :number
                              :block/uuid property-uuid
                              :build/keep-uuid? true
                              :block/collapsed? true
                              :build/properties (if exclude-namespaces?
                                                  {}
                                                  {:user.property/node #{[:block/uuid property-pvalue-uuid]}
                                                   :logseq.property/default-value 42})}
          :user.property/default-closed
          {:logseq.property/type :default
           :db/cardinality :db.cardinality/many
           :build/closed-values [{:value "joy" :uuid closed-value-uuid}
                                 {:value "sad" :uuid (random-uuid)}]}
          :user.property/checkbox {:logseq.property/type :checkbox}
          :user.property/date {:logseq.property/type :date}
          :user.property/url {:logseq.property/type :url
                              :build/properties {:logseq.property/description "desc for url"}}
          :user.property/node {:logseq.property/type :node
                               :db/cardinality :db.cardinality/many
                               :build/property-classes [:user.class/MyClass]}}
         :classes
         {:user.class/MyClass (cond-> {:build/properties {:user.property/url "https://example.com/MyClass"}
                                       :block/uuid class-uuid
                                       :build/keep-uuid? true}
                                (not exclude-namespaces?)
                                (assoc :block/alias #{[:block/uuid class-alias-uuid]}))
          :user.class/MyClassAlias {:block/uuid class-alias-uuid
                                    :build/keep-uuid? true}
          :user.class/MyClass2 {:build/class-extends [:user.class/MyClass]
                                :block/collapsed? true
                                :block/uuid class2-uuid
                                :build/keep-uuid? true
                                :build/properties {:logseq.property/description "tests child class"}}}
         :pages-and-blocks
         [{:page {:block/title "page1"
                  :block/uuid favorited-uuid :build/keep-uuid? true
                  :build/properties {:user.property/checkbox false
                                     :user.property/node #{[:block/uuid page-pvalue-uuid]}}}
           :blocks [{:block/title "b1"
                     :build/properties {:user.property/num 1
                                        :user.property/default-closed #{[:block/uuid closed-value-uuid]}
                                        :user.property/date [:block/uuid journal-uuid]}}
                    {:block/title "b2" :build/properties {:user.property/node #{[:block/uuid page-object-uuid]}}}
                    {:block/title "b3" :build/properties {:user.property/node #{[:block/uuid page-object-uuid]}}}
                    {:block/title "Example advanced query",
                     :build/tags #{:logseq.class/Query},
                     :build/properties
                     {:logseq.property/query
                      {:build/property-value :block
                       :block/title "{:query (task Todo)}"
                       :build/properties
                       {:logseq.property.code/lang "clojure"
                        :logseq.property.node/display-type :code}}}}
                    {:block/title "block has property value with tags and properties"
                     :build/properties
                     {:user.property/url
                      {:build/property-value :block
                       :block/title "https://example.com"
                       :build/tags #{:user.class/MyClass}}}}]}
          {:page {:block/title "page object"
                  :block/uuid page-object-uuid
                  :build/keep-uuid? true}
           :blocks []}
          {:page {:block/title "page2" :build/tags #{:user.class/MyClass2}}
           :blocks [{:block/title "hola" :block/uuid internal-block-uuid :build/keep-uuid? true}
                    {:block/title "myclass object 1"
                     :build/tags #{:user.class/MyClass}
                     :block/uuid block-pvalue-uuid
                     :build/keep-uuid? true}
                    (cond-> {:block/title "myclass object 2"
                             :build/tags #{:user.class/MyClass}}
                      (not exclude-namespaces?)
                      (merge {:block/uuid property-pvalue-uuid
                              :build/keep-uuid? true}))
                    {:block/title "myclass object 3"
                     :build/tags #{:user.class/MyClass}
                     :block/uuid page-pvalue-uuid
                     :build/keep-uuid? true}
                    {:block/title "ref blocks"
                     :block/collapsed? true
                     :build/children
                     [{:block/title (str "internal block ref to " (page-ref/->page-ref internal-block-uuid))}
                      {:block/title "node block"
                       :build/properties {:user.property/node #{[:block/uuid block-pvalue-uuid]}}}
                      {:block/title (str "property ref to " (page-ref/->page-ref property-uuid))}
                      {:block/title (str "class ref to " (page-ref/->page-ref class-uuid))}]}]}
          {:page {:block/title "Alias for 2/28" :block/uuid page-alias-uuid :build/keep-uuid? true}
           :blocks []}
          {:page {:build/journal 20250228
                  :block/alias #{[:block/uuid page-alias-uuid]}
                  :build/properties {:user.property/num 1}}
           :blocks [{:block/title "journal block"}]}
          {:page {:build/journal 19650201
                  :block/uuid journal-uuid
                  :build/keep-uuid? true}
           :blocks []}
          {:page {:block/uuid class-uuid}
           :blocks [{:block/title "class block1"
                     :build/children [{:block/title "class block2"}]}]}
          {:page {:block/uuid class2-uuid}
           :blocks [{:block/title "class2 block1"}]}
          {:page {:block/uuid property-uuid}
           :blocks [{:block/title "property block1"}]}]
         ::sqlite-export/graph-files
         [{:file/path "logseq/config.edn"
           :file/content "{:foo :bar}"}
          {:file/path "logseq/custom.css"
           :file/content ".foo {background-color: blue}"}
          {:file/path "logseq/custom.js"
           :file/content "// comment"}
          {:file/path "logseq/publish.css"
           :file/content ""}
          {:file/path "logseq/publish.js"
           :file/content ""}]
         :build-existing-tx? true}
        ;; Some of these built-ins are only here to make assertions pass
        built-in-pages
        [{:page {:block/title "Library" :build/properties {:logseq.property/built-in? true}}
          :blocks []}
         {:page {:block/title "Quick add" :build/properties {:logseq.property/built-in? true
                                                             :logseq.property/hide? true}}, :blocks []}
         {:page {:block/title "Contents" :build/properties {:logseq.property/built-in? true}}
          :blocks [{:block/title "right sidebar"}]}
         {:page {:block/title common-config/favorites-page-name
                 :build/properties {:logseq.property/built-in? true, :logseq.property/hide? true}}
          :blocks [(ldb/build-favorite-tx favorited-uuid)]}
         {:page {:block/title common-config/views-page-name
                 :build/properties {:logseq.property/built-in? true, :logseq.property/hide? true}}
          :blocks [{:block/title "All"
                    :build/properties {:logseq.property/view-for :logseq.class/Task
                                       :logseq.property.view/feature-type :class-objects}}
                   {:block/title "All"
                    :build/properties {:logseq.property/view-for :user.class/MyClass
                                       :logseq.property.view/feature-type :class-objects}}
                   {:block/title "Linked references",
                    :build/properties
                    {:logseq.property.view/type :logseq.property.view/type.list,
                     :logseq.property.view/feature-type :linked-references,
                     :logseq.property/view-for [:block/uuid journal-uuid]}}]}]]
    (cond-> original-data
      add-built-in-pages?
      (update :pages-and-blocks into built-in-pages))))

(deftest ^:long import-graph
  (let [original-data (build-original-graph-data)
        conn (db-test/create-conn-with-import-map original-data)
        ;; set to an unobtainable version to test this ident
        _ (d/transact! conn [{:db/ident :logseq.kv/schema-version :kv/value {:major 1 :minor 0}}])
        original-kv-values (remove #(= :logseq.kv/schema-version (:db/ident %))
                                   (d/q '[:find [(pull ?b [:db/ident :kv/value]) ...] :where [?b :kv/value]] @conn))
        conn2 (db-test/create-conn)
        imported-graph (export-graph-and-import-to-another-graph conn conn2 {})]

    ;; (cljs.pprint/pprint (set (:pages-and-blocks original-data)))
    ;; (cljs.pprint/pprint (set (:pages-and-blocks imported-graph)))
    ;; (cljs.pprint/pprint (butlast (clojure.data/diff (sort-pages-and-blocks (:pages-and-blocks original-data))
    ;;                                                 (:pages-and-blocks imported-graph))))
    (is (= (sort-pages-and-blocks (:pages-and-blocks original-data)) (:pages-and-blocks imported-graph)))
    (is (= 1 (count (d/datoms @conn2 :avet :block/title "page object")))
        "No duplicate pages for pvalue uuids used more than once")
    (is (= (expand-properties (:properties original-data)) (:properties imported-graph)))
    (is (= (expand-classes (:classes original-data)) (:classes imported-graph)))
    (is (= (::sqlite-export/graph-files original-data) (::sqlite-export/graph-files imported-graph))
        "All :file/path entities are imported")
    (is (= original-kv-values (::sqlite-export/kv-values imported-graph))
        "All :kv/value entities are imported except for ignored ones")
    (is (not= (:kv/value (d/entity @conn :logseq.kv/schema-version))
              (:kv/value (d/entity @conn2 :logseq.kv/schema-version)))
        "Ignored :kv/value is not updated")))

(deftest ^:long import-graph-with-timestamps
  (let [original-data* (build-original-graph-data)
        original-data (-> original-data*
                          (update :pages-and-blocks
                                  (fn [pages-and-blocks]
                                    (walk/postwalk (fn [e]
                                                     (if (and (map? e) (or (:block/title e) (:build/journal e)))
                                                       (common-util/block-with-timestamps e)
                                                       e))
                                                   pages-and-blocks)))
                          (update :classes update-vals common-util/block-with-timestamps)
                          (update :properties update-vals common-util/block-with-timestamps)
                          (update ::sqlite-export/graph-files
                                  (fn [files]
                                    (mapv #(let [now (js/Date.)]
                                             (merge % {:file/created-at now :file/last-modified-at now}))
                                          files))))
        conn (db-test/create-conn-with-import-map original-data)
        conn2 (db-test/create-conn)
        imported-graph (export-graph-and-import-to-another-graph conn conn2 {:include-timestamps? true})]

    ;; (cljs.pprint/pprint (butlast (clojure.data/diff (sort-pages-and-blocks (:pages-and-blocks original-data))
    ;;                                                 (:pages-and-blocks imported-graph))))
    (is (= (sort-pages-and-blocks (:pages-and-blocks original-data)) (:pages-and-blocks imported-graph)))
    (is (= (expand-properties (:properties original-data)) (:properties imported-graph)))
    (is (= (expand-classes (:classes original-data)) (:classes imported-graph)))
    (is (= (::sqlite-export/graph-files original-data) (::sqlite-export/graph-files imported-graph))
        "All :file/path entities are imported")))

(deftest ^:long import-graph-with-exclude-namespaces
  (let [original-data (build-original-graph-data {:exclude-namespaces? true})
        conn (db-test/create-conn-with-import-map original-data)
        conn2 (db-test/create-conn-with-blocks
               {:properties (update-vals (:properties original-data) #(dissoc % :build/properties))
                :classes (update-vals (:classes original-data) #(dissoc % :build/properties))})
        imported-graph (export-graph-and-import-to-another-graph conn conn2 {:exclude-namespaces #{:user}})]

    ;; (cljs.pprint/pprint (butlast (clojure.data/diff (sort-pages-and-blocks (:pages-and-blocks original-data))
    ;;                                                 (:pages-and-blocks imported-graph))))
    (is (= (sort-pages-and-blocks (:pages-and-blocks original-data)) (:pages-and-blocks imported-graph)))
    (is (= (::sqlite-export/graph-files original-data) (::sqlite-export/graph-files imported-graph))
        "All :file/path entities are imported")))

(deftest ^:long graph-is-idempotent-across-import-and-export
  (let [original-data (build-original-graph-data)
        conn (db-test/create-conn-with-import-map original-data)
        export-map (sqlite-export/build-export @conn {:export-type :graph})
        valid-result (sqlite-export/validate-export export-map)
        _ (assert (not (:error valid-result)) "No error when importing export-map into new graph")
        _ (validate-db (:db valid-result))
        export-map2 (sqlite-export/build-export (:db valid-result) {:export-type :graph})]
    ;; (cljs.pprint/pprint (sqlite-export/diff-exports export-map export-map2))
    (is (= nil
           (sqlite-export/diff-exports export-map export-map2))
        "No diff between original export and export after importing into a new graph")))

(deftest ^:long import-graph-preserves-property-history
  (let [now (common-util/time-ms)
        original-data
        {:properties {:user.property/num {:logseq.property/type :number}
                      :user.property/node {:logseq.property/type :node
                                           :db/cardinality :db.cardinality/many}}
         :pages-and-blocks [{:page {:block/title "page1"}
                             :blocks [{:block/title "num block"
                                       :build/properties {:user.property/num 44}}
                                      {:block/title "status block"
                                       :build/properties {:logseq.property/status :logseq.property/status.doing}}
                                      {:block/title "node block"}
                                      {:block/title "object 1"}
                                      {:block/title "object 2"}]}]}
        conn (db-test/create-conn-with-import-map original-data)
        num-block (db-test/find-block-by-content @conn "num block")
        status-block (db-test/find-block-by-content @conn "status block")
        node-block (db-test/find-block-by-content @conn "node block")
        original-property-history
        [{:block/uuid (random-uuid)
          :block/created-at now
          :logseq.property.history/block [:block/uuid (:block/uuid num-block)]
          :logseq.property.history/property :user.property/num
          :logseq.property.history/scalar-value 42}
         {:block/uuid (random-uuid)
          :block/created-at (+ now 1000)
          :logseq.property.history/block [:block/uuid (:block/uuid num-block)]
          :logseq.property.history/property :user.property/num
          :logseq.property.history/scalar-value 44}
         {:block/uuid (random-uuid)
          :block/created-at now
          :logseq.property.history/block [:block/uuid (:block/uuid node-block)]
          :logseq.property.history/property :user.property/node
          :logseq.property.history/ref-value [:block/uuid (:block/uuid (db-test/find-block-by-content @conn "object 1"))]}
         {:block/uuid (random-uuid)
          :block/created-at (+ now 1000)
          :logseq.property.history/block [:block/uuid (:block/uuid node-block)]
          :logseq.property.history/property :user.property/node
          :logseq.property.history/ref-value [:block/uuid (:block/uuid (db-test/find-block-by-content @conn "object 2"))]}
         {:block/uuid (random-uuid)
          :block/created-at now
          :logseq.property.history/block [:block/uuid (:block/uuid status-block)]
          :logseq.property.history/property :logseq.property/status
          :logseq.property.history/ref-value :logseq.property/status.todo}
         {:block/uuid (random-uuid)
          :block/created-at (+ now 1000)
          :logseq.property.history/block [:block/uuid (:block/uuid status-block)]
          :logseq.property.history/property :logseq.property/status
          :logseq.property.history/ref-value :logseq.property/status.doing}]
        _ (d/transact! conn original-property-history)
        export-map (sqlite-export/build-export @conn {:export-type :graph})
        valid-result (sqlite-export/validate-export export-map)
        _ (assert (not (:error valid-result)) "No error when importing export-map into new graph")
        _ (validate-db (:db valid-result))
        export-map2 (sqlite-export/build-export (:db valid-result) {:export-type :graph})
        property-history (::sqlite-export/property-history export-map2)]
    (is (= nil
           (sqlite-export/diff-exports export-map export-map2))
        "No diff between original export and export after importing into a new graph")
      ;; (cljs.pprint/pprint (clojure.data/diff original-property-history property-history))
    (is (= (set original-property-history) property-history)
        "Original property history equals exported property history")))

(deftest import-graph-with-different-property-value-cases
  (let [pvalue-uuid1 (random-uuid)
        original-data
        {:classes {:user.class/C1 {}}
         :properties
         {:user.property/default {:logseq.property/type :default}
          :user.property/default-many {:logseq.property/type :default
                                       :db/cardinality :db.cardinality/many}}
         :pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title "block with pvalue that has :build/tags"
                     :build/properties {:user.property/default
                                        {:build/property-value :block
                                         :block/title "tags pvalue"
                                         :build/tags #{:user.class/C1}}}}
                    {:block/title "block with pvalue that has a view"
                     :build/properties {:user.property/default {:build/property-value :block
                                                                :block/title "view pvalue"
                                                                :block/uuid pvalue-uuid1
                                                                :build/keep-uuid? true}}}
                    {:block/title "block with pvalue that has children"
                     :build/properties {:user.property/default
                                        {:build/property-value :block
                                         :block/title "children pvalue"
                                         :build/children
                                         [{:block/title "c1" :build/tags #{:user.class/C1}}
                                          {:block/title "c2" :build/properties {:user.property/default "c21"}}]}}}
                    {:block/title "block with pvalue map in a :many property"
                     :build/properties
                     {:user.property/default-many
                      #{"yep"
                        {:build/property-value :block
                         :block/title ":many pvalue"
                         :build/tags #{:user.class/C1}}}}}]}
          {:page {:block/title "$$$views2"}
           :blocks [{:block/title "Unlinked references",
                     :build/properties
                     {:logseq.property.view/type :logseq.property.view/type.list,
                      :logseq.property.view/group-by-property :block/page,
                      :logseq.property.view/feature-type :unlinked-references,
                      :logseq.property/view-for
                      [:block/uuid pvalue-uuid1]}}]}]}
        conn (db-test/create-conn-with-blocks (assoc original-data :build-existing-tx? true))
        conn2 (db-test/create-conn)
        imported-graph (export-graph-and-import-to-another-graph conn conn2 {:exclude-built-in-pages? true})]

    (is (= (expand-properties (:properties original-data)) (:properties imported-graph)))
    (is (= (expand-classes (:classes original-data)) (:classes imported-graph)))
    (is (= (sort-pages-and-blocks (:pages-and-blocks original-data)) (:pages-and-blocks imported-graph)))))

(defn- test-import-existing-page [import-options expected-page-properties]
  (let [original-data
        {:properties {:user.property/node {:logseq.property/type :node
                                           :db/cardinality :db.cardinality/many}}
         :pages-and-blocks
         [{:page {:block/title "page1"
                  :build/properties {:user.property/node
                                     #{[:build/page {:block/title "existing page"
                                                     :build/properties {:logseq.property/description "first description"}}]}}}}]}
        conn (db-test/create-conn-with-blocks original-data)
        page-uuid (:block/uuid (db-test/find-page-by-title @conn "existing page"))
        _ (validate-db @conn)
        ;; This is just a temp uuid used to link to the page during import
        temp-uuid (random-uuid)
        import-data
        {:properties {:user.property/node {:logseq.property/type :node
                                           :db/cardinality :db.cardinality/many}}
         :pages-and-blocks
         [{:page {:block/title "existing page"
                  :block/uuid temp-uuid
                  :build/keep-uuid? true
                  :build/properties {:logseq.property/description "second description"
                                     :logseq.property/exclude-from-graph-view true}}}
          {:page {:block/title "page2"
                  :build/properties {:user.property/node #{[:block/uuid temp-uuid]}}}}]
         ::sqlite-export/import-options import-options}
        {:keys [init-tx block-props-tx] :as _txs}
        (sqlite-export/build-import import-data @conn {})
        ;; _ (cljs.pprint/pprint _txs)
        _ (d/transact! conn (concat init-tx block-props-tx))
        _ (validate-db @conn)
        expected-pages-and-blocks
        [{:block/uuid page-uuid
          :build/keep-uuid? true,
          :block/title "existing page"
          :build/properties
          expected-page-properties}
         {:build/properties
          {:user.property/node
           #{[:block/uuid page-uuid]}},
          :block/title "page1"}
         {:build/properties
          {:user.property/node
           #{[:block/uuid page-uuid]}},
          :block/title "page2"}]
        exported-graph (sqlite-export/build-export @conn {:export-type :graph
                                                          :graph-options {:exclude-built-in-pages? true}})]
    (is (= expected-pages-and-blocks
           (map :page (:pages-and-blocks exported-graph)))
        "page uuid of 'existing page' is preserved across imports even when its assigned a temporary
         uuid to relate it to other nodes")))

(deftest build-import-can-import-existing-page-with-different-uuid
  (testing "By default any properties passed to an existing page are upserted"
    (test-import-existing-page {}
                               {:logseq.property/description "second description"
                                :logseq.property/exclude-from-graph-view true}))
  (testing "With ::existing-pages-keep-properties?, existing properties on existing pages are not overwritten by imported data"
    (test-import-existing-page {:existing-pages-keep-properties? true}
                               {:logseq.property/description "first description"
                                :logseq.property/exclude-from-graph-view true})))

(deftest build-export-omits-empty-build-properties
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}}
               :classes {:user.class/C1 {:build/class-properties [:user.property/p1]}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"
                                             :build/tags [:user.class/C1]}]}]})
        export-edn (sqlite-export/build-export @conn {:export-type :graph
                                                      :graph-options {:exclude-built-in-pages? true}})
        empty-build-properties (atom [])]
    (walk/postwalk (fn [e]
                     (when (and (map? e) (= {} (:build/properties e)))
                       (swap! empty-build-properties conj e))
                     e)
                   export-edn)
    (is (empty? @empty-build-properties)
        "Export should omit :build/properties when it would otherwise be an empty map")))

(deftest import-graph-with-assets
  (let [asset-uuid (random-uuid)
        asset2-uuid (random-uuid)
        original-data
        {:pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title "asset block"
                     :block/uuid asset-uuid
                     :build/keep-uuid? true
                     :build/tags #{:logseq.class/Asset}
                     :build/properties {:logseq.property.asset/type "pdf"
                                        :logseq.property.asset/checksum "abc"
                                        :logseq.property.asset/size 42}}
                    {:block/title "annotation block"
                     :build/tags #{:logseq.class/Pdf-annotation}
                     :build/properties {:logseq.property/asset [:block/uuid asset-uuid]}}]}
          {:page {:block/title "page2"}
           :blocks [{:block/title "asset image block"
                     :block/uuid asset2-uuid
                     :build/keep-uuid? true
                     :build/tags #{:logseq.class/Asset}
                     :build/properties {:logseq.property.asset/type "png"
                                        :logseq.property.asset/checksum "img-checksum"
                                        :logseq.property.asset/width 100
                                        :logseq.property.asset/height 200
                                        :logseq.property.asset/size 300}}
                    {:block/title "annotation with image"
                     :build/tags #{:logseq.class/Pdf-annotation}
                     :build/properties {:logseq.property.pdf/hl-image [:block/uuid asset2-uuid]}}]}]}
        conn (db-test/create-conn-with-blocks original-data)
        conn2 (db-test/create-conn)
        imported-graph (export-graph-and-import-to-another-graph conn conn2 {:exclude-built-in-pages? true})
        annotation-block (->> (:pages-and-blocks imported-graph)
                              (mapcat :blocks)
                              (filter map?)
                              (some #(when (= "annotation block" (:block/title %)) %)))
        annotation-image (->> (:pages-and-blocks imported-graph)
                              (mapcat :blocks)
                              (filter map?)
                              (some #(when (= "annotation with image" (:block/title %)) %)))]
    ;; (cljs.pprint/pprint (butlast (clojure.data/diff (sort-pages-and-blocks (:pages-and-blocks original-data))
    ;;                                                 (:pages-and-blocks imported-graph))))
    (is (= (sort-pages-and-blocks (:pages-and-blocks original-data)) (:pages-and-blocks imported-graph)))
    (is (= [:block/uuid asset-uuid]
           (get-in annotation-block [:build/properties :logseq.property/asset]))
        ":logseq.property/asset should export as a uuid ref")
    (is (= [:block/uuid asset2-uuid]
           (get-in annotation-image [:build/properties :logseq.property.pdf/hl-image]))
        ":logseq.property.pdf/hl-image should export as a uuid ref")))