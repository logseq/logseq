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

(deftest view-filter-value-after-operator-change-keeps-temporal-values
  (let [normalize #'worker-view/view-filter-value-after-operator-change
        custom-date (js/Date. "2024-01-15T00:00:00.000Z")
        journal-uuid #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        journal {:block/uuid journal-uuid}]
    (doseq [operator [:before :after]]
      (is (= "1 day ago" (normalize operator "1 day ago"))
          "Relative timestamp strings must survive after↔before.")
      (is (= "3 days ago" (normalize operator "3 days ago")))
      (is (= custom-date (normalize operator custom-date))
          "Custom-date calendar values are js Date objects.")
      (is (= 123 (normalize operator 123)))
      (is (nil? (normalize operator #{:stale}))
          "Incompatible :is values are still dropped."))
    (doseq [operator [:date-before :date-after]]
      (is (= journal-uuid (normalize operator journal-uuid)))
      (is (= journal (normalize operator journal)))
      (is (= 123 (normalize operator 123)))
      (is (= custom-date (normalize operator custom-date)))
      (is (= "1 day ago" (normalize operator "1 day ago"))))
    (is (= "1 day ago"
           (->> "1 day ago"
                (normalize :before)
                (normalize :after)))
        "Flipping after→before→after keeps the chosen timestamp string.")))

(deftest view-filter-data-keeps-deadline-timestamp-after-operator-change
  (let [conn (d/create-conn db-schema/schema)
        property {:db/ident :logseq.property/deadline
                  :block/title "Deadline"
                  :logseq.property/type :datetime}
        custom-date (js/Date. "2024-06-01T00:00:00.000Z")]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (is (= "1 day ago"
           (:value-after-operator-change
            (worker-view/view-filter-data
             @conn
             {:property property
              :property-ident :logseq.property/deadline
              :operator :before
              :value "1 day ago"})))
        "The thread-API payload used by the operator UI must keep relative timestamps.")
    (is (= custom-date
           (:value-after-operator-change
            (worker-view/view-filter-data
             @conn
             {:property property
              :property-ident :logseq.property/deadline
              :operator :after
              :value custom-date}))))))
