(ns electron.core
  (:require [electron.handler :as handler]
            [electron.updater :refer [init-updater]]
            [electron.utils :refer [mac? win32? prod? dev? log]]
            ["fs" :as fs]
            ["path" :as path]
            ["electron" :refer [BrowserWindow app] :as electron]))

(def ROOT_PATH (path/join js/__dirname ".."))
(def MAIN_WINDOW_ENTRY (str "file://" (path/join js/__dirname (if dev? "dev.html" "index.html"))))

(def ^:dynamic *setup-fn* nil)
(def ^:dynamic *teardown-fn* nil)
(def ^:dynamic *teardown-updater* nil)

;; Handle creating/removing shortcuts on Windows when installing/uninstalling.
(when (js/require "electron-squirrel-startup") (.quit app))

(defn create-main-window
  "create main app window"
  []
  (let [win-opts {:width  980
                  :height 700
                  :webPreferences
                  {:nodeIntegration         false
                   :nodeIntegrationInWorker false
                   :contextIsolation        true
                   :preload                 (path/join js/__dirname "js/preload.js")}}
        url MAIN_WINDOW_ENTRY
        win (BrowserWindow. (clj->js win-opts))]
    (.loadURL win url)
    (when dev? (.. win -webContents (openDevTools)))
    win))

(defn setup-updater! [^js win]
  (.. log (info (str "Logseq App(" (.getVersion app) ") Starting... ")))

  ;; manual updater
  (set! *teardown-updater*
        (init-updater {:repo   "logseq/logseq"
                       :logger log
                       :win    win})))

(defn main
  []
  (.on app "window-all-closed" #(when-not mac? (.quit app)))
  (.on app "ready"
       (fn []
         (let [^js win (create-main-window)
               *win (atom win)
               *quitting? (atom false)]

           (set! *setup-fn*
                 (fn []
                   ;; updater
                   (setup-updater! win)

                   ;; handler
                   (handler/set-ipc-handler! win)

                   ;; teardown
                   #(do
                      (when *teardown-updater* (*teardown-updater*)))))

           ;; setup effects
           (*setup-fn*)

           ;; main window events
           (.on win "close" #(if (or @*quitting? win32?)
                               (reset! *win nil)
                               (do (.preventDefault ^js/Event %)
                                   (.hide win))))
           (.on app "before-quit" #(reset! *quitting? true))
           (.on app "activate" #(if @*win (.show win)))))))

(defn start []
  (js/console.log "Main - start")
  (when *setup-fn* (*setup-fn*)))

(defn stop []
  (js/console.log "Main - stop")
  (when *teardown-fn* (*teardown-fn*)))
