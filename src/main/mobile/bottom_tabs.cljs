(ns mobile.bottom-tabs
  "iOS bottom tabs"
  (:require [cljs-bean.core :as bean]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [mobile.state :as mobile-state]
            [promesa.core :as p]))

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

;; (defn- tab-options
;;   [theme visible?]
;;   {:visible visible?
;;    :initialId "home"
;;    :items [{:id "home"
;;             :title "Journals"
;;             :systemIcon "house"}

;;            {:id "search"
;;             :title "Search"
;;             :systemIcon "magnifyingglass"}

;;            {:id "quick-add"
;;             :title "Quick add"
;;             :systemIcon "plus"}

;;            {:id "settings"
;;             :title "Settings"
;;             :systemIcon "gear"}]
;;    :selectedIconColor (if (= "light" theme)
;;                         "rgb(0, 105, 182)"
;;                         "#8ec2c2")
;;    :unselectedIconColor "#8E8E93"
;;    :titleOpacity 0.7})

(defn configure
  []
  (p/do!
    ;; (configure-tabs (:ui/theme @state/state) true)
   (configure-tabs
    [{:id "home"    :title "Home"    :systemImage "house"             :role "normal"}
     {:id "quick-add" :title "Capture" :systemImage "plus"            :role "normal"}
     {:id "settings" :title "Settings" :systemImage "gear"            :role "normal"}
     {:id "search"  :title "Search"  :systemImage "magnifyingglass"   :role "search"}])
   (add-tab-selected-listener!
    (fn [tab]
      (when-not (= tab "quick-add")
        (mobile-state/set-tab! tab))
      (case tab
        "home"
        (util/scroll-to-top false)
        "quick-add"
        (editor-handler/show-quick-add)
                       ;; TODO: support longPress detection
                       ;; (if (= "longPress" interaction)
                       ;;   (state/pub-event! [:mobile/start-audio-record])
                       ;;   (editor-handler/show-quick-add))
        nil)))
   (add-search-listener!
    (fn [q]
      ;; wire up search handler
      (js/console.log "Native search query" q))))

  ;; Update selected icon color according to current theme
  ;; (add-watch state/state
  ;;            :theme-changed
  ;;            (fn [_ _ old new]
  ;;              (when-not (= (:ui/theme old) (:ui/theme new))
  ;;                (configure-tabs (:ui/theme new) true))))
  )

(defn hide!
  []
  nil
  ;; (when (mobile-util/native-ios?)
  ;;   (.hide ^js TabsBar))
  )

(defn show!
  []
  nil
  ;; (when (mobile-util/native-ios?)
  ;;   (.show ^js TabsBar))
  )
