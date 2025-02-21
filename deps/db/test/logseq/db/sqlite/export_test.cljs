(ns logseq.db.sqlite.export-test
  (:require [cljs.pprint]
            [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.test.helper :as db-test]
            [medley.core :as medley]))

;; Test helpers
;; ============
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

(defn- expand-properties
  "Add default values to properties of an input export map to test against a
  db-based export map"
  [properties]
  (->> properties
       (map (fn [[k m]]
              [k
               (cond->
                (merge {:db/cardinality :db.cardinality/one}
                       m)
                 (not (:block/title m))
                 (assoc :block/title (name k)))]))
       (into {})))

(defn- expand-classes
  "Add default values to classes of an input export map to test against a
  db-based export map"
  [classes]
  (->> classes
       (map (fn [[k m]]
              [k
               (cond-> m
                 (not (:block/title m))
                 (assoc :block/title (name k)))]))
       (into {})))

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
                     :build/tags [:user.class/MyClass]}
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

(defn- import-second-time-assertions [conn conn2 page-title original-data
                                      & {:keys [transform-expected-blocks]
                                         :or {transform-expected-blocks (fn [bs] (into bs bs))}}]
  (let [page (db-test/find-page-by-title @conn2 page-title)
        imported-page (export-page-and-import-to-another-graph conn conn2 page-title)
        updated-page (db-test/find-page-by-title @conn2 page-title)
        expected-page-and-blocks
        (update-in (:pages-and-blocks original-data) [0 :blocks] transform-expected-blocks)]

    ;; Assume first page is one being imported for now
    (is (= (first expected-page-and-blocks)
           (first (:pages-and-blocks imported-page)))
        "Blocks are appended to existing page")
    (is (= (:block/created-at page) (:block/created-at updated-page))
        "Existing page didn't get re-created")
    (is (= (:block/updated-at page) (:block/updated-at updated-page))
        "Existing page didn't get updated")))

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
                     :build/tags [:user.class/MyClass]}
                    {:block/title "some task"
                     :build/properties {:logseq.task/status :logseq.task/status.doing}
                     :build/tags [:logseq.class/Task]}]}]}
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
                      {:logseq.property/type :default}}
         :pages-and-blocks
         [{:page {:block/title "page1"}
           :blocks [{:block/title (str "page ref to " (page-ref/->page-ref page-uuid))}
                    {:block/title (str "block ref to " (page-ref/->page-ref block-uuid))}
                    {:block/title "ref in properties"
                     :build/properties {:user.property/p2 (str "pvalue ref to " (page-ref/->page-ref pvalue-page-uuid))}}
                    {:block/title "hola" :block/uuid internal-block-uuid :build/keep-uuid? true}
                    {:block/title (str "internal block ref to " (page-ref/->page-ref internal-block-uuid))}
                    {:block/title (str "class ref to " (page-ref/->page-ref class-uuid))}
                    {:block/title (str "inline class ref to #" (page-ref/->page-ref class-uuid))}
                    {:block/title (str "property ref to " (page-ref/->page-ref property-uuid))}
                    {:block/title (str "journal ref to " (page-ref/->page-ref journal-uuid))}]}
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
               butlast)
           (:pages-and-blocks imported-page))
        "Page's blocks are imported")

    (import-second-time-assertions conn conn2 "page1" original-data
                                   {:transform-expected-blocks
                                    (fn [bs]
                                      ;; internal referenced block doesn't get copied b/c it already exists
                                      (into (vec (remove #(= "hola" (:block/title %)) bs))
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
                   :user.class/ChildClass {:build/class-parent :user.class/MyClass
                                           :build/class-properties [:user.property/p3]}
                   :user.class/ChildClass2 {:build/class-parent :user.class/MyClass2}
                   ;; shallow class b/c it's a property's class property
                   :user.class/NodeClass {:build/class-properties [:user.property/node-p1]}
                   :user.class/NodeClass2 {}}
         :pages-and-blocks
         [{:page {:block/title "page1"
                  :build/properties {:user.property/p1 "woot"}
                  :build/tags [:user.class/ChildClass]}
           :blocks [{:block/title "child object"
                     :build/tags [:user.class/ChildClass2]}]}]}
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
        {:properties {:user.property/num {:logseq.property/type :number}
                      :user.property/checkbox {:logseq.property/type :checkbox}
                      :user.property/date {:logseq.property/type :date}
                      :user.property/node {:logseq.property/type :node
                                           :db/cardinality :db.cardinality/many
                                           :build/property-classes [:user.class/MyClass]}
                      :user.property/p1 {:logseq.property/type :default}}
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
               (medley/dissoc-in [1 :blocks 0 :build/tags]))
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
          :user.class/MyClass2 {:build/class-parent :user.class/MyClass
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

    (is (= (expand-properties (:properties original-data)) (:properties imported-ontology)))
    (is (= (expand-classes (:classes original-data)) (:classes imported-ontology)))))
