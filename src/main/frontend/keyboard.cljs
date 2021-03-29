(ns frontend.keyboard
  (:require [clojure.string :as str]
            [frontend.keyboards.config :as kb-config]
            [frontend.state :as state]
            [frontend.util :refer [keyname mac?]]
            [goog.events :as events]
            [goog.ui.KeyboardShortcutHandler.EventType :as EventType]
            [lambdaisland.glogi :as log])
  (:import [goog.ui KeyboardShortcutHandler]))

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

(defn- mod-key [shortcut]
  (str/replace shortcut #"(?i)mod"
               (if mac? "meta" "ctrl")))

(defn shortcut-binding
  [id]
  (let [shortcut (or (state/get-shortcut id)
                     (get kb-config/default-shortcuts id))]
    (when-not shortcut
      (log/error :keyboard/shorcut-binding-notfound {:id id}))
    (->>
     (if (string? shortcut)
       [shortcut]
       shortcut)
     (mapv mod-key))))

(defn register-shortcuts
  [^js handler id]
  (doseq [k (shortcut-binding id)]
    (.registerShortcut handler (keyname id) k)))

(defn unregister-shortcuts
  [^js handler id]
  (doseq [k (shortcut-binding id)]
    (.unregisterShortcut handler k)))

(defn install-shortcuts!
  ([dispatcher]
   (install-shortcuts! dispatcher js/window))
  ([dispatcher target]
   (let [handler (new KeyboardShortcutHandler target)]
     ;; default is false, set it to true to deal with arrow keys
     (.setAllShortcutsAreGlobal handler true)
     ;; default is true, set it to false here
     (.setAlwaysPreventDefault handler false)
     ; (.setAlwaysStopPropagation handler true)

     ;; register shortcuts
     (doseq [[id _] dispatcher]
       (log/info :keyboard/install-shortcut {:id id :shortcut (shortcut-binding id)})
       ;; do i need this?
       ;; (.unregisterShortcut handler (shortcut-binding id))
       (register-shortcuts handler id))

     (let [f (fn [e]
               (let [dispatch-fn (get dispatcher (keyword (.-identifier e)))]
                 (js/console.log "going to trigger### " (.-identifier e))
                 (dispatch-fn e)))
           unlisten-fn (fn [] (.dispose handler))]

       (events/listen handler EventType/SHORTCUT_TRIGGERED f)

       ;; deregister shortcuts
       (fn []
         (doseq [[id _] dispatcher]
           (log/info :keyboard/remove-shortcut {:id id :shortcut (shortcut-binding id)})
           (unregister-shortcuts handler id))
         (unlisten-fn))))))


(comment
  ; dispatcher example
  (def dispatcher {:test/test (fn [e] (println "trigger test"))})

  (def f (install-shortcuts! dispatcher)))
