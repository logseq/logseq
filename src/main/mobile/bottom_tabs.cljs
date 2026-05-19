(ns mobile.bottom-tabs
  "Native bottom tabs"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.db-based.sync :as rtc-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [mobile.navigation :as mobile-nav]
            [mobile.search :as mobile-search]
            [mobile.state :as mobile-state]
            [mobile.tabs :as mobile-tabs]
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

(defn update-native-graphs!
  "Send native graph list to the iOS plugin."
  [payload]
  (when (and (mobile-util/native-ios?) liquid-tabs (.-updateNativeGraphs liquid-tabs))
    (.updateNativeGraphs liquid-tabs (clj->js payload))))

(defn mark-tab-content-ready!
  [id]
  (when (and (mobile-util/native-ios?) liquid-tabs (.-markTabContentReady liquid-tabs))
    (.markTabContentReady liquid-tabs #js {:id id})))

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
     (fn [^js data]
       (when-let [id (.-id data)]
         (when-not (string/blank? id)
           (let [native-push? (not= false (.-nativePush data))]
             (route-handler/redirect-to-page! id {:push (and native-push?
                                                              (mobile-util/native-platform?))}))))))))

(defn- repo-by-url
  [url]
  (some #(when (= url (:url %)) %) (state/get-repos)))

(defn- delete-local-graph!
  [url]
  (when-let [repo (repo-by-url url)]
    (repo-handler/remove-repo! repo)))

(defn- refresh-remote-graphs!
  []
  (state/set-state! :rtc/loading-graphs? true)
  (-> (rtc-handler/<get-remote-graphs)
      (p/finally
       (fn []
         (state/set-state! :rtc/loading-graphs? false)))))

(defn- delete-remote-graph!
  [url graph-uuid graph-schema-version]
  (state/set-state! :rtc/loading-graphs? true)
  (-> (p/do!
       (when (= (state/get-current-repo) url)
         (state/<invoke-db-worker :thread-api/rtc-stop))
       (rtc-handler/<rtc-delete-graph! graph-uuid graph-schema-version)
       (rtc-handler/<get-remote-graphs))
      (p/finally
       (fn []
         (state/set-state! :rtc/loading-graphs? false)))))

(defn- leave-remote-graph!
  [url graph-uuid]
  (state/set-state! :rtc/loading-graphs? true)
  (-> (p/do!
       (when (= (state/get-current-repo) url)
         (state/<invoke-db-worker :thread-api/rtc-stop))
       (rtc-handler/<rtc-leave-graph! graph-uuid))
      (p/then
       (fn []
         (notification/show! (t :graph/left) :success)
         (rtc-handler/<get-remote-graphs)))
      (p/catch
       (fn [e]
         (notification/show! (t :graph/leave-error) :error)
         (log/error :db-sync/leave-graph-failed
                    {:error e
                     :graph-uuid graph-uuid})))
      (p/finally
       (fn []
         (state/set-state! :rtc/loading-graphs? false)))))

(defn add-graph-action-listener!
  []
  (when (and (mobile-util/native-ios?) liquid-tabs)
    (.addListener
     liquid-tabs
     "nativeGraphAction"
     (fn [^js data]
       (case (.-action data)
         "open"
         (when-let [url (.-url data)]
           (when-not (string/blank? url)
             (state/pub-event! [:graph/switch url])))

         "download"
         (let [graph-name (.-graphName data)
               graph-uuid (.-graphUUID data)
               graph-schema-version (.-graphSchemaVersion data)]
           (when (and (not (string/blank? graph-name))
                      (not (string/blank? graph-uuid))
                      (not (string/blank? graph-schema-version)))
             (state/pub-event!
              [:rtc/download-remote-graph
               graph-name
               graph-uuid
               graph-schema-version
               (boolean (.-graphE2ee data))])))

         "refresh"
         (refresh-remote-graphs!)

         "deleteLocal"
         (when-let [url (.-url data)]
           (when-not (string/blank? url)
             (delete-local-graph! url)))

         "deleteRemote"
         (let [url (.-url data)
               graph-uuid (.-graphUUID data)
               graph-schema-version (.-graphSchemaVersion data)]
           (when (and (not (string/blank? graph-uuid))
                      (not (string/blank? graph-schema-version)))
             (delete-remote-graph! url graph-uuid graph-schema-version)))

         "leaveRemote"
         (let [url (.-url data)
               graph-uuid (.-graphUUID data)]
           (when-not (string/blank? graph-uuid)
             (leave-remote-graph! url graph-uuid)))

         nil)))))

(defn add-keyboard-hack-listener!
  "Listen for Backspace or Enter forwarded by the native iOS webview key bridge."
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
           (and reselected?
                (= @*current-tab tab))
           (do
             (when (mobile-util/native-platform?)
               (mobile-nav/pop-to-root! tab))
             (mobile-state/set-tab! tab)
             (when (= "home" tab)
               (util/scroll-to-top false)))

           (not= @*current-tab tab)
           (do
             (reset! *current-tab tab)
             (mobile-state/set-tab! tab))

           (= @*current-tab tab "home")
           (util/scroll-to-top false))))

      (add-watch mobile-state/*tab ::select-tab
                 (fn [_ _ _old new]
                   (when (and new (not= @*current-tab new))
                     (reset! *current-tab new)
                     (select! new)))))

    (add-search-listener!
     (fn [q]
       (reset! mobile-state/*search-input q)
       (p/let [result (mobile-search/search q)]
         (update-native-search-results! result))))
    (add-search-result-item-listener!)
    (add-graph-action-listener!)
    (add-keyboard-hack-listener!)))

(defn- translated-tab
  [tab]
  (-> tab
      (assoc :title (t (:title-key tab)))
      (dissoc :title-key)))

(defn selected-tab-ids
  []
  (mobile-tabs/selected-tab-ids
   (storage/get :ls-mobile-tabs)
   {:flashcards? (state/enable-flashcards?)}
   (mobile-tabs/max-main-tabs (mobile-util/native-iphone?))))

(defn configure
  []
  (let [tabs (->> (mobile-tabs/tab-configs
                   (storage/get :ls-mobile-tabs)
                   {:flashcards? (state/enable-flashcards?)}
                   (mobile-tabs/max-main-tabs (mobile-util/native-iphone?)))
                  (mapv translated-tab))]
    (configure-tabs
     (cond-> tabs
       (mobile-util/native-android?)
       (conj {:id "search"
              :title (t :nav/search)
              :systemImage "search"
              :role "search"})))))
