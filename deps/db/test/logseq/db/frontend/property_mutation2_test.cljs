(ns logseq.db.frontend.property-mutation2-test
  "Second-run mutation survivors in logseq.db.frontend.property."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.test.helper :as db-test]))

(defn- closed-value-conn
  "A graph with a closed-value property :user.property/choice and a block with
  :logseq.property/description. Returns {:conn :ids {title eid} :block-id}."
  []
  (let [uuids (zipmap ["a" "b" "c"] (repeatedly random-uuid))
        conn (db-test/create-conn-with-blocks
              {:properties {:user.property/choice
                            {:logseq.property/type :default
                             :build/closed-values (mapv (fn [[title u]] {:value title :uuid u}) uuids)}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "described"
                           :build/properties {:logseq.property/description "desc"}}]}]})
        ids (update-vals uuids #(:db/id (d/entity @conn [:block/uuid %])))]
    {:conn conn
     :ids ids
     :block-id (:db/id (db-test/find-block-by-content @conn "described"))}))

(deftest valid-property-name-requires-a-string
  (is (true? (db-property/valid-property-name? "plain")))
  (is (false? (db-property/valid-property-name? "#tag")))
  (is (false? (db-property/valid-property-name? "[[page]]")))
  (is (thrown-with-msg? js/Error #"Assert failed: \(string\? s\)"
                        (db-property/valid-property-name? nil))))

(deftest get-closed-property-values-skips-recycled-and-sorts-by-order
  (let [{:keys [conn ids]} (closed-value-conn)]
    (d/transact! conn [[:db/add (ids "a") :block/order "a3"]
                       [:db/add (ids "b") :block/order "a1"]
                       [:db/add (ids "c") :block/order "a2"]])
    (is (= ["b" "c" "a"]
           (map :block/title (db-property/get-closed-property-values @conn :user.property/choice)))
        "Values come back sorted by :block/order")
    (d/transact! conn [[:db/add (ids "c") :logseq.property/deleted-at 1]])
    (is (= ["b" "a"]
           (map :block/title (db-property/get-closed-property-values @conn :user.property/choice)))
        "A recycled value is not returned")))

(deftest get-closed-value-entity-by-name-finds-a-value-by-its-content
  (let [{:keys [conn ids]} (closed-value-conn)]
    (is (= (ids "b")
           (:db/id (db-property/get-closed-value-entity-by-name @conn :user.property/choice "b"))))
    (is (nil? (db-property/get-closed-value-entity-by-name @conn :user.property/choice "missing")))))

(deftest sort-properties-breaks-ties-by-uuid
  (let [p1 {:db/id 1 :block/order "a" :block/uuid "uuid-a"}
        p2 {:db/id 2 :block/order "b" :block/uuid "uuid-b"}
        p3 {:db/id 3 :block/order "b" :block/uuid "uuid-c"}
        p4 {:db/id 4 :block/order nil :block/uuid "uuid-d"}
        p5 {:db/id 5 :block/order nil :block/uuid "uuid-e"}]
    (is (= [p2 p3] (db-property/sort-properties [p3 p2])) "Equal orders sort by uuid")
    (is (= [p4 p5] (db-property/sort-properties [p5 p4])) "Missing orders sort by uuid")
    (is (= [p1 p2 p3 p4 p5] (db-property/sort-properties [p5 p3 p4 p2 p1])))))

(deftest get-class-ordered-properties-sorts-the-class-properties
  (let [p1 {:db/id 1 :block/order "a" :block/uuid "uuid-a"}
        p2 {:db/id 2 :block/order "b" :block/uuid "uuid-b"}
        p3 {:db/id 3 :block/order nil :block/uuid "uuid-c"}]
    (is (= [p1 p2 p3]
           (db-property/get-class-ordered-properties
            {:logseq.property.class/properties [p3 p2 p1]})))))

(defn- ascending?
  [& order-keys]
  (every? neg? (map compare order-keys (rest order-keys))))

(deftest normalize-sorted-entities-block-order-keeps-generated-keys-between-neighbours
  (let [orders (fn [entities]
                 (let [tx-map (into {} (map (juxt :db/id :block/order))
                                    (db-property/normalize-sorted-entities-block-order entities))]
                   (map tx-map [2 3])))
        [lo hi] (orders [{:db/id 1 :block/order "a0"}
                         {:db/id 2 :block/order "a1"}
                         {:db/id 3 :block/order "a1"}])
        [lo' hi'] (orders [{:db/id 1 :block/order "a2"}
                           {:db/id 2 :block/order "a3"}
                           {:db/id 3 :block/order "a3"}])]
    (is (ascending? "a0" lo hi "a1") "Duplicates share the gap between the previous entity and their own order")
    (is (ascending? "a2" lo' hi' "a3") "A single previous entity bounds the generated keys from below")))

(deftest scoped-closed-values-applies-exclusions-and-class-scope
  (let [excluded {:db/id 101}
        scoped {:db/id 100 :logseq.property/choice-classes [{:db/id 10}]}
        other-scope {:db/id 102 :logseq.property/choice-classes [{:db/id 99}]}
        unscoped {:db/id 103}
        values [scoped excluded other-scope unscoped]
        property {}
        tagged {:db/id 1 :block/tags [{:db/id 10 :logseq.property/choice-exclusions [excluded]}]}]
    (is (= [scoped unscoped]
           (db-property/scoped-closed-values property tagged :values values))
        "An excluded choice and a choice scoped to another class are hidden")
    (is (= [excluded unscoped]
           (db-property/scoped-closed-values property {:db/id 2} :values [scoped excluded other-scope unscoped]))
        "A block without classes sees only unscoped choices")))

(deftest scoped-closed-values-includes-the-block-itself-when-it-is-a-class
  (let [scoped {:db/id 100 :logseq.property/choice-classes [{:db/id 10}]}
        class-block {:db/id 10 :block/tags [{:db/ident :logseq.class/Tag}]}]
    (is (= [scoped]
           (db-property/scoped-closed-values {} class-block :values [scoped]))
        "A class sees choices scoped to itself")))

(deftest get-block-property-value-reads-the-live-entity
  (let [{:keys [conn block-id]} (closed-value-conn)]
    (is (= "desc"
           (db-property/get-block-property-value @conn {:db/id block-id} :logseq.property/description))
        "The value is read from the entity of the block's :db/id")
    (is (nil? (db-property/get-block-property-value nil {:db/id block-id} :logseq.property/description))
        "Without a db there is no value")))
