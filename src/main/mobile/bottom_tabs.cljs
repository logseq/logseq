(ns mobile.bottom-tabs
  "iOS bottom tabs"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.util :as common-util]
            [mobile.state :as mobile-state]))

;; Capacitor plugin instance:
;; Make sure the plugin is registered as `LiquidTabs` on the native side.
(def ^js liquid-tabs
  (.. js/Capacitor -Plugins -LiquidTabsPlugin))

(defn configure-tabs
  "Configure the native tab bar.

   `tabs` is a vector of maps:
   [{:id \"home\"   :title \"Home\"   :system-image \"house\"   :role \"normal\"}
    {:id \"search\" :title \"Search\" :system-image \"magnifyingglass\" :role \"search\"}]"
  [tabs]
  ;; Returns the underlying JS Promise from Capacitor
  (.configureTabs
   liquid-tabs
   (bean/->js {:tabs tabs})))

(defn select!
  "Programmatically select a tab by id. Returns a JS Promise."
  [id]
  (.selectTab
   liquid-tabs
   #js {:id id}))

(defn add-tab-selected-listener!
  "Listen to native tab selection.

   `f` receives the tab id string.
   Returns the Capacitor listener handle; call `(.remove handle)` to unsubscribe."
  [f]
  (.addListener
   liquid-tabs
   "tabSelected"
   (fn [data]
      ;; data is like { id: string }
     (when-let [id (.-id data)]
       (f id)))))

(defn add-search-listener!
  "Listen to native search query changes from the SwiftUI search tab.

   `f` receives a query string.
   Returns the Capacitor listener handle; call `(.remove handle)` to unsubscribe."
  [f]
  (.addListener
   liquid-tabs
   "searchChanged"
   (fn [data]
       ;; data is like { query: string }
     (f (.-query data)))))

(defn add-keyboard-hack-listener!
  "Listen for Backspace or Enter while the invisible keyboard field is focused."
  []
  (.addListener
   liquid-tabs
   "keyboardHackKey"
   (fn [data]
     ;; data is like { key: string }
     (when-let [k (.-key data)]
       (case k
         "backspace"
         (editor-handler/delete-block-when-zero-pos! nil)
         "enter"
         (when-let [input (state/get-input)]
           (let [value (.-value input)]
             (when (string/blank? value)
               (editor-handler/keydown-new-block-handler nil))))
         nil)))))

(defonce add-tab-listeners!
  (do
    (add-tab-selected-listener!
     (fn [tab]
       (reset! mobile-state/*search-input "")
       (when-not (= tab "quick-add")
         (mobile-state/set-tab! tab))
       (case tab
         "home"
         (do
           (route-handler/redirect-to-home!)
           (util/scroll-to-top false))
         "quick-add"
         (editor-handler/show-quick-add)
         ;; TODO: support longPress detection
         ;; (if (= "longPress" interaction)
         ;;   (state/pub-event! [:mobile/start-audio-record])
         ;;   (editor-handler/show-quick-add))
         nil)))
    (add-watch mobile-state/*tab ::select-tab
               (fn [_ _ _old new]
                 (when new (select! new))))
    (add-search-listener!
     (fn [q]
      ;; wire up search handler
       (js/console.log "Native search query" q)
       (reset! mobile-state/*search-input q)
       (reset! mobile-state/*search-last-input-at (common-util/time-ms))))
    (add-keyboard-hack-listener!)))

(defn configure
  []
  (configure-tabs
   [{:id "home"       :title "Home"       :systemImage "house" :role "normal"}
    {:id "favorites"  :title "Favorites"  :systemImage "star"  :role "normal"}
    {:id "quick-add"  :title "Capture"    :systemImage "tray"  :role "normal"}
    {:id "settings"   :title "Settings"   :systemImage "gear"  :role "normal"}]))
