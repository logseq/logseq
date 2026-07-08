(ns frontend.components.views-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.views :as views]))

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

(deftest group-by-column-should-exclude-name-and-include-many-properties
  (is (views/group-by-column? {:id :block/page}))
  (is (not (views/group-by-column? {:id :block/title
                                    :property {:logseq.property/type :string}})))
  (is (views/group-by-column? {:id :block/tags
                               :property {:logseq.property/type :class
                                          :db/cardinality :db.cardinality/many}})))
