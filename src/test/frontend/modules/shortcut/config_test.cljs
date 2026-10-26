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

(defn- shortcut-error-without-input
  "Runs the shortcut's fn the way the editing-mode handler does, with an event
  argument, while `state/get-input` returns nil. Returns the thrown error's
  message, or nil when the fn did not throw."
  [shortcut-id]
  (with-redefs [state/get-input (fn [] nil)]
    (try
      ((get-in shortcut-config/all-built-in-keyboard-shortcuts [shortcut-id :fn]) #js {})
      nil
      (catch :default e
        (ex-message e)))))

(deftest editing-input-shortcuts-do-nothing-without-input
  (testing "shortcuts that read the editor textarea do not throw once it is gone"
    (doseq [shortcut-id [:editor/kill-line-before
                         :editor/kill-line-after
                         :editor/forward-word
                         :editor/backward-word
                         :editor/forward-kill-word
                         :editor/backward-kill-word]]
      (is (nil? (shortcut-error-without-input shortcut-id))
          (str shortcut-id " must not throw when state/get-input is nil")))))
