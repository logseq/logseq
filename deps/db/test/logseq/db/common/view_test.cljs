(ns logseq.db.common.view-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.common.view :as db-view]
            [logseq.db.test.helper :as db-test]))

(defn- create-view-id
  [conn feature-type & {:keys [view-for-id]}]
  (let [tx (d/transact! conn [(cond-> {:db/id -100
                                       :block/title "Test view"
                                       :block/uuid #uuid "00000000-0000-0000-0000-000000000100"
                                       :logseq.property.view/feature-type feature-type
                                       :logseq.property.view/type :logseq.property.view/type.table}
                                view-for-id
                                (assoc :logseq.property/view-for view-for-id))])]
    (get-in tx [:tempids -100])))

(deftest get-view-data-all-pages-sorts-and-filters-hidden-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Alpha" :block/updated-at 10}}
                {:page {:block/title "Beta" :block/updated-at 20}}
                {:page {:block/title "Hidden" :block/updated-at 30 :logseq.property/hide? true}}
                {:page {:block/title "Deleted" :block/updated-at 40 :logseq.property/deleted-at 1}}]})
        view-id (create-view-id conn :all-pages)
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
        view-id (create-view-id conn :all-pages)
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
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                     :view-for-id class-id
                                                     :sorting [{:id :block/updated-at :asc? false}]})
        titles (map (fn [id] (:block/title (d/entity @conn id))) (:data result))]
    (is (= 2 (:count result)))
    (is (= #{"With timestamp" "Without timestamp"} (set titles)))))

(deftest get-view-data-class-objects-simple-is-filter-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "A" :build/tags [:Topic]}}
                {:page {:block/title "B" :build/tags [:Topic]}}
                {:page {:block/title "C" :build/tags [:Topic]}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                     :view-for-id class-id
                                                     :filters {:or? false
                                                               :filters [[:block/title :is #{"B"}]]}})
        titles (map (fn [id] (:block/title (d/entity @conn id))) (:data result))]
    (is (= 1 (:count result)))
    (is (= ["B"] titles))))

(deftest get-view-data-linked-references-page-view-does-not-crash-on-missing-db-ident-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Foo"}}
                {:page {:block/title "Bar"}}]})
        foo-id (d/q '[:find ?e .
                      :in $ ?title
                      :where [?e :block/title ?title]]
                    @conn
                    "Foo")
        bar-id (d/q '[:find ?e .
                      :in $ ?title
                      :where [?e :block/title ?title]]
                    @conn
                    "Bar")
        _ (d/transact! conn [[:db/add bar-id :block/refs foo-id]])
        view-id (create-view-id conn :linked-references :view-for-id foo-id)
        result (db-view/get-view-data @conn view-id {:view-feature-type :linked-references
                                                     :view-for-id foo-id})]
    (is (number? (:count result)))
    (is (contains? (set (:data result)) bar-id))))

(deftest get-view-data-class-objects-ref-filter-fast-path-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "Page A"}
                        :blocks [{:block/title "Obj A"
                                  :build/tags [:Topic]}]}
                {:page {:block/title "Page B"}
                 :blocks [{:block/title "Obj B"
                           :build/tags [:Topic]}]}]})
        obj-a-id (d/q '[:find ?e .
                         :in $ ?title
                         :where [?e :block/title ?title]]
                       @conn
                       "Obj A")
        obj-b-id (d/q '[:find ?e .
                         :in $ ?title
                         :where [?e :block/title ?title]]
                       @conn
                       "Obj B")
        page-a-uuid (:block/uuid (d/entity @conn (d/q '[:find ?e .
                                                        :in $ ?title
                                                        :where [?e :block/title ?title]]
                                                      @conn
                                                      "Page A")))
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        is-result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                        :view-for-id class-id
                                                        :filters {:or? false
                                                                  :filters [[:block/page :is #{page-a-uuid}]]}})
        is-titles (map (fn [id] (:block/title (d/entity @conn id))) (:data is-result))
        is-not-result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                            :view-for-id class-id
                                                            :filters {:or? false
                                                                      :filters [[:block/page :is-not #{page-a-uuid}]]}})
        is-not-titles (set (map (fn [id] (:block/title (d/entity @conn id))) (:data is-not-result)))]
    (is (= #{"Obj A"} (set is-titles)))
    (is (= #{"Obj B"} is-not-titles))
    (is (= #{obj-a-id} (set (:data is-result))))
    (is (= #{obj-b-id} (set (:data is-not-result))))))
