(ns frontend.components.views-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.views :as views]
            [logseq.shui.table.core :as shui-table]))

(deftest build-columns-should-allow-name-property-when-no-object-name
  "When with-object-name? is false, the user property 'Name' should be kept"
  (let [mock-properties [{:db/ident :user.property/name-abc
                          :block/title "Name"
                          :logseq.property/type :default}]
        columns (views/build-columns {} mock-properties {:with-object-name? false
                                                         :add-tags-column? false})]
    ;; Without built-in title column, user 'Name' property should exist
    (is (some #(= :user.property/name-abc (:id %)) columns))))

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

(deftest view-row-key-should-follow-current-row-id
  (is (= "card-42" (views/view-row-key "card-" [42] 0)))
  (is (= "card-99" (views/view-row-key "card-" [{:db/id 99}] 0)))
  (is (= "card-0" (views/view-row-key "card-" [nil] 0))))

(deftest table-row-id-should-support-map-rows
  (is (= [1 2 3]
         (keep shui-table/table-row-id [1 {:db/id 2} {:foo "ignored"} 3]))))

(deftest table-row-id-with-related-should-include-related-row-ids
  (let [table {:row-selection-related-ids-fn (fn [row]
                                              (when (= (:db/id row) 10)
                                                [20 30]))}]
    (is (= [10 20 30]
           (#'views/table-row-id-with-related table {:db/id 10})))
    (is (= [40]
           (#'views/table-row-id-with-related table {:db/id 40})))))

(deftest id-column-should-count-map-rows
  (let [columns (views/build-columns {} [] {:with-id? true
                                            :with-object-name? false
                                            :add-tags-column? false})
        id-column (some #(when (= :id (:id %)) %) columns)
        render-id (:cell id-column)]
    (is (= 1 (render-id {:rows [1 {:db/id 2} 3]} {:db/id 1} nil)))
    (is (= 2 (render-id {:rows [1 {:db/id 2} 3]} {:db/id 2} nil)))
    (is (= 3 (render-id {:rows [1 {:db/id 2} 3]} {:db/id 3} nil)))))

(deftest build-columns-should-mark-system-columns-readonly
  (let [columns (views/build-columns {} [] {:with-id? true
                                            :with-object-name? false
                                            :add-tags-column? false})
        created-at-column (some #(when (= :block/created-at (:id %)) %) columns)
        updated-at-column (some #(when (= :block/updated-at (:id %)) %) columns)]
    (is (false? (:editable? created-at-column)))
    (is (false? (:editable? updated-at-column)))))

(deftest default-visible-columns-should-respect-persisted-hidden-columns
  (let [columns [{:id :select}
                 {:id :id}
                 {:id :block/title}
                 {:id :user.property/status}]]
    (is (= {:id false}
           (#'views/default-visible-columns {} columns)))
    (is (= {}
           (#'views/default-visible-columns
            {:logseq.property.table/hidden-columns []}
            columns)))
    (is (= {:user.property/status false}
           (#'views/default-visible-columns
            {:logseq.property.table/hidden-columns [:user.property/status]}
            columns)))
    (is (= {:user.property/status false}
           (#'views/default-visible-columns
            {:logseq.property.table/ordered-columns [:block/title]}
            columns)))))

(deftest ordered-columns-sync-for-empty-hidden-should-only-run-for-persisted-empty-hidden
  (let [columns [{:id :select}
                 {:id :id}
                 {:id :block/title}
                 {:id :user.property/style}]
        entity {:logseq.property.table/ordered-columns [:block/title]}
        visible-columns {:id false
                         :user.property/style true}]
    (is (= [:block/title :user.property/style]
           (#'views/ordered-columns-sync-for-empty-hidden
            entity columns visible-columns [])))
    (is (nil? (#'views/ordered-columns-sync-for-empty-hidden
               entity columns visible-columns [:id])))
    (is (nil? (#'views/ordered-columns-sync-for-empty-hidden
               {} columns visible-columns [])))
    (is (nil? (#'views/ordered-columns-sync-for-empty-hidden
               {:logseq.property.table/ordered-columns [:block/title :user.property/style]}
               columns visible-columns [])))))
