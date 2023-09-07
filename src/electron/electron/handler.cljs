(ns electron.handler
  "This ns starts the event handling for the electron main process and defines
  all the application-specific event types"
  (:require ["/electron/utils" :as js-utils]
            ["abort-controller" :as AbortController]
            ["buffer" :as buffer]
            ["diff-match-patch" :as google-diff]
            ["electron" :refer [app autoUpdater dialog ipcMain shell]]
            ["fs" :as fs]
            ["fs-extra" :as fs-extra]
            ["os" :as os]
            ["path" :as node-path]
            [cljs-bean.core :as bean]
            [cljs.reader :as reader]
            [clojure.core.async :as async]
            [clojure.string :as string]
            [electron.backup-file :as backup-file]
            [electron.configs :as cfgs]
            [electron.file-sync-rsapi :as rsapi]
            [electron.find-in-page :as find]
            [electron.fs-watcher :as watcher]
            [electron.git :as git]
            [electron.logger :as logger]
            [electron.plugin :as plugin]
            [electron.search :as search]
            [electron.server :as server]
            [electron.shell :as shell]
            [electron.state :as state]
            [electron.utils :as utils]
            [electron.window :as win]
            [logseq.common.graph :as common-graph]
            [promesa.core :as p]))

(defmulti handle (fn [_window args] (keyword (first args))))

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

(defmethod handle :addVersionFile [_window [_ repo path content]]
  (backup-file/backup-file repo :version-file-dir path (node-path/extname path) content))

(defmethod handle :openFileBackupDir [_window [_ repo path]]
  (when (string? path)
    (let [dir (backup-file/get-backup-dir repo path)]
      (.openPath shell dir))))

(defmethod handle :readFile [_window [_ path]]
  (utils/read-file path))

(defn writable?
  [path]
  (assert (string? path))
  (try
    (fs/accessSync path (aget fs "W_OK"))
    (catch :default _e
      false)))

(defmethod handle :copyFile [_window [_ _repo from-path to-path]]
  (logger/info ::copy-file from-path to-path)
  (fs-extra/copy from-path to-path))

