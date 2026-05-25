(ns mobile.tabs-test
  (:require [cljs.test :refer [deftest is testing]]
            [mobile.tabs :as tabs]))

(deftest iphone-limits-main-tabs-to-four
  (testing "iPhone keeps four configurable content tabs; native search is separate"
    (is (= ["home" "graphs" "capture" "flashcards"]
           (tabs/selected-tab-ids nil {:flashcards? true} (tabs/max-main-tabs)))))

  (testing "custom tab selections are respected before applying the iPhone cap"
    (is (= ["home" "graphs" "go to" "capture"]
           (tabs/selected-tab-ids ["home" "graphs" "go to" "capture" "flashcards"]
                                  {:flashcards? true}
                                  (tabs/max-main-tabs))))))

(deftest selected-tabs-ignore-unavailable-tabs
  (testing "disabled flashcards and unknown tab ids are removed"
    (is (= ["home" "graphs" "go to"]
           (tabs/selected-tab-ids ["unknown" "home" "flashcards" "graphs" "go to"]
                                  {:flashcards? false}
                                  (tabs/max-main-tabs))))))

(deftest selected-tabs-always-include-home
  (testing "home is kept as the stable first tab even when custom data omits it"
    (is (= ["home" "graphs" "capture"]
           (tabs/selected-tab-ids ["graphs" "capture"]
                                  {:flashcards? true}
                                  (tabs/max-main-tabs)))))

  (testing "home is moved back to the first position when custom data reorders it"
    (is (= ["home" "graphs" "capture"]
           (tabs/selected-tab-ids ["graphs" "home" "capture"]
                                  {:flashcards? true}
                                  (tabs/max-main-tabs))))))

(deftest reorder-selected-tabs
  (testing "dragging a selected tab before another selected tab changes tab order"
    (is (= ["home" "flashcards" "graphs" "capture"]
           (tabs/reorder-tab-ids ["home" "graphs" "capture" "flashcards"]
                                 "flashcards"
                                 "graphs"
                                 {:flashcards? true}
                                 (tabs/max-main-tabs)))))

  (testing "dragging a selected tab down inserts it after the target tab"
    (is (= ["home" "capture" "flashcards" "graphs"]
           (tabs/reorder-tab-ids ["home" "graphs" "capture" "flashcards"]
                                 "graphs"
                                 "flashcards"
                                 {:flashcards? true}
                                 (tabs/max-main-tabs)))))

  (testing "dragging home is ignored because it is the stable first tab"
    (is (= ["home" "graphs" "capture" "flashcards"]
           (tabs/reorder-tab-ids ["home" "graphs" "capture" "flashcards"]
                                 "home"
                                 "capture"
                                 {:flashcards? true}
                                 (tabs/max-main-tabs)))))

  (testing "dragging before home is ignored because home is pinned"
    (is (= ["home" "graphs" "capture" "flashcards"]
           (tabs/reorder-tab-ids ["home" "graphs" "capture" "flashcards"]
                                 "capture"
                                 "home"
                                 {:flashcards? true}
                                 (tabs/max-main-tabs)))))

  (testing "reordering ignores unavailable targets"
    (is (= ["home" "graphs" "capture"]
           (tabs/reorder-tab-ids ["home" "graphs" "capture"]
                                 "capture"
                                 "flashcards"
                                 {:flashcards? false}
                                 (tabs/max-main-tabs))))))
