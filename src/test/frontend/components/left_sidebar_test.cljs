(ns frontend.components.left-sidebar-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.left-sidebar-util :as sidebar-util]))

(deftest mobile-sidebar-navigation-target-test
  (let [target (fn [matching-selector]
                 #js {:closest (fn [selector]
                                 (when (= matching-selector selector)
                                   #js {}))})]
    (testing "links that navigate away from the mobile sidebar"
      (doseq [selector [".sidebar-navigations a"
                        ".favorites .bd"
                        ".recent .bd"
                        ".nav-header"]]
        (is (true? (sidebar-util/mobile-navigation-target? (target selector)))
            selector)))
    (testing "popup triggers and unrelated sidebar controls"
      (is (false? (sidebar-util/mobile-navigation-target?
                   (target ".dropdown-wrapper"))))
      (is (false? (sidebar-util/mobile-navigation-target? (target nil)))))))
