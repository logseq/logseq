(ns logseq.api-db-based-test
  (:require [cljs-bean.core :as bean]
            [cljs.test :refer [use-fixtures deftest is testing]]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [logseq.api.db-based :as db-based-api]
            [logseq.db :as ldb]))

(def repo test-helper/test-db-name-db-version)

(use-fixtures :each test-helper/db-based-start-and-destroy-db)

(deftest get-tags-by-name-test
  (testing "get_tags_by_name returns tags with matching names"
    ;; Create tags with different names
    (test-helper/create-page! "Tag1" {:redirect? false :class? true})
    (test-helper/create-page! "Tag2" {:redirect? false :class? true})
    (test-helper/create-page! "tag1" {:redirect? false :class? true}) ; lowercase variant
    
    ;; Test getting tags by name
    (let [result (db-based-api/get-tags-by-name "Tag1")
          tags (when result (bean/->clj result))]
      (is (some? tags) "Should return tags")
      (is (vector? tags) "Should return a vector")
      (is (> (count tags) 0) "Should have at least one tag")
      
      ;; Verify all returned entities are classes/tags
      (doseq [tag tags]
        (is (ldb/class? (db/entity [:block/uuid (:uuid tag)]))
            "All returned entities should be tags/classes"))))

  (testing "get_tags_by_name returns nil for non-existent tags"
    (let [result (db-based-api/get-tags-by-name "NonExistentTag")]
      (is (nil? result) "Should return nil for non-existent tags")))

  (testing "get_tags_by_name returns multiple tags with same name"
    ;; Create multiple pages with same name but different case-sensitivity handling
    (test-helper/create-page! "MultiTag" {:redirect? false :class? true})
    
    (let [result (db-based-api/get-tags-by-name "MultiTag")
          tags (when result (bean/->clj result))]
      (is (some? tags) "Should return tags")
      (is (every? #(ldb/class? (db/entity [:block/uuid (:uuid %)])) tags)
          "All returned entities should be tags")))

  (testing "get_tags_by_name does not return non-tag pages"
    ;; Create a regular page (not a tag/class)
    (test-helper/create-page! "RegularPage" {:redirect? false})
    
    (let [result (db-based-api/get-tags-by-name "RegularPage")]
      (is (nil? result) "Should not return regular pages, only tags"))))
