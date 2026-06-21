(ns logseq.db.common.view-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.common.view :as db-view]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.test.helper :as db-test]))

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

(deftest get-view-data-class-objects-groups-by-title-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Topic {:block/title "Topic"}}
               :pages-and-blocks
               [{:page {:block/title "A" :build/tags [:Topic]}}
                {:page {:block/title "B" :build/tags [:Topic]}}]})
        class-id (:db/id (d/entity @conn :user.class/Topic))
        view-id (create-view-id conn :class-objects :view-for-id class-id)
        _ (d/transact! conn [[:db/add view-id :logseq.property.view/group-by-property :block/title]])
        result (db-view/get-view-data @conn view-id {:view-feature-type :class-objects
                                                     :view-for-id class-id})
        group-titles (map first (:data result))]
    (is (= ["A" "B"] group-titles))))

(deftest get-view-data-class-objects-groups-by-many-values-test
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

(deftest get-view-data-class-objects-groups-by-number-property-sorts-numerically-test
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
    ;; Number groups must sort numerically (1 2 10), not lexicographically (1 10 2)
    (is (= [1 2 10] asc-groups))
    ;; "Sort groups order" (desc?) must reverse the numeric order
    (is (= [10 2 1] desc-groups))))

(deftest get-view-data-class-objects-daterange-sort-test
  "Verify that sorting class objects by a :daterange property produces a
   correctly ordered result.  We create three Book pages with year-precision
   publication dates (2015, 2020, 2023) and assert that both ascending and
   descending sorts return them in the expected order."
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Book {:block/title "Book"}}
               :pages-and-blocks
               [{:page {:block/title "Book A" :build/tags [:Book]}}
                {:page {:block/title "Book B" :build/tags [:Book]}}
                {:page {:block/title "Book C" :build/tags [:Book]}}]})
        ;; 1. Create the daterange property.
        _ (d/transact! conn
                       [(sqlite-util/build-new-property
                         :user.property/publication-date
                         {:logseq.property/type :daterange}
                         {:title "Publication Date"})])
        ;; 2. Create three daterange value entities (year precision).
        ;;    year 2015 → 20150000, 2020 → 20200000, 2023 → 20230000
        tx2 (d/transact! conn
                         [{:db/id -10
                           :block/uuid (random-uuid)
                           :logseq.property.date/precision :year
                           :logseq.property.date/start 20150000}
                          {:db/id -20
                           :block/uuid (random-uuid)
                           :logseq.property.date/precision :year
                           :logseq.property.date/start 20200000}
                          {:db/id -30
                           :block/uuid (random-uuid)
                           :logseq.property.date/precision :year
                           :logseq.property.date/start 20230000}])
        dr-2015-id (get-in tx2 [:tempids -10])
        dr-2020-id (get-in tx2 [:tempids -20])
        dr-2023-id (get-in tx2 [:tempids -30])
        ;; Helper to look up a book id by title.
        book-id #(d/q '[:find ?e . :in $ ?t :where [?e :block/title ?t]] @conn %)
        ;; 3. Assign publication dates to each book.
        _ (d/transact! conn
                       [{:db/id (book-id "Book A") :user.property/publication-date dr-2020-id}
                        {:db/id (book-id "Book B") :user.property/publication-date dr-2015-id}
                        {:db/id (book-id "Book C") :user.property/publication-date dr-2023-id}])
        class-id (:db/id (d/entity @conn :user.class/Book))
        view-id  (create-view-id conn :class-objects :view-for-id class-id)
        ;; 4. Sort ascending: expect 2015 < 2020 < 2023  →  B, A, C
        asc-result  (db-view/get-view-data @conn view-id
                                           {:view-feature-type :class-objects
                                            :view-for-id class-id
                                            :sorting [{:id :user.property/publication-date :asc? true}]})
        asc-titles  (mapv #(:block/title (d/entity @conn %)) (:data asc-result))
        ;; 5. Sort descending: expect 2023 > 2020 > 2015  →  C, A, B
        desc-result (db-view/get-view-data @conn view-id
                                           {:view-feature-type :class-objects
                                            :view-for-id class-id
                                            :sorting [{:id :user.property/publication-date :asc? false}]})
        desc-titles (mapv #(:block/title (d/entity @conn %)) (:data desc-result))]
    (is (= 3 (:count asc-result)) "All three books are returned")
    (is (= ["Book B" "Book A" "Book C"] asc-titles)
        "Ascending sort: 2015 < 2020 < 2023")
    (is (= ["Book C" "Book A" "Book B"] desc-titles)
        "Descending sort: 2023 > 2020 > 2015")))

