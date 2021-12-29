(ns electron.core
  (:require [electron.handler :as handler]
            [electron.search :as search]
            [electron.updater :refer [init-updater]]
            [electron.utils :refer [*win mac? win32? linux? prod? dev? logger open get-win-from-sender]]
            [electron.configs :as cfgs]
            [clojure.string :as string]
            [promesa.core :as p]
            [cljs-bean.core :as bean]
            [electron.fs-watcher :as fs-watcher]
            ["fs-extra" :as fs]
            ["path" :as path]
            ["os" :as os]
            ["electron" :refer [BrowserWindow app protocol ipcMain dialog Menu MenuItem session] :as electron]
            [clojure.core.async :as async]
            [electron.state :as state]
            [electron.git :as git]
            [electron.window :as win]
            ["/electron/utils" :as utils]))

(defonce LSP_SCHEME "lsp")
(defonce LSP_PROTOCOL (str LSP_SCHEME "://"))
(defonce PLUGIN_URL (str LSP_PROTOCOL "logseq.io/"))
(defonce STATIC_URL (str LSP_PROTOCOL "logseq.com/"))
(defonce PLUGINS_ROOT (.join path (.homedir os) ".logseq/plugins"))

(def ROOT_PATH (path/join js/__dirname ".."))

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

(defn setup-interceptor! []
  (.registerFileProtocol
    protocol "assets"
    (fn [^js request callback]
      (let [url (.-url request)
            path (string/replace url "assets://" "")
            path (js/decodeURIComponent path)]
        (callback #js {:path path}))))

  (.registerFileProtocol
    protocol LSP_SCHEME
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
     (.unregisterProtocol protocol LSP_SCHEME)
     (.unregisterProtocol protocol "assets")))

(defn- handle-export-publish-assets [_event html custom-css-path repo-path asset-filenames]
  (p/let [app-path (. app getAppPath)
          asset-filenames (js->clj asset-filenames)
          result (. dialog showOpenDialog (clj->js {:properties ["openDirectory" "createDirectory" "promptToCreate", "multiSelections"]}))
          result (get (js->clj result) "filePaths")
          root-dir (first result)]
    (when root-dir
      (let [static-dir (path/join root-dir "static")
            assets-from-dir (path/join repo-path "assets")
            assets-to-dir (path/join root-dir "assets")
            index-html-path (path/join root-dir "index.html")]
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
                                        (println (str "Failed to copy " (path/join assets-from-dir filename) " to " (path/join assets-to-dir filename)))
                                        (js/console.error e)))))
                            asset-filenames)

                          (map
                            (fn [part]
                              (. fs copy (path/join app-path part) (path/join static-dir part)))
                            ["css" "fonts" "icons" "img" "js"])))
                custom-css (. fs readFile custom-css-path)
                _ (. fs writeFile (path/join static-dir "css" "custom.css") custom-css)
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
        quit-dirty-state "set-quit-dirty-state"]
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
                     (js/console.error e)))))

      (.handle call-win-channel
               (fn [^js e type & args]
                 (let [win (get-win-from-sender e)]
                   (try
                     (js-invoke win type args)
                     (catch js/Error e
                       (js/console.error e)))))))

    (win/setup-window-listeners! win)

    #(do (.removeHandler ipcMain toggle-win-channel)
         (.removeHandler ipcMain export-publish-assets)
         (.removeHandler ipcMain quit-dirty-state)
         (.removeHandler ipcMain call-app-channel)
         (.removeHandler ipcMain call-win-channel))))

(defn main
  []
  (if-not (.requestSingleInstanceLock app)
    (do
      (search/close!)
      (.quit app))
    (do
      (.registerSchemesAsPrivileged
       protocol (bean/->js [{:scheme     LSP_SCHEME
                             :privileges {:standard        true
                                          :secure          true
                                          :bypassCSP       true
                                          :supportFetchAPI true}}]))

      (.on app "second-instance"
           (fn [_event _commandLine _workingDirectory]
             (when-let [win @*win]
               (when (.isMinimized ^object win)
                 (.restore win))
               (.focus win))))

      (.on app "window-all-closed" (fn []
                                     (try
                                       (fs-watcher/close-watcher!)
                                       (search/close!)
                                       (catch js/Error e
                                         (js/console.error e)))
                                     (.quit app)))
      (.on app "ready"
           (fn []
             (let [t0 (setup-interceptor!)
                   ^js win (win/create-main-window)
                   _ (reset! *win win)]
               (.. logger (info (str "Logseq App(" (.getVersion app) ") Starting... ")))

               (utils/disableXFrameOptions win)

               (when (search/version-changed?)
                 (search/rm-search-dir!))

               (search/ensure-search-dir!)

               (search/open-dbs!)

               (git/auto-commit-current-graph!)

               (vreset! *setup-fn
                        (fn []
                          (let [t1 (setup-updater! win)
                                t2 (setup-app-manager! win)
                                tt (handler/set-ipc-handler! win)]

                            (vreset! *teardown-fn
                                     #(doseq [f [t0 t1 t2 tt]]
                                        (and f (f)))))))

               ;; setup effects
               (@*setup-fn)

               ;; main window events
               (.on win "close" (fn [e]
                                  (when @*quit-dirty?
                                    (.preventDefault e)
                                    (state/close-window! win)
                                    (let [web-contents (. win -webContents)]
                                      (.send web-contents "persistent-dbs"))
                                    (async/go
                                      (let [_ (async/<! state/persistent-dbs-chan)]
                                        (if (or @win/*quitting? (not mac?))
                                          (when-let [win @*win]
                                            (win/destroy-window! win)
                                            (reset! *win nil))
                                          (do (.preventDefault ^js/Event e)
                                              (if (and mac? (.isFullScreen win))
                                                (do (.once win "leave-full-screen" #(.hide win))
                                                    (.setFullScreen win false))
                                                (.hide win)))))))))

               (.on app "before-quit" (fn [_e]
                                        (reset! win/*quitting? true)))

               (.on app "activate" #(if @*win (.show win)))))))))

(defn start []
  (js/console.log "Main - start")
  (when @*setup-fn (@*setup-fn)))

(defn stop []
  (js/console.log "Main - stop")
  (when @*teardown-fn (@*teardown-fn)))
