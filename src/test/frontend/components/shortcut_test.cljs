(ns frontend.components.shortcut-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.shortcut :as shortcut]
            [frontend.util :as util]))

(deftest test-persisted-binding-value
  (let [persisted-binding-value #'shortcut/persisted-binding-value]
    (testing "canonical equivalent default binding collapses back to nil"
      (is (nil? (persisted-binding-value :editor/undo
                                         [(if util/mac? "meta+z" "ctrl+z")]))))

    (testing "non-default binding remains persisted"
      (is (= [(if util/mac? "meta+y" "ctrl+y")]
             (persisted-binding-value :editor/undo
                                      [(if util/mac? "meta+y" "ctrl+y")]))))))

(deftest test-customizable-shortcut-row?
  (let [customizable-shortcut-row? #'shortcut/customizable-shortcut-row?]
    (testing "rows with an action id stay editable even when currently disabled"
      (is (true? (customizable-shortcut-row? :graph/db-add true)))
      (is (true? (customizable-shortcut-row? :editor/copy true))))

    (testing "rows without an action id are not editable"
      (is (false? (customizable-shortcut-row? nil false))))))
