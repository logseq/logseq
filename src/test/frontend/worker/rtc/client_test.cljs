(ns frontend.worker.rtc.client-test
  (:require
   [cljs.test :refer [deftest is testing]]
   [frontend.worker.rtc.client :as subject]
   [logseq.db.frontend.schema :as db-schema]
   [datascript.core :as d]
   [logseq.db :as ldb]))

(def empty-db (d/empty-db db-schema/schema-for-db-based-graph))

(deftest local-block-ops->remote-ops-test
  (testing "user.class/yyy creation"
    (let [block-uuid (random-uuid)
          db (d/db-with empty-db [{:block/uuid block-uuid,
                                   :block/updated-at 1720017595873,
                                   :block/created-at 1720017595872,
                                   :block/format :markdown,
                                   :db/ident :user.class/yyy,
                                   :block/type "class",
                                   :block/name "yyy",
                                   :block/title "yyy"}])]
      (is (= {:update
              {:block-uuid block-uuid
               :db/ident :user.class/yyy
               :pos [nil nil],
               :av-coll
               [[:block/name "[\"~#'\",\"yyy\"]" 1 true]
                [:block/title "[\"~#'\",\"yyy\"]" 1 true]
                [:block/type "[\"~#'\",\"class\"]" 1 true]]}}
             (:remote-ops
              (#'subject/local-block-ops->remote-ops
               db
               {:move [:move 1 {:block-uuid block-uuid}]
                :update
                [:update 1 {:block-uuid block-uuid
                            :av-coll
                            [[:block/name (ldb/write-transit-str "yyy") 1 true]
                             [:block/title (ldb/write-transit-str "yyy") 1 true]
                             [:block/type (ldb/write-transit-str "class") 1 true]]}]}))))))

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
                                   :block/type "property",
                                   :block/order block-order,
                                   :block/name "xxx",
                                   :block/title "xxx"}])]
      (is (=
           {:update
            {:block-uuid block-uuid,
             :db/ident :user.property/xxx
             :pos [nil block-order],
             :av-coll
             [[:block/name "[\"~#'\",\"xxx\"]" 1 true]
              [:block/title "[\"~#'\",\"xxx\"]" 1 true]
              [:block/type "[\"~#'\",\"property\"]" 1 true]]}
            :update-schema
            {:block-uuid block-uuid
             :db/ident :user.property/xxx,
             :db/cardinality :db.cardinality/one,
             :db/valueType :db.type/ref,
             :db/index true}}
           (:remote-ops
            (#'subject/local-block-ops->remote-ops
             db
             {:move [:move 1 {:block-uuid block-uuid}]
              :update
              [:update 1 {:block-uuid block-uuid
                          :av-coll
                          [[:db/valueType (ldb/write-transit-str :db.type/ref) 1 true]
                           [:block/name (ldb/write-transit-str "xxx") 1 true]
                           [:block/title (ldb/write-transit-str "xxx") 1 true]
                           [:block/type (ldb/write-transit-str "property") 1 true]
                           [:db/cardinality (ldb/write-transit-str :db.cardinality/one) 1 true]
                           [:db/index (ldb/write-transit-str true) 1 true]]}]})))))))
