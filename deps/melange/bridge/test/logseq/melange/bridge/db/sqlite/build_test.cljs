(ns logseq.melange.bridge.db.sqlite.build-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.melange.bridge.db.property :as melange-property]
            [logseq.melange.bridge.db.sqlite.build :as sqlite-build]
            [logseq.melange.bridge.db.test-helper :as db-test]))

(deftest create-blocks-builds-ontology-properties-and-content-refs
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Players"}
                :blocks [{:block/title "Jrue Holiday links [[Defense]]"
                          :build/tags [:Person]
                          :build/properties {:description "Clutch defense"}}]}])
        block (db-test/find-block-by-content @conn #"^Jrue Holiday links")
        referenced-page (db-test/find-page-by-title @conn "Defense")]
    (testing "auto-created ontology is applied"
      (is (= [:user.class/Person]
             (mapv :db/ident (:block/tags block))))
      (is (= "Clutch defense"
             (-> block
                 :user.property/description
                 melange-property/property-value-content))))
    (testing "named page references create and link a page"
      (is (some? referenced-page))
      (is (contains? (:block/refs block) referenced-page)))))

(deftest create-blocks-builds-nested-property-value-attributes
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}}
               :classes {:C1 {}}
               :pages-and-blocks
               [{:page {:block/title "Page"}
                 :blocks
                 [{:block/title "Owner"
                   :build/properties
                   {:p1 {:build/property-value :block
                         :block/title "Nested value"
                         :build/tags [:C1]
                         :build/properties {:description "Nested description"}}}}]}]})
        property-value (db-test/find-block-by-content @conn "Nested value")]
    (is (= [:user.class/C1]
           (mapv :db/ident (:block/tags property-value))))
    (is (= "Nested description"
           (-> property-value
               :user.property/description
               melange-property/property-value-content)))
    (is (= :user.property/p1
           (-> property-value
               :logseq.property/created-from-property
               :db/ident)))))

(deftest create-blocks-builds-built-in-property-values
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Page"}
                :blocks [{:block/title "Task"
                          :build/properties
                          {:logseq.property/status :logseq.property/status.doing}}
                         {:block/title "Colored"
                          :build/properties
                          {:logseq.property/background-color "red"}}]}])]
    (is (= :logseq.property/status.doing
           (-> (db-test/find-block-by-content @conn "Task")
               :logseq.property/status
               :db/ident)))
    (is (= "red"
           (-> (db-test/find-block-by-content @conn "Colored")
               :logseq.property/background-color
               melange-property/property-value-content)))))

(deftest create-blocks-expands-pages-used-as-property-values
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Source"
                       :build/properties
                       {:date [:build/page {:build/journal 20250223}]
                        :page [:build/page
                               {:block/title "Object"
                                :build/properties
                                {:description "Nested page"
                                 :date [:build/page {:build/journal 20250224}]}}]}}}])
        object-page (db-test/find-page-by-title @conn "Object")]
    (is (= "Nested page"
           (-> object-page
               :user.property/description
               melange-property/property-value-content)))
    (is (= 20250224
           (-> object-page :user.property/date :block/journal-day)))
    (is (= 20250223
           (-> (db-test/find-page-by-title @conn "Source")
               :user.property/date
               :block/journal-day)))))

(deftest create-blocks-attaches-content-to-class-and-property-pages
  (let [class-uuid (random-uuid)
        property-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:classes {:C1 {:block/uuid class-uuid :build/keep-uuid? true}}
               :properties {:p1 {:block/uuid property-uuid :build/keep-uuid? true}}
               :pages-and-blocks
               [{:page {:block/uuid class-uuid}
                 :blocks [{:block/title "Class child"
                           :build/children [{:block/title "Class grandchild"}]}]}
                {:page {:block/uuid property-uuid}
                 :blocks [{:block/title "Property child"
                           :build/children [{:block/title "Property grandchild"}]}]}]
               :build-existing-tx? true})]
    (is (= #{"Class child" "Class grandchild"}
           (->> (d/q '[:find [?block ...]
                       :in $ ?page
                       :where [?block :block/page ?page]]
                     @conn [:block/uuid class-uuid])
                (map #(-> (d/entity @conn %) :block/title))
                set)))
    (is (= #{"Property child" "Property grandchild"}
           (->> (d/q '[:find [?block ...]
                       :in $ ?page
                       :where [?block :block/page ?page]]
                     @conn [:block/uuid property-uuid])
                (map #(-> (d/entity @conn %) :block/title))
                set)))))

(deftest create-blocks-preserves-qualified-ontology-namespaces
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/p1 {:logseq.property/type :default}
                            :other.property/p1 {:logseq.property/type :default}}
               :classes {:user.class/C1 {}
                         :other.class/C1 {}}})]
    (doseq [ident [:user.property/p1 :other.property/p1
                   :user.class/C1 :other.class/C1]]
      (is (some? (d/entity @conn ident)) (str "Missing " ident)))))

