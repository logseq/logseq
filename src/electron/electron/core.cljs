(ns electron.core
  (:require [electron.init :refer [init-channel]]
            ["fs" :as fs]
            ["path" :as path]
            ["electron" :refer [BrowserWindow app] :as electron]
            ["electron-updater" :refer [autoUpdater]]))

(defonce mac? (= (.-platform js/process) "darwin"))
(defonce win32? (= (.-platform js/process) "win32"))

(defonce prod? (= js/process.env.NODE_ENV "production"))
(defonce dev? (not prod?))
(defonce log (js/require "electron-log"))

(def ROOT_PATH (path/join js/__dirname ".."))
(def MAIN_WINDOW_ENTRY (str "file://" (path/join js/__dirname (if dev? "dev.html" "index.html"))))

;; Handle creating/removing shortcuts on Windows when installing/uninstalling.
(when (js/require "electron-squirrel-startup") (.quit app))

(defn create-main-window
  "create main app window"
  []
  (let [win-opts {:width  980
                  :height 700
                  :webPreferences
                  {:nodeIntegration true            ;; FIXME
}}
        url MAIN_WINDOW_ENTRY
        win (BrowserWindow. (clj->js win-opts))]
    (.loadURL win url)
    (when dev? (.. win -webContents (openDevTools)))
    win))

(defn setup-updater! [notify-update-status]
  ;; updater logging
  (set! (.. autoUpdater -logger) log)
  (set! (.. autoUpdater -logger -transports -file -level) "info")

  (.. log (info (str "Logseq App(" (.getVersion app) ") Starting... ")))

  (let [init-updater (js/require "update-electron-app")]
    (init-updater #js {:repo           "logseq/logseq"
                       :updateInterval "1 hour"
                       :logger         log}))
  ;;; updater hooks
  ;(doto autoUpdater
  ;  (.on "checking-for-update" #(notify-update-status "checking for updating..."))
  ;  (.on "update-not-available" #(notify-update-status "update not available"))
  ;  (.on "error" #(notify-update-status %))
  ;  (.on "download-progress"
  ;       #(let [progress-clj (js->clj %)
  ;              {:keys [percent transferred total]} progress-clj
  ;              msg (str "Progress Downloaded " percent "%"
  ;                       " (" transferred "/" total ")")]
  ;          (notify-update-status msg)))
  ;  (.on "update-downloaded" #(do (notify-update-status "update downloaded")
  ;                                (.. autoUpdater quitAndInstall)))
  ;  (.checkForUpdatesAndNotify))
)

(defn main
  []
  (.on app "window-all-closed" #(when-not mac? (.quit app)))
  (.on app "ready"
       (fn []
         (let [^js win (create-main-window)
               *win (atom win)
               *quitting? (atom false)]

           ;; auto updater
           (setup-updater! nil)

           ;; init stuffs
           (init-channel win)

           ;; main window events
           (.on win "close" #(if (or @*quitting? win32?)
                               (reset! *win nil)
                               (do (.preventDefault ^js/Event %)
                                   (.hide win))))
           (.on app "before-quit" #(reset! *quitting? true))
           (.on app "activate" #(if @*win (.show win)))))))

(defn start []
  (js/console.log "Main - start"))

(defn stop []
  (js/console.log "Main - stop"))
