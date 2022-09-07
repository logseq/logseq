(ns electron.core
  (:require [electron.handler :as handler]
            [electron.search :as search]
            [electron.updater :refer [init-updater] :as updater]
            [electron.utils :refer [*win mac? linux? dev? logger get-win-from-sender restore-user-fetch-agent get-graph-name]]
            [electron.url :refer [logseq-url-handler]]
            [clojure.string :as string]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            [electron.fs-watcher :as fs-watcher]
            ["fs-extra" :as fs]
            ["path" :as path]
            ["os" :as os]
            ["electron" :refer [BrowserWindow Menu app protocol ipcMain dialog shell] :as electron]
            ["electron-deeplink" :refer [Deeplink]]
            [clojure.core.async :as async]
            [electron.state :as state]
            [electron.git :as git]
            [electron.window :as win]
            [electron.exceptions :as exceptions]
            ["/electron/utils" :as utils]))

;; Keep same as main/frontend.util.url
(defonce LSP_SCHEME "logseq")
(defonce FILE_LSP_SCHEME "lsp")
(defonce LSP_PROTOCOL (str FILE_LSP_SCHEME "://"))
(defonce PLUGIN_URL (str LSP_PROTOCOL "logseq.io/"))
(defonce STATIC_URL (str LSP_PROTOCOL "logseq.com/"))
(defonce PLUGINS_ROOT (.join path (.homedir os) ".logseq/plugins"))

(defonce *setup-fn (volatile! nil))
(defonce *teardown-fn (volatile! nil))
(defonce *quit-dirty? (volatile! true))

;; Handle creating/removing shortcuts on Windows when installing/uninstalling.
(when (js/require "electron-squirrel-startup") (.quit app))

(defn setup-updater! [^js win]
  ;; manual/auto updater
  (when-not linux?
    (init-updater {:repo   "logseq/logseq"
                   :logger logger
                   :win    win})))

(defn open-url-handler
  "win - the main window instance (first renderer process)
   url - the input URL"
  [win url]
  (.info logger "open-url" (str {:url url}))

  (let [parsed-url (js/URL. url)
        url-protocol (.-protocol parsed-url)]
    (when (= (str LSP_SCHEME ":") url-protocol)
      (logseq-url-handler win parsed-url))))

