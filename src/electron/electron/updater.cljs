(ns electron.updater
  (:require [cljs-bean.core :as bean]
            [electron.configs :as cfgs]
            [electron.logger :as logger]
            [electron.utils :refer [*win prod?]]
            [frontend.version :refer [version]]
            ["electron" :refer [ipcMain]]))

;; electron-updater is loaded when the updater is set up, after the window
;; is created: at main process start it took about 115 ms of every open
(defn- auto-updater ^js [] (.-autoUpdater (js/require "electron-updater")))

(def *update-pending (atom nil))
(def *downloaded-update (atom nil))
(def debug (partial logger/debug "[updater]"))
(def electron-version version)

(defn- updater-channel
  []
  (let [platform (.-platform js/process)
        arch (.-arch js/process)]
    (case platform
      "win32" (when (#{"x64" "arm64"} arch)
                (str "latest-" arch))
      "darwin" (when (#{"x64" "arm64"} arch)
                 (str "latest-" arch))
      nil)))

(defn- emit-update!
  [^js win type payload]
  (when-let [web-contents (and win (. ^js win -webContents))]
    (.send web-contents "updates-callback"
           (bean/->js {:type type :payload payload}))))

(defn- emit-completed!
  [^js win]
  (emit-update! win "completed" nil))

(defn- normalize-payload
  [payload]
  (when payload
    (bean/->clj payload)))

(defn- normalize-error
  [^js e]
  {:message (or (.-message e) (str e))})

(defn- emit-update-downloaded!
  [payload]
  (when-let [web-contents (and @*win (. ^js @*win -webContents))]
    (.send web-contents "auto-updater-downloaded" (bean/->js payload))))

(defn- configure-auto-updater!
  []
  (let [channel (updater-channel)]
    (when channel
      (set! (.-channel (auto-updater)) channel)
      ;; Keep the original downgrade policy even though setting channel flips it on.
      (set! (.-allowDowngrade (auto-updater)) false))
    (debug "configure-auto-updater" {:platform (.-platform js/process)
                                     :arch (.-arch js/process)
                                     :channel channel}))
  (set! (.-autoInstallOnAppQuit (auto-updater)) false)
  (set! (.-autoDownload (auto-updater)) false))

(defn- register-auto-updater-listeners!
  [^js win]
  (let [checking-handler
        (fn []
          (emit-update! win "checking-for-update" nil))

        available-handler
        (fn [info]
          (emit-update! win "update-available" (normalize-payload info)))

        not-available-handler
        (fn [info]
          (emit-update! win "update-not-available" (normalize-payload info))
          (emit-completed! win))

        progress-handler
        (fn [progress]
          (emit-update! win "download-progress" (normalize-payload progress)))

        downloaded-handler
        (fn [info]
          (let [payload (normalize-payload info)]
            (reset! *downloaded-update payload)
            (logger/info "[update-downloaded]" payload)
            (emit-update! win "update-downloaded" payload)
            (emit-update-downloaded! payload)
            (emit-completed! win)))

        error-handler
        (fn [error]
          (logger/warn "[updater/error]" error)
          (emit-update! win "error" (normalize-error error))
          (emit-completed! win))]
    (doto (auto-updater)
      (.on "checking-for-update" checking-handler)
      (.on "update-available" available-handler)
      (.on "update-not-available" not-available-handler)
      (.on "download-progress" progress-handler)
      (.on "update-downloaded" downloaded-handler)
      (.on "error" error-handler))
    #(doto (auto-updater)
       (.off "checking-for-update" checking-handler)
       (.off "update-available" available-handler)
       (.off "update-not-available" not-available-handler)
       (.off "download-progress" progress-handler)
       (.off "update-downloaded" downloaded-handler)
       (.off "error" error-handler))))

(defn- <check-for-updates!
  [^js win auto-download?]
  (debug "check-for-updates" {:auto-download? auto-download?})
  (set! (.-autoDownload (auto-updater)) auto-download?)
  (-> (.checkForUpdates (auto-updater))
      (.then
       (fn [_]
         ;; Manual checks without auto download need an explicit terminal event.
         (when-not auto-download?
           (emit-completed! win))))
      (.catch
       (fn [error]
         (logger/warn "[updater/check]" error)
         (emit-update! win "error" (normalize-error error))
         (emit-completed! win)))))

(defn- init-auto-updater!
  [^js win]
  (when (and prod? (not= false (cfgs/get-item :auto-update)))
    (debug "init-auto-updater")
    (set! (.-autoDownload (auto-updater)) true)
    (-> (.checkForUpdates (auto-updater))
        (.catch (fn [error]
                  (logger/warn "[updater/auto-check]" error)
                  (emit-update! win "error" (normalize-error error))
                  (emit-completed! win))))))

(defn init-updater
  [{:keys [^js win] :as _opts}]
  (configure-auto-updater!)
  (let [dispose-listeners! (register-auto-updater-listeners! win)
        check-channel "check-for-updates"
        install-channel "install-updates"
        get-downloaded-channel "get-downloaded-update"
        check-listener (fn [_e & args]
                         (when-not @*update-pending
                           (reset! *update-pending true)
                           (let [auto-download? (true? (first args))]
                             (-> (<check-for-updates! win auto-download?)
                                 (.finally #(reset! *update-pending nil))))))
        install-listener (fn [_e _quit-app?]
                           (.quitAndInstall (auto-updater) false true))
        get-downloaded-listener (fn [_e]
                                  (some-> @*downloaded-update bean/->js))]
    (init-auto-updater! win)
    (.handle ipcMain check-channel check-listener)
    (.handle ipcMain install-channel install-listener)
    (.handle ipcMain get-downloaded-channel get-downloaded-listener)
    #(do
       (dispose-listeners!)
       (.removeHandler ipcMain install-channel)
       (.removeHandler ipcMain check-channel)
       (.removeHandler ipcMain get-downloaded-channel)
       (reset! *update-pending nil))))
