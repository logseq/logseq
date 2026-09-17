(ns frontend.mobile.theme
  "Native shell <-> webview system appearance contract."
  (:require [frontend.state :as state]))

(def native-system-theme-changed-event
  "logseq:native-system-theme-changed")

(defn native-system-theme-changed-js
  "JS snippet iOS/Android evaluate to notify the webview of system appearance.
  Keep native shells in sync with this exact string."
  [is-dark?]
  (str "window.dispatchEvent(new CustomEvent('"
       native-system-theme-changed-event
       "', { detail: { isDark: "
       (if is-dark? "true" "false")
       " } }));"))

(defn handle-native-system-theme-changed!
  "Apply a native system-appearance event when the user is following system theme."
  [^js e]
  (when (:ui/system-theme? (state/get-state))
    (let [is-dark? (boolean (some-> e .-detail .-isDark))]
      (state/set-theme-mode! (if is-dark? "dark" "light") true))))
