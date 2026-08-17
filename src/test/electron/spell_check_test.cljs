(ns electron.spell-check-test
  (:require [cljs.test :refer [deftest is testing]]
            [electron.spell-check :as spell-check]))

(defn- mock-session
  [{:keys [enabled languages available]
    :or {enabled true
         languages []
         available ["en-US" "en-GB" "fr"]}}]
  (let [state (atom {:enabled enabled
                     :languages languages
                     :download-url nil
                     :language-calls []
                     :enabled-calls []})
        session (js-obj)]
    (aset session "availableSpellCheckerLanguages" (clj->js available))
    (aset session "getSpellCheckerLanguages"
          (fn []
            (clj->js (:languages @state))))
    (aset session "setSpellCheckerLanguages"
          (fn [languages]
            (let [languages (js->clj languages)]
              (swap! state (fn [s]
                             (-> s
                                 (assoc :languages languages)
                                 (update :language-calls conj languages)))))))
    (aset session "setSpellCheckerDictionaryDownloadURL"
          (fn [url]
            (swap! state assoc :download-url url)))
    (aset session "setSpellCheckerEnabled"
          (fn [enabled?]
            (swap! state (fn [s]
                           (-> s
                               (assoc :enabled enabled?)
                               (update :enabled-calls conj enabled?))))))
    {:session session
     :state state}))

(deftest session-spellcheck-enabled?-test
  (testing "defaults to enabled unless the stored config is explicitly false"
    (is (true? (spell-check/session-spellcheck-enabled? nil)))
    (is (true? (spell-check/session-spellcheck-enabled? true)))
    (is (false? (spell-check/session-spellcheck-enabled? false)))))

(deftest window-web-preferences-test
  (testing "window create prefs enable spellcheck for nil and true, and disable only for false"
    (is (= {:spellcheck true} (spell-check/window-web-preferences nil)))
    (is (= {:spellcheck true} (spell-check/window-web-preferences true)))
    (is (= {:spellcheck false} (spell-check/window-web-preferences false)))))

(deftest hunspell-languages-test
  (testing "keeps currently configured languages that hunspell still supports"
    (is (= ["fr"] (spell-check/hunspell-languages ["fr"] ["en-US" "fr"] "en-US"))))
  (testing "uses the fallback locale when the persisted language list is empty"
    (is (= ["en-GB"] (spell-check/hunspell-languages [] ["en-GB" "fr"] "en-GB"))))
  (testing "maps a locale prefix onto an available hunspell language"
    (is (= ["en-GB"] (spell-check/hunspell-languages [] ["en-GB" "fr"] "en")))
    (is (= ["en-US"] (spell-check/hunspell-languages [] ["en-US" "fr"] "en_US"))))
  (testing "falls back to en-US, then the first available language"
    (is (= ["en-US"] (spell-check/hunspell-languages [] ["fr" "en-US"] nil)))
    (is (= ["fr"] (spell-check/hunspell-languages [] ["fr" "de"] nil)))
    (is (= [] (spell-check/hunspell-languages [] [] "en-US")))))

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

      (spell-check/apply-window-spellcheck! win false {:hunspell? false})

      (is (= [false] @calls))
      (is (false? (.-spellCheckerEnabled session))))))

(deftest apply-session-spellcheck!-hunspell-test
  (testing "enabling on Linux restores the dictionary URL, languages, and enabled flag"
    (let [{:keys [session state]} (mock-session {:enabled false :languages []})
          win (js-obj "webContents" (js-obj "session" session))]
      (spell-check/apply-window-spellcheck!
       win true
       {:hunspell? true
        :reinit-hunspell? true
        :fallback-language "en-US"})
      (is (true? (:enabled @state)))
      (is (= [true] (:enabled-calls @state)))
      (is (= spell-check/hunspell-dictionary-download-url (:download-url @state)))
      (is (= [[] ["en-US"]] (:language-calls @state)))
      (is (= ["en-US"] (:languages @state)))))

  (testing "enabling after a persisted empty dictionary uses the fallback locale"
    (let [{:keys [session state]} (mock-session {:enabled false
                                                 :languages []
                                                 :available ["en-GB" "fr"]})]
      (spell-check/apply-session-spellcheck!
       session true
       {:hunspell? true
        :reinit-hunspell? true
        :fallback-language "en-GB"})
      (is (= [[] ["en-GB"]] (:language-calls @state)))
      (is (true? (:enabled @state)))))

  (testing "enabling on Windows fills an empty language list without resetting an existing one"
    (let [{:keys [session state]} (mock-session {:languages []})]
      (spell-check/apply-session-spellcheck!
       session true
       {:hunspell? true
        :reinit-hunspell? false
        :fallback-language "en-US"})
      (is (= [["en-US"]] (:language-calls @state))))
    (let [{:keys [session state]} (mock-session {:languages ["fr"]})]
      (spell-check/apply-session-spellcheck!
       session true
       {:hunspell? true
        :reinit-hunspell? false
        :fallback-language "en-US"})
      (is (= [] (:language-calls @state)))
      (is (= ["fr"] (:languages @state)))))

    (let [{:keys [session state]} (mock-session {:enabled true :languages ["en-US"]})]
      (spell-check/apply-session-spellcheck!
       session false
       {:hunspell? true
        :reinit-hunspell? true
        :fallback-language "en-US"})
      (is (= [false] (:enabled-calls @state)))
      (is (nil? (:download-url @state)))
      (is (= [] (:language-calls @state)))
      (is (= ["en-US"] (:languages @state))))))
