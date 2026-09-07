(ns frontend.modules.shortcut.config-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.state :as state]
            [frontend.util :as util]))

(deftest graph-db-save-shortcut-does-not-trigger-legacy-save-event
  (testing "mod+s in db graph sends new save-info event"
    (let [events* (atom [])]
      (with-redefs [state/pub-event! (fn [event]
                                       (swap! events* conj event))]
        ((get-in shortcut-config/all-built-in-keyboard-shortcuts
                 [:graph/db-save :fn]))
        (is (= [[:graph/db-save-shortcut]]
               @events*))))))

(deftest publish-open-dialog-does-not-steal-mac-minimize
  (let [default-binding #'shortcut-config/publish-open-dialog-default-binding]
    (testing "macOS leaves Command+M unbound so the system can minimize"
      (is (= [] (default-binding true))))
    (testing "non-Mac keeps Ctrl+M as the publish default"
      (is (= "mod+m" (default-binding false))))
    (testing "built-in shortcut uses the platform default"
      (is (= (default-binding util/mac?)
             (get-in shortcut-config/all-built-in-keyboard-shortcuts
                     [:publish/open-dialog :binding]))))))
