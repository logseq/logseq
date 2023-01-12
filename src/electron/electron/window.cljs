(ns electron.window
  (:require ["electron-window-state" :as windowStateKeeper]
            [electron.utils :refer [mac? win32? linux? dev? open] :as utils]
            [electron.configs :as cfgs]
            [electron.context-menu :as context-menu]
            [electron.logger :as logger]
            ["electron" :refer [BrowserWindow app session shell] :as electron]
            ["path" :as path]
            ["url" :as URL]
            [electron.state :as state]
            [clojure.core.async :as async]
            [clojure.string :as string]))

(defonce *quitting? (atom false))

(def MAIN_WINDOW_ENTRY (if dev?
                         ;;"http://localhost:3001"
                         (str "file://" (path/join js/__dirname "index.html"))
                         (str "file://" (path/join js/__dirname "electron.html"))))

(defn create-main-window
  ([]
   (create-main-window MAIN_WINDOW_ENTRY))
  ([url]
   (let [win-state (windowStateKeeper (clj->js {:defaultWidth 980 :defaultHeight 700}))
         win-opts (cond->
                    {:width                (.-width win-state)
                     :height               (.-height win-state)
                     :frame                true
                     :titleBarStyle        "hiddenInset"
                     :trafficLightPosition {:x 16 :y 16}
                     :autoHideMenuBar      (not mac?)
                     :webPreferences
                     {:plugins                 true ; pdf
                      :nodeIntegration         false
                      :nodeIntegrationInWorker false
                      :sandbox                 false
                      :webSecurity             (not dev?)
                      :contextIsolation        true
                      :spellcheck              ((fnil identity true) (cfgs/get-item :spell-check))
                      ;; Remove OverlayScrollbars and transition `.scrollbar-spacing`
                      ;; to use `scollbar-gutter` after the feature is implemented in browsers.
                      :enableBlinkFeatures     'OverlayScrollbars'
                      :preload                 (path/join js/__dirname "js/preload.js")}}
                    linux?
                    (assoc :icon (path/join js/__dirname "icons/logseq.png")))
         win (BrowserWindow. (clj->js win-opts))]
     (.manage win-state win)
     (.onBeforeSendHeaders (.. session -defaultSession -webRequest)
                           (clj->js {:urls (array "*://*.youtube.com/*")})
                           (fn [^js details callback]
                             (let [url (.-url details)
                                   urlObj (js/URL. url)
                                   origin (.-origin urlObj)
                                   requestHeaders (.-requestHeaders details)]
                               (if (and
                                     (.hasOwnProperty requestHeaders "referer")
                                     (not-empty (.-referer requestHeaders)))
                                 (callback #js {:cancel         false
                                                :requestHeaders requestHeaders})
                                 (do
                                   (set! (.-referer requestHeaders) origin)
                                   (callback #js {:cancel         false
                                                  :requestHeaders requestHeaders}))))))
     (.loadURL win url)
     ;;(when dev? (.. win -webContents (openDevTools)))
     win)))

(defn destroy-window!
  [^js win]
  (.destroy win))

(defn on-close-actions!
  ;; TODO merge with the on close in core
  [^js win close-watcher-f] ;; injected watcher related func
  (.on win "close" (fn [e]
                     (.preventDefault e)
                     (when-let [dir (state/get-window-graph-path win)]
                       (close-watcher-f win dir))
                     (state/close-window! win)
                     (let [web-contents (. win -webContents)]
                       (.send web-contents "persistent-dbs"))
                     (async/go
                       (let [_ (async/<! state/persistent-dbs-chan)]
                         (destroy-window! win)
                         (when @*quitting?
                           (async/put! state/persistent-dbs-chan true)))))))

(defn switch-to-window!
  [^js win]
  (when (.isMinimized ^object win)
    (.restore win))
  (.focus win))

(defn get-all-windows
  []
  (.getAllWindows BrowserWindow))

(defn get-graph-all-windows
  [graph-path] ;; graph-path == dir
  (->> (group-by second (:window/graph @state/state))
       (#(get % graph-path))
       (map first)))

(defn graph-has-other-windows? [win dir]
  (let [windows (get-graph-all-windows dir)]
        ;; windows (filter #(.isVisible %) windows) ;; for mac .hide windows. such windows should also included
    (boolean (some (fn [^js window] (and (not (.isDestroyed window))
                                         (not= (.-id win) (.-id window))))
                   windows))))

(defn- open-default-app!
  [url default-open]
  (let [URL (.-URL URL)
        parsed-url (try (URL. url) (catch :default _ nil))]
    (if (and parsed-url (contains? #{"https:" "http:" "mailto:"} (.-protocol parsed-url)))
      (.openExternal shell url)
      (when default-open (default-open url)))))

(defn setup-window-listeners!
  [^js win]
  (when win
    (let [web-contents (. win -webContents)
          new-win-handler
          (fn [e url]
            (let [url (if (string/starts-with? url "file:")
                        (utils/safe-decode-uri-component url) url)
                  url (if-not win32? (string/replace url "file://" "") url)]
              (logger/info "new-window" url)
              (if (some #(string/includes?
                          (.normalize path url)
                          (.join path (. app getAppPath) %))
                        ["index.html" "electron.html"])
                (logger/info "pass-window" url)
                (open-default-app! url open)))
            (.preventDefault e))

          will-navigate-handler
          (fn [e url]
            (.preventDefault e)
            (open-default-app! url open))

          context-menu-handler
          (context-menu/setup-context-menu! win)]

      (doto web-contents
        (.on "new-window" new-win-handler)
        (.on "will-navigate" will-navigate-handler)
        (.on "did-start-navigation" #(.send web-contents "persist-zoom-level" (.getZoomLevel web-contents)))
        (.on "page-title-updated" #(.send web-contents "restore-zoom-level")))

      (doto win
        (.on "enter-full-screen" #(.send web-contents "full-screen" "enter"))
        (.on "leave-full-screen" #(.send web-contents "full-screen" "leave")))

      ;; clear
      (fn []
        (doto web-contents
          (.off "context-menu" context-menu-handler)
          (.off "new-window" new-win-handler)
          (.off "will-navigate" will-navigate-handler))

        (.off win "enter-full-screen")
        (.off win "leave-full-screen")))
    #()))
