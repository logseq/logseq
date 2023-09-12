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

;; Append a switch to disable site isolation trials
(.appendSwitch app.commandLine "disable-site-isolation-trials")

;; Set webPreferences to disable web security
(let [web-prefs
      {:webSecurity false}]
  (set! (.-webPreferences electron.BrowserWindow) web-prefs))


(def MAIN_WINDOW_ENTRY (if dev?
                         ;;"http://localhost:3001"
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
  ;; Insert your JavaScript code here
  (js/const cookie {:url "http://music.163.com" :name "MUSIC_U" :value "00CB6384E7488C73935F0A453866798E06119587F495AB73989B551B1A708C7FC99A348BE1F43A5A48D082F7F593A7942C9CB8BDC7C263D7555BA46C95314D91CD852B7D6213A6E61B1A9899AF0015E7E501D88DADEDA5358A12AD74AD42A24F405C73B7665B9940D2A12139CF39E8ADF09455B55AF13E8E24B3DB1945379D5D48C8FAC8272A2241A5857AFAB0A1E4A739E0E48AE1B7326D26416079D1A0CBE36B1FED9BA035EB743CAC5AF2F169DADE043283DDB5D5C291DAB8CB28F660629DF163F245A8E6E3A18372B18367D0FDA3A291DC525A26309DB7675D51596C9E57F5D8307912561DFA2BFF14F1EB2D15B7DCA48C57CBD47F9E11BC33060B36B473B1C40DBADD1546B612A7A97D1D2CAD3F4FDE1055991A5BE3F6E5A8512B23D75D598551F79917681DA1EE7664899EE6CE8CE9FDCDF4375D406DB852234CB3AB43FD8947176E330C999CC36EA81EB8E14E63"})
  (js/.then (.set (.-cookies (.-defaultSession session)) cookie)
           (fn [] (println "Success")))
  (js/.catch
  (.console.error js/console)
  (fn [error] (.error js/console error)))
  ))

  
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
