(ns frontend.components.graph-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.graph :as graph]))

(def graph-data
  {:nodes [{:id "1" :label "Design" :kind "tag" :block/created-at 1000}
           {:id "2" :label "Research" :kind "tag" :block/created-at 2000}
           {:id "3" :label "Archive" :kind "tag" :block/created-at 3000}
           {:id "10" :label "Design task" :kind "object" :block/created-at 1500}
           {:id "11" :label "Research task" :kind "object" :block/created-at 2500}
           {:id "12" :label "Archived task" :kind "object" :block/created-at 3500}]
   :links [{:source "10" :target "1"}
           {:source "11" :target "2"}
           {:source "12" :target "3"}]})

(deftest tag-options-are-counted-and-sorted
  (is (= [{:id "3" :label "Archive" :count 1}
          {:id "1" :label "Design" :count 1}
          {:id "2" :label "Research" :count 1}]
         (graph/tag-options graph-data))))

(deftest settings-select-all-tags-by-default
  (is (= #{"1" "2" "3"}
         (graph/selected-tag-id-set {} (graph/tag-options graph-data)))))

(deftest settings-use-non-grid-tags-layout-by-default
  (is (false? (:grid-layout? (graph/decode-settings {})))))

(deftest settings-roundtrip-keeps-all-tags-sentinel
  (let [settings {:view-mode :tags-and-objects
                  :selected-tag-ids nil
                  :open-groups #{:view-mode :displayed-tags}}
        encoded (graph/encode-settings settings)
        data (js->clj (js/JSON.parse (js/JSON.stringify encoded)) :keywordize-keys true)
        decoded (graph/decode-settings data)]
    (is (not (contains? data :selectedTagIds)))
    (is (nil? (:selected-tag-ids decoded)))
    (is (= #{"1" "2" "3"}
           (graph/selected-tag-id-set decoded (graph/tag-options graph-data))))))

(deftest settings-roundtrip-keeps-time-travel-filter
  (let [settings {:view-mode :all-pages
                  :created-at-filter 86400000
                  :open-groups #{:view-mode :time-travel}}
        encoded (graph/encode-settings settings)
        data (js->clj (js/JSON.parse (js/JSON.stringify encoded)) :keywordize-keys true)
        decoded (graph/decode-settings data)]
    (is (= 86400000 (:createdAtFilter data)))
    (is (= 86400000 (:created-at-filter decoded)))
    (is (contains? (:open-groups decoded) :time-travel))))

(deftest settings-roundtrip-keeps-layout-controls
  (let [settings {:view-mode :tags-and-objects
                  :depth 4
                  :grid-layout? true
                  :link-distance 132
                  :open-groups #{:layout}}
        encoded (graph/encode-settings settings)
        data (js->clj (js/JSON.parse (js/JSON.stringify encoded)) :keywordize-keys true)
        decoded (graph/decode-settings data)]
    (is (= 4 (:depth data)))
    (is (true? (:gridLayout data)))
    (is (= 132 (:linkDistance data)))
    (is (not (contains? data :showArrows)))
    (is (not (contains? data :showEdgeLabels)))
    (is (= 4 (:depth decoded)))
    (is (true? (:grid-layout? decoded)))
    (is (= 132 (:link-distance decoded)))
    (is (not (contains? decoded :show-arrows?)))
    (is (not (contains? decoded :show-edge-labels?)))))

(deftest layout-settings-are-clamped-when-decoded
  (let [decoded (graph/decode-settings {:depth 99
                                        :showArrows true
                                        :gridLayout true
                                        :linkDistance 999
                                        :showEdgeLabels false})]
    (is (= 5 (:depth decoded)))
    (is (true? (:grid-layout? decoded)))
    (is (= 180 (:link-distance decoded)))
    (is (not (contains? decoded :show-arrows?)))
    (is (not (contains? decoded :show-edge-labels?)))))

(deftest depth-control-is-active-only-with-selected-nodes
  (is (true? (graph/depth-control-disabled? [])))
  (is (true? (graph/depth-control-disabled? nil)))
  (is (false? (graph/depth-control-disabled? [{:id "1"}]))))

(deftest tag-selection-toggle-materializes-custom-selection-from-all
  (let [available-tags (graph/tag-options graph-data)
        settings (graph/toggle-selected-tag-id {:selected-tag-ids nil} available-tags "2")]
    (is (= #{"1" "3"}
           (set (:selected-tag-ids settings))))))

(deftest graph-data-is-filtered-by-selected-tags
  (let [filtered (graph/filter-tags-and-objects-graph
                  graph-data
                  #{"1" "2"})]
    (testing "keeps selected tags and their linked objects"
      (is (= #{"1" "2" "10" "11"}
             (set (map :id (:nodes filtered)))))
      (is (= #{{:source "10" :target "1"}
               {:source "11" :target "2"}}
             (set (:links filtered)))))))

(deftest time-travel-range-starts-with-first-visible-node
  (let [filtered (graph/filter-tags-and-objects-graph
                  graph-data
                  #{"2" "3"})]
    (is (= {:created-at-min 2000
            :created-at-max 3500
            :duration 1500}
           (graph/time-travel-range filtered)))))

(deftest time-travel-filter-applies-to-any-graph-mode
  (let [filtered (graph/filter-graph-by-created-at graph-data 1000)]
    (is (= #{"1" "2" "10"}
           (set (map :id (:nodes filtered)))))
    (is (= #{{:source "10" :target "1"}}
           (set (:links filtered))))))
