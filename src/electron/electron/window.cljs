(ns electron.window
  (:require ["electron-window-state" :as windowStateKeeper]
            [electron.utils :refer [mac? win32? linux? dev? open] :as utils]
            [electron.configs :as cfgs]
            [electron.context-menu :as context-menu]
            [electron.logger :as logger]
            ["electron" :refer [BrowserWindow app session shell] :as electron]
            ["path" :as node-path]
            ["url" :as URL]
            [electron.state :as state]
            [cljs-bean.core :as bean]
            [clojure.core.async :as async]
            [clojure.string :as string]))

(defonce *quitting? (atom false))

(def MAIN_WINDOW_ENTRY (if dev?
                         ;"http://localhost:3001"
                         (str "file://" (node-path/join js/__dirname "index.html"))
                         (str "file://" (node-path/join js/__dirname "electron.html"))))

(defn create-main-window!
  ([]
   (create-main-window! MAIN_WINDOW_ENTRY nil))
  ([url]
   (create-main-window! url nil))
  ([url opts]
   (let [win-state (windowStateKeeper (clj->js {:defaultWidth 980 :defaultHeight 700}))
         native-titlebar? (cfgs/get-item :window/native-titlebar?)
         win-opts  (cond->
                     {:backgroundColor      "#fff" ; SEE https://www.electronjs.org/docs/latest/faq#the-font-looks-blurry-what-is-this-and-what-can-i-do
                      :width                (.-width win-state)
                      :height               (.-height win-state)
                      :frame                (or mac? native-titlebar?)
                      :titleBarStyle        "hiddenInset"
                      :trafficLightPosition {:x 16 :y 16}
                      :autoHideMenuBar      (not mac?)
                      :show                 false
                      :webPreferences
                      {:plugins                 true        ; pdf
                       :nodeIntegration         false
                       :nodeIntegrationInWorker false
                       :nativeWindowOpen        true
                       :sandbox                 false
                       :webSecurity             (not dev?)
                       :contextIsolation        true
                       :spellcheck              ((fnil identity true) (cfgs/get-item :spell-check))
                       ;; Remove OverlayScrollbars and transition `.scrollbar-spacing`
                       ;; to use `scollbar-gutter` after the feature is implemented in browsers.
                       :enableBlinkFeatures     'OverlayScrollbars'
                       :preload                 (node-path/join js/__dirname "js/preload.js")}}

                     (seq opts)
                     (merge opts)

                     linux?
                     (assoc :icon (node-path/join js/__dirname "icons/logseq.png")))
         win       (BrowserWindow. (clj->js win-opts))]
     (.onBeforeSendHeaders (.. session -defaultSession -webRequest)
                           (clj->js {:urls (array "*://*.youtube.com/*")})
                           (fn [^js details callback]
                             (let [url            (.-url details)
                                   urlObj         (js/URL. url)
                                   origin         (.-origin urlObj)
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

(defn get-all-windows
  []
  (.getAllWindows BrowserWindow))

(defn destroy-window!
  [^js win]
  (.destroy win))

(defn close-handler
  [^js win close-watcher-f e]
  (.preventDefault e)
  (when-let [dir (state/get-window-graph-path win)]
    (close-watcher-f win dir))
  (state/close-window! win)
  (let [web-contents (. win -webContents)]
    (.send web-contents "persist-zoom-level" (.getZoomLevel web-contents))
    (.send web-contents "persistent-dbs"))
  (async/go
    (let [_ (async/<! state/persistent-dbs-chan)]
      (destroy-window! win)
      ;; (if @*quitting?
      ;;   (doseq [win (get-all-windows)]
      ;;     (destroy-window! win))
      ;;   (destroy-window! win))
      (when @*quitting?
        (async/put! state/persistent-dbs-chan true)))))

(defn on-close-actions!
  ;; TODO merge with the on close in core
  [^js win close-watcher-f] ;; injected watcher related func
  (.on win "close" (fn [e] (close-handler win close-watcher-f e))))

(defn switch-to-window!
  [^js win]
  (when (.isMinimized ^object win)
    (.restore win))
  ;; Ref: https://github.com/electron/electron/issues/8734
  (.setVisibleOnAllWorkspaces win true)
  (.focus win)
  (.setVisibleOnAllWorkspaces win false))

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
          open-external!
          (fn [url]
            (let [url (if (string/starts-with? url "file:")
                        (utils/safe-decode-uri-component url) url)
                  url (if-not win32? (string/replace url "file://" "") url)]
              (logger/info "new-window" url)
              (if (some #(string/includes?
                          (.normalize node-path url)
                          (.join node-path (. app getAppPath) %))
                        ["index.html" "electron.html"])
                (logger/info "pass-window" url)
                (open-default-app! url open))))

          will-navigate-handler
          (fn [e url]
            (.preventDefault e)
            (open-default-app! url open))

          context-menu-handler
          (context-menu/setup-context-menu! win)

          window-open-handler
          (fn [^js details]
            (let [url         (.-url details)
                  fullscreen? (.isFullScreen win)
                  features    (string/split (.-features details) ",")
                  features    (when (seq features)
                                (reduce (fn [a b]
                                          (let [[k v] (string/split b "=")]
                                            (if (string? v)
                                              (assoc a (keyword k) (parse-long (string/trim v)))
                                              a))) {} features))]
              (-> (if (= url "about:blank")
                    (merge {:action "allow"
                            :overrideBrowserWindowOptions
                            {:frame                true
                             :titleBarStyle        "default"
                             :trafficLightPosition {:x 16 :y 16}
                             :autoHideMenuBar      (not mac?)
                             :fullscreenable       (not fullscreen?)
                             :webPreferences
                             {:plugins          true
                              :nodeIntegration  false
                              :webSecurity      (not dev?)
                              :preload          (node-path/join js/__dirname "js/preload.js")
                              :nativeWindowOpen true}}}
                           features)
                    (do (open-external! url) {:action "deny"}))
                  (bean/->js))))]

      (doto web-contents
        (.on "will-navigate" will-navigate-handler)
        (.on "did-start-navigation" #(.send web-contents "persist-zoom-level" (.getZoomLevel web-contents)))
        (.on "page-title-updated" #(.send web-contents "restore-zoom-level"))
        (.setWindowOpenHandler window-open-handler))

      (doto win
        (.on "enter-full-screen" #(.send web-contents "full-screen" "enter"))
        (.on "leave-full-screen" #(.send web-contents "full-screen" "leave"))
        (.on "maximize" #(.send web-contents "maximize" true))
        (.on "unmaximize" #(.send web-contents "maximize" false)))

      ;; clear
      (fn []
        (doto web-contents
          (.off "context-menu" context-menu-handler)
          (.off "will-navigate" will-navigate-handler))

        (.off win "enter-full-screen")
        (.off win "leave-full-screen")))
    #()))