(defmethod handle :writeFile [window [_ repo path content]]
  (let [^js Buf (.-Buffer buffer)
        ^js content (if (instance? js/ArrayBuffer content)
                      (.from Buf content)
                      content)]
    (try
      (when (and (fs/existsSync path) (not (writable? path)))
        (fs/chmodSync path "644"))
      (fs/writeFileSync path content)
      (fs/statSync path)
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
  (fs/statSync path))

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

(defn- sanitize-graph-name
  [graph-name]
  (when graph-name
    (-> graph-name
        (string/replace "/" "++")
        (string/replace ":" "+3A+"))))

(defn- graph-name->path
  [graph-name]
  (when graph-name
    (-> graph-name
        (string/replace "+3A+" ":")
        (string/replace "++" "/"))))

(defn- get-graphs-dir
  []
  (let [dir (if utils/ci?
              (.resolve node-path js/__dirname "../tmp/graphs")
              (.join node-path (.homedir os) ".logseq" "graphs"))]
    (fs-extra/ensureDirSync dir)
    dir))

(defn- get-graphs
  "Returns all graph names in the cache directory (starting with `logseq_local_`)"
  []
  (let [dir (get-graphs-dir)]
    (->> (common-graph/readdir dir)
         (remove #{dir})
         (map #(node-path/basename % ".transit"))
         (map graph-name->path))))

;; TODO support alias mechanism
(defn get-graph-name
  "Given a graph's name of string, returns the graph's fullname.
   E.g., given `cat`, returns `logseq_local_<path_to_directory>/cat`
   Returns `nil` if no such graph exists."
  [graph-identifier]
  (->> (get-graphs)
       (some #(when (string/ends-with? (utils/normalize-lc %)
                                       (str "/" (utils/normalize-lc graph-identifier)))
                %))))

(defmethod handle :getGraphs [_window [_]]
  (get-graphs))

(defn- read-txid-info!
  [root]
  (try
    (let [txid-path (.join node-path root "logseq/graphs-txid.edn")]
      (when (fs/existsSync txid-path)
        (when-let [sync-meta (and (not (string/blank? root))
                                  (.toString (.readFileSync fs txid-path)))]
          (reader/read-string sync-meta))))
    (catch :default e
      (js/console.debug "[read txid meta] #" root (.-message e)))))

(defmethod handle :inflateGraphsInfo [_win [_ graphs]]
  (if (seq graphs)
    (for [{:keys [root] :as graph} graphs]
      (if-let [sync-meta (read-txid-info! root)]
        (assoc graph
               :sync-meta sync-meta
               :GraphUUID (second sync-meta))
        graph))
    []))

(defmethod handle :readGraphTxIdInfo [_win [_ root]]
  (read-txid-info! root))

(defn- get-graph-path
  [graph-name]
  (when graph-name
    (let [graph-name (sanitize-graph-name graph-name)
          dir (get-graphs-dir)]
      (.join node-path dir (str graph-name ".transit")))))

(defn- get-serialized-graph
  [graph-name]
  (when graph-name
    (when-let [file-path (get-graph-path graph-name)]
      (when (fs/existsSync file-path)
        (utils/read-file file-path)))))

(defmethod handle :getSerializedGraph [_window [_ graph-name]]
  (get-serialized-graph graph-name))

(defmethod handle :saveGraph [_window [_ graph-name value-str]]
  ;; NOTE: graph-name is a plain "local" for demo graph.
  (when (and graph-name value-str (not (= "local" graph-name)))
    (when-let [file-path (get-graph-path graph-name)]
      (fs/writeFileSync file-path value-str))))

(defmethod handle :deleteGraph [_window [_ graph-name]]
  (when graph-name
    (when-let [file-path (get-graph-path graph-name)]
      (when (fs/existsSync file-path)
        (fs-extra/removeSync file-path)))))

(defmethod handle :persistent-dbs-saved [_window _]
  (async/put! state/persistent-dbs-chan true)
  true)

;; Search related IPCs
(defmethod handle :search-blocks [_window [_ repo q opts]]
  (search/search-blocks repo q opts))

(defmethod handle :search-pages [_window [_ repo q opts]]
  (search/search-pages repo q opts))

(defmethod handle :rebuild-indice [_window [_ repo block-data page-data]]
  (search/truncate-blocks-table! repo)
  ;; unneeded serialization
  (search/upsert-blocks! repo (bean/->js block-data))
  (search/truncate-pages-table! repo)
  (search/upsert-pages! repo (bean/->js page-data))
  [])

(defmethod handle :transact-blocks [_window [_ repo data]]
  (let [{:keys [blocks-to-remove-set blocks-to-add]} data]
    ;; Order matters! Same id will delete then upsert sometimes.
    (when (seq blocks-to-remove-set)
      (search/delete-blocks! repo blocks-to-remove-set))
    (when (seq blocks-to-add)
      ;; unneeded serialization
      (search/upsert-blocks! repo (bean/->js blocks-to-add)))))

(defmethod handle :transact-pages [_window [_ repo data]]
  (let [{:keys [pages-to-remove-set pages-to-add]} data]
    ;; Order matters! Same id will delete then upsert sometimes.
    (when (seq pages-to-remove-set)
      (search/delete-pages! repo pages-to-remove-set))
    (when (seq pages-to-add)
      ;; unneeded serialization
      (search/upsert-pages! repo (bean/->js pages-to-add)))))

(defmethod handle :truncate-indice [_window [_ repo]]
  (search/truncate-blocks-table! repo)
  (search/truncate-pages-table! repo))

(defmethod handle :remove-db [_window [_ repo]]
  (search/delete-db! repo))
;; ^^^^
;; Search related IPCs End

(defn clear-cache!
  [window]
  (let [graphs-dir (get-graphs-dir)]
    (fs-extra/removeSync graphs-dir))

  (let [path (.getPath ^object app "userData")]
    (doseq [dir ["search" "IndexedDB"]]
      (let [path (node-path/join path dir)]
        (try
          (fs-extra/removeSync path)
          (catch :default e
            (logger/error "Clear cache:" e)))))
    (utils/send-to-renderer window "redirect" {:payload {:to :home}})))

(defmethod handle :clearCache [window _]
  (logger/info ::clear-cache)
  (search/close!)
  (clear-cache! window)
  (search/ensure-search-dir!))

(defmethod handle :openDialog [^js _window _messages]
  (open-dir-dialog))

(defmethod handle :copyDirectory [^js _window [_ src dest opts]]
  (fs-extra/copy src dest opts))

(defmethod handle :getLogseqDotDirRoot []
  (utils/get-ls-dotdir-root))

(defmethod handle :getSystemProxy [^js window]
  (if-let [sess (.. window -webContents -session)]
    (p/let [proxy (.resolveProxy sess "https://www.google.com")]
      proxy)
    (p/resolved nil)))

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

(defmethod handle :getDirname [_]
  js/__dirname)

(defmethod handle :getAppBaseInfo [^js win [_ _opts]]
  {:isFullScreen (.isFullScreen win)
   :isMaximized (.isMaximized win)})

(defmethod handle :getAssetsFiles [^js win [_ {:keys [exts]}]]
  (when-let [graph-path (state/get-window-graph-path win)]
    (when-let [assets-path (.join node-path graph-path "assets")]
      (when (fs-extra/pathExistsSync assets-path)
        (p/let [^js files (js-utils/getAllFiles assets-path (clj->js exts))]
          files)))))

(defn close-watcher-when-orphaned!
  "When it's the last window for the directory, close the watcher."
  [window graph-path]
  (when (not (win/graph-has-other-windows? window graph-path))
    (watcher/close-watcher! graph-path)))

(defn set-current-graph!
  [window graph-path]
  (let [old-path (state/get-window-graph-path window)]
    (when (and old-path graph-path (not= old-path graph-path))
      (close-watcher-when-orphaned! window old-path))
    (swap! state/state assoc :graph/current graph-path)
    (swap! state/state assoc-in [:window/graph window] graph-path)
    nil))

(defmethod handle :setCurrentGraph [^js window [_ graph-name]]
  (when graph-name
    (set-current-graph! window (utils/get-graph-dir graph-name))))

(defmethod handle :runGit [_ [_ args]]
  (when (seq args)
    (git/raw! args)))

(defmethod handle :runGitWithinCurrentGraph [_ [_ args]]
  (when (seq args)
    (git/init!)
    (git/run-git2! (clj->js args))))

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

(defmethod handle :gitCommitAll [_ [_ message]]
  (git/add-all-and-commit! message))

(defmethod handle :gitStatus [_ [_]]
  (git/short-status!))

(defmethod handle :installMarketPlugin [_ [_ mft]]
  (plugin/install-or-update! mft))

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

(defmethod handle :graphUnlinked [^js _win [_ repo]]
  (doseq [window (win/get-all-windows)]
    (utils/send-to-renderer window "graphUnlinked" (bean/->clj repo))))

(defmethod handle :dbsync [^js _win [_ graph tx-data]]
  (let [dir (utils/get-graph-dir graph)]
    (doseq [window (win/get-graph-all-windows dir)]
      (utils/send-to-renderer window "dbsync"
                              (bean/->clj {:graph graph
                                           :tx-data tx-data})))))

(defmethod handle :graphHasOtherWindow [^js win [_ graph]]
  (let [dir (utils/get-graph-dir graph)]
    (win/graph-has-other-windows? win dir)))

(defmethod handle :graphHasMultipleWindows [^js _win [_ graph]]
  (let [dir (utils/get-graph-dir graph)
        windows (win/get-graph-all-windows dir)]
    (> (count windows) 1)))

(defmethod handle :addDirWatcher [^js _window [_ dir options]]
  ;; receive dir path (not repo / graph) from frontend
  ;; Windows on same dir share the same watcher
  ;; Only close file watcher when:
  ;;    1. there is no one window on the same dir
  ;;    2. reset file watcher to resend `add` event on window refreshing
  (when dir
    (logger/debug ::watch-dir {:path dir})
    (watcher/watch-dir! dir options)
    nil))

(defmethod handle :unwatchDir [^js _window [_ dir]]
  (when dir
    (logger/debug ::unwatch-dir {:path dir})
    (watcher/close-watcher! dir)
    nil))

(defn open-new-window!
  "Persist db first before calling! Or may break db persistency"
  []
  (let [win (win/create-main-window!)]
    (win/on-close-actions! win close-watcher-when-orphaned!)
    (win/setup-window-listeners! win)
    win))

(defmethod handle :openNewWindow [_window [_]]
  (logger/info ::open-new-window)
  (open-new-window!)
  nil)

(defmethod handle :graphReady [window [_ graph-name]]
  (when-let [f (:window/once-graph-ready @state/state)]
    (f window graph-name)
    (state/set-state! :window/once-graph-ready nil)))

(defmethod handle :reloadWindowPage [^js win]
  (logger/warn ::reload-window-page)
  (when-let [web-content (.-webContents win)]
    (.reload web-content)))

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

;;;;;;;;;;;;;;;;;;;;;;;
;; file-sync-rs-apis ;;
;;;;;;;;;;;;;;;;;;;;;;;

(defmethod handle :key-gen [_]
  (rsapi/key-gen))

(defmethod handle :set-env [_ args]
  (apply rsapi/set-env (rest args)))

(defmethod handle :get-local-files-meta [_ args]
  (apply rsapi/get-local-files-meta (rest args)))

(defmethod handle :get-local-all-files-meta [_ args]
  (apply rsapi/get-local-all-files-meta (rest args)))

(defmethod handle :rename-local-file [_ args]
  (apply rsapi/rename-local-file (rest args)))

(defmethod handle :delete-local-files [_ args]
  (apply rsapi/delete-local-files (rest args)))

(defmethod handle :fetch-remote-files [_ args]
  (apply rsapi/fetch-remote-files (rest args)))

(defmethod handle :update-local-files [_ args]
  (apply rsapi/update-local-files (rest args)))

(defmethod handle :download-version-files [_ args]
  (apply rsapi/download-version-files (rest args)))

(defmethod handle :delete-remote-files [_ args]
  (apply rsapi/delete-remote-files (rest args)))

(defmethod handle :update-remote-files [_ args]
  (apply rsapi/update-remote-files (rest args)))

(defmethod handle :decrypt-fnames [_ args]
  (apply rsapi/decrypt-fnames (rest args)))

(defmethod handle :encrypt-fnames [_ args]
  (apply rsapi/encrypt-fnames (rest args)))

(defmethod handle :encrypt-with-passphrase [_ args]
  (apply rsapi/encrypt-with-passphrase (rest args)))

(defmethod handle :decrypt-with-passphrase [_ args]
  (apply rsapi/decrypt-with-passphrase (rest args)))

(defmethod handle :cancel-all-requests [_ args]
  (apply rsapi/cancel-all-requests (rest args)))

(defmethod handle :default [args]
  (logger/error "Error: no ipc handler for:" args))

(defn broadcast-persist-graph!
  "Receive graph-name (not graph path)
   Sends persist graph event to the renderer contains the target graph.
   Returns a promise<void>."
  [graph-name]
  (p/create (fn [resolve _reject]
              (let [graph-path (utils/get-graph-dir graph-name)
                    windows (win/get-graph-all-windows graph-path)
                    tar-graph-win (first windows)]
                (if tar-graph-win
                  ;; if no such graph, skip directly
                  (do (state/set-state! :window/once-persist-done #(resolve nil))
                      (utils/send-to-renderer tar-graph-win "persistGraph" graph-name))
                  (resolve nil))))))

(defmethod handle :broadcastPersistGraph [^js _win [_ graph-name]]
  (broadcast-persist-graph! graph-name))

(defmethod handle :broadcastPersistGraphDone [^js _win [_]]
  ;; main process -> renderer doesn't support promise, so we use a global var to store the callback
  (when-let [f (:window/once-persist-done @state/state)]
    (f)
    (state/set-state! :window/once-persist-done nil)))

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
