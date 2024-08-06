(ns logseq.outliner.property-test
  (:require [cljs.test :refer [deftest is testing are]]
            [logseq.db.frontend.schema :as db-schema]
            [datascript.core :as d]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.outliner.property :as outliner-property]
            [logseq.db.frontend.property :as db-property]))

(defn- find-block-by-content [conn content]
  (->> content
       (d/q '[:find [(pull ?b [*]) ...]
              :in $ ?content
              :where [?b :block/title ?content]]
            @conn)
       first))

(defn- create-conn-with-blocks [opts]
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
        _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
        _ (sqlite-build/create-blocks conn opts)]
    conn))

(deftest upsert-property!
  (testing "Creates a property"
    (let [conn (create-conn-with-blocks [])
          _ (outliner-property/upsert-property! conn nil {:type :number} {:property-name "num"})]
      (is (= {:type :number}
             (:block/schema (d/entity @conn :user.property/num)))
          "Creates property with property-name")))

  (testing "Updates a property"
    (let [conn (create-conn-with-blocks {:properties {:num {:block/schema {:type :number}}}})
          _ (outliner-property/upsert-property! conn :user.property/num {:type :default :cardinality :many} {})]
      (is (db-property/many? (d/entity @conn :user.property/num)))))

  (testing "Multiple properties that generate the same initial :db/ident"
    (let [conn (create-conn-with-blocks [])]
      (outliner-property/upsert-property! conn nil {:type :default} {:property-name "p1"})
      (outliner-property/upsert-property! conn nil {} {:property-name ":p1"})
      (outliner-property/upsert-property! conn nil {} {:property-name "1p1"})

      (is (= {:block/name "p1" :block/title "p1" :block/schema {:type :default}}
             (select-keys (d/entity @conn :user.property/p1) [:block/name :block/title :block/schema]))
          "Existing db/ident does not get modified")
      (is (= ":p1"
             (:block/title (d/entity @conn :user.property/p1-1)))
          "2nd property gets unique ident")
      (is (= "1p1"
             (:block/title (d/entity @conn :user.property/p1-2)))
          "3rd property gets unique ident"))))

(deftest convert-property-input-string
  (testing "Convert property input string according to its schema type"
    (let [test-uuid (random-uuid)]
      (are [x y]
           (= (let [[schema-type value] x]
                (outliner-property/convert-property-input-string schema-type value)) y)
        [:number "1"] 1
        [:number "1.2"] 1.2
        [:url test-uuid] test-uuid
        [:date test-uuid] test-uuid
        [:any test-uuid] test-uuid
        [nil test-uuid] test-uuid))))

(deftest create-property-text-block!
  (testing "Create a new :default property value"
    (let [conn (create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:default "foo"}}
                           {:block/title "b2"}]}])
          block (find-block-by-content conn "b2")
          ;; Use same args as outliner.op
          _ (outliner-property/create-property-text-block! conn (:db/id block) :user.property/default "" {})
          new-property-value (:user.property/default (find-block-by-content conn "b2"))]

      (is (some? (:db/id new-property-value)) "New property value created")
      (is (= "" (db-property/ref->property-value-content @conn new-property-value))
          "Property value has correct content")
      (is (= :user.property/default
             (get-in (d/entity @conn (:db/id new-property-value)) [:logseq.property/created-from-property :db/ident]))
          "Has correct created-from-property")))

  (testing "Create cases for a new :one :number property value"
    (let [conn (create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:num 2}}
                           {:block/title "b2"}]}])
          block (find-block-by-content conn "b2")
          ;; Use same args as outliner.op
          _ (outliner-property/create-property-text-block! conn (:db/id block) :user.property/num "3" {})
          new-property-value (:user.property/num (find-block-by-content conn "b2"))]

      (is (some? (:db/id new-property-value)) "New property value created")
      (is (= 3 (db-property/ref->property-value-content @conn new-property-value))
          "Property value has correct content")
      (is (= :user.property/num
             (get-in (d/entity @conn (:db/id new-property-value)) [:logseq.property/created-from-property :db/ident]))
          "Has correct created-from-property")

      (is (thrown-with-msg?
           js/Error
           #"Can't convert"
           (outliner-property/create-property-text-block! conn (:db/id block) :user.property/num "Not a number" {}))
          "Wrong value isn't transacted")))

  (testing "Create new :many :number property values"
    (let [conn (create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:num-many #{2}}}
                           {:block/title "b2"}]}])
          block (find-block-by-content conn "b2")
          ;; Use same args as outliner.op
          _ (outliner-property/create-property-text-block! conn (:db/id block) :user.property/num-many "3" {})
          _ (outliner-property/create-property-text-block! conn (:db/id block) :user.property/num-many "4" {})
          _ (outliner-property/create-property-text-block! conn (:db/id block) :user.property/num-many "5" {})
          new-property-values (:user.property/num-many (find-block-by-content conn "b2"))]

      (is (seq new-property-values) "New property values created")
      (is (= #{3 4 5} (db-property/ref->property-value-contents @conn new-property-values))
          "Property value has correct content"))))

