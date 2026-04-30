(ns electron.spell-check-test
  (:require [cljs.test :refer [deftest is testing]]
            [electron.spell-check]))

(defn- session-spellcheck-enabled?
  [value]
  (when-let [f (resolve 'electron.spell-check/session-spellcheck-enabled?)]
    (f value)))

(defn- apply-window-spellcheck!
  [win enabled?]
  (when-let [f (resolve 'electron.spell-check/apply-window-spellcheck!)]
    (f win enabled?)))

(deftest session-spellcheck-enabled?-test
  (testing "defaults to enabled unless the stored config is explicitly false"
    (is (true? (session-spellcheck-enabled? nil)))
    (is (true? (session-spellcheck-enabled? true)))
    (is (false? (session-spellcheck-enabled? false)))))

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

      (apply-window-spellcheck! win false)

      (is (= [false] @calls))
      (is (false? (.-spellCheckerEnabled session))))))
