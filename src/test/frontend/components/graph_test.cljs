(ns frontend.components.graph-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.graph :as graph]))

(def graph-data
  {:nodes [{:id "1" :label "Design" :kind "tag"}
           {:id "2" :label "Research" :kind "tag"}
           {:id "3" :label "Archive" :kind "tag"}
           {:id "10" :label "Design task" :kind "object"}
           {:id "11" :label "Research task" :kind "object"}
           {:id "12" :label "Archived task" :kind "object"}]
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
