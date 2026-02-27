(ns logseq.db-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

;;; datoms
;;; - 1 <----+
;;;   - 2    |
;;;     - 3 -+
(comment
  ;; TODO: throw error or fix broken data when cycle detected
  (def broken-outliner-data-with-cycle
    [{:db/id 1
      :block/uuid #uuid"e538d319-48d4-4a6d-ae70-c03bb55b6fe4"
      :block/parent 3}
     {:db/id 2
      :block/uuid #uuid"c46664c0-ea45-4998-adf0-4c36486bb2e5"
      :block/parent 1}
     {:db/id 3
      :block/uuid #uuid"2b736ac4-fd49-4e04-b00f-48997d2c61a2"
      :block/parent 2}]))

(def class-parents-data
  [{:block/tags :logseq.class/Tag
    :block/title "x"
    :block/name "x"
    :block/uuid #uuid "6c353967-f79b-4785-b804-a39b81d72461"}
   {:block/tags :logseq.class/Tag
    :block/title "y"
    :block/name "y"
    :block/uuid #uuid "7008db08-ba0c-4aa9-afc6-7e4783e40a99"
    :logseq.property.class/extends [:block/uuid #uuid "6c353967-f79b-4785-b804-a39b81d72461"]}
   {:block/tags :logseq.class/Tag
    :block/title "z"
    :block/name "z"
    :block/uuid #uuid "d95f2912-a7af-41b9-8ed5-28861f7fc0be"
    :logseq.property.class/extends [:block/uuid #uuid "7008db08-ba0c-4aa9-afc6-7e4783e40a99"]}])

(deftest get-class-extends
  (let [conn (db-test/create-conn)]
    (d/transact! conn class-parents-data)
    (is (= #{"x" "y"}
           (->> (ldb/get-class-extends (ldb/get-page @conn "z"))
                (map :block/title)
                set)))))

(deftest get-case-page
  (let [conn (db-test/create-conn-with-blocks
              {:properties
               {:foo {:logseq.property/type :default}
                :Foo {:logseq.property/type :default}}
               :classes {:movie {} :Movie {}}})]
    ;; Case sensitive properties
    (is (= "foo" (:block/title (ldb/get-case-page @conn "foo"))))
    (is (= "Foo" (:block/title (ldb/get-case-page @conn "Foo"))))
    ;; Case sensitive classes
    (is (= "movie" (:block/title (ldb/get-case-page @conn "movie"))))
    (is (= "Movie" (:block/title (ldb/get-case-page @conn "Movie"))))))

(deftest page-exists
  (let [conn (db-test/create-conn-with-blocks
              {:properties
               {:foo {:logseq.property/type :default}
                :Foo {:logseq.property/type :default}}
               :classes {:movie {} :Movie {}}})]
    (is (= ["foo"]
           (map #(:block/title (d/entity @conn %)) (ldb/page-exists? @conn "foo" #{:logseq.class/Property})))
        "Property pages correctly found for given class")
    (is (= nil
           (ldb/page-exists? @conn "foo" #{:logseq.class/Tag}))
        "Property pages correctly not found for given class")
    (is (= ["movie"]
           (map #(:block/title (d/entity @conn %)) (ldb/page-exists? @conn "movie" #{:logseq.class/Tag})))
        "Class pages correctly found for given class")
    (is (= nil
           (ldb/page-exists? @conn "movie" #{:logseq.class/Property}))
        "Class pages correctly not found for given class")))

(deftest test-transact-with-multiple-tx-datoms
  (testing "last write wins with same tx"
    (let [conn (d/create-conn)]
      (d/transact! conn [[:db/add -1 :property :v1]])
      (let [tx (:max-tx @conn)]
        (ldb/transact! conn
                       [(d/datom 1 :property :v1 (inc tx) false)
                        (d/datom 1 :property :v1 (inc tx) true)]))
      (is (= :v1 (:property (d/entity @conn 1))))))
  (testing "last write wins with different tx"
    (let [conn (d/create-conn)]
      (d/transact! conn [[:db/add -1 :property :v1]])
      (let [tx (:max-tx @conn)]
        (ldb/transact! conn
                       [(d/datom 1 :property :v1 (inc tx) false)
                        (d/datom 1 :property :v1 (+ tx 2) true)]))
      (is (= :v1 (:property (d/entity @conn 1)))))))

(deftest test-transact-with-temp-conn!
  (testing "DB validation should be running after the whole transaction"
    (let [conn (db-test/create-conn)]
      (testing "#Task shouldn't be converted to property"
        (is (thrown? js/Error
                     (with-out-str
                       (db-test/silence-stderr
                        (ldb/transact! conn [{:db/ident :logseq.class/Task
                                              :block/tags :logseq.class/Property}]))))))
      (ldb/transact-with-temp-conn!
       conn
       {}
       (fn [temp-conn _*batch-tx-data]
         (ldb/transact! temp-conn [{:db/ident :logseq.class/Task
                                    :block/tags :logseq.class/Property}])
         (ldb/transact! temp-conn [[:db/retract :logseq.class/Task :block/tags :logseq.class/Property]]))))))

(deftest get-bidirectional-properties
  (testing "disabled by default"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:friend {:logseq.property/type :node
                                       :build/property-classes [:Person]}}
                 :classes {:Person {}
                           :Project {}}
                 :pages-and-blocks
                 [{:page {:block/title "Alice"
                          :build/tags [:Person]
                          :build/properties {:friend [:build/page {:block/title "Bob"}]}}}
                  {:page {:block/title "Bob"}}
                  {:page {:block/title "Charlie"
                          :build/tags [:Project]
                          :build/properties {:friend [:build/page {:block/title "Bob"}]}}}]})
          target (db-test/find-page-by-title @conn "Bob")]
      (is (empty? (ldb/get-bidirectional-properties @conn (:db/id target))))))

  (testing "enabled per class"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:friend {:logseq.property/type :node
                                       :build/property-classes [:Person]}}
                 :classes {:Person {:build/properties {:logseq.property.class/enable-bidirectional? true}}
                           :Project {}}
                 :pages-and-blocks
                 [{:page {:block/title "Alice"
                          :build/tags [:Person]
                          :build/properties {:friend [:build/page {:block/title "Bob"}]}}}
                  {:page {:block/title "Bob"}}
                  {:page {:block/title "Charlie"
                          :build/tags [:Project]
                          :build/properties {:friend [:build/page {:block/title "Bob"}]}}}]})
          target (db-test/find-page-by-title @conn "Bob")
          results (ldb/get-bidirectional-properties @conn (:db/id target))]
      (is (= 1 (count results)))
      (is (= "People" (:title (first results))))
      (is (= ["Alice"]
             (map :block/title (:entities (first results))))))))

(defn- bidirectional-perf-conn
  [n property-titles]
  (let [target-page {:page {:block/title "Target"}}
        properties (into {}
                         (map (fn [property-title]
                                [property-title {:logseq.property/type :node
                                                 :build/property-classes [:Person]}]))
                         property-titles)
        person-properties (into {}
                                (map (fn [property-title]
                                       [property-title [:build/page {:block/title "Target"}]]))
                                property-titles)
        pages (vec (concat [target-page]
                           (map (fn [i]
                                  {:page {:block/title (str "Person " i)
                                          :build/tags [:Person]
                                          :build/properties person-properties}})
                                (range n))))]
    (db-test/create-conn-with-blocks
     {:properties properties
      :classes {:Person {:build/properties {:logseq.property.class/enable-bidirectional? true}}}
      :pages-and-blocks pages})))

(deftest ^:long get-bidirectional-properties-performance-single-property
  (testing "attribute lookups scale with unique properties, not entities"
    (let [conn (bidirectional-perf-conn 400 [:friend])
          target-id (:db/id (db-test/find-page-by-title @conn "Target"))
          original-entity d/entity
          attr-lookups (atom 0)
          results (with-redefs [d/entity (fn [db eid]
                                           (when (keyword? eid)
                                             (swap! attr-lookups inc))
                                           (original-entity db eid))]
                    (ldb/get-bidirectional-properties @conn target-id))]
      (is (= 1 (count results)))
      (is (= 400 (count (:entities (first results)))))
      (is (<= @attr-lookups 8)
          (str "expected bounded attr lookups, got " @attr-lookups)))))

(deftest ^:long get-bidirectional-properties-performance-multi-property
  (testing "attribute lookups stay bounded with multiple matching properties"
    (let [conn (bidirectional-perf-conn 300 [:friend :colleague])
          target-id (:db/id (db-test/find-page-by-title @conn "Target"))
          original-entity d/entity
          attr-lookups (atom 0)
          results (with-redefs [d/entity (fn [db eid]
                                           (when (keyword? eid)
                                             (swap! attr-lookups inc))
                                           (original-entity db eid))]
                    (ldb/get-bidirectional-properties @conn target-id))]
      (is (= 1 (count results)))
      (is (= 300 (count (:entities (first results)))))
      (is (<= @attr-lookups 12)
          (str "expected bounded attr lookups, got " @attr-lookups)))))