(deftest set-block-property-basic-cases
  (testing "Set a :number value with existing value"
    (let [conn (create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:num 2}}
                           {:block/title "b2"}]}])
          property-value (:user.property/num (find-block-by-content conn "b1"))
          _ (assert (:db/id property-value))
          block-uuid (:block/uuid (find-block-by-content conn "b2"))
          ;; Use same args as outliner.op
          _ (outliner-property/set-block-property! conn [:block/uuid block-uuid] :user.property/num (:db/id property-value))]
      (is (= (:db/id property-value)
             (:db/id (:user.property/num (find-block-by-content conn "b2")))))))

  (testing "Update a :number value with existing value"
    (let [conn (create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:num 2}}
                           {:block/title "b2" :build/properties {:num 3}}]}])
          property-value (:user.property/num (find-block-by-content conn "b1"))
          _ (assert (:db/id property-value))
          block-uuid (:block/uuid (find-block-by-content conn "b2"))
          ;; Use same args as outliner.op
          _ (outliner-property/set-block-property! conn [:block/uuid block-uuid] :user.property/num (:db/id property-value))]
      (is (= (:db/id property-value)
             (:db/id (:user.property/num (find-block-by-content conn "b2"))))))))

(deftest set-block-property-with-non-ref-values
  (testing "Setting :default with same property value reuses existing entity"
    (let [conn (create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:logseq.property/order-list-type "number"}}
                           {:block/title "b2"}]}])
          property-value (:logseq.property/order-list-type (find-block-by-content conn "b1"))
          block-uuid (:block/uuid (find-block-by-content conn "b2"))
          ;; Use same args as outliner.op
          _ (outliner-property/set-block-property! conn [:block/uuid block-uuid] :logseq.property/order-list-type "number")]
      (is (some? (:db/id (:logseq.property/order-list-type (find-block-by-content conn "b2"))))
          "New block has property set")
      (is (= (:db/id property-value)
             (:db/id (:logseq.property/order-list-type (find-block-by-content conn "b2")))))))

  (testing "Setting :checkbox with same property value reuses existing entity"
    (let [conn (create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1" :build/properties {:checkbox true}}
                           {:block/title "b2"}]}])
          property-value (:user.property/checkbox (find-block-by-content conn "b1"))
          block-uuid (:block/uuid (find-block-by-content conn "b2"))
          ;; Use same args as outliner.op
          _ (outliner-property/set-block-property! conn [:block/uuid block-uuid] :user.property/checkbox true)]
      (is (true? (:user.property/checkbox (find-block-by-content conn "b2")))
          "New block has property set")
      (is (= property-value (:user.property/checkbox (find-block-by-content conn "b2")))))))

(deftest remove-block-property!
  (let [conn (create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1" :build/properties {:default "foo"}}]}])
        block (find-block-by-content conn "b1")
        _ (assert (:user.property/default block))
        ;; Use same args as outliner.op
        _ (outliner-property/remove-block-property! conn [:block/uuid (:block/uuid block)] :user.property/default)
        updated-block (find-block-by-content conn "b1")]
    (is (some? updated-block))
    (is (nil? (:user.property/default updated-block)) "Block property is deleted")))

(deftest batch-set-property!
  (let [conn (create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "item 1"}
                         {:block/title "item 2"}]}])
        block-ids (map #(-> (find-block-by-content conn %) :block/uuid) ["item 1" "item 2"])
        _ (outliner-property/batch-set-property! conn block-ids :logseq.property/order-list-type "number")
        updated-blocks (map #(find-block-by-content conn %) ["item 1" "item 2"])]
    (is (= ["number" "number"]
           (map #(db-property/ref->property-value-contents @conn (:logseq.property/order-list-type %))
                updated-blocks))
        "Property values are batch set")))

(deftest batch-remove-property!
  (let [conn (create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "item 1" :build/properties {:logseq.property/order-list-type "number"}}
                         {:block/title "item 2" :build/properties {:logseq.property/order-list-type "number"}}]}])
        block-ids (map #(-> (find-block-by-content conn %) :block/uuid) ["item 1" "item 2"])
        _ (outliner-property/batch-remove-property! conn block-ids :logseq.property/order-list-type)
        updated-blocks (map #(find-block-by-content conn %) ["item 1" "item 2"])]
    (is (= [nil nil]
           (map :logseq.property/order-list-type updated-blocks))
        "Property values are batch removed")))

