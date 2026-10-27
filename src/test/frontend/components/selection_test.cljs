(ns frontend.components.selection-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.selection :as selection]))

(deftest dialog-selected-blocks-reads-the-outliner-selection-when-the-dialog-opens-test
  (let [loaded-when-toolbar-opened [{:db/id 1} {:db/id 2}]]
    (is (nil? (#'selection/dialog-selected-blocks nil loaded-when-toolbar-opened))
        "The outliner selection can change while the toolbar stays mounted, so the dialog reads it itself")
    (is (nil? (#'selection/dialog-selected-blocks [] loaded-when-toolbar-opened)))
    (is (= loaded-when-toolbar-opened
           (#'selection/dialog-selected-blocks [{:db/id 1}] loaded-when-toolbar-opened))
        "A selection owned by the caller, such as a table, is passed on")))
