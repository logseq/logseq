(ns frontend.modules.shortcut.config-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.state :as state]))

(defn- published-property-key
  [shortcut-id]
  (let [events* (atom [])]
    (with-redefs [state/pub-event! (fn [event]
                                     (swap! events* conj event))]
      ((get-in shortcut-config/all-built-in-keyboard-shortcuts [shortcut-id :fn]))
      (get-in @events* [0 1 :property-key]))))

(deftest graph-db-save-shortcut-does-not-trigger-legacy-save-event
  (testing "mod+s in db graph sends new save-info event"
    (let [events* (atom [])]
      (with-redefs [state/pub-event! (fn [event]
                                       (swap! events* conj event))]
        ((get-in shortcut-config/all-built-in-keyboard-shortcuts
                 [:graph/db-save :fn]))
        (is (= [[:graph/db-save-shortcut]]
               @events*))))))

(deftest task-property-shortcuts-use-keyword-idents
  (testing "status, priority, and deadline shortcuts seed built-in property idents"
    (is (= :logseq.property/status
           (published-property-key :editor/add-property-status))
        "p s must use the Status ident, not the title string")
    (is (= :logseq.property/priority
           (published-property-key :editor/add-property-priority))
        "p p must use the Priority ident, not the title string")
    (is (= :logseq.property/deadline
           (published-property-key :editor/add-property-deadline))
        "p d remains the working keyword-ident baseline")))
