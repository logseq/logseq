(ns logseq.db.common.view-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.common.view :as db-view]
            [logseq.db.test.helper :as db-test]))

(defn- all-pages-view-id [conn]
  (let [tx (d/transact! conn [{:db/id -100
                               :block/title "All pages test view"
                               :block/uuid #uuid "00000000-0000-0000-0000-000000000100"
                               :logseq.property.view/feature-type :all-pages
                               :logseq.property.view/type :logseq.property.view/type.table}])]
    (get-in tx [:tempids -100])))

(deftest get-view-data-all-pages-sorts-and-filters-hidden-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Alpha" :block/updated-at 10}}
                {:page {:block/title "Beta" :block/updated-at 20}}
                {:page {:block/title "Hidden" :block/updated-at 30 :logseq.property/hide? true}}
                {:page {:block/title "Deleted" :block/updated-at 40 :logseq.property/deleted-at 1}}]})
        view-id (all-pages-view-id conn)
        result (db-view/get-view-data @conn view-id {:view-feature-type :all-pages
                                                     :sorting [{:id :block/updated-at :asc? false}]})
        ids (:data result)
        titles (map (fn [id] (:block/title (d/entity @conn id))) ids)]
    (is (= 2 (:count result)))
    (is (= ["Beta" "Alpha"] titles))))

(deftest get-view-data-all-pages-title-sort-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "gamma" :block/updated-at 1}}
                {:page {:block/title "alpha" :block/updated-at 2}}
                {:page {:block/title "beta" :block/updated-at 3}}]})
        view-id (all-pages-view-id conn)
        result (db-view/get-view-data @conn view-id {:view-feature-type :all-pages
                                                     :sorting [{:id :block/title :asc? true}]})
        ids (:data result)
        titles (map (fn [id] (:block/title (d/entity @conn id))) ids)]
    (is (= ["alpha" "beta" "gamma"] titles))))

(deftest get-view-data-class-objects-sort-keeps-rows-with-missing-sort-value-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "With timestamp"
                        :block/updated-at 20
                        :build/tags [:Topic]}}
                {:page {:block/title "Without timestamp"
                        :block/updated-at 10
                        :build/tags [:Topic]}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        without-ts-id (d/q '[:find ?e .
                             :in $ ?title
                             :where [?e :block/title ?title]]
                           @conn
                           "Without timestamp")
        without-ts-value (:block/updated-at (d/entity @conn without-ts-id))
        _ (d/transact! conn [[:db/retract without-ts-id :block/updated-at without-ts-value]])
        view-id (all-pages-view-id conn)
        result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                     :view-for-id class-id
                                                     :sorting [{:id :block/updated-at :asc? false}]})
        titles (map (fn [id] (:block/title (d/entity @conn id))) (:data result))]
    (is (= 2 (:count result)))
    (is (= #{"With timestamp" "Without timestamp"} (set titles)))))
