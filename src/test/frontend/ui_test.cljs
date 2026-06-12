(ns frontend.ui-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.ui :as ui]))

(deftest plain-tab-key-test
  (testing "plain Tab is accepted"
    (is (true? (#'ui/plain-tab-key? #js {:key "Tab"})))
    (is (true? (#'ui/plain-tab-key? #js {:keyCode 9}))))

  (testing "modified Tab is ignored"
    (is (false? (#'ui/plain-tab-key? #js {:key "Tab"
                                           :shiftKey true})))
    (is (false? (#'ui/plain-tab-key? #js {:key "Tab"
                                           :metaKey true})))))
