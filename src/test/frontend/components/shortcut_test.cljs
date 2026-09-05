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

(deftest test-compute-reset-plan-shared-defaults
  (let [compute-reset-plan #'shortcut/compute-reset-plan
        reset-conflict-update #'shortcut/reset-conflict-update
        conflict-action-ids (fn [plan]
                              (into #{} (map :action-id) (:conflict-updates plan)))]
    (testing "resetting Delete Backward keeps shared default Backspace on Delete Selected Block"
      (let [plan (compute-reset-plan :editor/backspace
                                     (dh/get-group :editor/backspace)
                                     ["backspace"]
                                     [])]
        (is (not (contains? (conflict-action-ids plan) :editor/delete-selection)))))

    (testing "resetting Delete Selected Block keeps shared defaults on peer commands"
      (let [plan (compute-reset-plan :editor/delete-selection
                                     (dh/get-group :editor/delete-selection)
                                     ["backspace" "delete"]
                                     [])]
        (is (not (contains? (conflict-action-ids plan) :editor/backspace)))
        (is (not (contains? (conflict-action-ids plan) :editor/delete)))))

    (testing "shared default Backspace is not stripped from a peer still using defaults"
      (is (nil? (reset-conflict-update :editor/delete-selection
                                       ["backspace" "delete"]
                                       #{"backspace"}))))

    (testing "user-customized conflict still strips the colliding key"
      (is (= {:action-id :editor/bold :new-binding []}
             (reset-conflict-update :editor/bold ["backspace"] #{"backspace"}))))

    (testing "user-customized extra key is stripped while the command's own default remains"
      (is (= {:action-id :editor/copy :new-binding nil}
             (reset-conflict-update :editor/copy
                                    [(if util/mac? "meta+c" "ctrl+c") "backspace"]
                                    #{"backspace"}))))))

(deftest test-compute-reset-plan-customized-conflict
  (let [compute-reset-plan #'shortcut/compute-reset-plan]
    (with-redefs [state/custom-shortcuts (fn [] {:editor/bold ["backspace"]})]
      (let [plan (compute-reset-plan :editor/backspace
                                     (dh/get-group :editor/backspace)
                                     ["backspace"]
                                     [])]
        (is (= [{:action-id :editor/bold :new-binding []}]
               (vec (:conflict-updates plan)))
            "reset still clears a user-assigned Backspace that is not a peer default")))))
