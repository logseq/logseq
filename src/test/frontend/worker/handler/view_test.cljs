(ns frontend.worker.handler.view-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.handler.view :as worker-view]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(deftest view-filter-data-prepares-operators-and-normalized-values
  (let [conn (d/create-conn db-schema/schema)
        page-uuid #uuid "22222222-2222-2222-2222-222222222222"
        option {:property {:db/ident :user.property/topic
                           :block/title "Topic"
                           :logseq.property/type :node}
                :property-ident :user.property/topic
                :operator :is
                :value "stale"}]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (with-redefs [db-view/get-property-values
                  (fn [_db property-ident _option]
                    (is (= :user.property/topic property-ident))
                    [{:label "Page B"
                      :value {:block/uuid page-uuid
                              :block/title "Page B"}}])]
      (let [data (worker-view/view-filter-data @conn option)]
        (is (= [:is :is-not :text-contains :text-not-contains] (:operators data)))
        (is (= :property-values (:value-source data)))
        (is (true? (:many? data)))
        (is (= [{:label "Page B" :value page-uuid}] (:values data)))
        (is (nil? (:value-after-operator-change data))))))
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (is (= {:operators [:before :after]
            :value-source :timestamp
            :many? false
            :values nil
            :value-after-operator-change 123}
           (select-keys
            (worker-view/view-filter-data
             @conn
             {:property {:db/ident :block/created-at
                         :logseq.property/type :datetime}
              :property-ident :block/created-at
              :operator :before
              :value 123})
            [:operators :value-source :many? :values :value-after-operator-change])))))
