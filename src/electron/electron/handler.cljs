(ns electron.handler
  (:require ["electron" :refer [ipcMain dialog app]]
            [cljs-bean.core :as bean]
            ["fs" :as fs]
            ["fs-extra" :as fs-extra]
            ["path" :as path]
            [electron.fs-watcher :as watcher]
            [promesa.core :as p]
            [goog.object :as gobj]
            [clojure.string :as string]
            [electron.utils :as utils]
            [electron.state :as state]
            [clojure.core.async :as async]
            [electron.search :as search]))

(defmulti handle (fn [_window args] (keyword (first args))))

(defmethod handle :mkdir [_window [_ dir]]
  (fs/mkdirSync dir))

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

(defmethod handle :unlink [_window [_ path]]
  (fs/unlinkSync path))

(defmethod handle :readFile [_window [_ path]]
  (utils/read-file path))

(defmethod handle :writeFile [_window [_ path content]]
  ;; TODO: handle error
  (fs/writeFileSync path content)
  (fs/statSync path))

(defmethod handle :rename [_window [_ old-path new-path]]
  (fs/renameSync old-path new-path))

(defmethod handle :stat [_window [_ path]]
  (fs/statSync path))



(defonce allowed-formats
  #{:org :markdown :md :edn :json :css :excalidraw})

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
                           {:path (utils/fix-win-path! path)
                            :content (utils/read-file path)
                            :stat stat}))))
                (remove nil?))]
    (vec (cons {:path (utils/fix-win-path! path)} result))))

(defn- get-ls-dotdir-root
  []
  (let [lg-dir (str (.getPath app "home") "/.logseq")]
    (if-not (fs/existsSync lg-dir)
      (and (fs/mkdirSync lg-dir) lg-dir)
      lg-dir)))

(defn- get-ls-default-plugins
  []
  (let [plugins-root (path/join (get-ls-dotdir-root) "plugins")
        _ (if-not (fs/existsSync plugins-root)
            (fs/mkdirSync plugins-root))
        dirs (js->clj (fs/readdirSync plugins-root #js{"withFileTypes" true}))
        dirs (->> dirs
                  (filter #(.isDirectory %))
                  (filter #(not (string/starts-with? (.-name %) "_")))
                  (map #(path/join plugins-root (.-name %))))]
    dirs))

(defmethod handle :openDir [^js window _messages]
  (let [result (.showOpenDialogSync dialog (bean/->js
                                            {:properties ["openDirectory" "createDirectory" "promptToCreate"]}))
        path (first result)]
    (.. ^js window -webContents
        (send "open-dir-confirmed"
              (bean/->js {:opened? true})))
    (get-files path)))

(defmethod handle :getFiles [window [_ path]]
  (get-files path))

(defmethod handle :persistent-dbs-saved [window _]
  (async/put! state/persistent-dbs-chan true )
  true)

(defmethod handle :search-blocks [window [_ repo q opts]]
  (search/search-blocks repo q opts))

(defmethod handle :rebuild-blocks-indice [window [_ repo data]]
  (search/truncate-blocks-table! repo)
  ;; unneeded serialization
  (search/upsert-blocks! repo (bean/->js data)))

(defmethod handle :transact-blocks [window [_ repo data]]
  (let [{:keys [blocks-to-remove-set blocks-to-add]} data]
    (when (seq blocks-to-remove-set)
      (search/delete-blocks! repo blocks-to-remove-set))
    (when (seq blocks-to-add)
      ;; unneeded serialization
      (search/upsert-blocks! repo (bean/->js blocks-to-add)))))

(defmethod handle :truncate-blocks [window [_ repo]]
  (search/truncate-blocks-table! repo))

(defmethod handle :remove-db [window [_ repo]]
  (search/delete-db! repo))

(defn clear-cache!
  []
  (let [path (.getPath ^object app "userData")]
    (doseq [dir ["search" "IndexedDB"]]
      (let [path (path/join path dir)]
        (try
          (fs-extra/removeSync path)
          (catch js/Error e
            (js/console.error e)))))))

(defmethod handle :clearCache [_window _]
  (search/close!)
  (clear-cache!)
  (search/ensure-search-dir!))

(defmethod handle :addDirWatcher [window [_ dir]]
  (when dir
    (watcher/watch-dir! window dir)))

(defmethod handle :openDialogSync [^js window _messages]
  (let [result (.showOpenDialogSync dialog (bean/->js
                                             {:properties ["openDirectory"]}))
        path (first result)]
    path))

(defmethod handle :getLogseqDotDirRoot []
  (get-ls-dotdir-root))

(defmethod handle :getUserDefaultPlugins []
  (get-ls-default-plugins))

(defmethod handle :relaunchApp []
  (.relaunch app) (.quit app))

(defmethod handle :quitApp []
  (.quit app))


(defmethod handle :default [args]
  (println "Error: no ipc handler for: " (bean/->js args)))

(defn set-ipc-handler! [window]
  (let [main-channel "main"]
    (.handle ipcMain main-channel
             (fn [event args-js]
               (try
                 (let [message (bean/->clj args-js)]
                   (bean/->js (handle window message)))
                 (catch js/Error e
                   (when-not (contains? #{"mkdir" "stat"} (nth args-js 0))
                     (println "IPC error: " {:event event
                                            :args args-js}
                             e))
                   e))))
    #(.removeHandler ipcMain main-channel)))
