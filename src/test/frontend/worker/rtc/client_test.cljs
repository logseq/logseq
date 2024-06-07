(ns frontend.worker.rtc.client-test
  (:require
   [cljs.test :refer [deftest is testing]]
   [frontend.worker.rtc.client :as subject]
   [logseq.db.frontend.schema :as db-schema]
   [datascript.core :as d]
   [logseq.db :as ldb]))

(def empty-db (d/empty-db db-schema/schema-for-db-based-graph))

(deftest local-block-ops->remote-ops-test
  (testing "user.property/xxx creation"
    (let [block-uuid (random-uuid)
          block-order "b0P"
          db (d/db-with empty-db [{:db/index true
                                   :block/uuid block-uuid
                                   :db/valueType :db.type/ref
                                   :block/updated-at 1716880036491
                                   :block/created-at 1716880036491
                                   :block/schema {:type :number}
                                   :block/format :markdown
                                   :db/cardinality :db.cardinality/one
                                   :db/ident :user.property/xxx,
                                   :block/type #{"property"},
                                   :block/order block-order,
                                   :block/name "xxx",
                                   :block/original-name "xxx"}])]
      (is (=
           [[:update
             {:block-uuid block-uuid,
              :pos [nil block-order],
              :av-coll
              [[:db/ident "[\"~#'\",\"~:user.property/xxx\"]" 1 true]
               [:block/name "[\"~#'\",\"xxx\"]" 1 true]
               [:block/original-name "[\"~#'\",\"xxx\"]" 1 true]
               [:block/type "[\"~#'\",\"property\"]" 1 true]]}]
            [:update-schema
             {:block-uuid block-uuid
              :db/ident :user.property/xxx,
              :db/cardinality :db.cardinality/one,
              :db/valueType :db.type/ref,
              :db/index true}]]
           (:remote-ops
            (#'subject/local-block-ops->remote-ops
             db
             {:move [:move 1 {:block-uuid block-uuid}]
              :update
              [:update 1 {:block-uuid block-uuid
                          :av-coll
                          [[:db/valueType (ldb/write-transit-str :db.type/ref) 1 true]
                           [:db/ident (ldb/write-transit-str :user.property/xxx) 1 true]
                           [:block/name (ldb/write-transit-str "xxx") 1 true]
                           [:block/original-name (ldb/write-transit-str "xxx") 1 true]
                           [:block/type (ldb/write-transit-str "property") 1 true]
                           [:db/cardinality (ldb/write-transit-str :db.cardinality/one) 1 true]
                           [:db/index (ldb/write-transit-str true) 1 true]]}]})))))))
