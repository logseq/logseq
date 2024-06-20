(ns logseq.outliner.property-test
  (:require [cljs.test :refer [deftest is testing]]
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
              :where [?b :block/content ?content]]
            @conn)
       first))

(defn- create-conn-with-blocks [opts]
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
          _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
          _ (sqlite-build/create-blocks conn opts)]
    conn))

(deftest create-property-text-block!
  (testing "Create a new :default property value"
    (let [conn (create-conn-with-blocks
                [{:page {:block/original-name "page1"}
                  :blocks [{:block/content "b1" :build/properties {:default "foo"}}
                           {:block/content "b2"}]}])
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

  (testing "Create a new :number property value"
    (let [conn (create-conn-with-blocks
                [{:page {:block/original-name "page1"}
                  :blocks [{:block/content "b1" :build/properties {:num 2}}
                           {:block/content "b2"}]}])
          block (find-block-by-content conn "b2")
          ;; Use same args as outliner.op
          _ (outliner-property/create-property-text-block! conn (:db/id block) :user.property/num "3" {})
          new-property-value (:user.property/num (find-block-by-content conn "b2"))]

      (is (some? (:db/id new-property-value)) "New property value created")
      (is (= 3 (db-property/ref->property-value-content @conn new-property-value))
          "Property value has correct content")
      (is (= :user.property/num
             (get-in (d/entity @conn (:db/id new-property-value)) [:logseq.property/created-from-property :db/ident]))
          "Has correct created-from-property"))))

(deftest set-block-property-with-ref-values
  (testing "Select a :number value from existing values"
    (let [conn (create-conn-with-blocks
                [{:page {:block/original-name "page1"}
                  :blocks [{:block/content "b1" :build/properties {:num 2}}
                           {:block/content "b2"}]}])
          property-value (:user.property/num (find-block-by-content conn "b1"))
          _ (assert (:db/id property-value))
          block-uuid (:block/uuid (find-block-by-content conn "b2"))
          ;; Use same args as outliner.op
          _ (outliner-property/set-block-property! conn [:block/uuid block-uuid] :user.property/num (:db/id property-value))]
      (is (= (:db/id property-value)
             (:db/id (:user.property/num (find-block-by-content conn "b2"))))))))

(deftest set-block-property-with-raw-values
  (testing "Setting :default with same property value reuses existing entity"
    (let [conn (create-conn-with-blocks
                [{:page {:block/original-name "page1"}
                  :blocks [{:block/content "b1" :build/properties {:logseq.property/order-list-type "number"}}
                           {:block/content "b2"}]}])
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
                [{:page {:block/original-name "page1"}
                  :blocks [{:block/content "b1" :build/properties {:checkbox true}}
                           {:block/content "b2"}]}])
          property-value (:user.property/checkbox (find-block-by-content conn "b1"))
          block-uuid (:block/uuid (find-block-by-content conn "b2"))
          ;; Use same args as outliner.op
          _ (outliner-property/set-block-property! conn [:block/uuid block-uuid] :user.property/checkbox true)]
      (is (some? (:db/id (:user.property/checkbox (find-block-by-content conn "b2"))))
          "New block has property set")
      (is (= (:db/id property-value)
             (:db/id (:user.property/checkbox (find-block-by-content conn "b2"))))))))