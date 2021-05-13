(ns frontend.modules.shortcut.core
  (:require [clojure.string :as str]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.modules.shortcut.data-helper :as dh]
            [goog.events :as events]
            [goog.ui.KeyboardShortcutHandler.EventType :as EventType]
            [lambdaisland.glogi :as log]
            [medley.core :as medley])
  (:import [goog.ui KeyboardShortcutHandler]
           [goog.events KeyCodes]))

(def *installed (atom {}))

(def global-keys #js
  [KeyCodes/TAB
   KeyCodes/ENTER
   KeyCodes/BACKSPACE KeyCodes/DELETE
   KeyCodes/UP KeyCodes/LEFT KeyCodes/DOWN KeyCodes/RIGHT])

(defn install-shortcut!
  [handler-id {:keys [set-global-keys? prevent-default? state]
               :or   {set-global-keys? true
                      prevent-default? false}}]
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
        (.registerShortcut handler (util/keyname id) k)))

    (let [f (fn [e]
              (let [dispatch-fn (get shortcut-map (keyword (.-identifier e)))]
                ;; trigger fn
                (dispatch-fn e)))
          install-id (medley/random-uuid)
          data       {install-id
                      {:group      handler-id
                       :dispath-fn f
                       :handler    handler}}]

      (events/listen handler EventType/SHORTCUT_TRIGGERED f)

      (swap! *installed merge data)

      install-id)))

(defn install-shortcuts!
  []
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


(defn mixin [handler-id]
  {:did-mount
   (fn [state]
     (let [install-id (-> handler-id
                          (install-shortcut! {:state state}))]
       (assoc state :shortcut-key install-id)))

   :did-remount (fn [old-state new-state]

                  ;; uninstall
                  (-> (get old-state :shortcut-key)
                      uninstall-shortcut!)

                  ;; update new states
                  (let [install-id (-> handler-id
                                       (install-shortcut! {:state new-state}))]
                    (assoc new-state :shortcut-key install-id)))
   :will-unmount
   (fn [state]
     (-> (get state :shortcut-key)
         uninstall-shortcut!)
     (dissoc state :shortcut-key))})