(defn setup-interceptor! [^js app]
  (.setAsDefaultProtocolClient app LSP_SCHEME)

  (.registerFileProtocol
   protocol "assets"
   (fn [^js request callback]
     (let [url (.-url request)
           path (string/replace url "assets://" "")
           path (js/decodeURI path)]
       (callback #js {:path path}))))

  (.registerFileProtocol
   protocol FILE_LSP_SCHEME
   (fn [^js request callback]
     (let [url (.-url request)
           url' ^js (js/URL. url)
           [_ ROOT] (if (string/starts-with? url PLUGIN_URL)
                      [PLUGIN_URL PLUGINS_ROOT]
                      [STATIC_URL js/__dirname])

           path' (.-pathname url')
           path' (js/decodeURIComponent path')
           path' (.join path ROOT path')]

       (callback #js {:path path'}))))

  #(do
     (.unregisterProtocol protocol FILE_LSP_SCHEME)
     (.unregisterProtocol protocol "assets")))

(defn- handle-export-publish-assets [_event html custom-css-path export-css-path repo-path asset-filenames output-path]
  (p/let [app-path (. app getAppPath)
          asset-filenames (js->clj asset-filenames)
          root-dir (or output-path (handler/open-dir-dialog))]
    (when root-dir
      (let [static-dir (path/join root-dir "static")
            assets-from-dir (path/join repo-path "assets")
            assets-to-dir (path/join root-dir "assets")
            index-html-path (path/join root-dir "index.html")
            export-or-custom-css-path (if (fs/existsSync export-css-path) export-css-path custom-css-path)]
        (p/let [_ (. fs ensureDir static-dir)
                _ (. fs ensureDir assets-to-dir)
                _ (p/all (concat
                          [(. fs writeFile index-html-path html)


                           (. fs copy (path/join app-path "404.html") (path/join root-dir "404.html"))]

                          (map
                           (fn [filename]
                             (-> (. fs copy (path/join assets-from-dir filename) (path/join assets-to-dir filename))
                                 (p/catch
                                  (fn [e]
                                    (.error logger "Failed to copy"
                                            (str {:from (path/join assets-from-dir filename)
                                                  :to (path/join assets-to-dir filename)})
                                            e)))))
                           asset-filenames)

                          (map
                           (fn [part]
                             (. fs copy (path/join app-path part) (path/join static-dir part)))
                           ["css" "fonts" "icons" "img" "js"])))
                export-css (. fs readFile export-or-custom-css-path)
                _ (. fs writeFile (path/join static-dir "css" "export.css") export-css)
                js-files ["main.js" "code-editor.js" "excalidraw.js"]
                _ (p/all (map (fn [file]
                                (. fs removeSync (path/join static-dir "js" file)))
                              js-files))
                _ (p/all (map (fn [file]
                                (. fs moveSync
                                   (path/join static-dir "js" "publishing" file)
                                   (path/join static-dir "js" file)))
                              js-files))
                _ (. fs removeSync (path/join static-dir "js" "publishing"))
                ;; remove source map files
                ;; TODO: ugly, replace with ls-files and filter with ".map"
                _ (p/all (map (fn [file]
                                (. fs removeSync (path/join static-dir "js" (str file ".map"))))
                              ["main.js" "code-editor.js" "excalidraw.js" "age-encryption.js"]))]
          (. dialog showMessageBox (clj->js {:message (str "Export public pages and publish assets to " root-dir " successfully")})))))))

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
                   (catch js/Error e
                     (.error logger (str call-app-channel " " e))))))

      (.handle call-win-channel
               (fn [^js e type & args]
                 (let [win (get-win-from-sender e)]
                   (try
                     (js-invoke win type args)
                     (catch js/Error e
                       (.error logger (str call-win-channel " " e))))))))

    #(do (clear-win-effects!)
         (.removeHandler ipcMain toggle-win-channel)
         (.removeHandler ipcMain export-publish-assets)
         (.removeHandler ipcMain quit-dirty-state)
         (.removeHandler ipcMain call-app-channel)
         (.removeHandler ipcMain call-win-channel))))

