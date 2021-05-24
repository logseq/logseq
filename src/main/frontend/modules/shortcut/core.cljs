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
    ;; TODO add try catch for register conflicts
    (doseq [[id _] shortcut-map]
      ;; (log/info :shortcut/install-shortcut {:id id :shortcut (dh/shortcut-binding id)})
      (doseq [k (dh/shortcut-binding id)]
        (try
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

(defn install-shortcuts!
  []
  (install-shortcut! :shortcut.handler/misc {:skip-installed? true})
  (->> [:shortcut.handler/editor-global
        :shortcut.handler/global-non-editing-only
        :shortcut.handler/global-prevent-default]
       (map #(install-shortcut! % {}))
       doall))

(defn uninstall-shortcut! [install-id]
  (let [handler
        (-> (get @*installed install-id)
            :handler)]
    (.dispose ^js handler)
    (swap! *installed dissoc install-id)))


;; Sometimes backspace removes two chars instead of one
;; https://github.com/logseq/logseq/issues/1965
;; A workaround to ensure each shortcut group is only registered once

(defonce *registered-shortcuts-state (atom nil))

(defn- uninstall-shortcut-aux!
  [state handler-id]
  (some-> (get state :shortcut-key)
          uninstall-shortcut!)
  (swap! *registered-shortcuts-state dissoc handler-id))

(defn- install-shortcut-aux!
  [state handler-id]
  (if (get @*registered-shortcuts-state handler-id)
    state
    (let [install-id (-> handler-id
                        (install-shortcut! {:state state}))]
     (swap! *registered-shortcuts-state assoc handler-id install-id)
     (assoc state :shortcut-key install-id))))

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
  (doseq [{:keys [handler]} (vals @*installed)]
    (.removeAllListeners handler)))

(defn listen-all []
  (doseq [{:keys [handler dispatch-fn]} (vals @*installed)]
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
