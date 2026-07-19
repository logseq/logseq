(ns frontend.components.views-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [async deftest is testing]]
            [datascript.impl.entity :as de]
            [frontend.components.property.value :as property-value]
            [frontend.components.views :as views]
            [frontend.db.async :as db-async]
            [goog.object :as gobj]
            [promesa.core :as p]))

(deftest table-property-value-receives-view-parent
  (let [view-parent {:db/ident :logseq.class/Task}
        property {:db/ident :logseq.property/status
                  :block/title "Status"
                  :logseq.property/type :default}
        row {:db/id 1}
        calls* (atom [])]
    (with-redefs [de/entity? map?
                  property-value/property-value
                  (fn [& args] (swap! calls* conj args))]
      (let [columns (views/build-columns {:view-parent view-parent}
                                         [property]
                                         {:with-object-name? false
                                          :add-tags-column? false})
            column (some #(when (= :logseq.property/status (:id %)) %) columns)]
        ((:cell column) nil row column {})
        (is (= view-parent
               (some #(get-in (vec %) [2 :view-parent]) @calls*))
            (pr-str @calls*))))))

(deftest gallery-property-value-receives-view-parent
  (let [view-parent {:db/ident :logseq.class/Task}]
    (is (= {:view? true
            :gallery-view? true
            :view-parent view-parent}
           (#'views/gallery-property-value-opts {:view-parent view-parent})))))

(deftest references-default-to-list-view
  (is (= :logseq.property.view/type.list
         (#'views/view-display-type {} :linked-references)))
  (is (= :logseq.property.view/type.list
         (#'views/view-display-type {} :unlinked-references)))
  (is (= :logseq.property.view/type.gallery
         (#'views/view-display-type
          {:logseq.property.view/type
           {:db/ident :logseq.property.view/type.gallery}}
          :linked-references)))
  (is (= :logseq.property.view/type.table
         (#'views/view-display-type {} :all-pages))))

(deftest refreshed-views-preserve-the-current-tab
  (let [views [{:db/id 1 :block/title "First"}
               {:db/id 2 :block/title "Updated second"}]]
    (is (= (second views)
           (#'views/current-view-from views {:db/id 2 :block/title "Stale second"})))
    (is (= (first views)
           (#'views/current-view-from views {:db/id 3})))
    (is (nil? (#'views/current-view-from [] {:db/id 2})))))

(deftest view-type-button-uses-the-contextual-display-type
  (let [view {:db/id 1}
        all-pages-view (#'views/view-with-display-type
                        view :logseq.property.view/type.table)
        references-view (#'views/view-with-display-type
                         view :logseq.property.view/type.list)]
    (is (= :logseq.property.view/type.table
           (get-in all-pages-view [:logseq.property.view/type :db/ident])))
    (is (= "table"
           (get-in all-pages-view [:logseq.property.view/type :logseq.property/icon :id])))
    (is (= :logseq.property.view/type.list
           (get-in references-view [:logseq.property.view/type :db/ident])))
    (is (= "list"
           (get-in references-view [:logseq.property.view/type :logseq.property/icon :id])))))

(defn- render-lazy-item
  [row]
  (let [previous-react (gobj/get js/globalThis "React")]
    (gobj/set js/globalThis "React" react)
    (try
      (.renderToStaticMarkup
       react-dom-server
       (views/lazy-item [row] 0 {}
                        (fn [item]
                          (.createElement react "span" nil
                                          (if (contains? item :block/title)
                                            (:block/title item)
                                            "unloaded")))))
      (finally
        (if (some? previous-react)
          (gobj/set js/globalThis "React" previous-react)
          (js-delete js/globalThis "React"))))))

(deftest build-columns-should-allow-name-property-when-no-object-name
  "When with-object-name? is false, the user property 'Name' should be kept"
  (let [mock-properties [{:db/ident :user.property/name-abc
                          :block/title "Name"
                          :logseq.property/type :default}]
        columns (views/build-columns {} mock-properties {:with-object-name? false
                                                         :add-tags-column? false})]
    ;; Without built-in title column, user 'Name' property should exist
    (is (some #(= :user.property/name-abc (:id %)) columns))))

(deftest build-columns-should-include-page-column-when-requested
  (let [columns (views/build-columns {} [] {:add-tags-column? false
                                            :add-page-column? true})]
    (is (some #(= :block/page (:id %)) columns))
    (is (false? (:sortable? (some #(when (= :block/page (:id %)) %) columns))))
    (is (not (some #(= :block/page (:id %))
                   (views/build-columns {} [] {:add-tags-column? false}))))))

(deftest sort-columns-should-deduplicate-ordered-ids
  "Reproduces db-test#837 amplification: When ordered-column-ids contains
   duplicates (e.g., from corrupted drag-and-drop state), sort-columns
   should not produce duplicate columns."
  (let [columns [{:id :block/title :name "Name"}
                 {:id :user.property/abc :name "Name"}
                 {:id :user.property/age :name "Age"}]
        ;; Simulates corrupted ordered-column-ids with duplicates
        corrupted-ordered-ids [:block/title :user.property/abc :block/title :user.property/abc]
        sorted (views/sort-columns columns corrupted-ordered-ids)]
    ;; Without deduplication, this would produce 4+ columns
    (is (= 3 (count sorted))
        "sort-columns should deduplicate ordered IDs and produce exactly 3 columns")
    ;; Verify each column appears only once
    (is (= 1 (count (filter #(= :block/title (:id %)) sorted))))
    (is (= 1 (count (filter #(= :user.property/abc (:id %)) sorted))))
    (is (= 1 (count (filter #(= :user.property/age (:id %)) sorted))))))

(deftest sort-columns-should-preserve-order-of-first-occurrence
  "sort-columns deduplication should keep the first occurrence's order"
  (let [columns [{:id :a :name "A"}
                 {:id :b :name "B"}
                 {:id :c :name "C"}]
        ordered-ids [:c :b :a :c :b]
        sorted (views/sort-columns columns ordered-ids)]
    (is (= [:c :b :a] (map :id sorted)))))

(deftest gallery-lazy-item-opts-should-request-view-properties
  (let [properties [:block/title :user.property/cover :block/uuid]]
    (is (= {:properties properties}
           (views/gallery-lazy-item-opts {:properties properties})))))

(deftest gallery-card-asset-block-should-use-row-for-asset-class
  (let [block {:db/id 1
               :block/title "Inception poster"
               :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}]
    (is (= block
           (views/gallery-card-asset-block block :block/uuid)))))

(deftest view-row-ids-should-flatten-grouped-rows
  (is (= [1 2 3 4]
         (#'views/view-row-ids
          [[:group-a [1 2]]
           [:group-b [3 4]]]))))

(deftest grouped-gallery-row-ids-should-deduplicate-grouped-rows
  (is (= [1 2 3]
         (#'views/grouped-gallery-row-ids
          [[:group-a [1 2]]
           [:group-b [{:db/id 2} 3]]]))))

(deftest lazy-item-does-not-render-unloaded-row-values
  (testing "All Pages ids stay hidden until their row data is loaded"
    (is (= "<div style=\"min-height:24px\"></div>" (render-lazy-item 42))))
  (testing "Compact linked-reference rows stay hidden until they are hydrated"
    (is (= "<div style=\"min-height:24px\"></div>"
           (render-lazy-item {:db/id 42
                              :block/parent #uuid "11111111-1111-1111-1111-111111111111"})))))

(deftest lazy-item-renders-loaded-rows-including-empty-titles
  (is (= "<span>Loaded</span>"
         (render-lazy-item {:db/id 42 :block/title "Loaded"})))
  (is (= "<span></span>"
         (render-lazy-item {:db/id 43 :block/title ""}))))

(deftest lazy-item-loads-all-pages-rows-during-scroll
  (is (not (#'views/lazy-item-ready-to-load? 42 nil nil true false false)))
  (is (#'views/lazy-item-ready-to-load? 42 nil nil true true true))
  (is (#'views/lazy-item-ready-to-load? 42 nil nil false false false))
  (is (not (#'views/lazy-item-ready-to-load? 42 nil nil false false true)))
  (is (not (#'views/lazy-item-ready-to-load? 42 {:db/id 42} nil false true true)))
  (is (not (#'views/lazy-item-ready-to-load? 42 nil 42 true true true))))

(deftest table-row-loads-only-from-the-latest-all-pages-range
  (is (#'views/table-row-load-while-scrolling? :all-pages [10 20] 15))
  (is (not (#'views/table-row-load-while-scrolling? :all-pages [10 20] 21)))
  (is (not (#'views/table-row-load-while-scrolling? :all-pages nil 15)))
  (is (not (#'views/table-row-load-while-scrolling? :query-result [10 20] 15))))

(deftest all-pages-table-cells-render-with-the-virtualized-row
  (is (#'views/eager-table-cells? :all-pages))
  (is (not (#'views/eager-table-cells? :query-result))))

(deftest table-row-placeholder-matches-the-rendered-row-height
  (is (= 33 (#'views/lazy-item-placeholder-height true)))
  (is (= 24 (#'views/lazy-item-placeholder-height false))))

(deftest loaded-views-use-the-worker-query-result
  (async done
    (let [view-parent {:db/id 151
                       :logseq.property/views
                       [{:db/id 10
                         :block/order "local"
                         :logseq.property.view/feature-type :all-pages
                         :logseq.property.view/type {:db/id 114}}]}
          fetched-views [{:db/id 12
                          :block/order "b"
                          :logseq.property.view/feature-type :all-pages}
                         {:db/id 11
                          :block/order "a"
                          :logseq.property.view/feature-type :all-pages}]]
      (-> (p/with-redefs [db-async/<get-views
                          (fn [repo parent-id feature-type]
                            (is (= ["repo" 151 :all-pages]
                                   [repo parent-id feature-type]))
                            (p/resolved fetched-views))]
            (#'views/<get-or-load-views "repo" view-parent :all-pages))
          (p/then (fn [result]
                    (is (= [11 12] (mapv :db/id result))
                        "Compact parent data must not replace complete worker views.")))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest group-by-column-should-exclude-name-and-include-many-properties
  (is (views/group-by-column? {:id :block/page}))
  (is (not (views/group-by-column? {:id :block/title
                                    :property {:logseq.property/type :string}})))
  (is (views/group-by-column? {:id :block/tags
                               :property {:logseq.property/type :class
                                          :db/cardinality :db.cardinality/many}})))
