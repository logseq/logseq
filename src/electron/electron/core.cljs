(ns electron.core
  (:require ["/electron/utils" :as js-utils]
            ["electron" :refer [BrowserWindow Menu app protocol ipcMain dialog shell] :as electron]
            ["fs-extra" :as fs]

            ["os" :as os]
            ["path" :as node-path]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [electron.db :as db]
            [electron.exceptions :as exceptions]
            [electron.handler :as handler]
            [electron.i18n :as i18n :refer [t]]
            [electron.logger :as logger]
            [electron.release-warning :as release-warning]
            [electron.server :as server]
            [electron.updater :refer [init-updater] :as updater]
            [electron.url :refer [logseq-url-handler]]
            [electron.utils :refer [*win mac? dev? get-win-from-sender
                                    decode-protected-assets-schema-path send-to-renderer]
             :as utils]
            [electron.window :as win]
            [logseq.publishing.export :as publish-export]
            [promesa.core :as p]))

;; Keep same as main/frontend.util.url
(defonce LSP_SCHEME "logseq")
(defonce FILE_LSP_SCHEME "lsp")
(defonce FILE_ASSETS_SCHEME "assets")
(defonce LSP_PROTOCOL (str FILE_LSP_SCHEME "://"))
(defonce PLUGIN_URL (str LSP_PROTOCOL "logseq.io/"))
(defonce STATIC_URL (str LSP_PROTOCOL "logseq.com/"))
(defonce PLUGINS_ROOT (.join node-path (.homedir os) ".logseq/plugins"))

(defonce *setup-fn (volatile! nil))
(defonce *teardown-fn (volatile! nil))
(defonce *quit-dirty? (volatile! true))
(defonce CLI_LAUNCHER_MARKER "logseq-cli-managed")

(defn setup-updater! [^js win]
  ;; manual/auto updater
  (init-updater {:repo   "logseq/logseq"
                 :win    win}))

