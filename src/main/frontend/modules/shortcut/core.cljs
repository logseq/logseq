(ns frontend.modules.shortcut.core
  (:require [clojure.string :as str]
            [frontend.handler.config :as config]
            [frontend.handler.notification :as notification]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.events :as events]
            [goog.ui.KeyboardShortcutHandler.EventType :as EventType]
            [lambdaisland.glogi :as log]
            [medley.core :as medley])
  (:import [goog.events KeyCodes KeyHandler KeyNames]
           [goog.ui KeyboardShortcutHandler]))

(def *installed (atom {}))

(def global-keys #js
  [KeyCodes/TAB
   KeyCodes/ENTER
   KeyCodes/BACKSPACE KeyCodes/DELETE
   KeyCodes/UP KeyCodes/LEFT KeyCodes/DOWN KeyCodes/RIGHT])

(def key-names (js->clj KeyNames))

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
   (when-let [handler (if (or (string? handler-id) (keyword? handler-id))
                        (let [handler-id (keyword handler-id)]
                          (-> (get @*installed handler-id)
                              :handler))
                        ;; handler
                        handler-id)]

     (when shortcut-map
       (shortcut-config/add-shortcut! handler-id id shortcut-map))

     (when-not (false? (dh/shortcut-binding id))
       (doseq [k (dh/shortcut-binding id)]
         (try
           (log/debug :shortcut/register-shortcut {:id id :binding k})
           (.registerShortcut handler (util/keyname id) k)
           (catch js/Object e
             (log/error :shortcut/register-shortcut {:id id
                                                     :binding k
                                                     :error e})
             (notification/show! (str/join " " [id k (.-message e)]) :error false))))))))

(defn unregister-shortcut!
  "Unregister a shortcut.
  Example:
  (unregister-shortcut! :shortcut.handler/misc :foo/bar)"
  [handler-id shortcut-id]
  (when-let [handler (-> (get @*installed handler-id)
                         :handler)]
    (when shortcut-id
      (let [k (dh/shortcut-binding shortcut-id)]
        (.unregisterShortcut ^js handler k))
      (shortcut-config/remove-shortcut! handler-id shortcut-id))))

(defn install-shortcut!
  [handler-id {:keys [set-global-keys?
                      prevent-default?
                      skip-installed?
                      state]
               :or   {set-global-keys? true
                      prevent-default? false
                      skip-installed? false}}]
  (let [shortcut-map (dh/shortcut-map handler-id state)
        handler      (new KeyboardShortcutHandler js/window)]
     ;; set arrows enter, tab to global
    (when set-global-keys?
      (.setGlobalKeys handler global-keys))

    (.setAlwaysPreventDefault handler prevent-default?)

    ;; register shortcuts
    (doseq [[id _] shortcut-map]
      ;; (log/info :shortcut/install-shortcut {:id id :shortcut (dh/shortcut-binding id)})
      (register-shortcut! handler id))

    (let [f (fn [e]
              (let [shortcut-map (dh/shortcut-map handler-id state)
                    dispatch-fn (get shortcut-map (keyword (.-identifier e)))]
                ;; trigger fn
                (when dispatch-fn (dispatch-fn e))))
          install-id handler-id
          data       {install-id
                      {:group      handler-id
                       :dispatch-fn f
                       :handler    handler}}]

      (events/listen handler EventType/SHORTCUT_TRIGGERED f)

      (when-not skip-installed?
        (swap! *installed merge data))

      install-id)))

(defn- install-shortcuts!
  []
  (->> [:shortcut.handler/misc
        :shortcut.handler/editor-global
        :shortcut.handler/global-non-editing-only
        :shortcut.handler/global-prevent-default]
       (map #(install-shortcut! % {}))
       doall))

(defn uninstall-shortcut!
  [handler-id]
  (when-let [handler (-> (get @*installed handler-id)
                         :handler)]
    (.dispose ^js handler)
    (swap! *installed dissoc handler-id)))

(defn- uninstall-shortcut-aux!
  [state handler-id]
  (some-> (get state :shortcut-key)
          uninstall-shortcut!))

(defn- install-shortcut-aux!
  [state handler-id]
  (let [install-id (-> handler-id
                       (install-shortcut! {:state state}))]
    (assoc state :shortcut-key install-id)))

(defn mixin [handler-id]
  {:did-mount
   (fn [state]
     (install-shortcut-aux! state handler-id))

   :did-remount (fn [old-state new-state]
                  ;; uninstall
                  (uninstall-shortcut-aux! old-state handler-id)

                  ;; update new states
                  (install-shortcut-aux! new-state handler-id))
   :will-unmount
   (fn [state]
     (uninstall-shortcut-aux! state handler-id)
     (dissoc state :shortcut-key))})

(defn unlisten-all []
  (doseq [{:keys [handler group]} (vals @*installed)
          :when (not= group :shortcut.handler/misc)]
    (.removeAllListeners handler)))

(defn listen-all []
  (doseq [{:keys [handler group dispatch-fn]} (vals @*installed)
          :when (not= group :shortcut.handler/misc)]
    (events/listen handler EventType/SHORTCUT_TRIGGERED dispatch-fn)))

(defn disable-all-shortcuts []
  {:did-mount
   (fn [state]
     (unlisten-all)
     state)

   :will-unmount
   (fn [state]
     (listen-all)
     state)})

(defn refresh!
  "Always use this function to refresh shortcuts"
  []
  (log/info :shortcut/refresh @*installed)
  (doseq [id (keys @*installed)]
    (uninstall-shortcut! id))
  (install-shortcuts!))

(defn- name-with-meta [e]
  (let [ctrl    (.-ctrlKey e)
        alt     (.-altKey e)
        meta    (.-metaKey e)
        shift   (.-shiftKey e)
        keyname (get key-names (str (.-keyCode e)))]
    (cond->> keyname
      ctrl  (str "ctrl+")
      alt   (str "alt+")
      meta  (str "meta+")
      shift (str "shift+"))))

(defn- keyname [e]
  (let [name (get key-names (str (.-keyCode e)))]
    (case name
      nil nil
      ("ctrl" "shift" "alt" "esc") nil
      (str " " (name-with-meta e)))))

(defn record! []
  {:did-mount
   (fn [state]
     (let [handler (KeyHandler. js/document)
           keystroke (:rum/local state)]

       (doseq [id (keys @*installed)]
         (uninstall-shortcut! id))

       (events/listen handler "key"
                      (fn [e]
                        (.preventDefault e)
                        (swap! keystroke #(str % (keyname e)))))

       (assoc state ::key-record-handler handler)))

   :will-unmount
   (fn [{:rum/keys [args local] :as state}]
     (let [k (first args)
           keystroke (str/trim @local)]
       (when-not (empty? keystroke)
         (config/set-config! :shortcuts (merge
                                         (:shortcuts (state/get-config))
                                         {k keystroke}))))

     (when-let [^js handler (::key-record-handler state)]
       (.dispose handler))

     (js/setTimeout #(refresh!) 500)

     (dissoc state ::key-record-handler))})
