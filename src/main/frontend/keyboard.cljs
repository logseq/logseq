(ns frontend.keyboard
  (:require [goog.events :as events]
            [lambdaisland.glogi :as log]
            [frontend.util :refer [keyname]]
            [frontend.keyboards.config :as kb-config]
            [goog.ui.KeyboardShortcutHandler.EventType :as EventType])
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
     (let [f (fn [e]
               (trigger e)
               (when once?
                 (.unregisterShortcut handler key)))
           listener (events/listen
                     handler
                     EventType/SHORTCUT_TRIGGERED
                     f)
           unlisten-fn (fn []
                         (.dispose handler))]
       (fn []
         (.unregisterShortcut handler key)
         (unlisten-fn))))))

(defn shortcut-binding
  [id]
  (get kb-config/default-shortcuts id))


; each dispatcher key should be present in shortcut config
(defn- valid-dispatcher? [dispatcher]
  (->> dispatcher
       keys
       (every? (fn [k] (contains? kb-config/default-shortcuts k)))))

(defn install-shortcuts!
  ([dispatcher]
   (install-shortcuts! dispatcher js/window))
  ([dispatcher target]
   (assert (valid-dispatcher? dispatcher) "forget to register shortcut in config?")
   (let [handler (new KeyboardShortcutHandler target)]

     ;; register shortcuts
     (doseq [[id _] dispatcher]
       (log/info :keyboard/install-shortcut {:id id :shortcut (shortcut-binding id)})
       ;; do i need this?
       ;; (.unregisterShortcut handler (shortcut-binding id))
       (.registerShortcut handler (keyname id) (shortcut-binding id)))

     (let [f (fn [e]
               (let [dispatch-fn (get dispatcher (keyword (.-identifier e)))]
                 (dispatch-fn e)))
           unlisten-fn (fn [] (.dispose handler))]

       (events/listen handler EventType/SHORTCUT_TRIGGERED f)

       ;; deregister shortcuts
       (fn []
         (doseq [[id _] dispatcher]
           (log/info :keyboard/remove-shortcut {:id id :shortcut (shortcut-binding id)})
           (.unregisterShortcut handler (shortcut-binding id)))
         (unlisten-fn))))))

(comment
  ; dispatcher example
  (def dispatcher {:test/test (fn [e] (println "trigger test"))})
  (def f (install-shortcuts! dispatcher)))