(deftest add-existing-values-to-closed-values!
  (let [conn (create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1" :build/properties {:num 1}}
                         {:block/title "b2" :build/properties {:num 2}}]}])
        values (map (fn [d] (:block/uuid (d/entity @conn (:v d)))) (d/datoms @conn :avet :user.property/num))
        _ (outliner-property/add-existing-values-to-closed-values! conn :user.property/num values)]
    (is (= [1 2]
           (map db-property/closed-value-content (:block/_closed-value-property (d/entity @conn :user.property/num)))))))

(deftest upsert-closed-value!
  (let [conn (create-conn-with-blocks
              {:properties {:num {:build/closed-values [{:uuid (random-uuid) :value 2}]
                                  :block/schema {:type :number}}}})]

    (testing "Add non-number choice shouldn't work"
      (is
       (thrown-with-msg?
        js/Error
        #"Can't convert"
        (outliner-property/upsert-closed-value! conn :user.property/num {:value "not a number"}))))

    (testing "Can't add existing choice"
      (is
       (thrown-with-msg?
        js/Error
        #"Closed value choice already exists"
        (outliner-property/upsert-closed-value! conn :user.property/num {:value 2}))))

    (testing "Add choice successfully"
      (let [_ (outliner-property/upsert-closed-value! conn :user.property/num {:value 3})
            b (first (d/q '[:find [(pull ?b [*]) ...] :where [?b :property.value/content 3]] @conn))]
        (is (= (:block/type b) "closed value"))
        (is (= [2 3]
               (map db-property/closed-value-content (:block/_closed-value-property (d/entity @conn :user.property/num)))))))

    (testing "Update choice successfully"
      (let [b (first (d/q '[:find [(pull ?b [*]) ...] :where [?b :property.value/content 2]] @conn))
            _ (outliner-property/upsert-closed-value! conn :user.property/num {:id (:block/uuid b)
                                                                               :value 4
                                                                               :description "choice 4"})
            updated-b (d/entity @conn [:block/uuid (:block/uuid b)])]
        (is (= 4 (db-property/closed-value-content updated-b)))
        (is (= "choice 4" (db-property/property-value-content (:logseq.property/description updated-b))))))))

(deftest delete-closed-value!
  (let [closed-value-uuid (random-uuid)
        used-closed-value-uuid (random-uuid)
        conn (create-conn-with-blocks
              {:properties {:default {:build/closed-values [{:uuid closed-value-uuid :value "foo"}
                                                            {:uuid used-closed-value-uuid :value "bar"}]
                                      :block/schema {:type :default}}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "b1" :user.property/default [:block/uuid used-closed-value-uuid]}]}]})
        _ (assert (:user.property/default (find-block-by-content conn "b1")))
        property-uuid (:block/uuid (d/entity @conn :user.property-default))
        _ (outliner-property/delete-closed-value! conn property-uuid [:block/uuid closed-value-uuid])]
    (is (nil? (d/entity @conn [:block/uuid closed-value-uuid])))))

(deftest class-add-property!
  (let [conn (create-conn-with-blocks
              {:classes {:c1 {}}
               :properties {:p1 {:block/schema {:type :default}}
                            :p2 {:block/schema {:type :default}}}})
        _ (outliner-property/class-add-property! conn :user.class/c1 :user.property/p1)
        _ (outliner-property/class-add-property! conn :user.class/c1 :user.property/p2)]
    (is (= [:user.property/p1 :user.property/p2]
           (map :db/ident (:class/schema.properties (d/entity @conn :user.class/c1)))))))

(deftest class-remove-property!
  (let [conn (create-conn-with-blocks
              {:classes {:c1 {:build/schema-properties [:p1 :p2]}}})
        _ (outliner-property/class-remove-property! conn :user.class/c1 :user.property/p1)]
    (is (= [:user.property/p2]
           (map :db/ident (:class/schema.properties (d/entity @conn :user.class/c1)))))))

(deftest get-block-classes-properties
  (let [conn (create-conn-with-blocks
              {:classes {:c1 {:build/schema-properties [:p1]}
                         :c2 {:build/schema-properties [:p2 :p3]}}
               :pages-and-blocks
               [{:page {:block/title "p1"}
                 :blocks [{:block/title "o1"
                           :build/tags [:c1 :c2]}]}]})
        block (find-block-by-content conn "o1")]
    (is (= [:user.property/p1 :user.property/p2 :user.property/p3]
           (:classes-properties (outliner-property/get-block-classes-properties @conn (:db/id block)))))))
