(ns frontend.modules.shortcut.core
  (:require [clojure.string :as str]
            [frontend.handler.config :as config-handler]
            [frontend.handler.notification :as notification]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.events :as events]
            [goog.ui.KeyboardShortcutHandler.EventType :as EventType]
            [lambdaisland.glogi :as log]
            [goog.functions :refer [debounce]])
  (:import [goog.events KeyCodes KeyHandler KeyNames]
           [goog.ui KeyboardShortcutHandler]))

(def *installed (atom {}))
(def *inited? (atom false))
(def *pending (atom []))

(def global-keys #js
                  [KeyCodes/TAB
                   KeyCodes/ENTER
                   KeyCodes/BACKSPACE KeyCodes/DELETE
                   KeyCodes/UP KeyCodes/LEFT KeyCodes/DOWN KeyCodes/RIGHT])

(def key-names (js->clj KeyNames))

(declare register-shortcut!)

(defn consume-pending-shortcuts!
  []
  (when (and @*inited? (seq @*pending))
    (doseq [[handler-id id shortcut] @*pending]
      (register-shortcut! handler-id id shortcut))
    (reset! *pending [])))

(defn- get-handler-by-id
  [handler-id]
  (-> (filter #(= (:group %) handler-id) (vals @*installed))
      first
      :handler))

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
   (if (and (keyword? handler-id) (not @*inited?))
     (swap! *pending conj [handler-id id shortcut-map])
     (when-let [handler (if (or (string? handler-id) (keyword? handler-id))
                          (let [handler-id (keyword handler-id)]
                            (get-handler-by-id handler-id))

                          ;; handler
                          handler-id)]

       (when shortcut-map
         (shortcut-config/add-shortcut! handler-id id shortcut-map))

       (when-not (false? (dh/shortcut-binding id))
         (doseq [k (dh/shortcut-binding id)]
           (try
             (log/debug :shortcut/register-shortcut {:id id :binding k})
             (.registerShortcut handler (util/keyname id) (util/normalize-user-keyname k))
             (catch :default e
               (log/error :shortcut/register-shortcut {:id      id
                                                       :binding k
                                                       :error   e})
               (notification/show! (str/join " " [id k (.-message e)]) :error false)))))))))

(defn unregister-shortcut!
  "Unregister a shortcut.
  Example:
  (unregister-shortcut! :shortcut.handler/misc :foo/bar)"
  [handler-id shortcut-id]
  (when-let [handler (get-handler-by-id handler-id)]
    (when-let [ks (dh/shortcut-binding shortcut-id)]
      (doseq [k ks]
        (.unregisterShortcut ^js handler (util/normalize-user-keyname k))))
    (shortcut-config/remove-shortcut! handler-id shortcut-id)))

(defn uninstall-shortcut-handler!
  [install-id]
  (when-let [handler (-> (get @*installed install-id)
                         :handler)]
    (.dispose ^js handler)
    (swap! *installed dissoc install-id)))

(defn install-shortcut-handler!
  [handler-id {:keys [set-global-keys?
                      prevent-default?
                      state]
               :or   {set-global-keys? true
                      prevent-default? false}}]
  (when-let [install-id (get-handler-by-id handler-id)]
    (uninstall-shortcut-handler! install-id))

  (let [shortcut-map (dh/shortcut-map handler-id state)
        handler      (new KeyboardShortcutHandler js/window)]
    ;; set arrows enter, tab to global
    (when set-global-keys?
      (.setGlobalKeys handler global-keys))

    (.setAlwaysPreventDefault handler prevent-default?)

    ;; register shortcuts
    (doseq [[id _] shortcut-map]
      ;; (log/info :shortcut/install-shortcut {:id id :shortcut (str (dh/shortcut-binding id))})
      (register-shortcut! handler id))

    (let [f (fn [e]
              (let [shortcut-map (dh/shortcut-map handler-id state)
                    dispatch-fn (get shortcut-map (keyword (.-identifier e)))]
                ;; trigger fn
                (when dispatch-fn (dispatch-fn e))))
          install-id (random-uuid)
          data       {install-id
                      {:group      handler-id
                       :dispatch-fn f
                       :handler    handler}}]

      (.listen handler EventType/SHORTCUT_TRIGGERED f)

      (swap! *installed merge data)

      install-id)))

(defn- install-shortcuts!
  []
  (->> [:shortcut.handler/misc
        :shortcut.handler/editor-global
        :shortcut.handler/global-non-editing-only
        :shortcut.handler/global-prevent-default]
       (map #(install-shortcut-handler! % {}))
       doall))

(defn mixin [handler-id]
  {:did-mount
   (fn [state]
     (let [install-id (install-shortcut-handler! handler-id {:state state})]
       (assoc state ::install-id install-id)))

   :will-remount (fn [old-state new-state]
                  (uninstall-shortcut-handler! (::install-id old-state))
                  (when-let [install-id (install-shortcut-handler! handler-id {:state new-state})]
                    (assoc new-state ::install-id install-id)))
   :will-unmount
   (fn [state]
     (when-let [install-id (::install-id state)]
       (uninstall-shortcut-handler! install-id))
     state)})

(defn unlisten-all []
  (doseq [{:keys [handler group]} (vals @*installed)
          :when (not= group :shortcut.handler/misc)]
    (.removeAllListeners handler)))

(defn listen-all []
  (doseq [{:keys [handler group dispatch-fn]} (vals @*installed)
          :when (not= group :shortcut.handler/misc)]
    (events/listen handler EventType/SHORTCUT_TRIGGERED dispatch-fn)))

(def disable-all-shortcuts
  {:will-mount
   (fn [state]
     (unlisten-all)
     state)

   :will-unmount
   (fn [state]
     (listen-all)
     state)})

(defn refresh-internal!
  "Always use this function to refresh shortcuts"
  []
  (when-not (:ui/shortcut-handler-refreshing? @state/state)
    (state/set-state! :ui/shortcut-handler-refreshing? true)

    (doseq [id (keys @*installed)]
      (uninstall-shortcut-handler! id))
    (install-shortcuts!)
    (state/pub-event! [:shortcut-handler-refreshed])
    (state/set-state! :ui/shortcut-handler-refreshing? false)))

(def refresh! (debounce refresh-internal! 1000))

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
         (uninstall-shortcut-handler! id))

       (events/listen handler "key"
                      (fn [e]
                        (.preventDefault e)
                        (swap! keystroke #(str % (keyname e)))))

       (assoc state ::key-record-handler handler)))

   :will-unmount
   (fn [{:rum/keys [args local action] :as state}]
     (let [k (first args)
           keystroke (str/trim @local)]
       (when (and (= @action :save)
                  (seq keystroke))
         (config-handler/set-config!
           :shortcuts
           (merge
             (:shortcuts (state/get-config))
             {k keystroke}))))

     (when-let [^js handler (::key-record-handler state)]
       (.dispose handler))

     (js/setTimeout #(refresh!) 500)

     (dissoc state ::key-record-handler))})
