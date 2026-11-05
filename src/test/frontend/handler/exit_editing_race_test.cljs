(ns frontend.handler.exit-editing-race-test
  "An exit from editing (Escape, Shift+Up/Down at a block's edge) saves the
  block first and waits for the save. A click on another block while the
  save is in flight opens that block's editor; when the save settles, the
  exit must leave the new editor open."
  (:require [cljs.test :refer [async deftest is]]
            [frontend.handler.editor :as editor]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

;; editor/select-block-up-down is the exit Shift+Up/Down takes at a
;; block's first or last line

(defn- run-exit!
  "Starts `exit!` while editing \"edit-block-a\" with a save that settles only
  when told; a click then opens \"edit-block-b\" (unless `click?` is false).
  Resolves to what the exit did once the save settled: :cleared, :selected,
  or nil when it left the new editor alone."
  [exit! & {:keys [click?] :or {click? true}}]
  (let [editing (atom "edit-block-a")
        done-save (p/deferred)
        did (atom nil)
        saved? (atom false)]
    (-> (p/with-redefs [state/editing? (fn [] (some? @editing))
                        state/get-edit-input-id (fn [] @editing)
                        state/get-editor-block-container (constantly #js {})
                        state/get-input (constantly nil)
                        editor/save-current-block! (fn [& _] (reset! saved? true) done-save)
                        util/scroll-to-block (fn [& _])
                        ;; the arities of the real fn: a call to a
                        ;; multi-arity fn goes to the arity directly
                        state/exit-editing-and-set-selected-blocks! (let [f (fn []
                                                                              (reset! did :selected)
                                                                              (reset! editing nil))]
                                                                      (fn ([_] (f)) ([_ _] (f))))
                        state/clear-edit! (fn [& _]
                                            (reset! did :cleared)
                                            (reset! editing nil))]
          (let [exit (exit!)]
            ;; the click, while the save waits for the worker
            (when click? (reset! editing "edit-block-b"))
            (p/resolve! done-save nil)
            ;; the exit's steps after the save run in later microtasks; a
            ;; caller that drops the exit's promise is waited for too
            (p/do! exit (p/delay 0))))
        (p/then (fn [_] {:did @did :editing @editing :saved? @saved?})))))

(deftest escape-during-save-keeps-the-editor-a-click-opened-test
  (async done
    (-> (run-exit! #(editor/escape-editing {:select? false}))
        (p/then (fn [{:keys [did editing saved?]}]
                  (is saved? "the exit saved the block first")
                  (is (nil? did) "the exit leaves the clicked block's editor alone")
                  (is (= "edit-block-b" editing))))
        (p/catch (fn [e] (is false (str e))))
        (p/finally done))))

(deftest select-up-down-during-save-keeps-the-editor-a-click-opened-test
  (async done
    (-> (run-exit! #(#'editor/select-block-up-down :up))
        (p/then (fn [{:keys [did editing saved?]}]
                  (is saved? "the exit saved the block first")
                  (is (nil? did) "the exit leaves the clicked block's editor alone")
                  (is (= "edit-block-b" editing))))
        (p/catch (fn [e] (is false (str e))))
        (p/finally done))))

(deftest select-up-down-without-a-click-still-selects-test
  (async done
    (-> (run-exit! #(#'editor/select-block-up-down :up) :click? false)
        (p/then (fn [{:keys [did]}]
                  (is (= :selected did))))
        (p/catch (fn [e] (is false (str e))))
        (p/finally done))))

(deftest escape-without-a-click-still-exits-test
  (async done
    (let [editing (atom "edit-block-a")
          did (atom nil)]
      (-> (p/with-redefs [state/get-edit-input-id (fn [] @editing)
                          editor/save-current-block! (fn [& _] (p/resolved nil))
                          state/clear-edit! (fn [& _] (reset! did :cleared) (reset! editing nil))]
            (editor/escape-editing {:select? false}))
          (p/then (fn [_] (is (= :cleared @did))))
          (p/catch (fn [e] (is false (str e))))
          (p/finally done)))))
