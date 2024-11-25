(ns frontend.worker.rtc.remote-update-test
  (:require [cljs.test :as t :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.rtc.remote-update :as subject]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(deftest remote-op-value->tx-data-test
  (let [[block-uuid ref-uuid1 ref-uuid2] (repeatedly random-uuid)
        db (d/db-with (d/empty-db db-schema/schema-for-db-based-graph)
                      (sqlite-create-graph/build-db-initial-data {}))]
    (testing ":block/title"
      (let [db (d/db-with db [{:block/uuid block-uuid
                               :block/title "local-content"}])
            op-value {:block/title (ldb/write-transit-str "remote-content")}]
        (is (= [[:db/add (:db/id (d/entity db [:block/uuid block-uuid])) :block/title "remote-content"]]
               (#'subject/remote-op-value->tx-data db (d/entity db [:block/uuid block-uuid]) op-value)))))

    (testing ":block/tags (1)"
      (let [db (d/db-with db [{:block/uuid block-uuid}
                              {:block/uuid ref-uuid1}
                              {:block/uuid ref-uuid2}])
            op-value {:block/tags [ref-uuid1 ref-uuid2]}
            [db-id ref1 ref2] (map :db/id (d/pull-many db [:db/id] [[:block/uuid block-uuid]
                                                                    [:block/uuid ref-uuid1]
                                                                    [:block/uuid ref-uuid2]]))]
        (is (= #{[:db/add db-id :block/tags ref1] [:db/add db-id :block/tags ref2]}
               (set (#'subject/remote-op-value->tx-data db (d/entity db [:block/uuid block-uuid]) op-value))))))

    (testing ":block/tags (2)"
      (let [db (d/db-with db [{:db/id "ref1"
                               :block/uuid ref-uuid1}
                              {:block/uuid ref-uuid2}
                              {:block/uuid block-uuid
                               :block/tags ["ref1"]}])
            op-value {:block/tags [ref-uuid2]}
            [db-id ref2] (map :db/id (d/pull-many db [:db/id] [[:block/uuid block-uuid]
                                                               [:block/uuid ref-uuid2]]))]
        (is (= #{[:db/retract db-id :block/tags [:block/uuid ref-uuid1]]
                 [:db/add db-id :block/tags ref2]}
               (set (#'subject/remote-op-value->tx-data db (d/entity db [:block/uuid block-uuid]) op-value))))))

    (testing ":block/tags (3): ref2 not exist"
      (let [db (d/db-with db [{:db/id "ref1"
                               :block/uuid ref-uuid1}
                              {:block/uuid block-uuid
                               :block/tags ["ref1"]}])
            op-value {:block/tags [ref-uuid2]}]
        (is (= #{[:db/retract (:db/id (d/entity db [:block/uuid block-uuid])) :block/tags [:block/uuid ref-uuid1]]}
               (set (#'subject/remote-op-value->tx-data db (d/entity db [:block/uuid block-uuid]) op-value))))))
    (testing ":block/updated-at"
      (let [db (d/db-with db [{:block/uuid block-uuid
                               :block/updated-at 1}])
            ent (d/entity db [:block/uuid block-uuid])]
        (is (= [[:db/retract (:db/id ent) :block/updated-at]]
               (#'subject/remote-op-value->tx-data db ent {})))))
    (testing ":logseq.task/status, op-value don't have this attr, means remove this attr"
      (let [db (d/db-with db [{:db/id "ref1"
                               :block/uuid ref-uuid1}
                              {:block/uuid block-uuid
                               :logseq.task/status "ref1"}])
            op-value {}
            ent (d/entity db [:block/uuid block-uuid])]
        (is (= [[:db/retract (:db/id ent) :logseq.task/status]]
               (#'subject/remote-op-value->tx-data db ent op-value)))))))