(deftest create-blocks-expands-property-value-children
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "Page"}
                 :blocks
                 [{:block/title "Owner"
                   :build/properties
                   {:p1 {:build/property-value :block
                         :block/title "Value parent"
                         :build/children [{:block/title "Value child"}]}}}]}]})
        parent (db-test/find-block-by-content @conn "Value parent")
        child (db-test/find-block-by-content @conn "Value child")]
    (is (some? child))
    (is (= (:db/id parent) (-> child :block/parent :db/id)))
    (is (= (-> parent :block/page :db/id)
           (-> child :block/page :db/id)))))

(deftest create-blocks-minimally-updates-existing-entities
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:p1 {:logseq.property/type :default}}
               :classes {:C1 {}}
               :pages-and-blocks
               [{:page {:block/title "Page"}
                 :blocks [{:block/title "Original"}]}]})
        original-block (db-test/find-block-by-content @conn "Original")
        original-page (:block/page original-block)
        property (d/entity @conn :user.property/p1)
        class (d/entity @conn :user.class/C1)
        _ (sqlite-build/create-blocks
           conn
           {:pages-and-blocks
            [{:page {:block/uuid (:block/uuid original-page)}
              :blocks [{:block/uuid (:block/uuid original-block)
                        :block/title "Updated"
                        :build/tags [:user.class/C1]
                        :build/properties {:user.property/p1 "Changed"}}]}]
            :properties
            {:user.property/p1
             {:block/uuid (:block/uuid property)
              :logseq.property/type :default}}
            :classes
            {:user.class/C1 {:block/uuid (:block/uuid class)}}
            :auto-create-ontology? false
            :build-existing-tx? true})
        updated (db-test/find-block-by-content @conn "Updated")]
    (is (= (:db/id original-block) (:db/id updated)))
    (is (= (:db/id original-page) (-> updated :block/page :db/id)))
    (is (= [:user.class/C1] (mapv :db/ident (:block/tags updated))))
    (is (= "Changed"
           (-> updated
               :user.property/p1
               melange-property/property-value-content)))))

(deftest create-blocks-links-named-and-uuid-content-references
  (let [target-page-uuid (random-uuid)
        target-block-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Source"}
                 :blocks [{:block/title "named [[Named page]]"}
                          {:block/title (str "page [[" target-page-uuid "]]" )}
                          {:block/title (str "block [[" target-block-uuid "]]" )}
                          {:block/title "Target block"
                           :block/uuid target-block-uuid
                           :build/keep-uuid? true}]}
                {:page {:block/title "Target page"
                        :block/uuid target-page-uuid
                        :build/keep-uuid? true}}]
               :build-existing-tx? true})
        named-page (db-test/find-page-by-title @conn "Named page")
        target-page (db-test/find-page-by-title @conn "Target page")
        target-block (db-test/find-block-by-content @conn "Target block")]
    (is (contains? (:block/refs (db-test/find-block-by-content @conn #"^named"))
                   named-page))
    (is (contains? (:block/refs (db-test/find-block-by-content @conn #"^page"))
                   target-page))
    (is (contains? (:block/refs (db-test/find-block-by-content @conn #"^block"))
                   target-block))))

(deftest create-blocks-applies-properties-to-ontology-pages
  (let [conn (db-test/create-conn-with-blocks
              {:properties
               {:description {:logseq.property/type :default}
                :p1 {:logseq.property/type :default
                     :build/properties {:description "Property description"}}}
               :classes
               {:C1 {:build/properties {:description "Class description"}}}})
        property (d/entity @conn :user.property/p1)
        class (d/entity @conn :user.class/C1)]
    (is (= "Property description"
           (-> property
               :user.property/description
               melange-property/property-value-content)))
    (is (= "Class description"
           (-> class
               :user.property/description
               melange-property/property-value-content)))))

(deftest create-blocks-builds-class-property-relationships
  (let [conn (db-test/create-conn-with-blocks
              {:properties
               {:p1 {:logseq.property/type :default
                     :build/property-classes [:C1]}
                :p2 {:logseq.property/type :default}}
               :classes
               {:C1 {:build/class-properties [:p2 :p1]
                     :build/class-extends [:logseq.class/Task]}}})
        p1 (d/entity @conn :user.property/p1)
        class (d/entity @conn :user.class/C1)]
    (is (= [:user.class/C1]
           (mapv :db/ident (:logseq.property/classes p1))))
    (is (= #{:user.property/p2 :user.property/p1}
           (set (map :db/ident (:logseq.property.class/properties class)))))
    (is (neg? (compare (:block/order (d/entity @conn :user.property/p2))
                       (:block/order (d/entity @conn :user.property/p1)))))
    (is (= [:logseq.class/Task]
           (mapv :db/ident (:logseq.property.class/extends class))))))
