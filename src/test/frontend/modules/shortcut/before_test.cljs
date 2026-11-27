(ns frontend.modules.shortcut.before-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.modules.shortcut.before :as before]
            [frontend.modules.shortcut.data-helper :as data-helper]
            [frontend.state :as state]))

(defn- fake-event []
  #js {:preventDefault (fn []) :stopPropagation (fn []) :target nil})

(defn- run-gated
  "Runs f through enable-when-editing-mode! with the given editing state and input; returns whether f ran."
  [{:keys [editing? input config]}]
  (let [ran (atom false)
        handler (before/enable-when-editing-mode! (fn [_] (reset! ran true)) config)]
    (with-redefs [state/editing? (constantly editing?)
                  state/get-input (constantly input)]
      (handler (fake-event)))
    @ran))

(deftest editing-only-shortcuts-need-a-live-input
  (testing "editing state left over after the textarea is gone: the shortcut does not run"
    (is (false? (run-gated {:editing? true :input nil :config {}}))))
  (testing "a shortcut that clears that state (escape-editing) still runs"
    (is (true? (run-gated {:editing? true :input nil :config {:allow-without-input? true}}))))
  (testing "a live editor input: the shortcut runs"
    (is (true? (run-gated {:editing? true :input #js {:value "abc"} :config {}}))))
  (testing "not editing: nothing runs"
    (is (false? (run-gated {:editing? false :input #js {:value "abc"} :config {}})))))

(deftest block-editing-shortcuts-do-not-throw-without-an-input
  ;; every shortcut of the block-editing group, wrapped the way the shortcut handler installs them, pressed while
  ;; state/editing? is still true but the textarea is gone (Alt+U, Alt+K, Alt+E, Alt+A and the word shortcuts read it)
  (let [handlers (data-helper/shortcuts-map-by-handler-id :shortcut.handler/block-editing-only)]
    (is (seq handlers))
    (with-redefs [state/editing? (constantly true)
                  state/get-input (constantly nil)]
      (doseq [[id handler] handlers]
        (is (nil? (try (handler (fake-event)) nil
                       (catch :default e (str e))))
            (str id " throws when the editor input is gone"))))))
