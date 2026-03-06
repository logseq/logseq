(ns frontend.handler.editor-test
  ;; namespace local config for private function tests
  {:clj-kondo/config {:linters {:private-call {:level :off}}}}
  (:require [frontend.commands :as commands]
            [frontend.handler.editor :as editor]
            [frontend.db :as db]
            [clojure.test :refer [deftest is testing are use-fixtures]]
            [datascript.core :as d]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [frontend.db.model :as model]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [frontend.util :as util]))

(use-fixtures :each test-helper/start-and-destroy-db)

(defn- set-selection!
  [input start end]
  (set! (.-selectionStart input) start)
  (set! (.-selectionEnd input) end))

(defn- replace-selection-with-text!
  [value* input text]
  (let [start (.-selectionStart input)
        end (.-selectionEnd input)
        before (subs @value* 0 start)
        after (subs @value* end)
        next-value (str before text after)
        next-pos (+ start (count text))]
    (reset! value* next-value)
    (set! (.-value input) next-value)
    (set-selection! input next-pos next-pos)))

(defn- reset-ime-autopair-state!
  []
  (reset! editor/ime-snapshots {})
  (reset! editor/ime-skip-next-keyup-fallbacks {})
  (reset! editor/ime-keyup-during-composition-keys {}))

(defn- ime-autopair-on-change-handler
  [{:keys [value input-char selection-start selection-end repeat-count pre-commit?]
    :or {value ""
         selection-start 0
         selection-end 0
         repeat-count 1
         pre-commit? true}}]
  (let [value* (atom value)
        search-actions* (atom [])
        action-data* (atom nil)
        input (js-obj "value" value
                      "selectionStart" selection-start
                      "selectionEnd" selection-end)]
    (gobj/set input "setSelectionRange"
              (fn [start end]
                (set-selection! input start end)))
    (with-redefs [state/sub (constantly nil)
                  state/get-editor-action (constantly nil)
                  state/get-edit-input-id (constantly "id")
                  state/get-input (constantly input)
                  gdom/getElement (constantly input)
                  editor/edit-box-on-change! (fn [_e _block _id] nil)
                  util/scroll-editor-cursor (fn [_] nil)
                  cursor/pos (fn [_] (.-selectionStart input))
                  cursor/get-caret-pos (fn [_] {:pos (.-selectionStart input)})
                  cursor/move-cursor-forward (fn [_]
                                               (let [next-pos (inc (.-selectionStart input))]
                                                 (set-selection! input next-pos next-pos)))
                  cursor/move-cursor-to (fn
                                          ([_ n]
                                           (set-selection! input n n))
                                          ([_ n _delay?]
                                           (set-selection! input n n)))
                  util/get-selection-start (fn [_] (.-selectionStart input))
                  util/get-selection-end (fn [_] (.-selectionEnd input))
                  util/get-selected-text
                  (fn []
                    (let [start (.-selectionStart input)
                          end (.-selectionEnd input)]
                      (if (and (number? start)
                               (number? end)
                               (< start end))
                        (subs @value* start end)
                        "")))
                  state/set-block-content-and-last-pos!
                  (fn [_id next-value next-pos]
                    (reset! value* next-value)
                    (set! (.-value input) next-value)
                    (set-selection! input next-pos next-pos))
                  commands/simple-insert!
                  (fn [_id text {:keys [backward-pos]}]
                    (let [start (.-selectionStart input)
                          end (.-selectionEnd input)
                          before (subs @value* 0 start)
                          after (subs @value* end)
                          next-value (str before text after)
                          next-pos (- (+ start (count text))
                                      (or backward-pos 0))]
                      (reset! value* next-value)
                      (set! (.-value input) next-value)
                      (set-selection! input next-pos next-pos)))
                  commands/handle-step (fn [step] (swap! search-actions* conj step))
                  state/set-editor-action-data! (fn [m] (reset! action-data* m))]
      (let [search-timeout (atom nil)
            handler (editor/editor-on-change! nil "id" search-timeout)]
        (dotimes [_ repeat-count]
          (handler #js {:type "compositionstart" :data ""})
          (when pre-commit?
            (replace-selection-with-text! value* input input-char))
          (handler #js {:type "compositionend" :data input-char})))
      {:value @value*
       :pos (.-selectionStart input)
       :selection-start (.-selectionStart input)
       :selection-end (.-selectionEnd input)
       :search-actions @search-actions*
       :action-data @action-data*})))

(defn- keydown-autopair-replace-call-count
  [{:keys [value key key-code is-composing? editor-in-composition?]
    :or {value "test("
         key "("
         key-code 57
         is-composing? false
         editor-in-composition? false}}]
  (let [replace-count* (atom 0)
        pos (count value)
        input (js-obj "value" value
                      "selectionStart" pos
                      "selectionEnd" pos)
        event (js-obj "key" key
                      "ctrlKey" false
                      "metaKey" false
                      "isComposing" is-composing?)]
    (with-redefs [state/get-edit-input-id (constantly "id")
                  state/get-input (constantly input)
                  state/get-editor-action (constantly nil)
                  state/get-editor-show-page-search-hashtag? (constantly false)
                  state/editor-in-composition? (constantly editor-in-composition?)
                  mobile-util/native-platform? (constantly false)
                  cursor/pos (fn [_] (.-selectionStart input))
                  gdom/getElement (constantly input)
                  util/get-selected-text (constantly "")
                  util/stop (fn [_e] nil)
                  commands/simple-replace! (fn [& _]
                                             (swap! replace-count* inc)
                                             nil)]
      ((editor/keydown-not-matched-handler nil) event key-code)
      @replace-count*)))

(defn- ime-fallback-parenthesis-steps-after-composition
  []
  (let [value* (atom "test(")
        input (js-obj "value" @value*
                      "selectionStart" (count @value*)
                      "selectionEnd" (count @value*))
        fallback-steps* (atom [])]
    (gobj/set input "setSelectionRange"
              (fn [start end]
                (set-selection! input start end)))
    (with-redefs [state/sub (constantly nil)
                  state/get-editor-action (constantly nil)
                  state/get-last-key-code (constantly {:key "("})
                  state/get-edit-input-id (constantly "id")
                  state/get-input (constantly input)
                  gdom/getElement (constantly input)
                  editor/edit-box-on-change! (fn [_e _block _id] nil)
                  util/scroll-editor-cursor (fn [_] nil)
                  cursor/pos (fn [_] (.-selectionStart input))
                  cursor/get-caret-pos (fn [_] {:pos (.-selectionStart input)})
                  cursor/move-cursor-forward (fn [_]
                                               (let [next-pos (inc (.-selectionStart input))]
                                                 (set-selection! input next-pos next-pos)))
                  cursor/move-cursor-to (fn
                                          ([_ n]
                                           (set-selection! input n n))
                                          ([_ n _delay?]
                                           (set-selection! input n n)))
                  util/get-selection-start (fn [_] (.-selectionStart input))
                  util/get-selection-end (fn [_] (.-selectionEnd input))
                  util/get-selected-text (constantly "")
                  util/stop (fn [_] nil)
                  state/set-block-content-and-last-pos!
                  (fn [_id next-value next-pos]
                    (reset! value* next-value)
                    (set! (.-value input) next-value)
                    (set-selection! input next-pos next-pos))
                  commands/simple-insert!
                  (fn [_id text {:keys [backward-pos]}]
                    (let [start (.-selectionStart input)
                          end (.-selectionEnd input)
                          before (subs @value* 0 start)
                          after (subs @value* end)
                          next-value (str before text after)
                          next-pos (- (+ start (count text))
                                      (or backward-pos 0))]
                      (reset! value* next-value)
                      (set! (.-value input) next-value)
                      (set-selection! input next-pos next-pos)))
                  commands/handle-step
                  (fn [step]
                    (when (and (= :editor/input (first step))
                               (= "(())" (second step)))
                      (swap! fallback-steps* conj step)))
                  state/set-editor-action-data! (fn [_] nil)]
      (let [search-timeout (atom nil)
            on-change (editor/editor-on-change! nil "id" search-timeout)]
        (on-change #js {:type "compositionstart" :data ""})
        (replace-selection-with-text! value* input "(")
        (on-change #js {:type "compositionend" :data "("}))
      (editor/default-case-for-keyup-handler input
                                             (.-selectionStart input)
                                             "("
                                             nil
                                             false
                                             "(")
      @fallback-steps*)))

(defn- ime-keyup-before-compositionend-result
  []
  (let [value* (atom "test(")
        composing?* (atom false)
        input (js-obj "value" @value*
                      "selectionStart" (count @value*)
                      "selectionEnd" (count @value*))
        fallback-steps* (atom [])]
    (gobj/set input "setSelectionRange"
              (fn [start end]
                (set-selection! input start end)))
    (with-redefs [state/sub (constantly nil)
                  state/get-editor-action (constantly nil)
                  state/get-last-key-code (constantly {:key "("})
                  state/get-edit-input-id (constantly "id")
                  state/get-input (constantly input)
                  state/editor-in-composition? (fn [] @composing?*)
                  gdom/getElement (constantly input)
                  editor/edit-box-on-change! (fn [_e _block _id] nil)
                  util/scroll-editor-cursor (fn [_] nil)
                  cursor/pos (fn [_] (.-selectionStart input))
                  cursor/get-caret-pos (fn [_] {:pos (.-selectionStart input)})
                  cursor/move-cursor-forward (fn [_]
                                               (let [next-pos (inc (.-selectionStart input))]
                                                 (set-selection! input next-pos next-pos)))
                  cursor/move-cursor-to (fn
                                          ([_ n]
                                           (set-selection! input n n))
                                          ([_ n _delay?]
                                           (set-selection! input n n)))
                  util/get-selection-start (fn [_] (.-selectionStart input))
                  util/get-selection-end (fn [_] (.-selectionEnd input))
                  util/get-selected-text (constantly "")
                  util/stop (fn [_] nil)
                  state/set-block-content-and-last-pos!
                  (fn [_id next-value next-pos]
                    (reset! value* next-value)
                    (set! (.-value input) next-value)
                    (set-selection! input next-pos next-pos))
                  commands/simple-insert!
                  (fn [_id text {:keys [backward-pos]}]
                    (let [start (.-selectionStart input)
                          end (.-selectionEnd input)
                          before (subs @value* 0 start)
                          after (subs @value* end)
                          next-value (str before text after)
                          next-pos (- (+ start (count text))
                                      (or backward-pos 0))]
                      (reset! value* next-value)
                      (set! (.-value input) next-value)
                      (set-selection! input next-pos next-pos)))
                  commands/handle-step
                  (fn [step]
                    (when (and (= :editor/input (first step))
                               (= "(())" (second step)))
                      (swap! fallback-steps* conj step)))
                  state/set-editor-action-data! (fn [_] nil)]
      (let [search-timeout (atom nil)
            on-change (editor/editor-on-change! nil "id" search-timeout)]
        (reset! composing?* true)
        (on-change #js {:type "compositionstart" :data ""})
        (replace-selection-with-text! value* input "(")
        ;; Simulate engines where keyup happens before compositionend.
        (editor/default-case-for-keyup-handler input
                                               (.-selectionStart input)
                                               "("
                                               nil
                                               false
                                               "(")
        (reset! composing?* false)
        (on-change #js {:type "compositionend" :data "("}))
      {:value @value*
       :fallback-steps @fallback-steps*})))

(defn- ime-fallback-after-first-left-paren-composition
  []
  (let [value* (atom "test")
        input (js-obj "value" @value*
                      "selectionStart" (count @value*)
                      "selectionEnd" (count @value*))
        fallback-steps* (atom [])]
    (gobj/set input "setSelectionRange"
              (fn [start end]
                (set-selection! input start end)))
    (with-redefs [state/sub (constantly nil)
                  state/get-editor-action (constantly nil)
                  state/get-last-key-code (constantly {:key "("})
                  state/get-edit-input-id (constantly "id")
                  state/get-input (constantly input)
                  state/editor-in-composition? (constantly false)
                  gdom/getElement (constantly input)
                  editor/edit-box-on-change! (fn [_e _block _id] nil)
                  util/scroll-editor-cursor (fn [_] nil)
                  cursor/pos (fn [_] (.-selectionStart input))
                  cursor/get-caret-pos (fn [_] {:pos (.-selectionStart input)})
                  cursor/move-cursor-forward (fn [_]
                                               (let [next-pos (inc (.-selectionStart input))]
                                                 (set-selection! input next-pos next-pos)))
                  cursor/move-cursor-to (fn
                                          ([_ n]
                                           (set-selection! input n n))
                                          ([_ n _delay?]
                                           (set-selection! input n n)))
                  util/get-selection-start (fn [_] (.-selectionStart input))
                  util/get-selection-end (fn [_] (.-selectionEnd input))
                  util/get-selected-text (constantly "")
                  util/stop (fn [_] nil)
                  state/set-block-content-and-last-pos!
                  (fn [_id next-value next-pos]
                    (reset! value* next-value)
                    (set! (.-value input) next-value)
                    (set-selection! input next-pos next-pos))
                  commands/simple-insert!
                  (fn [_id text {:keys [backward-pos]}]
                    (let [start (.-selectionStart input)
                          end (.-selectionEnd input)
                          before (subs @value* 0 start)
                          after (subs @value* end)
                          next-value (str before text after)
                          next-pos (- (+ start (count text))
                                      (or backward-pos 0))]
                      (reset! value* next-value)
                      (set! (.-value input) next-value)
                      (set-selection! input next-pos next-pos)))
                  commands/handle-step
                  (fn [step]
                    (when (and (= :editor/input (first step))
                               (= "(())" (second step)))
                      (swap! fallback-steps* conj step)))
                  state/set-editor-action-data! (fn [_] nil)]
      (let [search-timeout (atom nil)
            on-change (editor/editor-on-change! nil "id" search-timeout)]
        (on-change #js {:type "compositionstart" :data ""})
        (replace-selection-with-text! value* input "(")
        (on-change #js {:type "compositionend" :data "("}))
      (editor/default-case-for-keyup-handler input
                                             (.-selectionStart input)
                                             "("
                                             nil
                                             false
                                             "(")
      {:value @value*
       :fallback-steps @fallback-steps*})))

(defn- ime-stale-skip-steps-on-next-fallback
  [{:keys [before-compositionend after-compositionend ime-key fallback-value fallback-char tracked-fallback-step]
    :or {before-compositionend (fn [_] nil)
         after-compositionend (fn [_] nil)
         ime-key "("
         fallback-value "hello("
         fallback-char "("
         tracked-fallback-step "(())"}}]
  (reset-ime-autopair-state!)
  (let [value* (atom "test(")
        composing?* (atom false)
        input (js-obj "value" @value*
                      "selectionStart" (count @value*)
                      "selectionEnd" (count @value*))
        fallback-steps* (atom [])]
    (gobj/set input "setSelectionRange"
              (fn [start end]
                (set-selection! input start end)))
    (with-redefs [state/sub (constantly nil)
                  state/get-editor-action (constantly nil)
                  state/get-last-key-code (constantly {:key ime-key})
                  state/get-edit-input-id (constantly "id")
                  state/get-input (constantly input)
                  state/editor-in-composition? (fn [] @composing?*)
                  gdom/getElement (constantly input)
                  editor/edit-box-on-change! (fn [_e _block _id] nil)
                  util/scroll-editor-cursor (fn [_] nil)
                  cursor/pos (fn [_] (.-selectionStart input))
                  cursor/get-caret-pos (fn [_] {:pos (.-selectionStart input)})
                  cursor/move-cursor-forward (fn [_]
                                               (let [next-pos (inc (.-selectionStart input))]
                                                 (set-selection! input next-pos next-pos)))
                  cursor/move-cursor-to (fn
                                          ([_ n]
                                           (set-selection! input n n))
                                          ([_ n _delay?]
                                           (set-selection! input n n)))
                  util/get-selection-start (fn [_] (.-selectionStart input))
                  util/get-selection-end (fn [_] (.-selectionEnd input))
                  util/get-selected-text (constantly "")
                  util/stop (fn [_] nil)
                  state/set-block-content-and-last-pos!
                  (fn [_id next-value next-pos]
                    (reset! value* next-value)
                    (set! (.-value input) next-value)
                    (set-selection! input next-pos next-pos))
                  commands/simple-insert!
                  (fn [_id text {:keys [backward-pos]}]
                    (let [start (.-selectionStart input)
                          end (.-selectionEnd input)
                          before (subs @value* 0 start)
                          after (subs @value* end)
                          next-value (str before text after)
                          next-pos (- (+ start (count text))
                                      (or backward-pos 0))]
                      (reset! value* next-value)
                      (set! (.-value input) next-value)
                      (set-selection! input next-pos next-pos)))
                  commands/handle-step
                  (fn [step]
                    (when (and (= :editor/input (first step))
                               (= tracked-fallback-step (second step)))
                      (swap! fallback-steps* conj step)))
                  state/set-editor-action-data! (fn [_] nil)]
      (let [search-timeout (atom nil)
            on-change (editor/editor-on-change! nil "id" search-timeout)
            on-keyup (editor/keyup-handler nil input "id")
            run-fallback-keyup! (fn [k]
                                  (editor/default-case-for-keyup-handler input
                                                                         (.-selectionStart input)
                                                                         k
                                                                         nil
                                                                         false
                                                                         fallback-char))]
        (reset! composing?* true)
        (on-change #js {:type "compositionstart" :data ""})
        (replace-selection-with-text! value* input ime-key)
        (before-compositionend {:on-change on-change
                                :on-keyup on-keyup
                                :run-fallback-keyup! run-fallback-keyup!})
        (reset! composing?* false)
        (on-change #js {:type "compositionend" :data ime-key})
        (after-compositionend {:on-change on-change
                               :on-keyup on-keyup
                               :run-fallback-keyup! run-fallback-keyup!})
        ;; Simulate next non-IME keyup fallback opportunity on the same input.
        (reset! value* fallback-value)
        (set! (.-value input) @value*)
        (set-selection! input (count @value*) (count @value*))
        (run-fallback-keyup! ime-key))
      @fallback-steps*)))

(defn- ime-stale-keyup-skip-steps-on-next-fallback
  []
  (ime-stale-skip-steps-on-next-fallback
   {:before-compositionend
    (fn [{:keys [run-fallback-keyup!]}]
      ;; Create an IME sequence where keyup arrives before compositionend.
      (run-fallback-keyup! "("))}))

(defn- ime-process-keyup-stale-skip-steps-on-next-fallback
  []
  (ime-stale-skip-steps-on-next-fallback
   {:before-compositionend
    (fn [{:keys [run-fallback-keyup!]}]
      ;; Simulate IME engines that emit keyup as Process/229 during composition.
      (run-fallback-keyup! "Process"))}))

(defn- ime-filtered-composing-keyup-stale-skip-steps-on-next-fallback
  []
  (ime-stale-skip-steps-on-next-fallback
   {:before-compositionend
    (fn [{:keys [on-keyup]}]
      ;; Simulate engines where keyup happens before compositionend,
      ;; but keyup is filtered by goog-event-is-composing?.
      (let [filtered-keyup-event (js-obj "key" "Process"
                                         "event_" (js-obj "code" "Digit9")
                                         "shiftKey" true
                                         "getBrowserEvent" (fn [] (js-obj "isComposing" true)))]
        (on-keyup filtered-keyup-event 229)))}))

(defn- ime-post-composition-nil-key229-keyup-consumes-skip-token
  []
  (ime-stale-skip-steps-on-next-fallback
   {:after-compositionend
    (fn [{:keys [on-keyup]}]
      ;; Post-composition keyup without `key` should still consume IME skip token.
      (let [post-keyup-event (js-obj "key" nil
                                     "keyCode" 229
                                     "event_" (js-obj "code" "Digit9")
                                     "shiftKey" true
                                     "getBrowserEvent" (fn [] (js-obj "isComposing" false)))]
        (on-keyup post-keyup-event 229)))}))

(defn- ime-full-width-paren-stale-skip-steps-on-next-fallback
  []
  (ime-stale-skip-steps-on-next-fallback
   {:ime-key "（"
    :fallback-value "hello（"
    :fallback-char "（"}))

(defn- ime-stale-snapshot-clear-path-result
  []
  (let [value* (atom "AB")
        action* (atom nil)
        input (js-obj "value" @value*
                      "selectionStart" 0
                      "selectionEnd" 1)]
    (gobj/set input "setSelectionRange"
              (fn [start end]
                (set-selection! input start end)))
    (with-redefs [state/sub (constantly nil)
                  state/get-editor-action (fn [] @action*)
                  state/get-editor-show-page-search-hashtag? (constantly false)
                  state/get-last-key-code (constantly {:key "("})
                  state/get-edit-input-id (constantly "id")
                  state/get-input (constantly input)
                  state/editor-in-composition? (constantly true)
                  mobile-util/native-platform? (constantly false)
                  gdom/getElement (constantly input)
                  editor/edit-box-on-change! (fn [_e _block _id] nil)
                  util/scroll-editor-cursor (fn [_] nil)
                  cursor/pos (fn [_] (.-selectionStart input))
                  cursor/get-caret-pos (fn [_] {:pos (.-selectionStart input)})
                  cursor/move-cursor-forward (fn [_]
                                               (let [next-pos (inc (.-selectionStart input))]
                                                 (set-selection! input next-pos next-pos)))
                  cursor/move-cursor-to (fn
                                          ([_ n]
                                           (set-selection! input n n))
                                          ([_ n _delay?]
                                           (set-selection! input n n)))
                  util/get-selection-start (fn [_] (.-selectionStart input))
                  util/get-selection-end (fn [_] (.-selectionEnd input))
                  util/get-selected-text
                  (fn []
                    (let [start (.-selectionStart input)
                          end (.-selectionEnd input)]
                      (if (and (number? start)
                               (number? end)
                               (< start end))
                        (subs @value* start end)
                        "")))
                  util/stop (fn [_] nil)
                  state/set-block-content-and-last-pos!
                  (fn [_id next-value next-pos]
                    (reset! value* next-value)
                    (set! (.-value input) next-value)
                    (set-selection! input next-pos next-pos))
                  commands/simple-insert!
                  (fn [_id text {:keys [backward-pos]}]
                    (let [start (.-selectionStart input)
                          end (.-selectionEnd input)
                          before (subs @value* 0 start)
                          after (subs @value* end)
                          next-value (str before text after)
                          next-pos (- (+ start (count text))
                                      (or backward-pos 0))]
                      (reset! value* next-value)
                      (set! (.-value input) next-value)
                      (set-selection! input next-pos next-pos)))
                  commands/simple-replace! (fn [& _] nil)
                  commands/handle-step (fn [_] nil)
                  state/set-editor-action-data! (fn [_] nil)]
      (let [search-timeout (atom nil)
            on-change (editor/editor-on-change! nil "id" search-timeout)
            on-keydown (editor/keydown-not-matched-handler nil)]
        (on-change #js {:type "compositionstart" :data ""})
        ;; Trigger clear branch in refresh-ime-snapshot-on-keydown!
        (reset! action* :commands)
        (on-keydown (js-obj "key" "Process"
                            "ctrlKey" false
                            "metaKey" false
                            "isComposing" true)
                    229)
        ;; Commit a caret insertion after the clear branch.
        (set-selection! input 2 2)
        (replace-selection-with-text! value* input "(")
        (reset! action* nil)
        (on-change #js {:type "compositionend" :data "("}))
      @value*)))

(deftest ime-keydown-autopair-composing-detection-test
  (testing "native keydown with isComposing should not run keydown autopair"
    (is (= 0 (keydown-autopair-replace-call-count {:is-composing? true}))))

  (testing "editor composition state should suppress keydown autopair even without event composing flag"
    (is (= 0 (keydown-autopair-replace-call-count {:is-composing? false
                                                   :editor-in-composition? true}))))

  (testing "non-composing keydown should keep existing autopair behavior"
    (is (= 1 (keydown-autopair-replace-call-count {:is-composing? false})))))

(deftest ime-keyup-fallback-dedup-test
  (testing "IME composition should not trigger keyup non-ascii parenthesis fallback"
    (is (empty? (ime-fallback-parenthesis-steps-after-composition))))

  (testing "IME composition state should suppress keyup fallback before compositionend"
    (let [result (ime-keyup-before-compositionend-result)]
      (is (empty? (:fallback-steps result)))
      (is (= "test(()" (:value result)))))

  (testing "first IME '(' after text should not trigger keyup fallback"
    (let [result (ime-fallback-after-first-left-paren-composition)]
      (is (empty? (:fallback-steps result)))
      (is (= "test(" (:value result))))))

(deftest ime-stale-keyup-skip-token-should-not-suppress-next-fallback-test
  (testing "stale skip token from previous IME cycle should not suppress next fallback"
    (is (= [[:editor/input "(())" {:backward-truncate-number 2
                                   :backward-pos 2}]]
           (ime-stale-keyup-skip-steps-on-next-fallback)))))

(deftest ime-process-keyup-stale-skip-token-should-not-suppress-next-fallback-test
  (testing "Process keyup during composition should not create stale skip token"
    (is (= [[:editor/input "(())" {:backward-truncate-number 2
                                   :backward-pos 2}]]
           (ime-process-keyup-stale-skip-steps-on-next-fallback)))))

(deftest ime-filtered-composing-keyup-stale-skip-token-should-not-suppress-next-fallback-test
  (testing "filtered composing keyup should not create stale skip token"
    (is (= [[:editor/input "(())" {:backward-truncate-number 2
                                   :backward-pos 2}]]
           (ime-filtered-composing-keyup-stale-skip-steps-on-next-fallback)))))

(deftest ime-post-composition-nil-key229-keyup-should-consume-skip-token-test
  (testing "post-composition keyup without key string should consume skip token"
    (is (= [[:editor/input "(())" {:backward-truncate-number 2
                                   :backward-pos 2}]]
           (ime-post-composition-nil-key229-keyup-consumes-skip-token)))))

(deftest ime-full-width-paren-skip-token-should-not-suppress-next-fallback-test
  (testing "full-width IME '(' should not suppress next non-ascii fallback"
    (is (= [[:editor/input "(())" {:backward-truncate-number 2
                                   :backward-pos 2}]]
           (ime-full-width-paren-stale-skip-steps-on-next-fallback)))))

(deftest ime-snapshot-clear-path-should-not-reuse-dom-snapshot-test
  (testing "cleared snapshot state should not be consumed from stale DOM snapshot property"
    (is (= "AB(" (ime-stale-snapshot-clear-path-result)))))

(deftest ime-composition-should-not-disable-next-non-ime-keydown-autopair-test
  ;; A completed IME composition must not disable the next regular keydown autopair.
  (ime-autopair-on-change-handler {:value "test("
                                   :selection-start 5
                                   :selection-end 5
                                   :input-char "("})
  (is (= 1 (keydown-autopair-replace-call-count {:value "test("
                                                 :is-composing? false}))))

(deftest ime-composition-autopair-basic-test
  (testing "IME composition should insert pair"
    (let [result (ime-autopair-on-change-handler {:input-char "("})]
      (is (= "()" (:value result)))
      (is (= 1 (:pos result)))))

  (testing "IME composition should move cursor over existing closer"
    (let [result (ime-autopair-on-change-handler {:value "~~"
                                                  :selection-start 1
                                                  :selection-end 1
                                                  :input-char "~"
                                                  :pre-commit? false})]
      (is (= "~~" (:value result)))
      (is (= 2 (:pos result)))))

  (testing "IME composition should move cursor over existing closer for parentheses"
    (let [result (ime-autopair-on-change-handler {:value "test()"
                                                  :selection-start 5
                                                  :selection-end 5
                                                  :input-char ")"})]
      (is (= "test()" (:value result)))
      (is (= 6 (:pos result))))))

(deftest ime-composition-selected-text-wrapping-test
  (let [result (ime-autopair-on-change-handler {:value "Test"
                                                :selection-start 0
                                                :selection-end 4
                                                :input-char "("})]
    (is (= "(Test)" (:value result)))
    (is (= 1 (:selection-start result)))
    (is (= 5 (:selection-end result)))))

(deftest ime-composition-search-actions-test
  (testing "[[ should trigger page search"
    (let [result (ime-autopair-on-change-handler {:input-char "["
                                                  :repeat-count 2})]
      (is (= [[:editor/search-page]] (:search-actions result)))
      (is (map? (:action-data result)))))

  (testing "(( should trigger block search"
    (let [result (ime-autopair-on-change-handler {:input-char "("
                                                  :repeat-count 2})]
      (is (= [[:editor/search-block :reference]] (:search-actions result)))
      (is (map? (:action-data result))))))

(deftest extract-nearest-link-from-text-test
  (testing "Page, block and tag links"
    (is (= "page1"
           (editor/extract-nearest-link-from-text "[[page1]] [[page2]]" 0))
        "Finds first page link correctly based on cursor position")

    (is (= "page2"
           (editor/extract-nearest-link-from-text "[[page1]] [[page2]]" 10))
        "Finds second page link correctly based on cursor position")

    (is (= "tag"
           (editor/extract-nearest-link-from-text "#tag [[page1]]" 3))
        "Finds tag correctly")

    (is (= "61e057b9-f799-4532-9258-cfef6ce58370"
           (editor/extract-nearest-link-from-text
            "((61e057b9-f799-4532-9258-cfef6ce58370)) #todo" 5))
        "Finds block correctly"))

  (testing "Url links"
    (is (= "https://github.com/logseq/logseq"
           (editor/extract-nearest-link-from-text
            "https://github.com/logseq/logseq is #awesome :)" 0 editor/url-regex))
        "Finds url correctly")

    (is (not= "https://github.com/logseq/logseq"
              (editor/extract-nearest-link-from-text
               "https://github.com/logseq/logseq is #awesome :)" 0))
        "Doesn't find url if regex not passed")

    (is (= "https://github.com/logseq/logseq"
           (editor/extract-nearest-link-from-text
            "[logseq](https://github.com/logseq/logseq) is #awesome :)" 0 editor/url-regex))
        "Finds url in markdown link correctly"))

  (is (= "https://github.com/logseq/logseq"
         (editor/extract-nearest-link-from-text
          "[[https://github.com/logseq/logseq][logseq]] is #awesome :)" 0 editor/url-regex))
      "Finds url in org link correctly"))

(defn- set-marker
  "Spied version of editor/set-marker"
  [marker content format]
  (let [actual-content (atom nil)]
    (with-redefs [editor/save-block-if-changed! (fn [_ content]
                                                  (reset! actual-content content))]
      (editor/set-marker {:block/marker marker :block/content content :block/format format})
      @actual-content)))

(deftest set-marker-org
  (are [marker content expect] (= expect (set-marker marker content :org))
    "TODO" "TODO content" "DOING content"
    "TODO" "** TODO content" "** DOING content"
    "TODO" "## TODO content" "DOING ## TODO content"
    "DONE" "DONE content" "content"))

(deftest set-marker-markdown
  (are [marker content expect] (= expect (set-marker marker content :markdown))
    "TODO" "TODO content" "DOING content"
    "TODO" "## TODO content" "## DOING content"
    "DONE" "DONE content" "content"))

(defn- keyup-handler
  "Spied version of editor/keyup-handler"
  [{:keys [value cursor-pos action commands]
    ;; Default to some commands matching which matches default behavior for most
    ;; completion scenarios
    :or {commands [:fake-command]}}]
  ;; Reset editor action in order to test result
  (state/set-editor-action! action)
  ;; Default cursor pos to end of line
  (let [pos (or cursor-pos (count value))
        input #js {:value value}]
    (with-redefs [editor/get-matched-commands (constantly commands)
                  ;; Ignore as none of its behaviors are tested
                  editor/default-case-for-keyup-handler (constantly nil)
                  cursor/pos (constantly pos)]
      ((editor/keyup-handler nil input nil)
       #js {:key (subs value (dec (count value)))}
       nil))))

(deftest keyup-handler-test
  (testing "Command autocompletion"
    (keyup-handler {:value "/b"
                    :action :commands
                    :commands [:fake-command]})
    (is (= :commands (state/get-editor-action))
        "Completion stays open if there is a matching command")

    (keyup-handler {:value "/zz"
                    :action :commands
                    :commands []})
    (is (= nil (state/get-editor-action))
        "Completion closed if there no matching commands")

    (keyup-handler {:value "/ " :action :commands})
    (is (= nil (state/get-editor-action))
        "Completion closed after a space follows /")

    (keyup-handler {:value "/block " :action :commands})
    (is (= :commands (state/get-editor-action))
        "Completion stays open if space is part of the search term for /"))

  (testing "Tag autocompletion"
    (keyup-handler {:value "foo #b" :action :page-search-hashtag})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Completion stays open for one tag")

    (keyup-handler {:value "text # #bar"
                    :action :page-search-hashtag
                    :cursor-pos 6})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Completion stays open when typing tag before another tag"))
  ;; Reset state
  (state/set-editor-action! nil))

(defn- handle-last-input-handler
  "Spied version of editor/handle-last-input"
  [{:keys [value cursor-pos]}]
  ;; Reset editor action in order to test result
  (state/set-editor-action! nil)
  ;; Default cursor pos to end of line
  (let [pos (or cursor-pos (count value))]
    (with-redefs [state/get-input (constantly #js {:value value})
                  cursor/pos (constantly pos)
                  cursor/move-cursor-backward (constantly nil) ;; ignore if called
                  cursor/get-caret-pos (constantly {})]
      (editor/handle-last-input))))

(deftest handle-last-input-handler-test
  (testing "Property autocompletion"
    (handle-last-input-handler {:value "::"})
    (is (= :property-search (state/get-editor-action))
        "Autocomplete properties if only colons have been typed")

    (handle-last-input-handler {:value "foo::bar\n::"})
    (is (= :property-search (state/get-editor-action))
        "Autocomplete properties if typing colons on a second line")

    (handle-last-input-handler {:value "middle of line::"})
    (is (= nil (state/get-editor-action))
        "Don't autocomplete properties if typing colons in the middle of a line")

    (handle-last-input-handler {:value "first \nfoo::bar"
                                :cursor-pos (dec (count "first "))})
    (is (= nil (state/get-editor-action))
        "Don't autocomplete properties if typing in a block where properties already exist"))

  (testing "Command autocompletion"
    (handle-last-input-handler {:value "/"})
    (is (= :commands (state/get-editor-action))
        "Command search if only / has been typed")

    (handle-last-input-handler {:value "some words /"})
    (is (= :commands (state/get-editor-action))
        "Command search on start of new word")

    (handle-last-input-handler {:value "a line\n/"})
    (is (= :commands (state/get-editor-action))
        "Command search on start of a new line")

    (handle-last-input-handler {:value "https://"})
    (is (= nil (state/get-editor-action))
        "No command search in middle of a word")

    (handle-last-input-handler {:value "#blah/"})
    (is (= nil (state/get-editor-action))
        "No command search after a tag search to allow for namespace completion"))

  (testing "Tag autocompletion"
    (handle-last-input-handler {:value "#"
                                :cursor-pos 1})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if only hashtag has been typed")

    (handle-last-input-handler {:value "foo #"
                                :cursor-pos 5})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if hashtag has been typed at EOL")

    (handle-last-input-handler {:value "#Some words"
                                :cursor-pos 1})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if hashtag is at start of line and there are existing words")

    (handle-last-input-handler {:value "foo #"
                                :cursor-pos 5})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if hashtag is at EOL and after a space")

    (handle-last-input-handler {:value "foo #bar"
                                :cursor-pos 5})
    (is (= :page-search-hashtag (state/get-editor-action))
        "Page search if hashtag is in middle of line and after a space")

    (handle-last-input-handler {:value "String#" :cursor-pos 7})
    (is (= nil (state/get-editor-action))
        "No page search if hashtag has been typed at end of a word")

    (handle-last-input-handler {:value "foo#bar" :cursor-pos 4})
    (is (= nil (state/get-editor-action))
        "No page search if hashtag is in middle of word")

    (handle-last-input-handler {:value "`String#gsub and String#`"
                                :cursor-pos (dec (count "`String#gsub and String#`"))})
    (is (= nil (state/get-editor-action))
        "No page search within backticks"))
  ;; Reset state
  (state/set-editor-action! nil))

(deftest save-block-aux!
  (load-test-files [{:file/path "pages/page1.md"
                     :file/content "\n
- b1 #foo"}])
  (testing "updating block's content changes content and preserves path-refs"
   (let [conn (db/get-db test-helper/test-db false)
         block (->> (d/q '[:find (pull ?b [* {:block/path-refs [:block/name]}])
                           :where [?b :block/content "b1 #foo"]]
                         @conn)
                    ffirst)
         prev-path-refs (set (map :block/name (:block/path-refs block)))
         _ (assert (= #{"page1" "foo"} prev-path-refs)
                   "block has expected :block/path-refs")
         ;; Use same options as edit-box-on-change!
         _ (editor/save-block-aux! block "b12 #foo" {:skip-properties? true})
         updated-block (d/pull @conn '[* {:block/path-refs [:block/name]}] [:block/uuid (:block/uuid block)])]
     (is (= "b12 #foo" (:block/content updated-block)) "Content updated correctly")
     (is (= prev-path-refs
            (set (map :block/name (:block/path-refs updated-block))))
         "Path-refs remain the same"))))

(deftest save-block!
  (testing "Saving blocks with and without properties"
    (test-helper/load-test-files [{:file/path "foo.md"
                                   :file/content "# foo"}])
    (let [repo test-helper/test-db
          block-uuid (:block/uuid (model/get-block-by-page-name-and-block-route-name repo "foo" "foo"))]
      (editor/save-block! repo block-uuid "# bar")
      (is (= "# bar" (:block/content (model/query-block-by-uuid block-uuid))))

      (editor/save-block! repo block-uuid "# foo" {:properties {:foo "bar"}})
      (is (= "# foo\nfoo:: bar" (:block/content (model/query-block-by-uuid block-uuid))))

      (editor/save-block! repo block-uuid "# bar")
      (is (= "# bar" (:block/content (model/query-block-by-uuid block-uuid)))))))

(defn- delete-block
  [db block {:keys [embed?]}]
  (let [sibling-block (d/entity db (get-in block [:block/left :db/id]))
        first-block (d/entity db (get-in sibling-block [:block/left :db/id]))
        block-dom-id "ls-block-block-to-delete"]
    (with-redefs [editor/get-state (constantly {:block-id (:block/uuid block)
                                                :block-parent-id block-dom-id
                                                :config {:embed? embed?}})
                ;; stub for delete-block
                  gdom/getElement (constantly #js {:id block-dom-id})
                ;; stub since not testing moving
                  editor/edit-block! (constantly nil)
                  util/get-blocks-noncollapse (constantly (mapv
                                                           (fn [m]
                                                             #js {:id (:id m)
                                                                  ;; for dom/attr
                                                                  :getAttribute #({"blockid" (str (:block-uuid m))
                                                                                   "data-embed" (if embed? "true" "false")} %)})
                                                           [{:id "ls-block-first-block"
                                                             :block-uuid (:block/uuid first-block)}
                                                            {:id "ls-block-sibling-block"
                                                             :block-uuid (:block/uuid sibling-block)}
                                                            {:id block-dom-id
                                                             :block-uuid (:block/uuid block)}]))]
      (editor/delete-block! test-helper/test-db false))))

(deftest delete-block!
  (testing "backspace deletes empty block"
    (load-test-files [{:file/path "pages/page1.md"
                       :file/content "\n
- b1
- b2
-"}])
    (let [conn (db/get-db test-helper/test-db false)
          block (->> (d/q '[:find (pull ?b [*])
                            :where [?b :block/content ""] [?b :block/page [:block/name "page1"]]]
                          @conn)
                     ffirst)
          _ (delete-block @conn block {})
          updated-blocks (->> (d/q '[:find (pull ?b [*])
                                     :where [?b :block/content] [(missing? $ ?b :block/pre-block?)]]
                                   @conn)
                              (map (comp :block/content first)))]
      (is (= ["b1" "b2"] updated-blocks) "Block is deleted"))
    (test-helper/reset-test-db!))

  (testing "backspace deletes empty block in embedded context"
    ;; testing embed at this layer doesn't require an embed block since
    ;; delete-block handles all the embed setup
    (load-test-files [{:file/path "pages/page1.md"
                       :file/content "\n
- b1
- b2
-"}])
    (let [conn (db/get-db test-helper/test-db false)
          block (->> (d/q '[:find (pull ?b [*])
                            :where [?b :block/content ""] [?b :block/page [:block/name "page1"]]]
                          @conn)
                     ffirst)
          _ (delete-block @conn block {:embed? true})
          updated-blocks (->> (d/q '[:find (pull ?b [*])
                                     :where [?b :block/content] [(missing? $ ?b :block/pre-block?)]]
                                   @conn)
                              (map (comp :block/content first)))]
      (is (= ["b1" "b2"] updated-blocks) "Block is deleted"))))
