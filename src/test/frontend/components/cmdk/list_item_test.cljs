(ns frontend.components.cmdk.list-item-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.cmdk.list-item :as list-item]))

(deftest current-page-badge-placement-test
  (testing "page result in current page gets text badge"
    (is (= {:text-badge "Current Page"}
           (list-item/current-page-badge-placement
            {:current-page? true
             :result-type :page}))))
  (testing "block result in current page gets header badge"
    (is (= {:header-badge "Current Page"}
           (list-item/current-page-badge-placement
            {:current-page? true
             :result-type :block}))))
  (testing "non current-page results do not get badge"
    (is (nil? (list-item/current-page-badge-placement
               {:current-page? false
                :result-type :page})))
    (is (nil? (list-item/current-page-badge-placement
               {:current-page? false
                :result-type :block})))
    (is (nil? (list-item/current-page-badge-placement
               {:current-page? true
                :result-type :unknown})))))

(deftest current-page-badge-node-test
  (testing "badge node renders expected class and label"
    (is (= [:span.cp__cmdk-current-page-badge "Current Page"]
           (list-item/current-page-badge-node "Current Page"))))
  (testing "blank labels do not render badge node"
    (is (nil? (list-item/current-page-badge-node "")))
    (is (nil? (list-item/current-page-badge-node nil)))))
