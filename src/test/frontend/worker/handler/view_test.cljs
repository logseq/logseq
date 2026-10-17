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

(deftest view-filter-value-after-operator-change-keeps-empty-for-is-operators
  (let [normalize #'worker-view/view-filter-value-after-operator-change]
    (is (= :empty (normalize :is-not :empty))
        "Switching is -> is-not must keep Empty, not drop it to nil.")
    (is (= :empty (normalize :is :empty))
        "Switching is-not -> is must keep Empty.")
    (is (= :empty (normalize :is (normalize :is-not :empty))))
    (is (= :empty (normalize :is-not (normalize :is :empty))))
    (is (= #{"tag"} (normalize :is #{"tag"})))
    (is (= #{"tag"} (normalize :is-not #{"tag"})))
    (is (nil? (normalize :is "stale"))
        ":is still requires a set or :empty.")
    (is (nil? (normalize :is-not "stale")))))

(deftest view-filter-data-keeps-empty-after-is-operator-change
  (let [conn (d/create-conn db-schema/schema)
        property {:db/ident :block/tags
                  :block/title "Tags"
                  :logseq.property/type :default}]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (with-redefs [db-view/get-property-values (fn [_db _property-ident _option] [])]
      (is (= :empty
             (:value-after-operator-change
              (worker-view/view-filter-data
               @conn
               {:property property
                :property-ident :block/tags
                :operator :is-not
                :value :empty})))
          "The thread-API payload used by the operator UI must keep :empty.")
      (is (= :empty
             (:value-after-operator-change
              (worker-view/view-filter-data
               @conn
               {:property property
                :property-ident :block/tags
                :operator :is
                :value :empty})))))))
