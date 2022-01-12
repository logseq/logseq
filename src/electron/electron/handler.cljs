(ns electron.handler
  (:require ["electron" :refer [ipcMain dialog app autoUpdater]]
            [cljs-bean.core :as bean]
            ["fs" :as fs]
            ["buffer" :as buffer]
            ["fs-extra" :as fs-extra]
            ["path" :as path]
            ["os" :as os]
            [electron.fs-watcher :as watcher]
            [electron.configs :as cfgs]
            [promesa.core :as p]
            [clojure.string :as string]
            [electron.utils :as utils]
            [electron.state :as state]
            [clojure.core.async :as async]
            [electron.search :as search]
            [electron.git :as git]
            [electron.plugin :as plugin]
            [electron.window :as win]))

(defmulti handle (fn [_window args] (keyword (first args))))

(defmethod handle :mkdir [_window [_ dir]]
  (fs/mkdirSync dir))

(defmethod handle :mkdir-recur [_window [_ dir]]
  (fs/mkdirSync dir #js {:recursive true}))

;; {encoding: 'utf8', withFileTypes: true}
(defn- readdir
  [dir]
  (->> (tree-seq
         (fn [^js f]
           (.isDirectory (fs/statSync f) ()))
         (fn [d]
           (let [files (fs/readdirSync d (clj->js {:withFileTypes true}))]
             (->> files
                  (remove #(.isSymbolicLink ^js %))
                  (remove #(string/starts-with? (.-name ^js %) "."))
                  (map #(.join path d (.-name %))))))
         dir)
       (doall)
       (vec)))

(defmethod handle :readdir [_window [_ dir]]
  (readdir dir))

(defmethod handle :unlink [_window [_ repo path]]
  (let [file-name (-> (string/replace path (str repo "/") "")
                      (string/replace "/" "_")
                      (string/replace "\\" "_"))
        recycle-dir (str repo "/logseq/.recycle")
        _ (fs-extra/ensureDirSync recycle-dir)
        new-path (str recycle-dir "/" file-name)]
    (fs/renameSync path new-path)))

(defn backup-file
  [repo path content]
  (let [file-name (-> (string/replace path (str repo "/") "")
                      (string/replace "/" "_")
                      (string/replace "\\" "_"))
        bak-dir (str repo "/logseq/bak")
        _ (fs-extra/ensureDirSync bak-dir)
        new-path (str bak-dir "/" file-name "."
                      (string/replace (.toISOString (js/Date.)) ":" "_"))]
    (fs/writeFileSync new-path content)
    (fs/statSync new-path)
    new-path))

(defmethod handle :backupDbFile [_window [_ repo path db-content]]
  (backup-file repo path db-content))

(defmethod handle :readFile [_window [_ path]]
  (utils/read-file path))

(defn writable?
  [path]
  (assert (string? path))
  (try
    (fs/accessSync path (aget fs "W_OK"))
    (catch js/Error _e
      false)))

(defmethod handle :writeFile [_window [_ repo path content]]
  (let [^js Buf (.-Buffer buffer)
        ^js content (if (instance? js/ArrayBuffer content)
                      (.from Buf content)
                      content)]
    (try
      (when (and (fs/existsSync path) (not (writable? path)))
        (fs/chmodSync path "644"))
      (fs/writeFileSync path content)
      (fs/statSync path)
      (catch js/Error e
        (let [backup-path (try
                            (backup-file repo path content)
                            (catch js/Error e
                              (println "Backup file failed")
                              (js/console.dir e)))]
          (utils/send-to-renderer "notification" {:type "error"
                                                  :payload (str "Write to the file " path
                                                                " failed, "
                                                                e
                                                                (when backup-path
                                                                  (str ". A backup file was saved to "
                                                                       backup-path
                                                                       ".")))}))))))

(defmethod handle :rename [_window [_ old-path new-path]]
  (fs/renameSync old-path new-path))

(defmethod handle :stat [_window [_ path]]
  (fs/statSync path))

(defonce allowed-formats
         #{:org :markdown :md :edn :json :js :css :excalidraw})

(defn get-ext
  [p]
  (-> (.extname path p)
      (subs 1)
      keyword))

(defn- get-files
  [path]
  (let [result (->>
                 (readdir path)
                 (remove (partial utils/ignored-path? path))
                 (filter #(contains? allowed-formats (get-ext %)))
                 (map (fn [path]
                        (let [stat (fs/statSync path)]
                          (when-not (.isDirectory stat)
                            {:path    (utils/fix-win-path! path)
                             :content (utils/read-file path)
                             :stat    stat}))))
                 (remove nil?))]
    (vec (cons {:path (utils/fix-win-path! path)} result))))

(defn open-dir-dialog []
  (p/let [result (.showOpenDialog dialog (bean/->js
                                          {:properties ["openDirectory" "createDirectory" "promptToCreate"]}))
          result (get (js->clj result) "filePaths")]
    (p/resolved (first result))))

(defmethod handle :openDir [^js _window _messages]
  (p/let [path (open-dir-dialog)]
    (if path
      (p/resolved (bean/->js (get-files path)))
      (p/rejected (js/Error "path empty")))))

(defmethod handle :getFiles [_window [_ path]]
  (get-files path))

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
  (let [dir (.join path (.homedir os) ".logseq" "graphs")]
    (fs-extra/ensureDirSync dir)
    dir))

(defn- get-graphs
  []
  (let [dir (get-graphs-dir)
        graphs-path (.join path (.homedir os) ".logseq" "graphs")]
    (->> (readdir dir)
         (remove #{graphs-path})
         (map #(path/basename % ".transit"))
         (map graph-name->path))))

(defmethod handle :getGraphs [_window [_]]
  (get-graphs))

(defn- get-graph-path
  [graph-name]
  (when graph-name
    (let [graph-name (sanitize-graph-name graph-name)
          dir (get-graphs-dir)]
      (.join path dir (str graph-name ".transit")))))

(defn- get-serialized-graph
  [graph-name]
  (when graph-name
    (when-let [file-path (get-graph-path graph-name)]
      (when (fs/existsSync file-path)
        (utils/read-file file-path)))))

(defmethod handle :getSerializedGraph [_window [_ graph-name]]
  (get-serialized-graph graph-name))

(defmethod handle :saveGraph [_window [_ graph-name value-str]]
  (when (and graph-name value-str)
    (when-let [file-path (get-graph-path graph-name)]
      (fs/writeFileSync file-path value-str))))

(defmethod handle :deleteGraph [_window [_ graph-name]]
  (when graph-name
    (when-let [file-path (get-graph-path graph-name)]
      (when (fs/existsSync file-path)
        (fs-extra/removeSync file-path)))))

(defmethod handle :openNewWindow [_window [_]]
  (let [win (win/create-main-window)]
    (win/on-close-save! win)
    (win/setup-window-listeners! win)
    nil))

(defmethod handle :persistent-dbs-saved [_window _]
  (async/put! state/persistent-dbs-chan true)
  true)

(defmethod handle :search-blocks [_window [_ repo q opts]]
  (search/search-blocks repo q opts))

(defmethod handle :rebuild-blocks-indice [_window [_ repo data]]
  (search/truncate-blocks-table! repo)
  ;; unneeded serialization
  (search/upsert-blocks! repo (bean/->js data))
  [])

(defmethod handle :transact-blocks [_window [_ repo data]]
  (let [{:keys [blocks-to-remove-set blocks-to-add]} data]
    (when (seq blocks-to-remove-set)
      (search/delete-blocks! repo blocks-to-remove-set))
    (when (seq blocks-to-add)
      ;; unneeded serialization
      (search/upsert-blocks! repo (bean/->js blocks-to-add)))))

(defmethod handle :truncate-blocks [_window [_ repo]]
  (search/truncate-blocks-table! repo))

(defmethod handle :remove-db [_window [_ repo]]
  (search/delete-db! repo))

(defn clear-cache!
  []
  (let [graphs-dir (get-graphs-dir)]
    (fs-extra/removeSync graphs-dir))

  (let [path (.getPath ^object app "userData")]
    (doseq [dir ["search" "IndexedDB"]]
      (let [path (path/join path dir)]
        (try
          (fs-extra/removeSync path)
          (catch js/Error e
            (js/console.error e)))))
    (utils/send-to-renderer "redirect" {:payload {:to :home}})))

(defmethod handle :clearCache [_window _]
  (search/close!)
  (clear-cache!)
  (search/ensure-search-dir!))

(defmethod handle :addDirWatcher [window [_ dir]]
  (watcher/close-watcher!)
  (when dir
    (watcher/watch-dir! window dir)))

(defmethod handle :openDialog [^js _window _messages]
  (open-dir-dialog))

(defmethod handle :getLogseqDotDirRoot []
  (utils/get-ls-dotdir-root))

(defmethod handle :getUserDefaultPlugins []
  (utils/get-ls-default-plugins))

(defmethod handle :relaunchApp []
  (.relaunch app) (.quit app))

(defmethod handle :quitApp []
  (.quit app))

(defmethod handle :userAppCfgs [_window [_ k v]]
  (let [config (cfgs/get-config)]
    (if-not k
      config
      (if-not (nil? v)
        (cfgs/set-item! (keyword k) v)
        (cfgs/get-item (keyword k))))))

(defmethod handle :getDirname [_]
  js/__dirname)

(defmethod handle :getAppBaseInfo [^js win [_ _opts]]
  {:isFullScreen (.isFullScreen win)})

(defmethod handle :setCurrentGraph [^js win [_ path]]
  (let [path (when path (utils/get-graph-dir path))]
    (swap! state/state assoc :graph/current path)
    (swap! state/state assoc-in [:window/graph win] path)
    nil))

(defmethod handle :runGit [_ [_ args]]
  (when (seq args)
    (git/raw! args)))

(defmethod handle :gitCommitAll [_ [_ message]]
  (git/add-all-and-commit! message))

(defmethod handle :installMarketPlugin [_ [_ mft]]
  (plugin/install-or-update! mft))

(defmethod handle :updateMarketPlugin [_ [_ pkg]]
  (plugin/install-or-update! pkg))

(defmethod handle :uninstallMarketPlugin [_ [_ id]]
  (plugin/uninstall! id))

(defmethod handle :quitAndInstall []
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

(defn- graph-has-other-windows? [win graph]
  (let [dir (utils/get-graph-dir graph)
        windows (win/get-graph-all-windows dir)
        windows (filter #(.isVisible %) windows)]
    (boolean (some (fn [^js window] (not= (.-id win) (.-id window))) windows))))

(defmethod handle :graphHasOtherWindow [^js win [_ graph]]
  (graph-has-other-windows? win graph))

(defmethod handle :graphHasMultipleWindows [^js _win [_ graph]]
  (let [dir (utils/get-graph-dir graph)
        windows (win/get-graph-all-windows dir)
        windows (filter #(.isVisible %) windows)]
    (> (count windows) 1)))

(defmethod handle :reloadWindowPage [^js win]
  (when-let [web-content (.-webContents win)]
    (.reload web-content)))

(defmethod handle :default [args]
  (println "Error: no ipc handler for: " (bean/->js args)))

(defn set-ipc-handler! [window]
  (let [main-channel "main"]
    (.handle ipcMain main-channel
             (fn [^js event args-js]
               (try
                 (let [message (bean/->clj args-js)]
                   (bean/->js (handle (or (utils/get-win-from-sender event) window) message)))
                 (catch js/Error e
                   (when-not (contains? #{"mkdir" "stat"} (nth args-js 0))
                     (println "IPC error: " {:event event
                                             :args args-js}
                             e))
                   e))))
    #(.removeHandler ipcMain main-channel)))
