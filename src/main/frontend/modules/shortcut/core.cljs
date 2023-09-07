(ns frontend.modules.shortcut.core
  (:require [clojure.string :as str]
            [frontend.handler.config :as config-handler]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.notification :as notification]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.modules.shortcut.utils :as shortcut-utils]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.events :as events]
            [goog.ui.KeyboardShortcutHandler.EventType :as EventType]
            [lambdaisland.glogi :as log]
            [goog.functions :refer [debounce]])
  (:import [goog.events KeyCodes KeyHandler KeyNames]
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
             (.registerShortcut handler (util/keyname id) (shortcut-utils/undecorate-binding k))
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
        (.unregisterShortcut ^js handler (shortcut-utils/undecorate-binding k))))
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

  (let [shortcut-map (dh/shortcut-map handler-id state)
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
                    shortcut-map (dh/shortcut-map handler-id state) ;; required to get shortcut map dynamically
                    dispatch-fn (get shortcut-map id)]
                ;; trigger fn
                (when dispatch-fn
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
            :shortcut.handler/global-prevent-default])
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
       (.dispose handler)
       (events/unlisten handler EventType/SHORTCUT_TRIGGERED dispatch-fn)))))

(defn listen-all! []
  (doseq [{:keys [handler group dispatch-fn]} (vals @*installed-handlers)
          :when (not= group :shortcut.handler/misc)]
    (if (.isDisposed handler)
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

(defn refresh-internal!
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

(def refresh! (debounce refresh-internal! 1000))

(defn- name-with-meta [e]
  (let [ctrl (.-ctrlKey e)
        alt (.-altKey e)
        meta (.-metaKey e)
        shift (.-shiftKey e)
        keyname (get key-names (str (.-keyCode e)))]
    (cond->> keyname
             ctrl (str "ctrl+")
             alt (str "alt+")
             meta (str "meta+")
             shift (str "shift+"))))

(defn keyname [e]
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

       (doseq [id (keys @*installed-handlers)]
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

     ;; force re-install shortcut handlers
     (js/setTimeout #(refresh!) 500)

     (dissoc state ::key-record-handler))})

(defn persist-user-shortcut!
  [id binding]
  (let [graph-shortcuts (or (:shortcuts (state/get-graph-config)) {})
        global-shortcuts (or (:shortcuts (state/get-global-config)) {})
        global? true]
    (letfn [(into-shortcuts [shortcuts]
              (cond-> shortcuts
                      (nil? binding)
                      (dissoc id)

                      (and global?
                           (or (string? binding)
                               (vector? binding)
                               (boolean? binding)))
                      (assoc id binding)))]
      ;; TODO: exclude current graph config shortcuts
      (when (nil? binding)
        (config-handler/set-config! :shortcuts (into-shortcuts graph-shortcuts)))
      (global-config-handler/set-global-config-kv! :shortcuts (into-shortcuts global-shortcuts)))))