(ns frontend.worker.migrate-test
  (:require ["fs" :as fs-node]
            [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.db.migrate :as db-migrate]
            [logseq.db :as ldb]))

(deftest test-separate-classes-and-properties
  (testing "Separate properties from classes"
    (let [db-transit (str (fs-node/readFileSync "src/test/migration/65.0.transit"))
          db (ldb/read-transit-str db-transit)
          conn (d/conn-from-db db)
          tx-data (db-migrate/separate-classes-and-properties conn nil)
          new-property (first tx-data)]
      (is (= (dissoc new-property
                     :block/updated-at
                     :block/created-at
                     :db/ident
                     :block/uuid
                     :block/order)
             {:db/index true,
              :logseq.property/type :default,
              :db/valueType :db.type/ref,
              :block/tags #{:logseq.class/Property},
              :block/title "Book",
              :db/cardinality :db.cardinality/one,
              :logseq.property/classes 156,
              :block/name "book"}))
      (is (= (rest tx-data)
             [[:db/retract 156 :block/tags :logseq.class/Property]
              [:db/retract 156 :logseq.property/type]
              [:db/retract 156 :db/cardinality]
              [:db/retract 156 :db/valueType]
              [:db/retract 156 :db/index]
              [:db/retract 156 :logseq.property/classes]
              [:db/retract 157 :user.class/Book-FrG9O7sY 155]
              [:db/add 157 (:db/ident new-property) 155]])))))