(deftest get-view-data-class-objects-daterange-month-precision-sort-test
  (testing "Sorting by a :daterange property with :month precision"
    ;; Books and their month-precision dates (day part is arbitrary for :month precision)
    ;; A=Feb 2020, B=May 2019, C=Nov 2021  →  asc: B A C  /  desc: C A B
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:Book {:block/title "Book"}}
                 :pages-and-blocks
                 [{:page {:block/title "Book A" :build/tags [:Book]}}
                  {:page {:block/title "Book B" :build/tags [:Book]}}
                  {:page {:block/title "Book C" :build/tags [:Book]}}]})
          _ (d/transact! conn
                         [(sqlite-util/build-new-property
                           :user.property/pub-date
                           {:logseq.property/type :daterange}
                           {:title "Publication Date"})])
          tx (d/transact! conn
                          [{:db/id -10
                            :logseq.property.date/precision :month
                            :logseq.property.date/start 20200200}   ; Feb 2020
                           {:db/id -20
                            :logseq.property.date/precision :month
                            :logseq.property.date/start 20190500}   ; May 2019
                           {:db/id -30
                            :logseq.property.date/precision :month
                            :logseq.property.date/start 20211100}]) ; Nov 2021
          book-id #(d/q '[:find ?e . :in $ ?t :where [?e :block/title ?t]] @conn %)
          _ (d/transact! conn
                         [{:db/id (book-id "Book A") :user.property/pub-date (get-in tx [:tempids -10])}
                          {:db/id (book-id "Book B") :user.property/pub-date (get-in tx [:tempids -20])}
                          {:db/id (book-id "Book C") :user.property/pub-date (get-in tx [:tempids -30])}])
          class-id (:db/id (d/entity @conn :user.class/Book))
          view-id  (create-view-id conn :class-objects :view-for-id class-id)
          asc-titles  (mapv #(:block/title (d/entity @conn %))
                            (:data (db-view/get-view-data @conn view-id
                                                          {:view-feature-type :class-objects
                                                           :view-for-id class-id
                                                           :sorting [{:id :user.property/pub-date :asc? true}]})))
          desc-titles (mapv #(:block/title (d/entity @conn %))
                            (:data (db-view/get-view-data @conn view-id
                                                          {:view-feature-type :class-objects
                                                           :view-for-id class-id
                                                           :sorting [{:id :user.property/pub-date :asc? false}]})))]
      (is (= ["Book B" "Book A" "Book C"] asc-titles)
          "Month precision ascending: May 2019 < Feb 2020 < Nov 2021")
      (is (= ["Book C" "Book A" "Book B"] desc-titles)
          "Month precision descending: Nov 2021 > Feb 2020 > May 2019"))))

(deftest get-view-data-class-objects-daterange-day-precision-sort-test
  (testing "Sorting by a :daterange property with :day precision"
    ;; A=2024-03-10, B=2024-01-25, C=2024-06-05  →  asc: B A C  /  desc: C A B
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:Book {:block/title "Book"}}
                 :pages-and-blocks
                 [{:page {:block/title "Book A" :build/tags [:Book]}}
                  {:page {:block/title "Book B" :build/tags [:Book]}}
                  {:page {:block/title "Book C" :build/tags [:Book]}}]})
          _ (d/transact! conn
                         [(sqlite-util/build-new-property
                           :user.property/pub-date
                           {:logseq.property/type :daterange}
                           {:title "Publication Date"})])
          tx (d/transact! conn
                          [{:db/id -10
                            :logseq.property.date/precision :day
                            :logseq.property.date/start 20240310}  ; Mar 10 2024
                           {:db/id -20
                            :logseq.property.date/precision :day
                            :logseq.property.date/start 20240125}  ; Jan 25 2024
                           {:db/id -30
                            :logseq.property.date/precision :day
                            :logseq.property.date/start 20240605}]) ; Jun 5 2024
          book-id #(d/q '[:find ?e . :in $ ?t :where [?e :block/title ?t]] @conn %)
          _ (d/transact! conn
                         [{:db/id (book-id "Book A") :user.property/pub-date (get-in tx [:tempids -10])}
                          {:db/id (book-id "Book B") :user.property/pub-date (get-in tx [:tempids -20])}
                          {:db/id (book-id "Book C") :user.property/pub-date (get-in tx [:tempids -30])}])
          class-id (:db/id (d/entity @conn :user.class/Book))
          view-id  (create-view-id conn :class-objects :view-for-id class-id)
          asc-titles  (mapv #(:block/title (d/entity @conn %))
                            (:data (db-view/get-view-data @conn view-id
                                                          {:view-feature-type :class-objects
                                                           :view-for-id class-id
                                                           :sorting [{:id :user.property/pub-date :asc? true}]})))
          desc-titles (mapv #(:block/title (d/entity @conn %))
                            (:data (db-view/get-view-data @conn view-id
                                                          {:view-feature-type :class-objects
                                                           :view-for-id class-id
                                                           :sorting [{:id :user.property/pub-date :asc? false}]})))]
      (is (= ["Book B" "Book A" "Book C"] asc-titles)
          "Day precision ascending: Jan 25 < Mar 10 < Jun 5")
      (is (= ["Book C" "Book A" "Book B"] desc-titles)
          "Day precision descending: Jun 5 > Mar 10 > Jan 25"))))

