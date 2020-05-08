(ns frontend.keyboard
  (:require [goog.events :as events]
            [goog.ui.KeyboardShortcutHandler.EventType :as EventType]
            [goog.events.KeyCodes :as KeyCodes])
  (:import  [goog.ui KeyboardShortcutHandler]))

;; Copy from https://github.com/tonsky/rum/blob/gh-pages/doc/useful-mixins.md#keyboard-shortcut

(defn install-shortcut!
  "Installs a Keyboard Shortcut handler.
   The key is a string the trigger is a function that will receive the keyboard event as the
   first argument. If once? is true the keyboard shortcut is only fired once.
   The unregister handler is returned and can be called to unregister the listener.
   If target is not given it's attached to window."
  ([key trigger] (install-shortcut! key trigger false js/window))
  ([key trigger once?] (install-shortcut! key trigger once? js/window))
  ([key trigger once? target]
   (let [handler (new KeyboardShortcutHandler target)]
     (.registerShortcut handler (str key once?) key)
     (events/listen
              handler
              EventType/SHORTCUT_TRIGGERED
              (fn [e]
                (trigger e)
                (when once?
                  (.unregisterShortcut handler keys))))
     (fn []
       (.unregisterShortcut handler key)))))
