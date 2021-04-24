(ns frontend.modules.shortcut.core
  (:require [clojure.string :as str]
            [frontend.modules.shortcut.binding :as binding]
            [frontend.modules.shortcut.handler :refer [handler]]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.events :as events]
            [goog.ui.KeyboardShortcutHandler.EventType :as EventType]
            [lambdaisland.glogi :as log])
  (:import [goog.ui KeyboardShortcutHandler]
           [goog.events KeyCodes]))

(def installed (atom []))
(def binding-profile (atom [binding/default binding/custom]))

(defn- mod-key [shortcut]
  (str/replace shortcut #"(?i)mod"
               (if util/mac? "meta" "ctrl")))
(defn shortcut-binding
  [id]
  (let [shortcut (or (state/get-shortcut id)
                     (get (apply merge @binding-profile) id))]
    (when-not shortcut
      (log/error :shortcut/binding-not-found {:id id}))
    (->>
     (if (string? shortcut)
       [shortcut]
       shortcut)
     (mapv mod-key))))

(def global-keys #js
  [KeyCodes/ENTER KeyCodes/TAB KeyCodes/BACKSPACE KeyCodes/DELETE
   KeyCodes/UP KeyCodes/LEFT KeyCodes/DOWN KeyCodes/RIGHT])

(defn install-shortcut!
  [shortcut-map]
  (let [handler (new KeyboardShortcutHandler js/window)]
    ;; set arrows enter, tab to global
    (.setGlobalKeys handler global-keys)
    ;; default is true, set it to false here
    ;; (.setAlwaysPreventDefault handler false)

    ;; register shortcuts
    (doseq [[id _] shortcut-map]
      (log/info :shortcut/install-shortcut {:id id :shortcut (shortcut-binding id)})
      (doseq [k (shortcut-binding id)]
        (.registerShortcut handler (util/keyname id) k)))

    (let [f (fn [e]
              (let [dispatch-fn (get shortcut-map (keyword (.-identifier e)))]
                ;; trigger fn
                (dispatch-fn e)))
          unlisten-fn (fn [] (.dispose handler))]

      (events/listen handler EventType/SHORTCUT_TRIGGERED f)

      ;; return deregister fn
      (fn []
        (log/info :shortcut/dispose (into [] (keys shortcut-map)))
        (unlisten-fn)))))

(defn install-shortcuts!
  []
  (let [result (->> handler
                    (map #(install-shortcut! %))
                    doall)]
    (reset! installed result)))

(defn uninstall-shortcuts!
  []
  (doseq [f @installed]
    (f)))
