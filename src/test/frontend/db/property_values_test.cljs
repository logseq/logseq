(ns frontend.db.property-values-test
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.test.helper :as test-helper]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.property :as outliner-property]))

(def repo test-helper/test-db)

(defn start-and-destroy-db
  [f]
  (test-helper/start-and-destroy-db f))

(use-fixtures :each start-and-destroy-db)

(deftest get-property-values-filters-recycled-ref-values-test
  (let [property-ident :block/tags
        active-title "Active ref value"
        recycled-title "Recycled ref value"]
    (d/transact! (db/get-db repo false)
                 [[:db/add -2 :block/title active-title]
                  [:db/add -3 :block/title recycled-title]
                  [:db/add -3 :logseq.property/deleted-at 1]
                  [:db/add -10 property-ident -2]
                  [:db/add -11 property-ident -3]])
    (let [result (db-view/get-property-values @(db/get-db repo false) property-ident {})]
      (is (contains? (set (map :label result)) active-title))
      (is (not (contains? (set (map :label result)) recycled-title))))))

(deftest property-closed-values-hide-recycled-values-test
  (d/transact! (db/get-db repo false)
               [{:db/id -1 :db/ident :user.property/closed-values-visibility}
                {:db/id -2
                 :block/title "Visible closed value"
                 :block/order "a"
                 :block/closed-value-property -1}
                {:db/id -3
                 :block/title "Recycled closed value"
                 :block/order "b"
                 :block/closed-value-property -1
                 :logseq.property/deleted-at 1}])
  (let [db @(db/get-db repo false)
        property (d/entity db :user.property/closed-values-visibility)
        values (entity-plus/lookup-kv-then-entity property :property/closed-values)]
    (is (= ["Visible closed value"] (map :block/title values)))))

(defn- assert-deleting-block-removes-cli-created-property-values
  [property-type property-ident value]
  (let [property-title (name property-ident)
        conn (db-test/create-conn-with-blocks
              {:properties {property-ident {:logseq.property/type property-type
                                            :db/cardinality :db.cardinality/many
                                            :logseq.property/public? true
                                            :block/title property-title}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "block1"}]}]})
        block (db-test/find-block-by-content @conn "block1")
        block-uuid (:block/uuid block)]
    (outliner-property/batch-set-property! conn [block-uuid] property-ident value)
    (let [block (d/entity @conn [:block/uuid block-uuid])
          value (first (get block property-ident))
          value-id (:db/id value)]
      (is (= (:db/id block) (:db/id (:block/parent value)))
          "Generated property value blocks should be owned by their block")
      (outliner-core/delete-blocks! conn [block] {})
      (is (nil? (d/entity @conn value-id))
          "Deleting the owning block removes its generated property value block"))))

(deftest deleting-block-removes-cli-created-default-property-values-test
  (assert-deleting-block-removes-cli-created-property-values
   :default
   :user.property/xxx-IiHzt48w
   "x1"))

(deftest deleting-block-removes-cli-created-url-property-values-test
  (assert-deleting-block-removes-cli-created-property-values
   :url
   :user.property/url-IiHzt48w
   "https://example.com/x1"))

(deftest batch-set-property-does-not-partially-write-generated-values-test
  (let [property-ident :user.property/atomic-IiHzt48w
        conn (db-test/create-conn-with-blocks
              {:properties {property-ident {:logseq.property/type :default
                                            :db/cardinality :db.cardinality/many
                                            :logseq.property/public? true
                                            :block/title "atomic"}}
               :pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "block1"}]}]})
        block (db-test/find-block-by-content @conn "block1")
        block-uuid (:block/uuid block)]
    (is (thrown? js/Error
                 (outliner-property/batch-set-property! conn [block-uuid] property-ident ["x1" {}])))
    (let [block (d/entity @conn [:block/uuid block-uuid])
          generated-values (d/q '[:find [?v ...]
                                  :in $ ?property-ident
                                  :where
                                  [?v :logseq.property/created-from-property ?property-ident]]
                                @conn
                                property-ident)]
      (is (empty? (get block property-ident))
          "Failed updates should not leave generated values on the block")
      (is (empty? generated-values)
          "Failed updates should not leave generated value blocks"))))

(deftest class-add-property-keeps-scoped-choices-unchanged-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:t1 {:build/class-properties [:priority]}
                         :t2 {}}
               :properties {:priority {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "b1" :build/tags [:t1]}
                          {:block/title "b2" :build/tags [:t2]}]}]})
        t1 (:db/id (d/entity @conn :user.class/t1))
        _ (outliner-property/upsert-closed-value! conn :user.property/priority
                                                  {:value "P1"
                                                   :scoped-class-id t1})
        property-before (d/entity @conn :user.property/priority)
        b1 (db-test/find-block-by-content @conn "b1")
        b2 (db-test/find-block-by-content @conn "b2")]
    (is (= ["P1"]
           (map db-property/closed-value-content
                (db-property/scoped-closed-values property-before b1))))
    (is (empty? (db-property/scoped-closed-values property-before b2)))
    (outliner-property/class-add-property! conn :user.class/t2 :user.property/priority)
    (let [property-after (d/entity @conn :user.property/priority)]
      (is (empty? (db-property/scoped-closed-values property-after b2)))
      (is (= [t1]
             (->> (:property/closed-values property-after)
                  (mapcat :logseq.property/choice-classes)
                  (map :db/id)
                  distinct
                  sort))))))
