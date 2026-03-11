(ns frontend.modules.shortcut.core
  (:require [clojure.string :as string]
            [frontend.handler.config :as config-handler]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [goog.events :as events]
            [goog.object :as gobj]
            [goog.ui.KeyboardShortcutHandler.EventType :as EventType]
            [lambdaisland.glogi :as log]
            [logseq.shui.ui :as shui])
  (:import [goog.events KeyCodes KeyNames]
           [goog.ui KeyboardShortcutHandler]))

(defonce *installed-handlers (atom {}))
(defonce *pending-inited? (atom false))
(defonce *pending-shortcuts (atom []))

(def global-keys #js
                  [KeyCodes/TAB
                   KeyCodes/ENTER
                   KeyCodes/BACKSPACE KeyCodes/DELETE
                   KeyCodes/UP KeyCodes/LEFT KeyCodes/DOWN KeyCodes/RIGHT])

(def key-names (js->clj KeyNames))

(declare register-shortcut!)

(defn consume-pending-shortcuts!
  []
  (when (and @*pending-inited? (seq @*pending-shortcuts))
    (doseq [[handler-id id shortcut] @*pending-shortcuts]
      (register-shortcut! handler-id id shortcut))
    (reset! *pending-shortcuts [])))

(defn- get-handler-by-id
  [handler-id]
  (->> (vals @*installed-handlers)
       (filter #(= (:group %) handler-id))
       first
       :handler))

(defn- get-installed-ids-by-handler-id
  [handler-id]
  (some->> @*installed-handlers
           (filter #(= (:group (second %)) handler-id))
           (map first)
           (remove nil?)
           (vec)))

(defn register-shortcut!
  "Register a shortcut, notice the id need to be a namespaced keyword to avoid
  conflicts.
  Example:
  (register-shortcut! :shortcut.handler/misc :foo/bar {:binding \"mod+shift+8\"
     :fn (fn [_state _event]
     (js/alert \"test shortcut\"))})"
  ([handler-id id]
   (register-shortcut! handler-id id nil))
  ([handler-id id shortcut-map]
   (if (and (keyword? handler-id) (not @*pending-inited?))
     (swap! *pending-shortcuts conj [handler-id id shortcut-map])
     (when-let [^js handler (if (or (string? handler-id) (keyword? handler-id))
                              (let [handler-id (keyword handler-id)]
                                (get-handler-by-id handler-id))

                              ;; as Handler instance
                              handler-id)]

       (when shortcut-map
         (shortcut-config/add-shortcut! handler-id id shortcut-map))

       (when-not (false? (dh/shortcut-binding id))
         (doseq [k (dh/shortcut-binding id)]
           (try
             (log/debug :shortcut/register-shortcut {:id id :binding k})
             ;; Defensively clear stale registration before registering.
             (let [undec-k (shortcut-utils/undecorate-binding k)]
               (try (.unregisterShortcut handler undec-k)
                    (catch :default _))
               (.registerShortcut handler (util/keyname id) undec-k))
             (catch :default e
               (let [chord-prefix? (string/includes? (.-message e) "shortcut: null")]
                 (if chord-prefix?
                   ;; Chord-prefix tree clash: expected when a simple key and a
                   ;; chord starting with that key coexist on the same handler.
                   ;; The chord becomes dormant — no user notification needed.
                   (log/debug :shortcut/chord-prefix-clash {:id id :binding k})
                   ;; Unexpected conflict: log full debug info for investigation.
                   (do
                     (let [tree (.-shortcuts_ handler)
                           undec-k (shortcut-utils/undecorate-binding k)]
                       (js/console.group "SHORTCUT CONFLICT DEBUG")
                       (js/console.warn "ID:" (str id))
                       (js/console.warn "Binding:" k "→" undec-k)
                       (js/console.warn "Error:" (.-message e))
                       (js/console.warn "Handler tree keys:" (js/Object.keys tree))
                       (js/console.warn "Full tree:" (js/JSON.stringify tree js/undefined 2))
                       (js/console.groupEnd))
                     (log/error :shortcut/register-shortcut {:id      id
                                                             :binding k
                                                             :error   e})
                     (notification/show! (string/join " " [id k (.-message e)]) :error false))))))))))))

(defn unregister-shortcut!
  "Unregister a shortcut.
  Example:
  (unregister-shortcut! :shortcut.handler/misc :foo/bar)"
  [handler-id shortcut-id]
  (when-let [handler (get-handler-by-id handler-id)]
    (when-let [ks (dh/shortcut-binding shortcut-id)]
      (doseq [k ks]
        (.unregisterShortcut ^js handler (shortcut-utils/undecorate-binding k)))))
  (when shortcut-id
    (shortcut-config/remove-shortcut! handler-id shortcut-id)))

(defn uninstall-shortcut-handler!
  ([install-id] (uninstall-shortcut-handler! install-id false))
  ([install-id refresh?]
   (when-let [handler (-> (get @*installed-handlers install-id)
                          :handler)]
     (.dispose ^js handler)
     (log/debug :shortcuts/uninstall-handler (-> @*installed-handlers (get install-id) :group (str (if refresh? "*" ""))))
     (swap! *installed-handlers dissoc install-id))))

(defn install-shortcut-handler!
  [handler-id {:keys [set-global-keys?
                      prevent-default?
                      state]
               :or   {set-global-keys? true
                      prevent-default? false}}]

  ;; force uninstall existed handler
  (some->>
   (get-installed-ids-by-handler-id handler-id)
   (map #(uninstall-shortcut-handler! % true))
   (doall))

  (let [shortcut-map (dh/shortcuts-map-by-handler-id handler-id state)
        handler (new KeyboardShortcutHandler js/window)]
    ;; set arrows enter, tab to global
    (when set-global-keys?
      (.setGlobalKeys handler global-keys))

    (.setAlwaysPreventDefault handler prevent-default?)

    ;; register shortcuts
    (doseq [[id _] shortcut-map]
      ;; (log/info :shortcut/install-shortcut {:id id :shortcut (str (dh/shortcut-binding id))})
      (register-shortcut! handler id))

    (let [f (fn [e]
              (let [id (keyword (.-identifier e))
                    shortcut-map (dh/shortcuts-map-by-handler-id handler-id state) ;; required to get shortcut map dynamically
                    dispatch-fn (get shortcut-map id)
                    binding (dh/shortcut-binding id)]
                (state/set-state! :editor/latest-shortcut id)
                ;; Trigger animation for visible shortcuts
                (when binding
                  (let [bindings (if (coll? binding) binding [binding])]
                    (doseq [b bindings]
                      (when b
                        (try
                          (shui/shortcut-press! b true)
                          (catch :default e
                            (log/warn :shortcut-press-animation-error {:binding b :error e})))))))
                ;; trigger fn — suppress on keymap settings page (animate-only mode)
                (when (and dispatch-fn
                           (not (= "keymap" (.. js/document -body -dataset -settingsTab))))
                  (plugin-handler/hook-lifecycle-fn! id dispatch-fn e))))
          install-id (random-uuid)
          data {install-id
                {:group       handler-id
                 :dispatch-fn f
                 :handler     handler}}]

      (.listen handler EventType/SHORTCUT_TRIGGERED f)

      (log/debug :shortcuts/install-handler (str handler-id))
      (swap! *installed-handlers merge data)

      install-id)))

(defn- install-shortcuts!
  [handler-ids]
  (->> (or (seq handler-ids)
           [:shortcut.handler/misc
            :shortcut.handler/editor-global
            :shortcut.handler/global-non-editing-only
            :shortcut.handler/global-prevent-default
            :shortcut.handler/block-editing-only])
       (map #(install-shortcut-handler! % {}))
       doall))

(defn mixin
  ([handler-id] (mixin handler-id true))
  ([handler-id remount-reinstall?]
   (cond->
    {:did-mount
     (fn [state]
       (let [install-id (install-shortcut-handler! handler-id {:state state})]
         (assoc state ::install-id install-id)))

     :will-unmount
     (fn [state]
       (when-let [install-id (::install-id state)]
         (uninstall-shortcut-handler! install-id))
       state)}

     remount-reinstall?
     (assoc
      :will-remount
      (fn [old-state new-state]
        (util/profile "[shortcuts] reinstalled:"
          (uninstall-shortcut-handler! (::install-id old-state))
          (when-let [install-id (install-shortcut-handler! handler-id {:state new-state})]
            (assoc new-state ::install-id install-id))))))))

(defn mixin*
  "This is an optimized version compared to (mixin).
   And the shortcuts will not be frequently loaded and unloaded.
   As well as ensuring unnecessary updates of components."
  [handler-id]
  {:did-mount
   (fn [state]
     (let [*state (volatile! state)
           install-id (install-shortcut-handler! handler-id {:state *state})]
       (assoc state ::install-id install-id
              ::*state *state)))

   :will-remount
   (fn [old-state new-state]
     (when-let [*state (::*state old-state)]
       (vreset! *state new-state))
     new-state)

   :will-unmount
   (fn [state]
     (when-let [install-id (::install-id state)]
       (uninstall-shortcut-handler! install-id)
       (some-> (::*state state) (vreset! nil)))
     state)})

(defn unlisten-all!
  ([] (unlisten-all! false))
  ([dispose?]
   (doseq [{:keys [handler group dispatch-fn]} (vals @*installed-handlers)
           :when (not= group :shortcut.handler/misc)]
     (if dispose?
       (.dispose ^js handler)
       (events/unlisten handler EventType/SHORTCUT_TRIGGERED dispatch-fn)))))

(defn listen-all! []
  (doseq [{:keys [handler group dispatch-fn]} (vals @*installed-handlers)
          :when (not= group :shortcut.handler/misc)]
    (if (.isDisposed ^js handler)
      (install-shortcut-handler! group {})
      (events/listen handler EventType/SHORTCUT_TRIGGERED dispatch-fn))))

(def disable-all-shortcuts
  {:will-mount
   (fn [state]
     (unlisten-all!)
     state)

   :will-unmount
   (fn [state]
     (listen-all!)
     state)})

(defn refresh!
  "Always use this function to refresh shortcuts"
  []
  (when-not (:ui/shortcut-handler-refreshing? @state/state)
    (state/set-state! :ui/shortcut-handler-refreshing? true)

    (let [ids (keys @*installed-handlers)
          _handler-ids (set (map :group (vals @*installed-handlers)))]
      (doseq [id ids] (uninstall-shortcut-handler! id))
      ;; TODO: should re-install existed handlers
      (install-shortcuts! nil))
    (state/pub-event! [:shortcut-handler-refreshed])
    (state/set-state! :ui/shortcut-handler-refreshing? false)))

(def ^:private code->key-name-map
  "Maps KeyboardEvent.code values to the key-name strings used by key-names.
   Used as fallback when Closure's KeyHandler corrupts keyCode (e.g. macOS
   Option+key producing Unicode characters, or AltGr on Windows)."
  {"Space"        "space"
   "Enter"        "enter"
   "Tab"          "tab"
   "Backspace"    "backspace"
   "Delete"       "delete"
   "Escape"       "esc"
   "ArrowUp"      "up"
   "ArrowDown"    "down"
   "ArrowLeft"    "left"
   "ArrowRight"   "right"
   "BracketLeft"  "open-square-bracket"
   "BracketRight" "close-square-bracket"
   "Semicolon"    "semicolon"
   "Equal"        "equals"
   "Minus"        "dash"
   "Quote"        "single-quote"
   "Backquote"    "grave-accent"
   "Backslash"    "backslash"
   "Comma"        "comma"
   "Period"       "period"
   "Slash"        "slash"
   "PageUp"       "page-up"
   "PageDown"     "page-down"
   "Home"         "home"
   "End"          "end"
   "Insert"       "insert"
   "CapsLock"     "caps-lock"
   "NumpadEnter"  "enter"
   "NumpadAdd"    "+"
   "NumpadSubtract" "-"
   "NumpadMultiply" "*"
   "NumpadDivide" "/"
   "Numpad0" "0" "Numpad1" "1" "Numpad2" "2" "Numpad3" "3" "Numpad4" "4"
   "Numpad5" "5" "Numpad6" "6" "Numpad7" "7" "Numpad8" "8" "Numpad9" "9"})

(defn- code->key-name
  "Maps a KeyboardEvent.code string to the key-name used by key-names."
  [code]
  (when (string? code)
    (cond
      ;; KeyA-KeyZ → "a"-"z"
      (string/starts-with? code "Key")
      (string/lower-case (subs code 3))

      ;; Digit0-Digit9 → "0"-"9"
      (string/starts-with? code "Digit")
      (subs code 5)

      ;; F1-F12
      (re-matches #"F\d{1,2}" code)
      (string/lower-case code)

      ;; Everything else via lookup
      :else
      (get code->key-name-map code))))

(defn- resolve-key-name
  "Resolve the key name from a KeyEvent. Tries key-names (keyCode) first,
   then falls back to code->key-name (native KeyboardEvent.code) when a
   modifier is held — corrects macOS Option+key corruption and AltGr on Windows."
  [e]
  (or (get key-names (str (.-keyCode e)))
      (when (or (.-altKey e) (.-ctrlKey e) (.-metaKey e))
        (some-> (gobj/getValueByKeys e "event_" "code")
                code->key-name))))

(defn- name-with-meta [e resolved-name]
  (let [ctrl (.-ctrlKey e)
        alt (.-altKey e)
        meta (.-metaKey e)
        shift (.-shiftKey e)]
    ;; cond->> applies bottom-to-top, so list modifiers in reverse
    ;; canonical order (ctrl+alt+meta+shift) to produce correct output
    (cond->> resolved-name
      shift (str "shift+")
      meta (str "meta+")
      alt (str "alt+")
      ctrl (str "ctrl+"))))

(defn keyname
  [e]
  (let [name (resolve-key-name e)]
    (cond
      (nil? name) nil
      (#{"ctrl" "shift" "alt" "meta" "esc"} name) nil
      :else (str " " (name-with-meta e name)))))

(defn persist-user-shortcut!
  [id binding]
  (let [global? true]
    (letfn [(into-shortcuts [shortcuts]
              (cond-> (or shortcuts {})
                (nil? binding)
                (dissoc id)

                (and global?
                     (or (string? binding)
                         (vector? binding)
                         (boolean? binding)))
                (assoc id binding)))]
      ;; TODO: exclude current graph config shortcuts
      (config-handler/set-config!
       :shortcuts (into-shortcuts (:shortcuts (state/get-graph-config))))
      (if (util/electron?)
        (global-config-handler/set-global-config-kv!
         :shortcuts (into-shortcuts (:shortcuts (state/get-global-config))))
        ;; web browser platform
        (storage/set :ls-shortcuts (into-shortcuts (storage/get :ls-shortcuts)))))))

(defn persist-user-shortcuts-batch!
  "Persist multiple shortcut binding changes atomically.
   changes is a seq of [id binding] pairs where binding is a string, vector,
   boolean, or nil (nil means remove/reset to default).
   Reads each config source once, applies all changes, and writes once per source
   to avoid read-modify-write races between sequential persist-user-shortcut! calls."
  [changes]
  (let [apply-changes
        (fn [shortcuts]
          (reduce (fn [m [id binding]]
                    (if (nil? binding)
                      (dissoc m id)
                      (if (or (string? binding)
                              (vector? binding)
                              (boolean? binding))
                        (assoc m id binding)
                        m)))
                  (or shortcuts {})
                  changes))]
    (config-handler/set-config!
     :shortcuts (apply-changes (:shortcuts (state/get-graph-config))))
    (if (util/electron?)
      (global-config-handler/set-global-config-kv!
       :shortcuts (apply-changes (:shortcuts (state/get-global-config))))
      (storage/set :ls-shortcuts (apply-changes (storage/get :ls-shortcuts))))))
