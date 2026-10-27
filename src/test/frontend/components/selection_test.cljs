(ns frontend.components.selection-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.selection :as selection]
            [frontend.state :as state]))

(deftest dialog-selected-blocks-reads-the-outliner-selection-when-the-dialog-opens-test
  (let [loaded-when-toolbar-opened [{:db/id 1} {:db/id 2}]]
    (is (nil? (#'selection/dialog-selected-blocks nil loaded-when-toolbar-opened))
        "The outliner selection can change while the toolbar stays mounted, so the dialog reads it itself")
    (is (nil? (#'selection/dialog-selected-blocks [] loaded-when-toolbar-opened)))
    (is (= loaded-when-toolbar-opened
           (#'selection/dialog-selected-blocks [{:db/id 1}] loaded-when-toolbar-opened))
        "A selection owned by the caller, such as a table, is passed on")))

(deftest trash-button-confirms-on-click-not-pointer-down-test
  (let [calls (atom [])
        stopped (atom 0)
        event #js {:preventDefault (fn [] (swap! stopped inc))
                   :stopPropagation (fn [])}
        {:keys [on-pointer-down on-click]}
        (#'selection/trash-button-handlers (fn [] (swap! calls conj :cut)))]
    (with-redefs [state/pub-event! (fn [e] (swap! calls conj e))]
      (on-pointer-down event)
      (is (empty? @calls)
          "Pressing the button must not open the delete confirmation: the release would close it")
      (is (pos? @stopped)
          "The press is still stopped so it does not clear the selection")
      (on-click event)
      (is (= [:cut [:editor/hide-action-bar]] @calls)
          "The click deletes the selection and hides the action bar"))))
