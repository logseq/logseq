(ns logseq.db.frontend.property-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db.frontend.property :as db-property]))

(deftest sort-properties
  (let [p1 {:db/id 1, :block/order "a", :block/uuid "uuid-a"}
        p2 {:db/id 2, :block/order "b", :block/uuid "uuid-b"}
        p3 {:db/id 3, :block/order nil, :block/uuid "uuid-d"}
        p4 {:db/id 4, :block/order "b", :block/uuid "uuid-c"}
        p5 {:db/id 5, :block/order nil, :block/uuid "uuid-e"}]
    (is (= [p1 p2 p4 p3 p5]
           (db-property/sort-properties [p3 p1 p5 p2 p4])))))

(deftest normalize-block-order-tx-data-test
  (testing "Generate appropriate :block/order values for sorted-blocks with :block/order value = nil or duplicated"
    (let [p1 {:db/id 1, :block/order "a0"}
          p2 {:db/id 2, :block/order "bbb"}
          p3 {:db/id 3, :block/order "bbb"}
          p4 {:db/id 4, :block/order nil}
          p5 {:db/id 5, :block/order nil}
          sorted-entities [p1 p2 p3 p4 p5]
          tx-data (db-property/normalize-sorted-entities-block-order sorted-entities)
          ;; apply tx-data to entities
          tx-map (into {} (map (juxt :db/id identity) tx-data))
          updated-entities (map (fn [ent]
                                  (if-let [tx (get tx-map (:db/id ent))]
                                    (merge ent tx)
                                    ent))
                                sorted-entities)
          ;; sort again and test
          final-sorted (db-property/sort-properties updated-entities)]
      (is (= 5 (count final-sorted)))
      ;; Check that all orders are now strings
      (is (every? string? (map :block/order final-sorted)))
      ;; Check that all orders are unique
      (is (= 5 (count (set (map :block/order final-sorted)))))
      ;; Check that the final list is sorted correctly by the new orders
      (is (= final-sorted (sort-by :block/order final-sorted)))))

  (testing "No changes needed for already valid orders"
    (let [p1 {:db/id 1, :block/order "b00"}
          p2 {:db/id 2, :block/order "b01"}
          sorted-entities [p1 p2]
          tx-data (db-property/normalize-sorted-entities-block-order sorted-entities)]
      (is (empty? tx-data)))))

(deftest reaction-built-in-properties
  (let [props db-property/built-in-properties]
    (testing "entries exist"
      (is (contains? props :logseq.property.reaction/emoji-id))
      (is (contains? props :logseq.property.reaction/target)))

    (testing "schema types"
      (is (= :string (get-in props [:logseq.property.reaction/emoji-id :schema :type])))
      (is (= :node (get-in props [:logseq.property.reaction/target :schema :type]))))

    (testing "internal visibility"
      (is (= false (get-in props [:logseq.property.reaction/emoji-id :schema :public?])))
      (is (= false (get-in props [:logseq.property.reaction/target :schema :public?])))
      (is (= true (get-in props [:logseq.property.reaction/emoji-id :schema :hide?])))
      (is (= true (get-in props [:logseq.property.reaction/target :schema :hide?]))))

    (testing "logseq property namespace"
      (is (db-property/logseq-property? :logseq.property.reaction/emoji-id))
      (is (db-property/logseq-property? :logseq.property.reaction/target)))))

(deftest comments-built-in-properties
  (let [props db-property/built-in-properties
        property :logseq.property.comments/blocks]
    (is (contains? props property))
    (is (= "Commented blocks" (get-in props [property :title])))
    (is (= :node (get-in props [property :schema :type])))
    (is (= :many (get-in props [property :schema :cardinality])))
    (is (= false (get-in props [property :schema :public?])))
    (is (= true (get-in props [property :schema :hide?])))
    (is (db-property/logseq-property? property))))

(deftest assignee-built-in-property
  (let [property (get db-property/built-in-properties :logseq.property/assignee)]
    (testing "schema"
      (is (= "Assignee" (:title property)))
      (is (= :node (get-in property [:schema :type])))
      (is (= :many (get-in property [:schema :cardinality])))
      (is (= true (get-in property [:schema :public?]))))

    (testing "queryable built-in logseq property"
      (is (= true (:queryable? property)))
      (is (contains? db-property/public-built-in-properties :logseq.property/assignee))
      (is (db-property/logseq-property? :logseq.property/assignee)))))

(deftest agent-session-id-built-in-property
  (let [property (get db-property/built-in-properties :logseq.property.agent/session-id)]
    (testing "schema"
      (is (= "agent session id" (:title property)))
      (is (= :string (get-in property [:schema :type])))
      (is (not (contains? (:schema property) :db/cardinality)))
      (is (= false (get-in property [:schema :public?])))
      (is (= true (get-in property [:schema :hide?]))))

    (testing "internal built-in logseq property"
      (is (not (contains? db-property/public-built-in-properties :logseq.property.agent/session-id)))
      (is (db-property/logseq-property? :logseq.property.agent/session-id))
      (is (db-property/internal-property? :logseq.property.agent/session-id)))))
