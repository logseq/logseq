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

(deftest view-filter-data-clears-incompatible-text-operator-values-to-empty-string
  (let [conn (d/create-conn db-schema/schema)
        property {:db/ident :user.property/note
                  :block/title "Note"
                  :logseq.property/type :default}]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (with-redefs [db-view/get-property-values (fn [_db _property-ident _option] [])]
      (is (= ""
             (:value-after-operator-change
              (worker-view/view-filter-data
               @conn
               {:property property
                :property-ident :user.property/note
                :operator :text-contains
                :value #{"Apple"}})))
          "The thread-API payload used by the operator UI must not return nil.")
      (is (= ""
             (:value-after-operator-change
              (worker-view/view-filter-data
               @conn
               {:property property
                :property-ident :user.property/note
                :operator :text-not-contains
                :value #{"Apple"}}))))
      (is (= "App"
             (:value-after-operator-change
              (worker-view/view-filter-data
               @conn
               {:property property
                :property-ident :user.property/note
                :operator :text-contains
                :value "App"})))))))

(deftest view-filter-value-after-operator-change-keeps-text-operators-usable
  (let [normalize #'worker-view/view-filter-value-after-operator-change]
    (is (= "" (normalize :text-contains #{"Apple"}))
        "An equality set is incompatible with contains and must become an empty string, not nil.")
    (is (= "" (normalize :text-not-contains #{"Apple"})))
    (is (= "App" (normalize :text-contains "App"))
        "An already-typed contains string is kept.")
    (is (= "App" (normalize :text-not-contains "App")))
    (is (= "" (normalize :text-contains nil)))
    (is (= #{"Apple"} (normalize :is #{"Apple"})))
    (is (nil? (normalize :is "Apple"))
        ":is still requires a set.")))
