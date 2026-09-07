(ns frontend.components.shortcut-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.shortcut :as shortcut]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.state :as state]
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

(deftest test-compute-reset-plan
  (with-redefs [state/custom-shortcuts (fn [] {:editor/backspace []
                                           :editor/bold ["backspace"]})]
    (is (= {:conflict-updates [{:action-id :editor/bold :new-binding []}]
            :undo-entries [{:action-id :editor/backspace :previous-binding []}
                           {:action-id :editor/bold :previous-binding ["backspace"]}]}
           (#'shortcut/compute-reset-plan :editor/backspace
                                         (dh/get-group :editor/backspace)
                                         ["backspace"]
                                         []))
        "Reset preserves shared defaults and records only changed bindings for undo")))
