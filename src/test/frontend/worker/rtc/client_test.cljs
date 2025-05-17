(ns frontend.worker.rtc.client-test
  (:require
   [cljs.test :refer [deftest is testing]]
   [datascript.core :as d]
   [frontend.worker.rtc.client :as subject]
   [logseq.db :as ldb]
   [logseq.db.frontend.schema :as db-schema]))

(def empty-db (d/empty-db db-schema/schema))

(deftest local-block-ops->remote-ops-test
  (testing "user.class/yyy creation"
    (let [block-uuid (random-uuid)
          db (d/db-with empty-db [{:block/uuid block-uuid,
                                   :block/updated-at 1720017595873,
                                   :block/created-at 1720017595872,
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
          db (d/db-with empty-db [{:block/uuid #uuid "00000002-5389-0208-3000-000000000000",
                                   :block/updated-at 1741424828774,
                                   :block/created-at 1741424828774,
                                   :logseq.property/built-in? true,
                                   :block/tags [2],
                                   :block/title "Tag",
                                   :db/id 2,
                                   :db/ident :logseq.class/Tag,
                                   :block/name "tag"}
                                  {:block/uuid #uuid "00000002-1038-7670-4800-000000000000",
                                   :block/updated-at 1741424828774,
                                   :block/created-at 1741424828774,
                                   :logseq.property/built-in? true,
                                   :block/tags [2]
                                   :block/title "Property",
                                   :db/id 3,
                                   :db/ident :logseq.class/Property,
                                   :block/name "property"}
                                  {:db/index true
                                   :block/uuid block-uuid
                                   :db/valueType :db.type/ref
                                   :block/updated-at 1716880036491
                                   :block/created-at 1716880036491
                                   :logseq.property/type :number
                                   :db/cardinality :db.cardinality/one
                                   :db/ident :user.property/xxx,
                                   :block/tags [3]
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
