(ns electron.updater
  (:require [cljs-bean.core :as bean]
            [electron.configs :as cfgs]
            [electron.logger :as logger]
            [electron.utils :refer [*win prod?]]
            [frontend.version :refer [version]]
            ["electron" :refer [ipcMain]]
            ["electron-updater" :refer [autoUpdater]]))

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
      (set! (.-channel autoUpdater) channel)
      ;; Keep the original downgrade policy even though setting channel flips it on.
      (set! (.-allowDowngrade autoUpdater) false))
    (debug "configure-auto-updater" {:platform (.-platform js/process)
                                     :arch (.-arch js/process)
                                     :channel channel}))
  (set! (.-autoInstallOnAppQuit autoUpdater) false)
  (set! (.-autoDownload autoUpdater) false))

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
    (.on autoUpdater "checking-for-update" checking-handler)
    (.on autoUpdater "update-available" available-handler)
    (.on autoUpdater "update-not-available" not-available-handler)
    (.on autoUpdater "download-progress" progress-handler)
    (.on autoUpdater "update-downloaded" downloaded-handler)
    (.on autoUpdater "error" error-handler)
    #(do
       (.off autoUpdater "checking-for-update" checking-handler)
       (.off autoUpdater "update-available" available-handler)
       (.off autoUpdater "update-not-available" not-available-handler)
       (.off autoUpdater "download-progress" progress-handler)
       (.off autoUpdater "update-downloaded" downloaded-handler)
       (.off autoUpdater "error" error-handler))))

(defn- <check-for-updates!
  [^js win auto-download?]
  (debug "check-for-updates" {:auto-download? auto-download?})
  (set! (.-autoDownload autoUpdater) auto-download?)
  (-> (.checkForUpdates autoUpdater)
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
    (set! (.-autoDownload autoUpdater) true)
    (-> (.checkForUpdates autoUpdater)
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
                           (.quitAndInstall autoUpdater false true))
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
