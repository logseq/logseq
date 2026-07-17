(ns logseq.melange.bridge.db.view-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.melange.bridge.db.test-helper :as db-test]
            [logseq.melange.bridge.db.view :as db-view]))

(defn- create-view-id
  [conn feature-type & {:keys [view-for-id]}]
  (let [tx (d/transact! conn [(cond-> {:db/id -100
                                       :block/title "Test view"
                                       :block/uuid (random-uuid)
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
        titles (map (fn [id] (:block/title (d/entity @conn id))) (:data result))]
    (is (= 2 (:count result)))
    (is (= ["Beta" "Alpha"] titles))))

(deftest get-view-data-class-objects-simple-filter-test
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

(deftest get-view-data-class-objects-groups-many-values-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}
                         :SciFi {:block/title "Sci-Fi"}
                         :Drama {:block/title "Drama"}}
               :pages-and-blocks
               [{:page {:block/title "Movie A" :build/tags [:Topic :SciFi :Drama]}}
                {:page {:block/title "Movie B" :build/tags [:Topic :SciFi]}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        _ (d/transact! conn [[:db/add view-id :logseq.property.view/group-by-property :block/tags]])
        result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                     :view-for-id class-id})
        group->titles (into {}
                            (map (fn [[group rows]]
                                   [(:block/title group)
                                    (set (map (fn [id] (:block/title (d/entity @conn id))) rows))]))
                            (:data result))]
    (is (= #{"Movie A" "Movie B"} (get group->titles "Sci-Fi")))
    (is (= #{"Movie A"} (get group->titles "Drama")))))

(deftest get-view-data-linked-references-preserves-metadata-test
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
    (is (contains? (set (:data result)) bar-id))
    (is (contains? result :ref-pages-count))))

(deftest get-view-data-number-groups-sort-numerically-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :properties {:user.property/score {:logseq.property/type :number}}
               :pages-and-blocks
               [{:page {:block/title "A" :build/tags [:Topic]
                        :build/properties {:user.property/score 2}}}
                {:page {:block/title "B" :build/tags [:Topic]
                        :build/properties {:user.property/score 10}}}
                {:page {:block/title "C" :build/tags [:Topic]
                        :build/properties {:user.property/score 1}}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        _ (d/transact! conn [[:db/add view-id :logseq.property.view/group-by-property :user.property/score]])
        asc-groups (map first (:data (db-view/get-view-data @conn view-id
                                                            {:view-feature-type :class-objects
                                                             :view-for-id class-id})))
        _ (d/transact! conn [[:db/add view-id :logseq.property.view/sort-groups-desc? true]])
        desc-groups (map first (:data (db-view/get-view-data @conn view-id
                                                             {:view-feature-type :class-objects
                                                              :view-for-id class-id})))]
    (is (= [1 2 10] asc-groups))
    (is (= [10 2 1] desc-groups))))

(deftest get-property-values-selects-view-entities-through-ocaml-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :properties {:user.property/score {:logseq.property/type :number}}
               :pages-and-blocks
               [{:page {:block/title "A" :build/tags [:Topic]
                        :build/properties {:user.property/score 2}}}
                {:page {:block/title "B" :build/tags [:Topic]
                        :build/properties {:user.property/score 10}}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        values (db-view/get-property-values @conn :user.property/score
                                            {:view-id view-id})]
    (is (= #{"2" "10"} (set (map :label values))))))

(deftest get-view-data-property-objects-runs-domain-owned-query-test
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:user.property/score {:logseq.property/type :number}}
               :pages-and-blocks
               [{:page {:block/title "With score"
                        :build/properties {:user.property/score 2}}}
                {:page {:block/title "Without score"}}]})
        property (d/entity @conn :user.property/score)
        view-id (create-view-id conn :property-objects
                                :view-for-id (:db/id property))
        result (db-view/get-view-data @conn view-id
                                      {:view-feature-type :property-objects})
        titles (set (map (fn [id] (:block/title (d/entity @conn id)))
                         (:data result)))]
    (is (= #{"With score"} titles))))
