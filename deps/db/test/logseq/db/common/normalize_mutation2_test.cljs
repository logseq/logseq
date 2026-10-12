(ns logseq.db.common.normalize-mutation2-test
  "Second-run mutation survivors in logseq.db.common.normalize."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.db.common.normalize :as normalize]))

(def ^:private schema
  {:block/uuid {:db/unique :db.unique/identity}
   :db/ident {:db/unique :db.unique/identity}})

(defn- db-with
  [tx-data]
  (d/db-with (d/empty-db schema) tx-data))

(defn- eid-of
  [db block-uuid]
  (:db/id (d/entity db [:block/uuid block-uuid])))

(deftest replace-attr-retract-with-retract-entity-v2-drops-datoms-of-retracted-entities
  (let [gone-uuid (random-uuid)
        kept-uuid (random-uuid)
        db (db-with [{:block/uuid kept-uuid}])]
    (is (= [[:db/retractEntity [:block/uuid gone-uuid]]
            [:db/add [:block/uuid kept-uuid] :block/title "kept" 1]]
           (normalize/replace-attr-retract-with-retract-entity-v2
            db
            [[:db/retract [:block/uuid gone-uuid] :block/uuid gone-uuid 1]
             [:db/add [:block/uuid gone-uuid] :block/title "gone" 1]
             [:db/add [:block/uuid kept-uuid] :block/title "kept" 1]])))))

(deftest replace-attr-retract-with-retract-entity-keeps-datoms-of-unchanged-eids
  (let [gone-uuid (random-uuid)
        kept-uuid (random-uuid)
        db-after (db-with [{:block/uuid kept-uuid}])
        kept-eid (eid-of db-after kept-uuid)
        same-eid-retract (d/datom kept-eid :block/uuid kept-uuid 11 false)
        gone-retract (d/datom 900001 :block/uuid gone-uuid 10 false)
        gone-title-retract (d/datom 900001 :block/title "gone" 10 false)
        moved-retract (d/datom 900002 :block/uuid kept-uuid 12 false)]
    (is (= [[:db/retractEntity [:block/uuid gone-uuid]]
            same-eid-retract
            [:db/retractEntity 900002]]
           (normalize/replace-attr-retract-with-retract-entity
            db-after
            [gone-retract gone-title-retract same-eid-retract moved-retract])))))

(deftest eid->lookup-and-eid->tempid-fall-back-to-ident
  (let [block-uuid (random-uuid)
        db (db-with [{:db/ident :test/some-ident}
                     {:block/uuid block-uuid}])
        ident-eid (:db/id (d/entity db :test/some-ident))
        block-eid (eid-of db block-uuid)]
    (is (= :test/some-ident (normalize/eid->lookup db ident-eid)))
    (is (= ":test/some-ident" (normalize/eid->tempid db ident-eid)))
    (is (= [:block/uuid block-uuid] (normalize/eid->lookup db block-eid)))
    (is (= (str block-uuid) (normalize/eid->tempid db block-eid)))
    (is (nil? (normalize/eid->lookup db 900001)))
    (is (nil? (normalize/eid->tempid db 900001)))))

(deftest normalize-tx-data-puts-schema-attributes-first
  (let [block-uuid (random-uuid)
        db (db-with [{:block/uuid block-uuid}])
        eid (eid-of db block-uuid)
        lookup [:block/uuid block-uuid]]
    (is (= [[:db/add lookup :db/ident :test/new-attr 7]
            [:db/add lookup :db/valueType :db.type/ref 7]
            [:db/add lookup :db/cardinality :db.cardinality/many 7]
            [:db/add lookup :test/plain "x" 7]]
           (normalize/normalize-tx-data
            db db
            [(d/datom eid :test/plain "x" 7 true)
             (d/datom eid :db/cardinality :db.cardinality/many 7 true)
             (d/datom eid :db/valueType :db.type/ref 7 true)
             (d/datom eid :db/ident :test/new-attr 7 true)])))))

(deftest normalize-tx-data-moves-retract-entity-after-other-items
  (let [gone-uuid (random-uuid)
        kept-uuid (random-uuid)
        db-before (db-with [{:block/uuid gone-uuid} {:block/uuid kept-uuid}])
        db-after (db-with [{:block/uuid kept-uuid}])]
    (is (= [[:db/add [:block/uuid kept-uuid] :block/title "kept" 6]
            [:db/retractEntity [:block/uuid gone-uuid]]]
           (normalize/normalize-tx-data
            db-after db-before
            [(d/datom (eid-of db-before gone-uuid) :block/uuid gone-uuid 5 false)
             (d/datom (eid-of db-before kept-uuid) :block/title "kept" 6 true)])))))

(deftest normalize-tx-data-removes-duplicate-retract-entity
  (let [gone-uuid (random-uuid)
        db-before (db-with [{:block/uuid gone-uuid}])
        db-after (db-with [])]
    (is (= [[:db/retractEntity [:block/uuid gone-uuid]]]
           (normalize/normalize-tx-data
            db-after db-before
            [(d/datom 900001 :block/uuid gone-uuid 5 false)
             (d/datom 900002 :block/uuid gone-uuid 5 false)])))))

(deftest normalize-datom-resolves-ref-value-known-only-to-db-after
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        db-after @conn
        db-before (db-with [])
        page (ldb/get-page db-after "page1")
        block (db-test/find-block-by-content db-after "b1")]
    (is (= [:db/add (str (:block/uuid block)) :block/parent (str (:block/uuid page)) 9]
           (normalize/normalize-datom
            db-after db-before
            [(:db/id block) :block/parent (:db/id page) 9 true])))))
