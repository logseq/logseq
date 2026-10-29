(ns frontend.handler.editor-unsaved-text-test
  "The editor saves what was typed: in blocks that hold a tag, when the page is
  hidden, and when an edit was undone back to the text editing started with."
  (:require [clojure.test :refer [async deftest is testing use-fixtures]]
            [frontend.handler.block :as block-handler]
            [frontend.handler.editor :as editor]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]))

(use-fixtures :each {:before (fn []
                              (async done
                                     (test-helper/start-test-db!)
                                     (done)))
                     :after (fn []
                              (state/set-current-repo! nil)
                              (test-helper/destroy-test-db!))})

(defn- auto-saves?
  "Types `value` with the cursor at `cursor-pos` and reports whether the
  auto-save timer saves the block."
  [value cursor-pos]
  (let [block {:db/id 1
               :block/uuid #uuid "44444444-4444-4444-4444-444444444444"
               :block/title "before"}
        *saves (atom 0)
        original-set-timeout js/setTimeout]
    (set! js/setTimeout (fn [f _ms] (f) :timeout-id))
    (try
      (with-redefs [state/get-edit-block (constantly block)
                    state/set-edit-content! (fn [& _] nil)
                    block-handler/mark-last-input-time! (fn [& _] nil)
                    state/input-idle? (constantly true)
                    editor/save-current-block! (fn [& _] (swap! *saves inc))
                    editor/handle-last-input (fn [] nil)]
        (editor/edit-box-on-change! #js {:target #js {:value value
                                                      :selectionStart cursor-pos}}
                                    block
                                    "edit-block-input"))
      (finally
        (set! js/setTimeout original-set-timeout)))
    (pos? @*saves)))

(deftest auto-save-runs-in-a-block-that-holds-a-tag-test
  (testing "a complete tag elsewhere in the block does not stop the auto-save"
    (is (true? (auto-saves? "task #project and more" 22)))
    (is (true? (auto-saves? "see https://example.com/#anchor today" 37))))
  (testing "a tag being typed at the cursor still holds the save back"
    (is (false? (auto-saves? "task #proj" 10)))
    (is (false? (auto-saves? "task #[[my proj" 15)))))

(deftest hidden-page-saves-the-editing-block-test
  (let [*saves (atom [])]
    (with-redefs [state/get-edit-block (constantly {:block/uuid (random-uuid)})
                  editor/save-current-block! (fn [opts] (swap! *saves conj opts))]
      (editor/save-current-block-when-hidden! "visible")
      (is (empty? @*saves) "A visible page leaves the auto-save to the timer")
      (editor/save-current-block-when-hidden! "hidden")
      (is (= [{:flush-input? true}] @*saves)
          "Hiding the page (reload, minimize, app sent to background) saves the typed text"))))
