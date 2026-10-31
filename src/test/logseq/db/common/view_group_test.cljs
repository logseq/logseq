(ns logseq.db.common.view-group-test
  "Grouping tests that need `:property/closed-values`, which is an entity-plus
  lookup that nbb does not support. The nbb tests live in
  deps/db/test/logseq/db/common/view_test.cljs."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.common.view :as db-view]
            [logseq.db.test.helper :as db-test]))

(defn- create-view-id
  [conn class-id]
  (let [tx (d/transact! conn [{:db/id -100
                               :block/title "Test view"
                               :block/uuid (random-uuid)
                               :logseq.property.view/feature-type :class-objects
                               :logseq.property.view/type :logseq.property.view/type.table
                               :logseq.property/view-for class-id}])]
    (get-in tx [:tempids -100])))

(deftest get-view-data-group-by-user-added-closed-value-keeps-the-value-entity-test
  (let [icon {:type :emoji :id "rocket"}
        conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "Page"}
                 :blocks [{:block/title "First"
                           :build/tags [:Topic]
                           :build/properties {:user.property/stage "Charlie"}}
                          {:block/title "Second"
                           :build/tags [:Topic]
                           :build/properties {:user.property/stage "Alpha"}}
                          {:block/title "Third"
                           :build/tags [:Topic]
                           :build/properties {:user.property/stage "Bravo"}}]}]
               :properties {:user.property/stage
                            {:logseq.property/type :default
                             ;; The dropdown order (Charlie, Alpha, Bravo) differs from the alphabetical one
                             :build/closed-values [{:value "Charlie" :uuid (random-uuid)}
                                                   {:value "Alpha" :uuid (random-uuid) :icon icon}
                                                   {:value "Bravo" :uuid (random-uuid)}]}}})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn class-id)
        option {:view-feature-type :class-objects
                :view-for-id class-id
                :group-by-property-ident :user.property/stage}
        group-title (fn [group]
                      (or (:logseq.property/value group) (:block/title group)))
        group-titles (fn [result]
                       (mapv (fn [[group _rows]] (group-title group)) (:data result)))
        alpha-group (fn [result]
                      (some (fn [[group _rows]] (when (= "Alpha" (group-title group)) group))
                            (:data result)))]
    (d/transact! conn [[:db/add view-id :logseq.property.view/sort-groups-desc? false]])
    (let [result (db-view/get-view-data @conn view-id option)]
      (is (= ["Charlie" "Alpha" "Bravo"] (group-titles result))
          "Groups of a user-added closed value follow the order of the value dropdown")
      (is (= icon (:logseq.property/icon (alpha-group result)))
          "The group key carries the icon of the closed value"))
    (d/transact! conn [[:db/add view-id :logseq.property.view/sort-groups-desc? true]])
    (is (= ["Bravo" "Alpha" "Charlie"]
           (group-titles (db-view/get-view-data @conn view-id option)))
        "Descending reverses the dropdown order")))
