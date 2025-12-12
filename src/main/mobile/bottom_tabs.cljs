(ns mobile.bottom-tabs
  "Native bottom tabs"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.route :as route-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [mobile.navigation :as mobile-nav]
            [mobile.search :as mobile-search]
            [mobile.state :as mobile-state]
            [promesa.core :as p]))

;; Capacitor plugin instance (nil if native side hasn't shipped it yet).
(def ^js liquid-tabs
  (.. js/Capacitor -Plugins -LiquidTabsPlugin))

(defn configure-tabs
  "Configure the native tab bar.

   `tabs` is a vector of maps:
   [{:id \"home\"   :title \"Home\"   :system-image \"house\"   :role \"normal\"}
    {:id \"search\" :title \"Search\" :system-image \"magnifyingglass\" :role \"search\"}]"
  [tabs]
  (when liquid-tabs
    ;; Returns the underlying JS Promise from Capacitor
    (.configureTabs
     liquid-tabs
     (bean/->js {:tabs tabs}))))

(defn select!
  "Programmatically select a tab by id. Returns a JS Promise."
  [id]
  (when liquid-tabs
    (.selectTab
     liquid-tabs
     #js {:id id})))

(defn update-native-search-results!
  "Send native search result list to the iOS plugin."
  [results]
  (when (and (util/capacitor?) liquid-tabs (.-updateNativeSearchResults liquid-tabs))
    (.updateNativeSearchResults liquid-tabs (clj->js {:results results}))))

(defn add-tab-selected-listener!
  "Listen to native tab selection.

   `f` receives the tab id string and a boolean indicating reselect.
   Returns the Capacitor listener handle; call `(.remove handle)` to unsubscribe."
  [f]
  (when (and (util/capacitor?) liquid-tabs)
    (.addListener
     liquid-tabs
     "tabSelected"
     (fn [^js data]
      ;; data is like { id: string, reselected?: boolean }
       (when-let [id (.-id data)]
         (f id (boolean (.-reselected data))))))))

(defn add-search-listener!
  "Listen to native search query changes from the SwiftUI search tab.

   `f` receives a query string.
   Returns the Capacitor listener handle; call `(.remove handle)` to unsubscribe."
  [f]
  (when (and (util/capacitor?) liquid-tabs)
    (.addListener
     liquid-tabs
     "searchChanged"
     (fn [data]
         ;; data is like { query: string }
       (f (.-query data))))))

(defn add-search-result-item-listener!
  []
  (when (and (util/capacitor?) liquid-tabs)
    (.addListener
     liquid-tabs
     "openSearchResultBlock"
     (fn [data]
       (when-let [id (.-id data)]
         (when-not (string/blank? id)
           (route-handler/redirect-to-page! id {:push (mobile-util/native-android?)})))))))

(defn add-keyboard-hack-listener!
  "Listen for Backspace or Enter while the invisible keyboard field is focused."
  []
  (when (and (util/capacitor?) liquid-tabs)
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
           nil))))))

(defonce add-tab-listeners!
  (when (and (util/capacitor?) liquid-tabs)
    (let [*current-tab (atom nil)]
      (add-tab-selected-listener!
       (fn [tab reselected?]
         (cond
           reselected?
           (do
             (mobile-nav/pop-to-root! tab)
             (mobile-state/set-tab! tab)
             (when (= "home" tab)
               (util/scroll-to-top false)))

           (not= @*current-tab tab)
           (do
             (reset! *current-tab tab)
             (mobile-state/set-tab! tab)
             (when (= "home" tab)
               (util/scroll-to-top false))))))

      (add-watch mobile-state/*tab ::select-tab
                 (fn [_ _ _old new]
                   (when (and new (not= @*current-tab new))
                     (reset! *current-tab new)
                     (select! new)))))

    (add-search-listener!
     (fn [q]
       ;; wire up search handler
       (js/console.log "Native search query" q)
       (reset! mobile-state/*search-input q)
       (p/let [result (mobile-search/search q)]
         (update-native-search-results! result))))
    (add-search-result-item-listener!)
    (add-keyboard-hack-listener!)))

(defn configure
  []
  (configure-tabs
   (cond->
    [{:id "home"
      :title "Home"
      :systemImage "house"
      :role "normal"}
     {:id "graphs"
      :title "Graphs"
      :systemImage "app.background.dotted"
      :role "normal"}
     {:id "capture"
      :title "Capture"
      :systemImage "tray"
      :role "normal"}
     {:id "go to"
      :title "Go To"
      :systemImage "square.stack.3d.down.right"
      :role "normal"}]
     (mobile-util/native-android?)
     (conj {:id "search"
            :title "Search"
            :systemImage "search"
            :role "search"}))))
