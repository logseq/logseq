;; src/test/memo/consistency_test.cljs
(ns memo.consistency-test
  (:require [clojure.test :refer [deftest is testing]]
            [frontend.modules.memo.consistency :as consistency]))

(deftest test-detect-age-conflict
  (testing "detects age inconsistency in character settings"
    (let [setting-a {:logseq.memo/id "李明" :logseq.memo/type :character :body "姓名: 李明\n年龄: 28\n地点: 北京"}
          setting-b {:logseq.memo/id "李明" :logseq.memo/type :character :body "姓名: 李明\n年龄: 30\n地点: 北京"}
          conflicts (consistency/check-conflicts setting-a setting-b)]
      (is (= (count conflicts) 1))
      (is (= (:type (first conflicts)) :age-conflict)))))

(deftest test-detect-location-conflict
  (testing "detects location inconsistency in character settings"
    (let [setting-a {:logseq.memo/id "李明" :logseq.memo/type :character :body "姓名: 李明\n年龄: 28\n地点: 北京"}
          setting-b {:logseq.memo/id "李明" :logseq.memo/type :character :body "姓名: 李明\n年龄: 28\n地点: 上海"}
          conflicts (consistency/check-conflicts setting-a setting-b)]
      (is (= (count conflicts) 1))
      (is (= (:type (first conflicts)) :location-conflict)))))

(deftest test-no-conflict
  (testing "returns empty when no conflict exists"
    (let [setting-a {:logseq.memo/id "李明" :logseq.memo/type :character :body "姓名: 李明\n年龄: 28\n地点: 北京"}
          setting-b {:logseq.memo/id "李明" :logseq.memo/type :character :body "姓名: 李明\n年龄: 28\n地点: 北京"}
          conflicts (consistency/check-conflicts setting-a setting-b)]
      (is (= (count conflicts) 0)))))

(deftest test-detect-both-conflicts
  (testing "detects multiple conflicts when both age and location differ"
    (let [setting-a {:logseq.memo/id "李明" :logseq.memo/type :character :body "姓名: 李明\n年龄: 28\n地点: 北京"}
          setting-b {:logseq.memo/id "李明" :logseq.memo/type :character :body "姓名: 李明\n年龄: 30\n地点: 上海"}
          conflicts (consistency/check-conflicts setting-a setting-b)]
      (is (= (count conflicts) 2))
      (is (some #(= (:type %) :age-conflict) conflicts))
      (is (some #(= (:type %) :location-conflict) conflicts)))))