(defn- set-app-menu! []
  (let [about-fn (fn []
                   (.showMessageBox dialog (clj->js {:title "Logseq"
                                                     :icon (path/join js/__dirname "icons/logseq.png")
                                                     :message (str "Version " updater/electron-version)})))
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
                        :submenu [{:label "New Window"
                                   :click (fn []
                                            (p/let [graph-name (get-graph-name (state/get-graph-path))
                                                    _ (handler/broadcast-persist-graph! graph-name)]
                                              (handler/open-new-window!)))
                                   :accelerator (if mac? 
                                                  "CommandOrControl+N"
                                                  ;; Avoid conflict with `Control+N` shortcut to move down in the text editor on Windows/Linux
                                                  "Shift+CommandOrControl+N")}
                                  (if mac?
                                    {:role "close"}
                                    {:role "quit"})]}
                       {:role "editMenu"}
                       {:role "viewMenu"}
                       {:role "windowMenu"})
        ;; Windows has no about role
        template (conj template
                       (if mac?
                         {:role "help"
                          :submenu [{:label "Official Documentation"
                                     :click #(.openExternal shell "https://docs.logseq.com/")}]}
                         {:role "help"
                          :submenu [{:label "Official Documentation"
                                     :click #(.openExternal shell "https://docs.logseq.com/")}
                                    {:role "about"
                                     :label "About Logseq"
                                     :click about-fn}]}))
        menu (.buildFromTemplate Menu (clj->js template))]
    (.setApplicationMenu Menu menu)))

(defn- setup-deeplink! []
  ;; Works for Deeplink v1.0.9
  ;; :mainWindow is only used for handeling window restoring on second-instance,
  ;; But we already handle window restoring without deeplink.
  ;; https://github.com/glawson/electron-deeplink/blob/73d58edcde3d0e80b1819cd68a0c6e837a9c9258/src/index.ts#L150-L155
  (-> (Deeplink. #js
                  {:app app
                   :mainWindow nil
                   :protocol LSP_SCHEME
                   :isDev dev?})
      (.on "received"
           (fn [url]
             (when-let [win @*win]
               (open-url-handler win url))))))

(defn main []
  (if-not (.requestSingleInstanceLock app)
    (do
      (search/close!)
      (.quit app))
    (let [privileges {:standard        true
                      :secure          true
                      :bypassCSP       true
                      :supportFetchAPI true}]
      (.registerSchemesAsPrivileged
        protocol (bean/->js [{:scheme     LSP_SCHEME
                              :privileges privileges}
                             {:scheme     FILE_LSP_SCHEME
                              :privileges privileges}]))

      (set-app-menu!)
      (setup-deeplink!)

      (.on app "second-instance"
           (fn [_event _commandLine _workingDirectory]
             (when-let [window @*win]
               (win/switch-to-window! window))))

      (.on app "window-all-closed" (fn []
                                     (.debug logger "window-all-closed" "Quiting...")
                                     (try
                                       (fs-watcher/close-watcher!)
                                       (search/close!)
                                       (catch js/Error e
                                         (.error logger "window-all-closed" e)))
                                     (.quit app)))
      (.on app "ready"
           (fn []
             (let [t0 (setup-interceptor! app)
                   ^js win (win/create-main-window)
                   _ (reset! *win win)]
               (.. logger (info (str "Logseq App(" (.getVersion app) ") Starting... ")))

               (restore-user-fetch-agent)

               (utils/disableXFrameOptions win)

               (search/ensure-search-dir!)

               (search/open-dbs!)

               (git/auto-commit-current-graph!)

               (vreset! *setup-fn
                        (fn []
                          (let [t1 (setup-updater! win)
                                t2 (setup-app-manager! win)
                                t3 (handler/set-ipc-handler! win)
                                tt (exceptions/setup-exception-listeners!)]

                            (vreset! *teardown-fn
                                     #(doseq [f [t0 t1 t2 t3 tt]]
                                        (and f (f)))))))

               ;; setup effects
               (@*setup-fn)

               ;; main window events
               ;; TODO merge with window/on-close-actions!
               ;; TODO elimilate the difference between main and non-main windows
               (.on win "close" (fn [e]
                                  (when @*quit-dirty? ;; when not updating
                                    (.preventDefault e)
                                    (let [web-contents (. win -webContents)]
                                      (.send web-contents "persistent-dbs"))
                                    (async/go
                                      (let [_ (async/<! state/persistent-dbs-chan)]
                                        (if (or @win/*quitting? (not mac?))
                                          ;; MacOS: only cmd+q quitting will trigger actual closing
                                          ;; otherwise, it's just hiding - don't do any actuall closing in that case
                                          ;; except saving transit
                                          (when-let [win @*win]
                                            (when-let [dir (state/get-window-graph-path win)]
                                              (handler/close-watcher-when-orphaned! win dir))
                                            (state/close-window! win)
                                            (win/destroy-window! win)
                                            ;; FIXME: what happens when closing main window on Windows?
                                            (reset! *win nil))
                                          ;; Just hiding - don't do any actuall closing operation
                                          (do (.preventDefault ^js/Event e)
                                              (if (and mac? (.isFullScreen win))
                                                (do (.once win "leave-full-screen" #(.hide win))
                                                    (.setFullScreen win false))
                                                (.hide win)))))))))
               (.on app "before-quit" (fn [_e]
                                        (reset! win/*quitting? true)))

               (.on app "activate" #(when @*win (.show win)))))))))

(defn start []
  (.debug logger "Main - start")
  (when @*setup-fn (@*setup-fn)))

(defn stop []
  (.debug logger "Main - stop")
  (when @*teardown-fn (@*teardown-fn)))
