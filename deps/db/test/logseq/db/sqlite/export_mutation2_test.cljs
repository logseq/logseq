(ns logseq.db.sqlite.export-mutation2-test
  "Second-run mutation survivors of logseq.db.sqlite.export."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.test.helper :as db-test]))

(def ^:private cv1 #uuid "11111111-1111-4111-8111-000000000001")
(def ^:private cv2 #uuid "11111111-1111-4111-8111-000000000002")
(def ^:private alias-uuid #uuid "11111111-1111-4111-8111-000000000003")
(def ^:private obj-uuid #uuid "11111111-1111-4111-8111-000000000004")
(def ^:private c1-uuid #uuid "11111111-1111-4111-8111-000000000005")
(def ^:private t1 1700000000000)
(def ^:private t2 1700000001000)

(def ^:private fixture
  {:properties
   {:user.property/closed {:logseq.property/type :default
                           :db/cardinality :db.cardinality/many
                           :build/closed-values [{:value "joy" :uuid cv1 :icon {:type :emoji :id "smile"}}
                                                 {:value "sad" :uuid cv2}]}
    :user.property/num {:logseq.property/type :number
                        :block/created-at t1 :block/updated-at t2}
    :user.property/node {:logseq.property/type :node
                         :db/cardinality :db.cardinality/many}
    :user.property/txt {:logseq.property/type :default}
    :user.property/txt2 {:logseq.property/type :default
                         :build/properties {:logseq.property/default-value "dflt"}}}
   :classes
   {:user.class/C1 {:build/class-properties [:user.property/txt]
                    :block/uuid c1-uuid :build/keep-uuid? true
                    :block/created-at t1 :block/updated-at t2
                    :block/alias #{[:block/uuid alias-uuid]}}
    :user.class/C2 {:build/class-extends [:user.class/C1]
                    :block/collapsed? true}}
   :pages-and-blocks
   [{:page {:block/title "page1" :block/created-at t1 :block/updated-at t2}
     :blocks [{:block/title "b1" :block/created-at t1 :block/updated-at t2
               :build/properties {:user.property/num 1
                                  :user.property/closed #{[:block/uuid cv1]}}}
              {:block/title "b2" :block/collapsed? true
               :build/tags #{:user.class/C2}
               :build/properties {:user.property/txt
                                  {:build/property-value :block
                                   :block/title "tagged value"
                                   :build/tags #{:user.class/C1}}}}
              {:block/title "b3" :build/properties {:user.property/txt "plain"}}
              {:block/title "b4"
               :build/properties {:user.property/txt
                                  {:build/property-value :block
                                   :block/title "nested"
                                   :build/properties {:user.property/num 5}}}}
              {:block/title "b5" :build/properties {:user.property/node #{[:block/uuid obj-uuid]}}}
              {:block/title (str "class ref " (page-ref/->page-ref c1-uuid))}]}
    {:page {:block/title "obj page" :block/uuid obj-uuid :build/keep-uuid? true}
     :blocks []}
    {:page {:block/title "Alias page" :block/uuid alias-uuid :build/keep-uuid? true}
     :blocks []}]})

(defn- graph-human
  [conn options]
  (sqlite-export/build-export @conn {:export-type :graph-human :graph-options options}))

(defn- page-blocks
  [export-edn page-title]
  (->> (:pages-and-blocks export-edn)
       (some #(when (= page-title (get-in % [:page :block/title])) %))
       :blocks))

(defn- block-by-title
  [blocks title]
  (some #(when (= title (:block/title %)) %) blocks))

;; graph-human export of the fixture

;; Fails if, in `build-pvalue-entity-default`, `:block/created-at` becomes `:block/journal-day` or `:block/updated-at` becomes `:block/uuid`.
;; Fails if, in `build-export-properties`, `:block/created-at` becomes `:block/journal-day`, `:block/updated-at` becomes `:block/uuid` or `:logseq.property/icon` becomes `:logseq.property/type`.
;; Fails if, in `build-export-class`, `:block/created-at` becomes `:block/journal-day` or `:block/updated-at` becomes `:block/uuid`.
;; Fails if, in `build-node-export`, `:block/created-at` becomes `:block/journal-day` or `:block/updated-at` becomes `:block/uuid`.
;; Fails if, in `build-graph-export`, the `(assoc ::schema-version db-schema/ver...` step is dropped.
(deftest graph-human-export-timestamps-and-ontology-test
  (let [conn (db-test/create-conn-with-import-map fixture)
        export-edn (graph-human conn {:include-timestamps? true})
        blocks (page-blocks export-edn "page1")
        b1 (block-by-title blocks "b1")
        b2 (block-by-title blocks "b2")
        closed-values (get-in export-edn [:properties :user.property/closed :build/closed-values])]
    (testing "properties keep their timestamps"
      (is (= t1 (get-in export-edn [:properties :user.property/num :block/created-at])))
      (is (= t2 (get-in export-edn [:properties :user.property/num :block/updated-at]))))
    (testing "classes keep their timestamps"
      (is (= t1 (get-in export-edn [:classes :user.class/C1 :block/created-at])))
      (is (= t2 (get-in export-edn [:classes :user.class/C1 :block/updated-at]))))
    (testing "blocks keep their timestamps"
      (is (= t1 (:block/created-at b1)))
      (is (= t2 (:block/updated-at b1))))
    (testing "closed values keep icons only when they have one"
      (is (= {:type :emoji :id "smile"} (:icon (first closed-values))))
      (is (not (contains? (second closed-values) :icon))))
    (testing "property value blocks with tags keep timestamps"
      (let [pvalue (get-in b2 [:build/properties :user.property/txt])]
        (is (number? (:block/created-at pvalue)))
        (is (number? (:block/updated-at pvalue)))))
    (testing "collapsed state is exported on a block"
      (is (true? (:block/collapsed? b2))))
    (testing "schema version"
      (is (= db-schema/version (::sqlite-export/schema-version export-edn))))))

;; Fails if, in `block-title`, `:block/title` becomes `:block/tx-id`.
;; Fails if, in `build-pvalue-entity-default`, `:build/tags` becomes `:build/children` or `:block/tags` becomes `:block/title`.
;; Fails if, in `buildable-properties`, `:logseq.property/default-value` becomes `:logseq.property/icon` or `:db/ident` becomes `:db/index`.
;; Fails if, in `remove-uuid-if-not-ref-given-uuids`, `:build/properties` becomes `:build/property-classes` or `:build/tags` becomes `:build/children`.
;; Fails if, in `build-graph-export`, the `:property-value-uuids?` key is dropped or the `:include-uuid?` key is dropped.
(deftest graph-human-export-property-values-test
  (let [conn (db-test/create-conn-with-import-map fixture)
        export-edn (graph-human conn {})
        blocks (page-blocks export-edn "page1")
        pvalue #(get-in (block-by-title blocks %) [:build/properties :user.property/txt])]
    (testing "a plain property value stays a plain value"
      (is (= "plain" (pvalue "b3"))))
    (testing "a property value with tags stays a map with its tags"
      (is (= {:build/property-value :block
              :block/title "tagged value"
              :build/tags #{:user.class/C1}}
             (pvalue "b2"))))
    (testing "a property value with properties stays a map with its properties"
      (is (= {:build/property-value :block
              :block/title "nested"
              :build/properties {:user.property/num 5}}
             (pvalue "b4"))))
    (testing "page values are exported by uuid"
      (is (= #{[:block/uuid obj-uuid]}
             (get-in (block-by-title blocks "b5") [:build/properties :user.property/node]))))
    (testing "a default value is exported as its content"
      (is (= "dflt"
             (get-in export-edn [:properties :user.property/txt2 :build/properties :logseq.property/default-value]))))
    (testing "a class referenced by content keeps its uuid"
      (is (= c1-uuid (get-in export-edn [:classes :user.class/C1 :block/uuid]))))))

;; Fails if, in `build-graph-export`, the `(update :pages-and-blocks sort-pages-...` step is dropped.
(deftest graph-human-export-pages-are-sorted-test
  (let [conn (db-test/create-conn-with-import-map fixture)
        titles (mapv #(get-in % [:page :block/title])
                     (:pages-and-blocks (graph-human conn {})))]
    (is (= (sort titles) titles))))

;; closed values

;; graph-ontology

;; Fails if, in `build-graph-ontology-export`, the `(dissoc :logseq.property.class/proper...` step is dropped or `:logseq.property.class/properties` becomes `:logseq.property.class/extends`.
(deftest graph-ontology-class-properties-are-not-build-properties-test
  (let [conn (db-test/create-conn-with-import-map fixture)
        c1 (get-in (sqlite-export/build-export @conn {:export-type :graph-ontology}) [:classes :user.class/C1])]
    (is (= [:user.property/txt] (:build/class-properties c1)))
    (is (not (contains? c1 :build/properties)))))

;; Fails if, in `ignored-properties`, `:logseq.property/created-by-ref` becomes `:logseq.property/created-from-property` or `:logseq.property.embedding/hnsw-label-updated-at` becomes `:logseq.property.embedding/hnsw-label`.
(deftest ignored-properties-are-not-exported-test
  (let [conn (db-test/create-conn-with-import-map
              {:properties {:user.property/p1 {:logseq.property/type :default}}
               :classes {:user.class/MyClass {:build/class-properties [:user.property/p1]}}
               :pages-and-blocks [{:page {:block/title "page1"} :blocks [{:block/title "b1"}]}]})
        creator-uuid (random-uuid)
        class-ent (d/entity @conn :user.class/MyClass)
        block (db-test/find-block-by-content @conn "b1")
        _ (d/transact! conn [{:db/ident :logseq.property.embedding/hnsw-label-updated-at
                              :block/uuid (random-uuid)
                              :block/title "HNSW label updated-at"
                              :block/tags :logseq.class/Property
                              :logseq.property/built-in? true
                              :logseq.property/type :number}
                             {:block/uuid creator-uuid :block/title "creator"}
                             {:db/id (:db/id class-ent)
                              :logseq.property.class/properties [:logseq.property/created-by-ref
                                                                 :logseq.property.embedding/hnsw-label-updated-at]}
                             {:db/id (:db/id block)
                              :logseq.property/created-by-ref [:block/uuid creator-uuid]
                              :logseq.property.embedding/hnsw-label-updated-at 8}])]
    (testing "class properties"
      (is (= [:user.property/p1]
             (get-in (sqlite-export/build-export @conn {:export-type :graph-ontology})
                     [:classes :user.class/MyClass :build/class-properties]))))
    (testing "block properties"
      (let [exported (::sqlite-export/block
                      (sqlite-export/build-export @conn {:export-type :block :block-id (:db/id block)}))]
        (is (not (contains? (:build/properties exported) :logseq.property/created-by-ref)))
        (is (not (contains? (:build/properties exported) :logseq.property.embedding/hnsw-label-updated-at)))))))

;; block export

;; Fails if, in `build-node-export`, `:block/collapsed?` becomes `:block/created-at` or `:block/uuid` becomes `:block/_closed-value-property`.
;; Fails if, in `build-block-export`, the `:include-uuid-fn` key is dropped.
(deftest block-export-collapsed-and-self-reference-test
  (let [self-uuid (random-uuid)
        conn (db-test/create-conn-with-import-map
              {:pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title (str "self " (page-ref/->page-ref self-uuid))
                           :block/uuid self-uuid :build/keep-uuid? true
                           :block/collapsed? true}]}]})
        exported (::sqlite-export/block
                  (sqlite-export/build-export @conn {:export-type :block :block-id [:block/uuid self-uuid]}))]
    (is (true? (:block/collapsed? exported)))
    (is (not (contains? exported :block/created-at)))
    (is (= self-uuid (:block/uuid exported)))
    (is (true? (:build/keep-uuid? exported)))))

(def ^:private tagged-page-uuid #uuid "22222222-2222-4222-8222-000000000001")

;; Fails if, in `build-node-classes`, the `vals` step is dropped, the `(remove db-class/logseq-class?)` step is dropped, `:build/properties` becomes `:build/property-classes`, `:build/tags` becomes `:build/children` or `remove` becomes `filter`.
(deftest block-export-classes-from-property-values-test
  (let [conn (db-test/create-conn-with-import-map
              {:properties {:user.property/node {:logseq.property/type :node
                                                  :db/cardinality :db.cardinality/many}
                            :user.property/txt {:logseq.property/type :default}
                            :user.property/limited {:logseq.property/type :node
                                                    :build/property-classes [:user.class/Limit :logseq.class/Task]}}
               :classes {:user.class/PageClass {}
                         :user.class/BlockClass {}
                         :user.class/Limit {}}
               :pages-and-blocks
               [{:page {:block/title "obj page" :block/uuid tagged-page-uuid :build/keep-uuid? true
                        :build/tags #{:user.class/PageClass}}
                 :blocks []}
                {:page {:block/title "page1"}
                 :blocks [{:block/title "holder"
                           :build/properties
                           {:user.property/node #{[:block/uuid tagged-page-uuid]}
                            :user.property/txt {:build/property-value :block
                                                :block/title "tagged value"
                                                :build/tags #{:user.class/BlockClass :logseq.class/Task}}
                            :user.property/limited [:block/uuid tagged-page-uuid]}}]}]})
        holder (db-test/find-block-by-content @conn "holder")
        export-edn (sqlite-export/build-export @conn {:export-type :block :block-id (:db/id holder)})
        classes (:classes export-edn)]
    (is (= {:block/title "PageClass"} (get classes :user.class/PageClass))
        "class of a page value")
    (is (= {:block/title "BlockClass"} (get classes :user.class/BlockClass))
        "class of a block value")
    (is (= {:block/title "Limit"} (get classes :user.class/Limit))
        "class of a property")
    (is (not-any? #(= "logseq.class" (namespace %)) (keys classes))
        "built-in classes are not exported")))

;; Fails if, in `build-class-parents-export`, the `(remove db-property/logseq-property?)` step is dropped.
(deftest block-export-skips-built-in-properties-of-class-parents-test
  (let [conn (db-test/create-conn-with-import-map
              {:classes {:user.class/Parent {:build/class-properties [:logseq.property/status]}
                         :user.class/Child {:build/class-extends [:user.class/Parent]}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "tagged" :build/tags #{:user.class/Child}}]}]})
        block (db-test/find-block-by-content @conn "tagged")
        export-edn (sqlite-export/build-export @conn {:export-type :block :block-id (:db/id block)})]
    (is (contains? (:classes export-edn) :user.class/Parent))
    (is (not (contains? (:properties export-edn) :logseq.property/status)))))

;; page export

(def ^:private pv-uuid #uuid "33333333-3333-4333-8333-000000000001")
(def ^:private target-uuid #uuid "33333333-3333-4333-8333-000000000002")
(def ^:private y1-uuid #uuid "33333333-3333-4333-8333-000000000003")
(def ^:private y2-uuid #uuid "33333333-3333-4333-8333-000000000004")

;; Fails if, in `build-pvalue-entity-default`, `:block/uuid` becomes `:block/_closed-value-property`.
;; Fails if, in `remove-uuid-if-not-ref-given-uuids`, `:block/uuid` becomes `:block/_closed-value-property`.
(deftest page-export-keeps-referenced-property-value-uuid-test
  (let [conn (db-test/create-conn-with-import-map
              {:properties {:user.property/txt {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "pg"}
                 :blocks [{:block/title "holder"
                           :build/properties {:user.property/txt
                                              {:build/property-value :block
                                               :block/title "referenced value"
                                               :block/uuid pv-uuid
                                               :build/keep-uuid? true}}}
                          {:block/title (str "ref " (page-ref/->page-ref pv-uuid))}]}]})
        page (db-test/find-page-by-title @conn "pg")
        blocks (page-blocks (sqlite-export/build-export @conn {:export-type :page :page-id (:db/id page)}) "pg")]
    (is (= {:build/property-value :block
            :block/title "referenced value"
            :block/uuid pv-uuid
            :build/keep-uuid? true}
           (get-in (block-by-title blocks "holder") [:build/properties :user.property/txt])))))

;; Fails if, in `build-page-export`, the `:handle-block-uuids?` key is dropped.
(deftest page-export-keeps-uuid-of-block-used-as-node-property-value-test
  (let [conn (db-test/create-conn-with-import-map
              {:properties {:user.property/node {:logseq.property/type :node}}
               :pages-and-blocks
               [{:page {:block/title "pg"}
                 :blocks [{:block/title "target" :block/uuid target-uuid :build/keep-uuid? true}
                          {:block/title "holder"
                           :build/properties {:user.property/node [:block/uuid target-uuid]}}
                          {:block/title "unreferenced"}]}]})
        page (db-test/find-page-by-title @conn "pg")
        blocks (page-blocks (sqlite-export/build-export @conn {:export-type :page :page-id (:db/id page)}) "pg")]
    (is (= target-uuid (:block/uuid (block-by-title blocks "target"))))
    (is (true? (:build/keep-uuid? (block-by-title blocks "target"))))
    (is (not (contains? (block-by-title blocks "unreferenced") :block/uuid)))))

;; Fails if, in `build-uuid-block-export`, `:block/order` becomes `:block/page`.
(deftest page-export-orders-referenced-blocks-test
  (let [conn (db-test/create-conn-with-import-map
              {:pages-and-blocks
               [{:page {:block/title "xpage"}
                 :blocks [{:block/title (str "refs " (page-ref/->page-ref y1-uuid) " " (page-ref/->page-ref y2-uuid))}]}
                {:page {:block/title "ypage"}
                 :blocks [{:block/title "y1" :block/uuid y1-uuid :build/keep-uuid? true}
                          {:block/title "y2" :block/uuid y2-uuid :build/keep-uuid? true}]}]})
        y1 (d/entity @conn [:block/uuid y1-uuid])
        y2 (d/entity @conn [:block/uuid y2-uuid])
        _ (d/transact! conn [[:db/add (:db/id y1) :block/order (:block/order y2)]
                             [:db/add (:db/id y2) :block/order (:block/order y1)]])
        page (db-test/find-page-by-title @conn "xpage")
        export-edn (sqlite-export/build-export @conn {:export-type :page :page-id (:db/id page)})]
    (is (= ["y2" "y1"] (mapv :block/title (page-blocks export-edn "ypage"))))))

;; Fails if, in `pvalue-descendant?`, `:block/parent` becomes `:block/raw-title`.
(deftest pvalue-descendant-sees-grandchildren-of-property-value-blocks-test
  (let [conn (db-test/create-conn-with-import-map
              {:properties {:user.property/txt {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "pg"}
                 :blocks [{:block/title "holder"
                           :build/properties
                           {:user.property/txt
                            {:build/property-value :block
                             :block/title "value"
                             :build/children [{:block/title "child"
                                               :build/children [{:block/title "grandchild"}]}]}}}
                          {:block/title "plain"}]}]})
        pvalue-descendant? #'sqlite-export/pvalue-descendant?]
    (is (true? (pvalue-descendant? (db-test/find-block-by-content @conn "child"))))
    (is (true? (pvalue-descendant? (db-test/find-block-by-content @conn "grandchild"))))
    (is (false? (pvalue-descendant? (db-test/find-block-by-content @conn "plain"))))
    (is (false? (pvalue-descendant? (db-test/find-block-by-content @conn "holder"))))))

;; view-nodes and selected-nodes export

(def ^:private b-uuid #uuid "44444444-4444-4444-8444-000000000001")
(def ^:private y-uuid #uuid "44444444-4444-4444-8444-000000000002")

(defn- nodes-conn
  []
  (db-test/create-conn-with-import-map
   {:properties {:user.property/node {:logseq.property/type :node}
                 :user.property/txt {:logseq.property/type :default}}
    :pages-and-blocks
    [{:page {:block/title "vp"}
      :blocks [{:block/title "parent" :build/children [{:block/title "child"}]}
               {:block/title (str "a refs " (page-ref/->page-ref b-uuid))}
               {:block/title "b target" :block/uuid b-uuid :build/keep-uuid? true}
               {:block/title "x holder" :build/properties {:user.property/node [:block/uuid y-uuid]
                                                          :user.property/txt "some text"}}]}
     {:page {:block/title "ypage"}
      :blocks [{:block/title "y target" :block/uuid y-uuid :build/keep-uuid? true}]}]}))

(defn- block-by-prefix
  [conn prefix]
  (->> (d/datoms @conn :avet :block/title)
       (map #(d/entity @conn (:e %)))
       (filter #(string? (:block/title %)))
       (some #(when (.startsWith (:block/title %) prefix) %))))

;; Fails if, in `build-nodes-export`, the `:pvalue-uuids` key is dropped.
;; Fails if, in `build-view-nodes-export`, the `:include-uuid-fn` key is dropped or the `:include-children?` key is dropped.
(deftest view-nodes-export-test
  (let [conn (nodes-conn)
        rows (mapv #(vector :block/uuid (:block/uuid (block-by-prefix conn %)))
                   ["parent" "child" "a refs" "b target" "x holder"])
        export-edn (sqlite-export/build-export @conn {:export-type :view-nodes :rows rows})
        blocks (page-blocks export-edn "vp")
        by-title (fn [prefix] (some #(when (re-find (re-pattern (str "^" prefix)) (:block/title %)) %) blocks))]
    (testing "nodes are exported flat, children are not nested"
      (is (= 5 (count blocks)))
      (is (every? #(not (contains? % :build/children)) blocks)))
    (testing "referenced nodes keep their uuid"
      (is (= b-uuid (:block/uuid (by-title "b target"))))
      (is (not (contains? (by-title "parent") :block/uuid))))
    (testing "blocks used as property values are exported with their uuid"
      (is (= y-uuid (:block/uuid (block-by-title (page-blocks export-edn "ypage") "y target")))))))

;; Fails if, in `build-selected-nodes-export`, the `:include-uuid-fn` key is dropped.
(deftest selected-nodes-export-test
  (let [conn (nodes-conn)
        node-ids (mapv #(:db/id (block-by-prefix conn %)) ["parent" "a refs" "b target" "x holder"])
        export-edn (sqlite-export/build-export @conn {:export-type :selected-nodes :node-ids node-ids})
        blocks (page-blocks export-edn "vp")
        parent (block-by-title blocks "parent")]
    (testing "children of selected nodes are nested"
      (is (= ["child"] (mapv :block/title (:build/children parent)))))
    (testing "referenced nodes keep their uuid"
      (is (seq (filter #(= "b target" (:block/title %)) blocks)))
      (is (every? #(= b-uuid (:block/uuid %)) (filter #(= "b target" (:block/title %)) blocks))))
    (testing "property values are not exported as blocks"
      (is (not-any? #(= "some text" (:block/title %)) blocks)))
    (testing "blocks used as property values are exported with their uuid"
      (is (= y-uuid (:block/uuid (block-by-title (page-blocks export-edn "ypage") "y target")))))))

;; graph-human content refs, links and property history

;; Fails if, in `get-graph-content-ref-uuids`, the body becomes `nil`, the `(keep #(when-not (:logseq.property/bu...` step is dropped, `:block/link` becomes `:block/order`, `:logseq.property/built-in?` becomes `:logseq.property/classes`, `:block/page` becomes `:block/parent`, `:block/uuid` becomes `:block/_closed-value-property`, the `(map #(:block/uuid (d/entity db (:v %...` step is dropped, the `(mapcat db-content/get-matched-ids)` step is dropped or `filter` becomes `remove`.
(deftest graph-human-keeps-uuids-of-referenced-blocks-test
  (let [t2-uuid (random-uuid)
        t3-uuid (random-uuid)
        t5-uuid (random-uuid)
        conn (db-test/create-conn-with-import-map
              {:pages-and-blocks
               [{:page {:block/title "user page"}
                 :blocks [{:block/title "linker"}
                          {:block/title "t2" :block/uuid t2-uuid :build/keep-uuid? true}
                          {:block/title "t3" :block/uuid t3-uuid :build/keep-uuid? true}
                          {:block/title "t5" :block/uuid t5-uuid :build/keep-uuid? true}
                          {:block/title (str "see " (page-ref/->page-ref t5-uuid))}]}
                {:page {:block/title "Contents" :build/properties {:logseq.property/built-in? true}}
                 :blocks [{:block/title "top" :build/children [{:block/title "builtin linker"}]}]}]})
        eid #(:db/id (db-test/find-block-by-content @conn %))
        _ (d/transact! conn [[:db/add (eid "linker") :block/link (eid "t2")]
                             [:db/add (eid "builtin linker") :block/link (eid "t3")]])
        uuid-of (fn [export-edn title] (:block/uuid (block-by-title (page-blocks export-edn "user page") title)))]
    (testing "links from every page keep uuids"
      (let [export-edn (graph-human conn {})]
        (is (= t2-uuid (uuid-of export-edn "t2")))
        (is (= t3-uuid (uuid-of export-edn "t3")))
        (is (= t5-uuid (uuid-of export-edn "t5")))))
    (testing "links from built-in pages are ignored when they are excluded"
      (let [export-edn (graph-human conn {:exclude-built-in-pages? true})]
        (is (= t2-uuid (uuid-of export-edn "t2")))
        (is (nil? (uuid-of export-edn "t3")))
        (is (= t5-uuid (uuid-of export-edn "t5")))))))

;; Fails if, in `build-graph-export`, the `(mapcat (fn [history]` step is dropped, the `set` step is dropped, `:logseq.property.history/block` becomes `:logseq.property.history/property` or `:logseq.property.history/ref-value` becomes `:logseq.property.history/scalar-value`.
(deftest graph-human-keeps-uuids-referenced-by-property-history-test
  (let [h1 (random-uuid)
        h2 (random-uuid)
        h3 (random-uuid)
        hist-uuid (random-uuid)
        conn (db-test/create-conn-with-import-map
              {:properties {:user.property/num {:logseq.property/type :number}
                            :user.property/node {:logseq.property/type :node
                                                 :db/cardinality :db.cardinality/many}}
               :pages-and-blocks
               [{:page {:block/title "p"}
                 :blocks [{:block/title "h1" :block/uuid h1 :build/keep-uuid? true}
                          {:block/title "h2" :block/uuid h2 :build/keep-uuid? true}
                          {:block/title "h3" :block/uuid h3 :build/keep-uuid? true}
                          {:block/title "h4"}]}]})
        _ (d/transact! conn [{:block/uuid hist-uuid
                              :block/created-at t1
                              :logseq.property.history/block [:block/uuid h1]
                              :logseq.property.history/property :user.property/num
                              :logseq.property.history/scalar-value 42}
                             {:block/uuid (random-uuid)
                              :block/created-at t2
                              :logseq.property.history/block [:block/uuid h2]
                              :logseq.property.history/property :user.property/node
                              :logseq.property.history/ref-value [:block/uuid h3]}])
        export-edn (graph-human conn {})
        blocks (page-blocks export-edn "p")]
    (is (= #{h1 h2 h3} (set (keep :block/uuid blocks)))
        "blocks referenced by history keep their uuid, others lose it")
    (is (= 2 (count (::sqlite-export/property-history export-edn))))
    (is (contains? (::sqlite-export/property-history export-edn)
                   {:block/uuid hist-uuid
                    :block/created-at t1
                    :logseq.property.history/block [:block/uuid h1]
                    :logseq.property.history/property :user.property/num
                    :logseq.property.history/scalar-value 42}))
    (is (some #(= {:logseq.property.history/block [:block/uuid h2]
                   :logseq.property.history/property :user.property/node
                   :logseq.property.history/ref-value [:block/uuid h3]}
                  (dissoc % :block/uuid :block/created-at))
              (::sqlite-export/property-history export-edn)))))

;; small helpers called directly

;; Fails if, in `get-pvalue-uuids`, the `set` step is dropped.
(deftest get-pvalue-uuids-returns-set-test
  (let [u (random-uuid)
        r (#'sqlite-export/get-pvalue-uuids
           {:build/properties {:user.property/p (with-meta [:block/uuid u] {::sqlite-export/existing-property-value? true})
                               :user.property/q [:block/uuid (random-uuid)]}})]
    (is (set? r))
    (is (= #{u} r))))

;; Fails if, in `sort-pages-and-blocks`, `:build/journal` becomes `:build/keep-uuid?` or `:block/uuid` becomes `:block/_closed-value-property`.
(deftest sort-pages-and-blocks-orders-journals-and-uuids-test
  (let [f sqlite-export/sort-pages-and-blocks
        u1 #uuid "00000000-0000-4000-8000-000000000001"
        u2 #uuid "00000000-0000-4000-8000-000000000002"]
    (is (= [{:page {:build/journal 20250101}} {:page {:build/journal 20250102}}]
           (f [{:page {:build/journal 20250102}} {:page {:build/journal 20250101}}])))
    (is (= [{:page {:block/uuid u1}} {:page {:block/uuid u2}}]
           (f [{:page {:block/uuid u2}} {:page {:block/uuid u1}}])))
    (is (= [{:page {:build/journal 20250101}} {:page {:block/title "a"}} {:page {:block/title "b"}}]
           (f [{:page {:block/title "b"}} {:page {:build/journal 20250101}} {:page {:block/title "a"}}])))))

;; Fails if, in `find-undefined-classes-and-properties`, the body becomes `nil`, `:build/property-classes` becomes `:build/property-value`, `:build/class-properties` becomes `:build/closed-values` or `:build/properties` becomes `:build/property-classes`.
(deftest find-undefined-classes-and-properties-test
  (is (= {:classes #{:user.class/ViaProperty :user.class/ViaBlock}
          :properties #{:user.property/class-prop :user.property/page-prop :user.property/block-prop}}
         (#'sqlite-export/find-undefined-classes-and-properties
          {:classes {:user.class/Defined {:build/class-properties [:user.property/class-prop]}}
           :properties {:user.property/defined {:build/property-classes #{:user.class/ViaProperty}}}
           :pages-and-blocks [{:page {:block/title "p" :build/properties {:user.property/page-prop 1}}
                               :blocks [{:block/title "b"
                                         :build/tags #{:user.class/ViaBlock}
                                         :build/properties {:user.property/block-prop 1}}]}]}))))

;; Fails if, in `find-undefined-uuids`, the body becomes `nil`, `:block/uuid` becomes `:block/_closed-value-property`, the `set` step is dropped, `:block/alias` becomes `:block/closed-value-property` or the `:logseq.property/created-from-property` step is dropped.
(deftest find-undefined-uuids-test
  (let [conn (db-test/create-conn-with-import-map
              {:properties {:user.property/txt {:logseq.property/type :default}}
               :pages-and-blocks [{:page {:block/title "p"}
                                   :blocks [{:block/title "holder" :build/properties {:user.property/txt "v"}}]}]})
        value-block-uuid (:block/uuid (:user.property/txt (db-test/find-block-by-content @conn "holder")))
        [k1 p1 pg1 pv1 a1 a2 a3] (repeatedly 7 random-uuid)
        f #(#'sqlite-export/find-undefined-uuids @conn %)]
    (testing "undefined aliases"
      (is (= #{a1} (f {:classes {:user.class/K {:block/alias #{[:block/uuid a1]}}}})))
      (is (= #{a2} (f {:properties {:user.property/P {:block/alias #{[:block/uuid a2]}}}})))
      (is (= #{a3} (f {:pages-and-blocks [{:page {:block/alias #{[:block/uuid a3]}}}]}))))
    (testing "uuids defined by classes, properties, pages and property values are known"
      (is (= #{} (f {:classes {:user.class/K {:block/uuid k1}}
                     :properties {:user.property/P {:block/uuid p1 :block/alias #{[:block/uuid k1]}}}})))
      (is (= #{} (f {:classes {:user.class/K {:block/alias #{[:block/uuid p1]}}}
                     :properties {:user.property/P {:block/uuid p1}}})))
      (is (= #{} (f {:pages-and-blocks [{:page {:block/uuid pg1 :block/alias #{[:block/uuid pg1]}}}]})))
      (is (= #{} (f {:classes {:user.class/K {:block/alias #{[:block/uuid pv1]}}}
                     :pages-and-blocks [{:page {:block/title "p"}
                                         :blocks [{:block/title "b"
                                                   :build/properties {:user.property/txt
                                                                      {:build/property-value :block
                                                                       :block/title "v"
                                                                       :block/uuid pv1}}}]}]}))))
    (testing "uuids of property value blocks in the db are not undefined"
      (is (= #{} (f {:classes {:user.class/K {:block/alias #{[:block/uuid value-block-uuid]}}}}))))
    (testing "uuids of other blocks in the db are undefined when the export lacks them"
      (let [holder-uuid (:block/uuid (db-test/find-block-by-content @conn "holder"))]
        (is (= #{holder-uuid}
               (f {:classes {:user.class/K {:block/alias #{[:block/uuid holder-uuid]}}}})))))))

;; Fails if, in `patch-invalid-keywords`, the `(filter #(re-find #"[0-9a-zA-Z*+!_'?<...` step is dropped.
(deftest patch-invalid-keywords-test
  (is (= {:properties {:user.property/NUM-2ndx {} :user.property/ok {}}}
         (#'sqlite-export/patch-invalid-keywords
          {:properties {(keyword "user.property" "2nd.x") {} :user.property/ok {}}}))))

;; Fails if, in `update-existing-properties`, the `(map (fn [[k v]]` step is dropped, the `:property-id` key is dropped, the `:actual` key is dropped, the `:expected` key is dropped, `:logseq.property/type` becomes `:logseq.property/value`, `:db/cardinality` becomes `:db/id` or `:block/uuid` becomes `:block/_closed-value-property`.
(deftest update-existing-properties-test
  (let [conn (db-test/create-conn-with-import-map
              {:properties {:user.property/p1 {:logseq.property/type :default}}})
        conflicts (atom [])
        p1 (d/entity @conn :user.property/p1)
        result (#'sqlite-export/update-existing-properties
                @conn conflicts
                {:user.property/p1 {:logseq.property/type :number :db/cardinality :db.cardinality/many}
                 :user.property/new {:logseq.property/type :number}})]
    (is (= {:user.property/p1 {:logseq.property/type :number
                               :db/cardinality :db.cardinality/many
                               :block/uuid (:block/uuid p1)}
            :user.property/new {:logseq.property/type :number}}
           result))
    (is (= [{:property-id :user.property/p1
             :actual {:logseq.property/type :number :db/cardinality :db.cardinality/many}
             :expected {:logseq.property/type :default :db/cardinality :db.cardinality/one}}]
           @conflicts))))

;; Fails if, in `check-for-existing-entities`, the `(map (fn [[k v]]` step is dropped.
(deftest check-for-existing-entities-adds-uuids-of-existing-classes-test
  (let [conn (db-test/create-conn-with-import-map {:classes {:user.class/Existing {}}})
        existing (d/entity @conn :user.class/Existing)
        result (#'sqlite-export/check-for-existing-entities
                @conn {:classes {:user.class/Existing {:block/title "Existing"}
                                 :user.class/Other {:block/title "Other"}}}
                (atom []))]
    (is (= {:user.class/Existing {:block/title "Existing" :block/uuid (:block/uuid existing)}
            :user.class/Other {:block/title "Other"}}
           (:classes result)))))

;; Fails if, in `build-block-import-options`, `:block/page` becomes `:block/parent`.
(deftest build-block-import-options-test
  (let [current-uuid (random-uuid)
        page-uuid (random-uuid)
        result (#'sqlite-export/build-block-import-options
                {:block/uuid current-uuid :block/page {:block/uuid page-uuid :block/title "t"}}
                {::sqlite-export/block {:block/title "x" :block/page {:block/uuid (random-uuid)}}})]
    (is (= [{:page {:block/uuid page-uuid}
             :blocks [{:block/title "x" :block/uuid current-uuid}]}]
           (:pages-and-blocks result)))))

;; Fails if, in `current-db-retract-tx`, the `distinct` step is dropped.
(deftest current-db-retract-tx-is-distinct-test
  (let [conn (db-test/create-conn-with-import-map {:pages-and-blocks [{:page {:block/title "p"} :blocks [{:block/title "b"}]}]})
        tx (#'sqlite-export/current-db-retract-tx @conn)]
    (is (vector? tx))
    (is (= (count (set (map :e (d/datoms @conn :eavt)))) (count tx)))
    (is (apply distinct? tx))))

;; Fails if, in `datom-schema-attrs`, `:db/valueType` becomes `:db/add` or `:db/index` becomes `:db/retractEntity`.
;; Fails if, in `schema-datom-eids`, `:db/ident` becomes `:db/index`.
(deftest datoms-for-import-applies-schema-datoms-first-test
  (let [f #'sqlite-export/datoms-for-import]
    (testing "value type and index datoms are schema datoms"
      (is (= [[3 :db/valueType :db.type/ref] [3 :db/ident :user.property/r] [5 :db/index true] [5 :db/ident :user.property/i]
              [4 :other 1]]
             (vec (f [[4 :other 1] [3 :db/valueType :db.type/ref] [3 :db/ident :user.property/r]
                      [5 :db/index true] [5 :db/ident :user.property/i]])))))
    (testing "an ident alone is not a schema datom"
      (is (= [[5 :other 1] [5 :db/ident :foo/bar]]
             (vec (f [[5 :other 1] [5 :db/ident :foo/bar]])))))))

;; Fails if, in `build-datom-import`, the `:block-props-tx` key is dropped or the `:misc-tx` key is dropped.
(deftest build-import-of-datoms-test
  (let [conn (db-test/create-conn)
        result (sqlite-export/build-import {::sqlite-export/graph-format :datoms :datoms [[1 :block/title "x"]]} @conn {})]
    (is (= #{:init-tx :block-props-tx :misc-tx} (set (keys result))))
    (is (= [] (:block-props-tx result)))
    (is (= [] (:misc-tx result)))
    (is (= [:db/add 1 :block/title "x"] (last (:init-tx result))))))

;; Fails if, in `build-import`, the `:error` key is dropped.
(deftest build-import-reports-property-conflicts-test
  (let [conn (db-test/create-conn-with-import-map
              {:properties {:user.property/p1 {:logseq.property/type :default}}})
        result (sqlite-export/build-import {:properties {:user.property/p1 {:logseq.property/type :number}}} @conn {})]
    (is (string? (:error result)))
    (is (re-find #"user.property/p1" (:error result)))))

;; Fails if, in `tx-touched-entity-ids`, the `vec` step is dropped.
(deftest tx-touched-entity-ids-test
  (let [r (#'sqlite-export/tx-touched-entity-ids {:tx-data [{:e 1} {:e 1} {:e 2}]})]
    (is (vector? r))
    (is (= [1 2] r))))

;; Fails if, in `validate-import-tx-data`, the `:errors` key is dropped.
(deftest validate-import-tx-data-returns-errors-test
  (let [conn (db-test/create-conn)
        result (#'sqlite-export/validate-import-tx-data
                {:init-tx [{:block/uuid (random-uuid) :block/title "no name" :block/tags :logseq.class/Page}]}
                @conn "Test EDN" :graph)]
    (is (re-find #"^The Test EDN has \d+ validation error" (:error result)))
    (is (seq (:errors result)))))

;; Fails if, in `validate-import-txs`, the `:error` key is dropped.
(deftest validate-import-txs-passes-through-build-errors-test
  (let [conn (db-test/create-conn)]
    (is (= {:error "boom"} (sqlite-export/validate-import-txs {:error "boom"} @conn)))))

;; Fails if, in `validate-export`, the `:error` key is dropped.
(deftest validate-export-reports-unexpected-errors-test
  (let [result (sqlite-export/validate-export {:pages-and-blocks [{:page 1}]})]
    (is (re-find #"^The exported EDN is unexpectedly invalid: " (:error result)))))

;; Fails if, in `prepare-export-to-diff`, the body becomes `nil`, the `(update ::kv-values` step is dropped, the `;; This varies per copied graph so ig...` step is dropped, the `(sort-by :db/ident)` step is dropped, `remove` becomes `filter`, `:logseq.kv/local-graph-uuid` becomes `:logseq.kv/remote-schema-version` or `:db/ident` becomes `:db/index`.
;; Fails if, in `diff-exports`, the body becomes `nil`.
(deftest diff-exports-test
  (let [kv (fn [ident v] {:db/ident ident :kv/value v})
        base {::sqlite-export/kv-values [(kv :logseq.kv/a 1) (kv :logseq.kv/b 2)]}]
    (testing "kv values are compared regardless of order"
      (is (nil? (sqlite-export/diff-exports
                 base
                 {::sqlite-export/kv-values [(kv :logseq.kv/b 2) (kv :logseq.kv/a 1)]}))))
    (testing "per-graph kv values are ignored"
      (is (nil? (sqlite-export/diff-exports
                 (update base ::sqlite-export/kv-values into [(kv :logseq.kv/import-type 1)
                                                               (kv :logseq.kv/imported-at 1)
                                                               (kv :logseq.kv/local-graph-uuid 1)])
                 (update base ::sqlite-export/kv-values into [(kv :logseq.kv/import-type 2)
                                                               (kv :logseq.kv/imported-at 2)
                                                               (kv :logseq.kv/local-graph-uuid 2)])))))
    (testing "other kv values are compared"
      (is (some? (sqlite-export/diff-exports
                  base
                  (assoc base ::sqlite-export/kv-values [(kv :logseq.kv/a 1) (kv :logseq.kv/b 3)])))))
    (testing "kv values missing from one side are compared"
      (is (some? (sqlite-export/diff-exports
                  base
                  (update base ::sqlite-export/kv-values conj (kv :logseq.kv/remote-schema-version 1))))))
    (testing "a difference elsewhere is reported"
      (is (some? (sqlite-export/diff-exports (assoc base :properties {:a 1}) (assoc base :properties {:a 2})))))))

;; reader-3 additions

;; Fails if, in `closed-values-for-export`, the `(sort-by :block/order)` step is dropped.
(deftest recycled-referenced-closed-value-keeps-its-block-order-test
  (let [conn (db-test/create-conn-with-import-map fixture)
        joy (d/entity @conn [:block/uuid cv1])
        _ (d/transact! conn [[:db/add (:db/id joy) :logseq.property/deleted-at t1]])
        export-edn (sqlite-export/build-export @conn {:export-type :graph-ontology})]
    (is (= ["joy" "sad"]
           (mapv :value (get-in export-edn [:properties :user.property/closed :build/closed-values])))
        "a recycled closed value that a block still uses sorts before a later live one")))

;; Fails if, in `buildable-properties`, `:block/closed-value-property` becomes `:block/collapsed?`.
(deftest block-export-collapsed-property-value-keeps-its-properties-test
  (let [conn (db-test/create-conn-with-import-map
              {:properties {:user.property/txt {:logseq.property/type :default}
                            :user.property/num {:logseq.property/type :number}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "holder"
                           :build/properties {:user.property/txt
                                              {:build/property-value :block
                                               :block/title "folded value"
                                               :build/properties {:user.property/num 7}}}}]}]})
        pvalue (db-test/find-block-by-content @conn "folded value")
        _ (d/transact! conn [[:db/add (:db/id pvalue) :block/collapsed? true]])
        holder (db-test/find-block-by-content @conn "holder")
        exported (::sqlite-export/block
                  (sqlite-export/build-export @conn {:export-type :block :block-id (:db/id holder)}))]
    (is (true? (:block/collapsed? (d/entity @conn (:db/id pvalue)))))
    (is (= {:build/property-value :block
            :block/title "folded value"
            :build/properties {:user.property/num 7}}
           (get-in exported [:build/properties :user.property/txt])))))

;; Fails if, in `build-node-export`, `:block/tags` becomes `:block/title`.
(deftest block-export-keeps-tags-of-an-empty-block-test
  (let [conn (db-test/create-conn-with-import-map
              {:classes {:user.class/T {}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "" :build/tags #{:user.class/T :logseq.class/Task}}]}]})
        block (->> (d/datoms @conn :avet :block/title "")
                   (map #(d/entity @conn (:e %)))
                   (some #(when (:block/page %) %)))
        export-edn (sqlite-export/build-export @conn {:export-type :block :block-id (:db/id block)})]
    (is (= #{:user.class/T :logseq.class/Task} (:build/tags (::sqlite-export/block export-edn))))))

(def ^:private c2-uuid #uuid "55555555-5555-4555-8555-000000000001")

;; Fails if, in `build-class-parents-export`, the `(filter #(:build/class-extends (val %)))` step is dropped.
(deftest block-export-does-not-add-parents-of-a-class-referenced-in-content-test
  (let [conn (db-test/create-conn-with-import-map
              {:classes {:user.class/Base {}
                         :user.class/Sub {:build/class-extends [:user.class/Base]
                                          :block/uuid c2-uuid :build/keep-uuid? true}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title (str "about " (page-ref/->page-ref c2-uuid))}]}]})
        block (db-test/find-block-by-content @conn (str "about " (page-ref/->page-ref c2-uuid)))
        export-edn (sqlite-export/build-export @conn {:export-type :block :block-id (:db/id block)})]
    (is (contains? (:classes export-edn) :user.class/Sub))
    (is (not (contains? (:classes export-edn) :user.class/Base)))))

(def ^:private z-uuid #uuid "55555555-5555-4555-8555-000000000002")

(defn- pvalue-ref-conn
  []
  (db-test/create-conn-with-import-map
   {:properties {:user.property/txt {:logseq.property/type :default}}
    :pages-and-blocks
    [{:page {:block/title "vp"}
      :blocks [{:block/title "holder"
                :build/properties {:user.property/txt
                                   {:build/property-value :block
                                    :block/title (str "see " (page-ref/->page-ref z-uuid))}}}]}
     {:page {:block/title "zpage"}
      :blocks [{:block/title "z target" :block/uuid z-uuid :build/keep-uuid? true}]}]}))

;; Fails if, in `build-view-nodes-export`, the `vals` step is dropped.
(deftest view-nodes-export-keeps-uuid-of-block-referenced-by-a-property-value-test
  (let [conn (pvalue-ref-conn)
        holder (db-test/find-block-by-content @conn "holder")
        export-edn (sqlite-export/build-export @conn {:export-type :view-nodes
                                                      :rows [[:block/uuid (:block/uuid holder)]]})]
    (is (= z-uuid (:block/uuid (block-by-title (page-blocks export-edn "zpage") "z target"))))))

;; Fails if, in `build-selected-nodes-export`, the `vals` step is dropped.
(deftest selected-nodes-export-keeps-uuid-of-block-referenced-by-a-property-value-test
  (let [conn (pvalue-ref-conn)
        holder (db-test/find-block-by-content @conn "holder")
        export-edn (sqlite-export/build-export @conn {:export-type :selected-nodes
                                                      :node-ids [(:db/id holder)]})]
    (is (= z-uuid (:block/uuid (block-by-title (page-blocks export-edn "zpage") "z target"))))))
