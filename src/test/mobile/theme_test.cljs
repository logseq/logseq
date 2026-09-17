(ns mobile.theme-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.mobile.theme :as mobile-theme]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.util :as util]))

(deftest native-system-theme-changed-js-matches-native-shell-snippet
  (testing "native iOS/Android evaluate this exact CustomEvent snippet"
    (is (= "window.dispatchEvent(new CustomEvent('logseq:native-system-theme-changed', { detail: { isDark: true } }));"
           (mobile-theme/native-system-theme-changed-js true)))
    (is (= "window.dispatchEvent(new CustomEvent('logseq:native-system-theme-changed', { detail: { isDark: false } }));"
           (mobile-theme/native-system-theme-changed-js false)))))

(deftest native-system-theme-changed-updates-theme-when-following-system
  (let [prev-theme (state/get-state :ui/theme)
        prev-system (state/get-state :ui/system-theme?)]
    (try
      (testing "dark system appearance"
        (state/set-state! :ui/system-theme? true)
        (state/set-state! :ui/theme "light")
        (mobile-theme/handle-native-system-theme-changed! #js {:detail #js {:isDark true}})
        (is (= "dark" (state/get-state :ui/theme))))
      (testing "light system appearance"
        (state/set-state! :ui/system-theme? true)
        (state/set-state! :ui/theme "dark")
        (mobile-theme/handle-native-system-theme-changed! #js {:detail #js {:isDark false}})
        (is (= "light" (state/get-state :ui/theme))))
      (finally
        (state/set-state! :ui/theme prev-theme)
        (state/set-state! :ui/system-theme? prev-system)))))

(deftest native-system-theme-changed-skips-when-not-following-system
  (let [prev-theme (state/get-state :ui/theme)
        prev-system (state/get-state :ui/system-theme?)]
    (try
      (state/set-state! :ui/system-theme? false)
      (state/set-state! :ui/theme "light")
      (mobile-theme/handle-native-system-theme-changed! #js {:detail #js {:isDark true}})
      (is (= "light" (state/get-state :ui/theme)))
      (finally
        (state/set-state! :ui/theme prev-theme)
        (state/set-state! :ui/system-theme? prev-system)))))

(deftest default-system-theme-includes-ios
  (testing "fresh iOS installs follow system appearance like macOS and Windows"
    (with-redefs [util/mac? false
                  util/win32? false
                  util/ios? (constantly true)]
      (is (true? (state/default-system-theme?)))))
  (testing "macOS still defaults to system theme"
    (with-redefs [util/mac? true
                  util/win32? false
                  util/ios? (constantly false)]
      (is (true? (state/default-system-theme?)))))
  (testing "platforms without a system-theme default stay off"
    (with-redefs [util/mac? false
                  util/win32? false
                  util/ios? (constantly false)]
      (is (false? (state/default-system-theme?))))))

(deftest system-theme-preference-preserves-explicit-light-or-dark
  (testing "stored false is kept so users who picked light/dark are unchanged"
    (with-redefs [storage/get (fn [k]
                                (when (= k :ui/system-theme?) false))
                  state/default-system-theme? (constantly true)]
      (is (false? (state/system-theme-preference)))))
  (testing "stored true is kept"
    (with-redefs [storage/get (fn [k]
                                (when (= k :ui/system-theme?) true))
                  state/default-system-theme? (constantly false)]
      (is (true? (state/system-theme-preference)))))
  (testing "unset storage uses the platform default"
    (with-redefs [storage/get (constantly nil)
                  state/default-system-theme? (constantly true)]
      (is (true? (state/system-theme-preference))))))

(deftest restore-mobile-theme-follows-ios-system-default-when-unset
  (let [calls (atom [])]
    (with-redefs [storage/get (fn [k]
                                (when (= k :ui/theme) "light"))
                  state/default-system-theme? (constantly true)
                  mobile-util/native-platform? (constantly true)
                  mobile-util/set-native-interface-style! (fn [mode system?]
                                                            (swap! calls conj [mode system?]))
                  util/set-theme-light (constantly nil)
                  util/set-theme-dark (constantly nil)]
      (state/restore-mobile-theme!)
      (is (= [["light" true]] @calls)))))

(deftest restore-mobile-theme-keeps-explicit-light-or-dark
  (let [calls (atom [])]
    (with-redefs [storage/get (fn [k]
                                (case k
                                  :ui/theme "dark"
                                  :ui/system-theme? false
                                  nil))
                  state/default-system-theme? (constantly true)
                  mobile-util/native-platform? (constantly true)
                  mobile-util/set-native-interface-style! (fn [mode system?]
                                                            (swap! calls conj [mode system?]))
                  util/set-theme-light (constantly nil)
                  util/set-theme-dark (constantly nil)]
      (state/restore-mobile-theme!)
      (is (= [["dark" false]] @calls)))))
