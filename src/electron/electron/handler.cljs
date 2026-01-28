(ns electron.handler
  "This ns starts the event handling for the electron main process and defines
  all the application-specific event types"
  (:require ["/electron/utils" :as js-utils]
            ["abort-controller" :as AbortController]
            ["buffer" :as buffer]
            ["diff-match-patch" :as google-diff]
            ["electron" :refer [app autoUpdater dialog ipcMain shell]]
            ["electron-window-state" :as windowStateKeeper]
            ["fs" :as fs]
            ["fs-extra" :as fs-extra]
            ["os" :as os]
            ["path" :as node-path]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [electron.backup-file :as backup-file]
            [electron.configs :as cfgs]
            [electron.db :as db]
            [electron.find-in-page :as find]
            [electron.handler-interface :refer [handle]]
            [electron.keychain :as keychain]
            [electron.logger :as logger]
            [electron.plugin :as plugin]
            [electron.server :as server]
            [electron.shell :as shell]
            [electron.state :as state]
            [electron.utils :as utils]
            [electron.window :as win]
            [logseq.cli.common.graph :as cli-common-graph]
            [logseq.common.graph :as common-graph]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(defmethod handle :mkdir [_window [_ dir]]
  (fs/mkdirSync dir))

(defmethod handle :mkdir-recur [_window [_ dir]]
  (fs/mkdirSync dir #js {:recursive true}))

(defmethod handle :readdir [_window [_ dir]]
  (common-graph/readdir dir))

(defmethod handle :listdir [_window [_ dir flat?]]
  (when (and dir (fs-extra/pathExistsSync dir))
    (js-utils/deepReadDir dir (if (boolean? flat?) flat? true))))

(defmethod handle :unlink [_window [_ repo-dir path]]
  (if (or (plugin/dotdir-file? path)
          (plugin/assetsdir-file? path))
    (fs/unlinkSync path)
    (try
      (logger/info ::unlink {:path path})
      (let [file-name   (-> (string/replace path (str repo-dir "/") "")
                            (string/replace "/" "_")
                            (string/replace "\\" "_"))
            recycle-dir (str repo-dir "/logseq/.recycle")
            _           (fs-extra/ensureDirSync recycle-dir)
            new-path    (str recycle-dir "/" file-name)]
        (fs/renameSync path new-path)
        (logger/debug ::unlink "recycle to" new-path))
      (catch :default e
        (logger/error ::unlink path e)
        nil))))

(defonce Diff (google-diff.))
(defn string-some-deleted?
  [old new]
  (let [result (.diff_main Diff old new)]
    (some (fn [a] (= -1 (first a))) result)))

(defmethod handle :backupDbFile [_window [_ repo path db-content new-content]]
  (when (and (string? db-content)
             (string? new-content)
             (string-some-deleted? db-content new-content))
    (logger/info ::backup "backup db file" path)
    (backup-file/backup-file repo :backup-dir path (node-path/extname path) db-content)))

(defmethod handle :openFileInFolder [_window [_ full-path]]
  (when-let [full-path (utils/to-native-win-path! full-path)]
    (logger/info ::open-file-in-folder full-path)
    (.showItemInFolder shell full-path)))

(defmethod handle :readFile [_window [_ path]]
  (utils/read-file path))

(defmethod handle :readFileRaw [_window [_ path]]
  (utils/read-file-raw path))

(defn writable?
  [path]
  (assert (string? path))
  (try
    (fs/accessSync path (aget fs "W_OK"))
    (catch :default _e
      false)))

(defn chmod-enabled?
  []
  (if (= nil (cfgs/get-item :feature/enable-automatic-chmod?))
    true
    (cfgs/get-item :feature/enable-automatic-chmod?)))

(defmethod handle :copyFile [_window [_ _repo from-path to-path]]
  (logger/info ::copy-file from-path to-path)
  (fs-extra/copy from-path to-path))

(defmethod handle :writeFile [window [_ repo path content]]
  (let [^js Buf (.-Buffer buffer)
        ^js content (if (instance? js/ArrayBuffer content)
                      (.from Buf content)
                      content)]
    (try
      (when (and (chmod-enabled?) (fs/existsSync path) (not (writable? path)))
        (fs/chmodSync path "644"))
      (fs/writeFileSync path content)
      (utils/fs-stat->clj path)
      (catch :default e
        (logger/warn ::write-file path e)
        (let [backup-path (try
                            (backup-file/backup-file repo :backup-dir path (node-path/extname path) content)
                            (catch :default e
                              (logger/error ::write-file "backup file failed:" e)))]
          (utils/send-to-renderer window "notification" {:type "error"
                                                         :payload (str "Write to the file " path
                                                                       " failed, "
                                                                       e
                                                                       (when backup-path
                                                                         (str ". A backup file was saved to "
                                                                              backup-path
                                                                              ".")))}))))))

(defmethod handle :rename [_window [_ old-path new-path]]
  (logger/info ::rename "from" old-path "to" new-path)
  (fs/renameSync old-path new-path))

(defmethod handle :stat [_window [_ path]]
  (utils/fs-stat->clj path))

(defn- get-files
  "Returns vec of file-objs"
  [path]
  (->> (common-graph/get-files path)
       (map (fn [path]
              (let [stat (fs/statSync path)]
                (when-not (.isDirectory stat)
                  {:path    (utils/fix-win-path! path)
                   :content (utils/read-file path)
                   :stat    stat}))))
       (remove nil?)
       vec))

(defn open-dir-dialog []
  (p/let [result (.showOpenDialog dialog (bean/->js
                                          {:properties ["openDirectory" "createDirectory" "promptToCreate"]}))
          result (get (js->clj result) "filePaths")]
    (p/resolved (first result))))

(defn- pretty-print-js-error
  "Converts file related JS Error messages to a human readable format.
   Ex.:
   Error: EACCES: permission denied, scandir '/tmp/test'
   Permission denied for path: '/tmp/test' (Code: EACCES)"
  [e]
  (some->>
   e
   str
   ;; Message parsed as "Error: $ERROR_CODE$: $REASON$, function $PATH$"
   (re-matches #"(?:Error\: )(.+)(?:\: )(.+)(?:, \w+ )('.+')")
   rest
   (#(str (string/capitalize (second %)) " for path: " (nth % 2) " (Code: " (first %) ")"))))

(defmethod handle :openDir [^js window _messages]
  (logger/info ::open-dir "open folder selection dialog")
  (p/let [path (open-dir-dialog)
          path (utils/fix-win-path! path)]
    (logger/debug ::open-dir {:path path})
    (if path
      (try
        (p/resolved (bean/->js {:path path
                                :files (get-files path)}))
        (catch js/Error e
          (do
            (utils/send-to-renderer window "notification" {:type "error"
                                                           :payload (str "Opening the specified directory failed.\n"
                                                                         (or (pretty-print-js-error e) (str "Unexpected error: " e)))})
            (p/rejected e))))

      (p/rejected (js/Error "path empty")))))

(defmethod handle :getFiles [_window [_ path]]
  (logger/debug ::get-files {:path path})
  (p/let [files (get-files path)]
    (bean/->js {:path path
                :files files})))

(defn get-graphs
  "Returns all graph names"
  []
  (distinct (cli-common-graph/get-db-based-graphs)))

;; TODO support alias mechanism
(defn get-graph-name
  "Given a graph's name of string, returns the graph's fullname. For example, given
  `cat`, returns `logseq_db_cat`.  Returns `nil` if no such graph exists."
  [graph-identifier]
  (->> (get-graphs)
       (some #(when (or
                     (= (utils/normalize-lc %) (utils/normalize-lc (str sqlite-util/db-version-prefix graph-identifier)))
                     (string/ends-with? (utils/normalize-lc %)
                                        (str "/" (utils/normalize-lc graph-identifier))))
                %))))

(defmethod handle :getGraphs [_window [_]]
  (get-graphs))

(defmethod handle :deleteGraph [_window [_ graph]]
  (when graph
    (db/unlink-graph! graph)))

;; DB related IPCs start

(defmethod handle :db-export [_window [_ repo data]]
  (db/ensure-graph-dir! repo)
  (db/save-db! repo data))

(defmethod handle :db-get [_window [_ repo]]
  (db/get-db repo))

;; DB related IPCs End

(defmethod handle :openDialog [^js _window _messages]
  (open-dir-dialog))

(defmethod handle :showOpenDialog [_window [_ ^js options]]
  (p/let [^js result (.showOpenDialog dialog options)]
    result))

(defmethod handle :getLogseqDotDirRoot []
  (utils/get-ls-dotdir-root))

(defmethod handle :setProxy [_win [_ options]]
  ;; options: {:type "system" | "direct" | "socks5" | "http" | ... }
  (p/do!
   (utils/<set-proxy options)
   (utils/save-proxy-settings options)))

(defmethod handle :testProxyUrl [_win [_ url options]]
  ;; FIXME: better not to set proxy while testing url
  (let [_ (utils/<set-proxy options)
        start-ms (.getTime (js/Date.))]
    (-> (utils/fetch url)
        (p/timeout 10000)
        (p/then (fn [resp]
                  (let [code (.-status resp)
                        response-ms (- (.getTime (js/Date.)) start-ms)]
                    (if (<= 200 code 299)
                      #js {:code code
                           :response-ms response-ms}
                      (p/rejected (js/Error. (str "HTTP status " code)))))))
        (p/catch (fn [e]
                   (if (instance? p/TimeoutException e)
                     (p/rejected (js/Error. "Timeout"))
                     (p/rejected e)))))))

(defmethod handle :httpFetchJSON [_win [_ url options]]
  (p/let [res (utils/fetch url options)
          json (.json res)]
    json))

(defmethod handle :getUserDefaultPlugins []
  (utils/get-ls-default-plugins))

(defmethod handle :validateUserExternalPlugins [_win [_ urls]]
  (zipmap urls (for [url urls]
                 (try
                   (and (fs-extra/pathExistsSync url)
                        (fs-extra/pathExistsSync (node-path/join url "package.json")))
                   (catch :default _e false)))))

(defmethod handle :relaunchApp []
  (.relaunch app) (.quit app))

(defmethod handle :quitApp []
  (.quit app))

(defmethod handle :userAppCfgs [_window [_ k v]]
  (let [config (cfgs/get-config)]
    (if-let [k (and k (keyword k))]
      (if-not (nil? v)
        (do (cfgs/set-item! k v)
            (state/set-state! [:config k] v))
        (cfgs/get-item k))
      config)))

(defmethod handle :getAppBaseInfo [^js win [_ _opts]]
  {:isFullScreen (.isFullScreen win)
   :isMaximized (.isMaximized win)})

(defmethod handle :getAssetsFiles [^js win [_ {:keys [exts]}]]
  (when-let [graph-path (state/get-window-graph-path win)]
    (when-let [assets-path (.join node-path graph-path "assets")]
      (when (fs-extra/pathExistsSync assets-path)
        (p/let [^js files (js-utils/getAllFiles assets-path (clj->js exts))]
          files)))))

(defn set-current-graph!
  [window graph-path]
  (swap! state/state assoc-in [:window/graph window] graph-path)
  nil)

(defmethod handle :setCurrentGraph [^js window [_ graph-name]]
  (when graph-name
    (set-current-graph! window (utils/get-graph-dir graph-name))))

(defmethod handle :runCli [window [_ {:keys [command args returnResult]}]]
  (try
    (let [on-data-handler (fn [message]
                            (let [result (str "Running " command ": " message)]
                              (when returnResult
                                (utils/send-to-renderer window "notification"
                                                        {:type    "success"
                                                         :payload result}))))
          deferred        (p/deferred)
          on-exit-handler (fn [code]
                            (p/resolve! deferred code))
          _job            (shell/run-command-safely! command args on-data-handler on-exit-handler)]
      deferred)
    (catch js/Error e
      (utils/send-to-renderer window "notification"
                              {:type    "error"
                               :payload (.-message e)}))))

(defmethod handle :installMarketPlugin [_ [_ manifest]]
  (plugin/install-or-update! manifest))

(defmethod handle :updateMarketPlugin [_ [_ pkg]]
  (plugin/install-or-update! pkg))

(defmethod handle :uninstallMarketPlugin [_ [_ id]]
  (plugin/uninstall! id))

(def *request-abort-signals (atom {}))

(defmethod handle :httpRequest [_ [_ req-id opts]]
  (let [{:keys [url abortable method data returnType headers]} opts]
    (when-let [[method type] (and (not (string/blank? url))
                                  [(keyword (string/upper-case (or method "GET")))
                                   (keyword (string/lower-case (or returnType "json")))])]
      (-> (utils/fetch url
                       (-> {:method  method
                            :headers (and headers (bean/->js headers))}
                           (merge (when (and (not (contains? #{:GET :HEAD} method)) data)
                                    ;; TODO: support type of arrayBuffer
                                    {:body (js/JSON.stringify (bean/->js data))})

                                  (when-let [^js controller (and abortable (AbortController.))]
                                    (swap! *request-abort-signals assoc req-id controller)
                                    {:signal (.-signal controller)}))))
          (p/then (fn [^js res]
                    (case type
                      :json
                      (.json res)

                      :arraybuffer
                      (.arrayBuffer res)

                      :base64
                      (-> (.buffer res)
                          (p/then #(.toString % "base64")))

                      :text
                      (.text res))))
          (p/catch
           (fn [^js e]
             ;; TODO: handle special cases
             (throw e)))
          (p/finally
            (fn []
              (swap! *request-abort-signals dissoc req-id)))))))

(defmethod handle :httpRequestAbort [_ [_ req-id]]
  (when-let [^js controller (get @*request-abort-signals req-id)]
    (.abort controller)))

(defmethod handle :quitAndInstall []
  (logger/info ::quick-and-install)
  (.quitAndInstall autoUpdater))

;; The graphHas* events are not used but maybe useful later?
(defmethod handle :graphHasOtherWindow [^js win [_ graph]]
  (let [dir (utils/get-graph-dir graph)]
    (win/graph-has-other-windows? win dir)))

(defmethod handle :graphHasMultipleWindows [^js _win [_ graph]]
  (let [dir (utils/get-graph-dir graph)
        windows (win/get-graph-all-windows dir)]
    (> (count windows) 1)))

(defn open-new-window!
  [repo]
  (let [win (win/create-main-window! win/MAIN_WINDOW_ENTRY {:graph repo})]
    (win/on-close-actions! win)
    (win/setup-window-listeners! win)
    win))

(defmethod handle :openNewWindow [_window [_ repo]]
  (logger/info ::open-new-window)
  (open-new-window! repo)
  nil)

(defmethod handle :graphReady [window [_ graph-name]]
  (when-let [f (:window/once-graph-ready @state/state)]
    (f window graph-name)
    (state/set-state! :window/once-graph-ready nil)))

(defmethod handle :window-minimize [^js win]
  (.minimize win))

(defmethod handle :window-toggle-maximized [^js win]
  (if (.isMaximized win)
    (.unmaximize win)
    (.maximize win)))

(defmethod handle :window-toggle-fullscreen [^js win]
  (.setFullScreen win (not (.isFullScreen win))))

(defmethod handle :window-close [^js win]
  (.close win))

(defmethod handle :window-reload [^js win]
  (.reload (.-webContents win)))

(defmethod handle :theme-loaded [^js win]
  (.manage (windowStateKeeper) win)
  (.show win))

(defmethod handle :keychain/save-e2ee-password [_window [_ key encrypted-text]]
  (keychain/<set-password! key encrypted-text))

(defmethod handle :keychain/get-e2ee-password [_window [_ key]]
  (keychain/<get-password key))

(defmethod handle :keychain/delete-e2ee-password [_window [_ key]]
  (keychain/<delete-password! key))

(defmethod handle :default [args]
  (logger/error "Error: no ipc handler for:" args))

(defmethod handle :find-in-page [^js win [_ search option]]
  (find/find! win search (bean/->js option)))

(defmethod handle :clear-find-in-page [^js win [_]]
  (find/clear! win))

(defmethod handle :server/load-state []
  (server/load-state-to-renderer!))

(defmethod handle :server/do [^js _win [_ action]]
  (server/do-server! action))

(defmethod handle :server/set-config [^js _win [_ config]]
  (server/set-config! config))

(defmethod handle :system/info [^js _win _]
  {:home-dir (.homedir os)})

(defmethod handle :window/open-blank-callback [^js win [_ _type]]
  (win/setup-window-listeners! win) nil)

(defn set-ipc-handler! [window]
  (let [main-channel "main"]
    (.handle ipcMain main-channel
             (fn [^js event args-js]
               (try
                 (let [message (bean/->clj args-js)]
                   ;; Be careful with the return values of `handle` defmethods.
                   ;; Values that are not non-JS objects will cause this
                   ;; exception -
                   ;; https://www.electronjs.org/docs/latest/breaking-changes#behavior-changed-sending-non-js-objects-over-ipc-now-throws-an-exception
                   (bean/->js (handle (or (utils/get-win-from-sender event) window) message)))
                 (catch :default e
                   (when-not (contains? #{"mkdir" "stat"} (nth args-js 0))
                     (logger/error "IPC error: " {:event event
                                                  :args args-js}
                                   e))
                   e))))
    #(.removeHandler ipcMain main-channel)))
