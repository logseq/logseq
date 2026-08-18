(ns electron.spell-check-test
  (:require [cljs.test :refer [deftest is testing]]
            [electron.spell-check :as spell-check]))

(deftest session-spellcheck-enabled?-test
  (testing "defaults to enabled unless the stored config is explicitly false"
    (is (true? (spell-check/session-spellcheck-enabled? nil)))
    (is (true? (spell-check/session-spellcheck-enabled? true)))
    (is (false? (spell-check/session-spellcheck-enabled? false)))))

(deftest startup-spellcheck-states-test
  (testing "Linux keeps spellcheck disabled until the window is ready"
    (is (= [false true] (spell-check/startup-spellcheck-states true true)))
    (is (= [false false] (spell-check/startup-spellcheck-states true false))))
  (testing "other platforms apply the configured state directly"
    (is (= [true true] (spell-check/startup-spellcheck-states false true)))
    (is (= [false false] (spell-check/startup-spellcheck-states false false)))))

(deftest apply-window-spellcheck!-test
  (testing "updates the BrowserWindow session spell checker state"
    (let [calls (atom [])
          session (js-obj "spellCheckerEnabled" true)
          web-contents (js-obj "session" session)
          win (js-obj "webContents" web-contents)]
      (aset session "setSpellCheckerEnabled"
            (fn [enabled?]
              (swap! calls conj enabled?)
              (aset session "spellCheckerEnabled" enabled?)))

      (spell-check/apply-window-spellcheck! win false)

      (is (= [false] @calls))
      (is (false? (.-spellCheckerEnabled session))))))
