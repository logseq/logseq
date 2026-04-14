;; src/test/memo/graph_view_test.cljs
(ns memo.graph-view-test
  (:require [clojure.test :refer [deftest is testing]]
            [frontend.components.memo.graph-view :as graph-view]))

(deftest test-setting-node-color
  (testing "returns correct color for setting types"
    (is (= (graph-view/setting-color :character) "#6366f1"))
    (is (= (graph-view/setting-color :world) "#22c55e"))))