(defn open-url-handler
  "win - the main window instance (first renderer process)
   url - the input URL"
  [win url]
  (logger/info "open-url" {:url url})
  ;; https://github.com/electron-userland/electron-builder/issues/1552
  ;; At macOS platform this is captured at 'open-url' event, we set it with deeplinkingUrl = url! (See // Protocol handler for osx)
  ;; At win32 platform this is saved at process.argv together with other arguments. To get only the provided url, deeplinkingUrl = argv.slice(1). (See // Protocol handler for win32)
  (when-let [parsed-url (try (js/URL. url)
                             (catch :default e
                               (logger/info "upon opening non-url" {:error e})))]
    (when (= (str LSP_SCHEME ":") (.-protocol parsed-url))
      (logseq-url-handler win parsed-url))))

(defn- register-default-protocol-client!
  "Register Logseq as the default handler for the custom protocol.
   Windows dev runs launched through the Electron binary need the entry
   script path passed explicitly so the OS can relaunch the same app."
  [^js app']
  (if (and utils/win32? (.-defaultApp js/process))
    (let [main-script (aget (.-argv js/process) 1)
          args (if main-script
                 #js [(.resolve node-path main-script)]
                 #js [])]
      (.setAsDefaultProtocolClient app' LSP_SCHEME (.-execPath js/process) args))
    (.setAsDefaultProtocolClient app' LSP_SCHEME)))

(defn setup-interceptor! [_app]
  (.registerFileProtocol
   protocol FILE_ASSETS_SCHEME
   (fn [^js request callback]
     (let [url (.-url request)
           url (decode-protected-assets-schema-path url)
           path (string/replace url "assets://" "")
           path (js/decodeURIComponent path)]
       (cond (or (string/starts-with? path "/")
                 (re-find #"(?i)^/[a-zA-Z]:" path))
             (callback #js {:path path})

             ;; assume windows unc path
             utils/win32?
             (do (logger/debug :resolve-assets-url url)
                 (callback #js {:path (str "//" path)}))

             :else
             (do
               (logger/warn ::resolve-assets-url "Unknown assets url" url)
               (callback #js {:path path}))))))

  (.registerFileProtocol
   protocol FILE_LSP_SCHEME
   (fn [^js request callback]
     (let [url (.-url request)
           url' ^js (js/URL. url)
           [_ ROOT] (if (string/starts-with? url PLUGIN_URL)
                      [PLUGIN_URL PLUGINS_ROOT]
                      [STATIC_URL js/__dirname])

           path' (.-pathname url')
           path' (utils/safe-decode-uri-component path')
           path' (.join node-path ROOT path')]

       (callback #js {:path path'}))))

  #(do
     (.unregisterProtocol protocol FILE_LSP_SCHEME)
     (.unregisterProtocol protocol FILE_ASSETS_SCHEME)))

(defn- handle-export-publish-assets [_event html repo-path asset-filenames output-path]
  (p/let [app-path (. app getAppPath)
          asset-filenames (->> (js->clj asset-filenames) (remove nil?))
          root-dir (or output-path (handler/open-dir-dialog))]
    (when root-dir
      (publish-export/create-export
       html
       app-path
       repo-path
       root-dir
       {:asset-filenames asset-filenames
        :log-error-fn logger/error
        :notification-fn #(send-to-renderer :notification %)}))))

(defn setup-app-manager!
  [^js win]
  (let [toggle-win-channel "toggle-max-or-min-active-win"
        call-app-channel "call-application"
        call-win-channel "call-main-win"
        export-publish-assets "export-publish-assets"
        quit-dirty-state "set-quit-dirty-state"
        clear-win-effects! (win/setup-window-listeners! win)]

    (doto ipcMain
      (.handle quit-dirty-state
               (fn [_ dirty?]
                 (vreset! *quit-dirty? (boolean dirty?))))

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

      (.handle export-publish-assets handle-export-publish-assets)

      (.handle call-app-channel
               (fn [_ type & args]
                 (try
                   (js-invoke app type args)
                   (catch :default e
                     (logger/error (str call-app-channel " " e))))))

      (.handle call-win-channel
               (fn [^js e type & args]
                 (let [win (get-win-from-sender e)]
                   (try
                     (js-invoke win type args)
                     (catch :default e
                       (logger/error (str call-win-channel " " e))))))))

    #(do (clear-win-effects!)
         (.removeHandler ipcMain toggle-win-channel)
         (.removeHandler ipcMain export-publish-assets)
         (.removeHandler ipcMain quit-dirty-state)
         (.removeHandler ipcMain call-app-channel)
         (.removeHandler ipcMain call-win-channel))))

(defn- set-app-menu! []
  (let [about-fn (fn []
                   (.showMessageBox dialog (clj->js {:title "Logseq"
                                                     :icon (node-path/join js/__dirname "icons/logseq.png")
                                                     :message (t :electron/version updater/electron-version)})))
        template (if mac?
                   [{:label (.-name app)
                     :submenu [{:role "about"}
                               {:type "separator"}
                               {:role "services"}
                               {:type "separator"}
                               {:role "hide"}
                               {:role "hideOthers"}
                               {:role "unhide"}
                               {:type "separator"}
                               {:role "quit"}]}]
                   [])
        template (conj template
                       {:role "fileMenu"
                        :submenu [{:label (t :electron/new-window)
                                   :click (fn [] (handler/open-new-window! nil))
                                   :accelerator (if mac?
                                                  "CommandOrControl+N"
                                                  ;; Avoid conflict with `Control+N` shortcut to move down in the text editor on Windows/Linux
                                                  "Shift+CommandOrControl+N")}
                                  (if mac?
                                    ;; Disable Command+W shortcut
                                    {:role "close"
                                     :accelerator false}
                                    {:role "quit"})]}
                       {:role "editMenu"}
                       {:role "viewMenu"}
                       {:role "windowMenu"
                        :submenu
                        (concat
                          (when-not mac?
                            [{:role "minimize"}
                             {:role "zoom"}
                             ;; Disable Control+W shortcut
                             {:role "close"
                              :accelerator false}])
                          [{:label "Always on Top"
                            :type "checkbox"
                            :click (fn [menuItem browserWindow]
                                     ;; switch alwaysOnTop state
                                     (.setAlwaysOnTop browserWindow (.-checked menuItem)))}])})
        ;; Windows has no about role
        template (conj template
                       (if mac?
                         {:role "help"
                          :submenu [{:label (t :electron/official-docs)
                                     :click #(.openExternal shell "https://docs.logseq.com/")}]}
                         {:role "help"
                          :submenu [{:label (t :electron/official-docs)
                                     :click #(.openExternal shell "https://docs.logseq.com/")}
                                    {:role "about"
                                     :label (t :electron/about)
                                     :click about-fn}]}))
        ;; Enable Cmd/Ctrl+= Zoom In
        template (conj template
                       {:role "zoomin"
                        :accelerator "CommandOrControl+="})
        menu (.buildFromTemplate Menu (clj->js template))]
    (.setApplicationMenu Menu menu)))

(defn- find-deeplink-url
  "Extract a deeplink URL from a sequence of command-line argument strings."
  [args]
  (some #(when (string/starts-with? % (str LSP_SCHEME ":")) %) args))

(defn- setup-deeplink! []
  ;; macOS: app fires open-url for custom-protocol links when the app is already running
  (.on app "open-url"
       (fn [^js event url]
         (.preventDefault event)
         (when-let [win @*win]
           (open-url-handler win url)))))

(defn- handle-initial-deeplink!
  "On Windows/Linux, the protocol URL is passed as a command-line argument
   on the first launch. Call this after the main window is ready."
  [win]
  (when-not mac?
    (when-let [url (find-deeplink-url (rest (js->clj (.-argv js/process))))]
      (open-url-handler win url))))

(defn- maybe-warn-wrong-release!
  []
  (when (release-warning/x64-on-apple-silicon?
         {:platform (.-platform js/process)
          :arch (.-arch js/process)
          :running-under-arm64-translation? (boolean (.-runningUnderARM64Translation app))})
    (-> (.showMessageBox
         dialog
         (clj->js (assoc (release-warning/warning-dialog-options t) :title "Logseq")))
        (.then
         (fn [result]
           (when-let [url (release-warning/selected-release-url (.-response result))]
             (.openExternal shell url))))
        (.catch
         (fn [error]
           (logger/warn :electron/wrong-release-warning-failed error))))))

(defn- path-separator
  []
  (if utils/win32? ";" ":"))

(defn- split-path-env
  [path-env]
  (->> (string/split (or path-env "") (re-pattern (path-separator)))
       (remove string/blank?)
       distinct))

(defn- writable-dir?
  [dir]
  (try
    (when (and (string? dir)
               (fs/existsSync dir)
               (.isDirectory (fs/statSync dir)))
      (fs/accessSync dir (aget fs "constants" "W_OK"))
      true)
    (catch :default _
      false)))

(defn- find-first-writable-dir
  [dirs]
  (some #(when (writable-dir? %) %) dirs))

(defn- ensure-dir!
  [dir]
  (when (and (string? dir) (not (fs/existsSync dir)))
    (fs/mkdirSync dir #js {:recursive true})))

(defn- preferred-unix-cli-dir
  []
  (let [path-dirs (split-path-env (.-PATH js/process.env))
        user-bin (node-path/join (.homedir os) ".local" "bin")]
    (or (find-first-writable-dir path-dirs)
        (do
          (ensure-dir! user-bin)
          (when (writable-dir? user-bin)
            user-bin)))))

(defn- preferred-win-cli-dir
  []
  (let [path-env (or (.-PATH js/process.env) (.-Path js/process.env))
        path-dirs (split-path-env path-env)
        local-appdata (.-LOCALAPPDATA js/process.env)
        windows-apps-dir (when local-appdata
                           (node-path/join local-appdata "Microsoft" "WindowsApps"))]
    (or (when windows-apps-dir
          (ensure-dir! windows-apps-dir)
          (when (writable-dir? windows-apps-dir)
            windows-apps-dir))
        (find-first-writable-dir path-dirs))))

(defn- cli-script-path
  []
  (if (.-isPackaged ^js app)
    (node-path/join js/process.resourcesPath "app.asar" "js" "logseq-cli.js")
    (node-path/join js/__dirname "logseq-cli.js")))

(defn- render-unix-cli-launcher
  [exe-path cli-path]
  (str "#!/usr/bin/env sh\n"
       "# " CLI_LAUNCHER_MARKER "\n"
       "set -eu\n"
       "ELECTRON_RUN_AS_NODE=1 exec \"" exe-path "\" \"" cli-path "\" \"$@\"\n"))

(defn- render-win-cli-launcher
  [exe-path cli-path]
  (str "@echo off\r\n"
       "REM " CLI_LAUNCHER_MARKER "\r\n"
       "set ELECTRON_RUN_AS_NODE=1\r\n"
       "\"" exe-path "\" \"" cli-path "\" %*\r\n"))

(defn- write-cli-launcher!
  [path content windows?]
  (let [should-write? (if (fs/existsSync path)
                        (let [existing (.readFileSync fs path "utf8")]
                          (and (string/includes? existing CLI_LAUNCHER_MARKER)
                               (not= existing content)))
                        true)]
    (when should-write?
      (.writeFileSync fs path content "utf8")
      (when-not windows?
        (fs/chmodSync path "755"))
      true)))

(defn- install-cli-launcher!
  []
  (try
    (let [cli-path (cli-script-path)
          cli-dir (if utils/win32?
                    (preferred-win-cli-dir)
                    (preferred-unix-cli-dir))]
      (cond
        (not (fs/existsSync cli-path))
        (logger/warn :cli/install (str "Missing CLI script at " cli-path ", skip installing launcher"))

        (nil? cli-dir)
        (logger/warn :cli/install "No writable PATH directory found; skip installing logseq launcher")

        :else
        (let [target-path (if utils/win32?
                            (node-path/join cli-dir "logseq.cmd")
                            (node-path/join cli-dir "logseq"))
              exe-path (.getPath app "exe")
              content (if utils/win32?
                        (render-win-cli-launcher exe-path cli-path)
                        (render-unix-cli-launcher exe-path cli-path))]
          (when (write-cli-launcher! target-path content utils/win32?)
            (logger/info :cli/install (str "Installed launcher at " target-path))))))
    (catch :default e
      (logger/warn :cli/install "Failed to install logseq launcher" e))))

(defn- on-app-ready!
  [^js app']
  (.on app' "ready"
       (fn []
         (logger/info (str "Logseq App(" (.getVersion app') ") Starting... "))

         ;; Add React developer tool
         (when-let [^js devtoolsInstaller (and dev? (js/require "electron-devtools-installer"))]
           (-> (.default devtoolsInstaller (.-REACT_DEVELOPER_TOOLS devtoolsInstaller))
               (.then #(js/console.log "Added Extension:" (.-REACT_DEVELOPER_TOOLS devtoolsInstaller)))))

         (let [t0 (setup-interceptor! app')
               ^js win (win/create-main-window!)
               _ (reset! *win win)]

           (utils/<restore-proxy-settings)

           (js-utils/disableXFrameOptions win)

           (db/ensure-graphs-dir!)
           (install-cli-launcher!)

           ;; Windows/Linux: handle deeplink URL passed on first launch via argv
           (handle-initial-deeplink! win)
           (maybe-warn-wrong-release!)

           (vreset! *setup-fn
                    (fn []
                      (let [t1 (setup-updater! win)
                            t2 (setup-app-manager! win)
                            t3 (handler/set-ipc-handler! win)
                            t4 (server/setup! win)
                            tt (exceptions/setup-exception-listeners!)]

                        (vreset! *teardown-fn
                                 #(doseq [f [t0 t1 t2 t3 t4 tt]]
                                    (and f (f)))))))

           ;; setup effects
           (@*setup-fn)

           ;; main window events
           (.on win "close" (fn [e]
                              (when @*quit-dirty? ;; when not updating
                                (.preventDefault e)

                                (let [windows (win/get-all-windows)
                                      window @*win
                                      multiple-windows? (> (count windows) 1)]
                                  (cond
                                    (or multiple-windows? (not mac?) @win/*quitting?)
                                    (when window
                                      (win/close-handler win e)
                                      (reset! *win nil))

                                    (and mac? (not multiple-windows?))
                                        ;; Just hiding - don't do any actual closing operation
                                    (do (.preventDefault ^js/Event e)
                                        (if (and mac? (.isFullScreen win))
                                          (do (.once win "leave-full-screen" #(.hide win))
                                              (.setFullScreen win false))
                                          (.hide win)))
                                    :else
                                    nil)))))
           (.on app' "before-quit" (fn [_e]
                                     (reset! win/*quitting? true)
                                     (handler/stop-all-db-workers!)))

           (.on app' "activate" #(when @*win (.show win)))))))

(defn main []
  (if-not (.requestSingleInstanceLock app)
    (.quit app)
    (let [privileges {:standard        true
                      :secure          true
                      :bypassCSP       true
                      :supportFetchAPI true}]
      (.registerSchemesAsPrivileged
       protocol (bean/->js [{:scheme     LSP_SCHEME
                             :privileges privileges}
                            {:scheme     FILE_LSP_SCHEME
                             :privileges privileges}
                            {:scheme     FILE_ASSETS_SCHEME
                             :privileges {:standard        false
                                          :secure          false
                                          :bypassCSP       false
                                          :supportFetchAPI false}}]))

      (register-default-protocol-client! app)
      (set-app-menu!)
      (i18n/on-locale-change! set-app-menu!)
      (setup-deeplink!)

      (.on app "second-instance"
           (fn [_event ^js command-line _working-directory]
             (when-let [window @*win]
               (win/switch-to-window! window)
               ;; Windows/Linux: deeplink URL may appear in subsequent-instance commandLine
               (when-let [url (find-deeplink-url (rest (js->clj command-line)))]
                 (open-url-handler window url)))))

      (.on app "window-all-closed" (fn []
                                     (logger/debug "window-all-closed" "Quitting...")
                                     (handler/stop-all-db-workers!)
                                     (.quit app)))
      (on-app-ready! app))))

(defn start []
  (logger/debug "Main - start")
  (when @*setup-fn (@*setup-fn)))

(defn stop []
  (logger/debug "Main - stop")
  (when @*teardown-fn (@*teardown-fn)))