(deftest get-view-data-class-objects-daterange-range-values-sort-by-start-test
  (testing "Sorting by a :daterange property with start+end ranges — sort uses :start"
    ;; All three books have ranges, but different starts.
    ;; A: 2022-01-01 → 2022-12-31, B: 2020-06-01 → 2021-05-31, C: 2023-03-01 → 2023-09-30
    ;; asc by start: B (2020) < A (2022) < C (2023)
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:Book {:block/title "Book"}}
                 :pages-and-blocks
                 [{:page {:block/title "Book A" :build/tags [:Book]}}
                  {:page {:block/title "Book B" :build/tags [:Book]}}
                  {:page {:block/title "Book C" :build/tags [:Book]}}]})
          _ (d/transact! conn
                         [(sqlite-util/build-new-property
                           :user.property/pub-date
                           {:logseq.property/type :daterange}
                           {:title "Publication Date"})])
          tx (d/transact! conn
                          [{:db/id -10
                            :logseq.property.date/precision :day
                            :logseq.property.date/start 20220101
                            :logseq.property.date/end   20221231}
                           {:db/id -20
                            :logseq.property.date/precision :day
                            :logseq.property.date/start 20200601
                            :logseq.property.date/end   20210531}
                           {:db/id -30
                            :logseq.property.date/precision :day
                            :logseq.property.date/start 20230301
                            :logseq.property.date/end   20230930}])
          book-id #(d/q '[:find ?e . :in $ ?t :where [?e :block/title ?t]] @conn %)
          _ (d/transact! conn
                         [{:db/id (book-id "Book A") :user.property/pub-date (get-in tx [:tempids -10])}
                          {:db/id (book-id "Book B") :user.property/pub-date (get-in tx [:tempids -20])}
                          {:db/id (book-id "Book C") :user.property/pub-date (get-in tx [:tempids -30])}])
          class-id (:db/id (d/entity @conn :user.class/Book))
          view-id  (create-view-id conn :class-objects :view-for-id class-id)
          asc-titles (mapv #(:block/title (d/entity @conn %))
                           (:data (db-view/get-view-data @conn view-id
                                                         {:view-feature-type :class-objects
                                                          :view-for-id class-id
                                                          :sorting [{:id :user.property/pub-date :asc? true}]})))]
      (is (= ["Book B" "Book A" "Book C"] asc-titles)
          "Range values sort by :start — 2020 < 2022 < 2023"))))

(deftest get-view-data-class-objects-daterange-nil-sort-test
  (testing "Books without a daterange property value are kept in results when sorting by that property"
    ;; Book A has a date, Books B and C do not.
    ;; All three should appear in the result regardless of sort direction.
    (let [conn (db-test/create-conn-with-blocks
                {:classes {:Book {:block/title "Book"}}
                 :pages-and-blocks
                 [{:page {:block/title "Book A" :build/tags [:Book]}}
                  {:page {:block/title "Book B" :build/tags [:Book]}}
                  {:page {:block/title "Book C" :build/tags [:Book]}}]})
          _ (d/transact! conn
                         [(sqlite-util/build-new-property
                           :user.property/pub-date
                           {:logseq.property/type :daterange}
                           {:title "Publication Date"})])
          tx (d/transact! conn
                          [{:db/id -10
                            :logseq.property.date/precision :year
                            :logseq.property.date/start 20200000}])
          book-id #(d/q '[:find ?e . :in $ ?t :where [?e :block/title ?t]] @conn %)
          _ (d/transact! conn
                         [{:db/id (book-id "Book A") :user.property/pub-date (get-in tx [:tempids -10])}])
          ;; Books B and C intentionally have no :user.property/pub-date
          class-id (:db/id (d/entity @conn :user.class/Book))
          view-id  (create-view-id conn :class-objects :view-for-id class-id)
          result   (db-view/get-view-data @conn view-id
                                          {:view-feature-type :class-objects
                                           :view-for-id class-id
                                           :sorting [{:id :user.property/pub-date :asc? true}]})
          titles   (set (map #(:block/title (d/entity @conn %)) (:data result)))]
      (is (= 3 (:count result))
          "All three books are returned even when two lack the sort property")
      (is (= #{"Book A" "Book B" "Book C"} titles)
          "Books without a daterange value are not dropped from results"))))
