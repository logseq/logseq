(ns electron.core
  (:require [electron.handler :as handler]
            [electron.updater :refer [init-updater]]
            [electron.utils :refer [mac? win32? prod? dev? logger open]]
            [clojure.string :as string]
            ["fs" :as fs]
            ["path" :as path]
            ["electron" :refer [BrowserWindow app protocol ipcMain] :as electron]))

(def ROOT_PATH (path/join js/__dirname ".."))
(def MAIN_WINDOW_ENTRY (str "file://" (path/join js/__dirname (if dev? "electron-dev.html" "electron.html"))))

(defonce *setup-fn (volatile! nil))
(defonce *teardown-fn (volatile! nil))

;; Handle creating/removing shortcuts on Windows when installing/uninstalling.
;(when (js/require "electron-squirrel-startup") (.quit app))

(defn create-main-window
  "create main app window"
  []
  (let [win-opts {:width         980
                  :height        700
                  :frame         win32?
                  :autoHideMenuBar win32?
                  :titleBarStyle (if mac? "hidden" nil)
                  :webPreferences
                  {:nodeIntegration         false
                   :nodeIntegrationInWorker false
                   :contextIsolation        true
                   :spellcheck              true
                   :preload                 (path/join js/__dirname "js/preload.js")}}
        url MAIN_WINDOW_ENTRY
        win (BrowserWindow. (clj->js win-opts))]
    (.loadURL win url)
    (when dev? (.. win -webContents (openDevTools)))
    win))

(defn setup-updater! [^js win]
  ;; manual updater
  (init-updater {:repo   "logseq/logseq"
                 :logger logger
                 :win    win}))

(defn setup-interceptor! []
  (.registerFileProtocol
   protocol "assets"
   (fn [^js request callback]
     (let [url (.-url request)
           path (string/replace url "assets://" "")
           path (js/decodeURIComponent path)]
       (callback #js {:path path}))))
  #(.unregisterProtocol protocol "assets"))

(defn setup-app-manager!
  [^js win]
  (let [toggle-win-channel "toggle-max-or-min-active-win"
        call-app-channel "call-application"
        web-contents (. win -webContents)]
    (doto ipcMain
      (.handle toggle-win-channel
               (fn [_ toggle-min?]
                 (when-let [active-win (.getFocusedWindow BrowserWindow)]
                   (if toggle-min?
                     (if (.isMinimized active-win)
                       (.restore active-win)
                       (.minimize active-win))
                     (if (.isMaximized active-win)
                       (.unmaximize active-win)
                       (.maximize active-win))))))
      (.handle call-app-channel
               (fn [_ type & args]
                 (try
                   (js-invoke app type args)
                   (catch js/Error e
                     (js/console.error e))))))

    (.on web-contents  "new-window"
         (fn [e url]
           (.. logger (info "new-window" url))
           (open url)
           (.preventDefault e)))

    (doto win
      (.on "enter-full-screen" #(.send web-contents "full-screen" "enter"))
      (.on "leave-full-screen" #(.send web-contents "full-screen" "leave")))

    #(do (.removeHandler ipcMain toggle-win-channel)
         (.removeHandler ipcMain call-app-channel))))

(defn main
  []
  (.on app "window-all-closed" #(when-not mac? (.quit app)))
  (.on app "ready"
       (fn []
         (let [^js win (create-main-window)
               *win (atom win)
               *quitting? (atom false)]

           (.. logger (info (str "Logseq App(" (.getVersion app) ") Starting... ")))

           (vreset! *setup-fn
                    (fn []
                      (let [t0 (setup-updater! win)
                            t1 (setup-interceptor!)
                            t2 (setup-app-manager! win)
                            tt (handler/set-ipc-handler! win)]

                        (vreset! *teardown-fn
                                 #(doseq [f [t0 t1 t2 tt]]
                                    (and f (f)))))))

           ;; setup effects
           (@*setup-fn)

           ;; main window events
           (.on win "close" #(if (or @*quitting? (not mac?))
                               (reset! *win nil)
                               (do (.preventDefault ^js/Event %)
                                   (.hide win))))
           (.on app "before-quit" #(reset! *quitting? true))
           (.on app "activate" #(if @*win (.show win)))))))

(defn start []
  (js/console.log "Main - start")
  (when @*setup-fn (@*setup-fn)))

(defn stop []
  (js/console.log "Main - stop")
  (when @*teardown-fn (@*teardown-fn)))
