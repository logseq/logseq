(ns frontend.worker.handler.view-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.handler.view :as worker-view]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.test.helper :as db-test]))

(deftest view-filter-data-lists-the-values-of-the-query-result-rows
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Task {:block/title "Task"}}
               :pages-and-blocks
               [{:page {:block/title "Page"}
                 :blocks [{:block/title "Row A"
                           :build/tags [:Task]
                           :build/properties {:user.property/note "Doing"}}
                          {:block/title "Row B"
                           :build/tags [:Task]
                           :build/properties {:user.property/note "Done"}}
                          {:block/title "Not in the query"
                           :build/tags [:Task]
                           :build/properties {:user.property/note "Cancelled"}}]}]
               :properties {:user.property/note {:logseq.property/type :default}}})
        view-id (-> (d/transact! conn [{:db/id -100
                                        :block/title "Query view"
                                        :block/uuid (random-uuid)
                                        :logseq.property.view/feature-type :query-result
                                        :logseq.property.view/type :logseq.property.view/type.table}])
                    (get-in [:tempids -100]))
        row-uuid (fn [title]
                   (:block/uuid (d/entity @conn (d/q '[:find ?e .
                                                       :in $ ?title
                                                       :where [?e :block/title ?title]]
                                                     @conn title))))
        filter-values (fn [row-uuids]
                        (set (map :label (:values (worker-view/view-filter-data
                                                   @conn
                                                   {:property-ident :user.property/note
                                                    :view-id view-id
                                                    :query-row-uuids row-uuids})))))]
    (is (= #{"Doing" "Done"} (filter-values [(row-uuid "Row A") (row-uuid "Row B")]))
        "The filter lists the values of the rows the query returned")
    (is (= #{"Done"} (filter-values [(row-uuid "Row B")])))))

(deftest view-filter-data-keeps-empty-value-when-switching-is-and-is-not
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
    (doseq [operator [:is :is-not]]
      (is (= :empty
             (:value-after-operator-change
              (worker-view/view-filter-data
               @conn
               {:property {:db/ident :block/tags
                           :logseq.property/type :node}
                :property-ident :block/tags
                :operator operator
                :value :empty})))
          (str "Empty value is kept when changing to " operator)))
    (is (nil? (:value-after-operator-change
               (worker-view/view-filter-data
                @conn
                {:property {:db/ident :block/tags
                            :logseq.property/type :node}
                 :property-ident :block/tags
                 :operator :text-contains
                 :value :empty})))
        "Empty value is dropped for operators that cannot use it")))

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
