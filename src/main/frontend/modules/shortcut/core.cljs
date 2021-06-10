(ns frontend.modules.shortcut.core
  (:require [clojure.string :as str]
            [frontend.handler.notification :as notification]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.util :as util]
            [goog.events :as events]
            [goog.ui.KeyboardShortcutHandler.EventType :as EventType]
            [lambdaisland.glogi :as log]
            [medley.core :as medley])
  (:import [goog.events KeyCodes]
           [goog.ui KeyboardShortcutHandler]))

(def *installed (atom {}))

(def global-keys #js
  [KeyCodes/TAB
   KeyCodes/ENTER
   KeyCodes/BACKSPACE KeyCodes/DELETE
   KeyCodes/UP KeyCodes/LEFT KeyCodes/DOWN KeyCodes/RIGHT])

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
      (doseq [k (dh/shortcut-binding id)]
        (try
          (log/debug :shortcut/register-shortcut {:id id :binding k})
          (.registerShortcut handler (util/keyname id) k)
          (catch js/Object e
            (log/error :shortcut/register-shortcut {:id id
                                                    :binding k
                                                    :error e})
            (notification/show! (str/join " " [id k (.-message e)]) :error false)))))

    (let [f (fn [e]
              (let [dispatch-fn (get shortcut-map (keyword (.-identifier e)))]
                ;; trigger fn
                (dispatch-fn e)))
          install-id (medley/random-uuid)
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

(defn- uninstall-shortcut! [install-id]
  (when-let
      [handler (-> (get @*installed install-id)
                   :handler)]
    (.dispose ^js handler)
    (swap! *installed dissoc install-id)))


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
