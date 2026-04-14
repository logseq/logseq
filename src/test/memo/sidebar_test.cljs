;; src/test/memo/sidebar_test.cljs
(ns memo.sidebar-test
  (:require [clojure.test :refer [deftest is testing]]
            [frontend.components.memo.sidebar :as sidebar]))

(deftest test-setting-types
  (testing "returns all setting types with labels"
    (is (= (count (sidebar/setting-types)) 5))))
