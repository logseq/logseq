(ns electron.handler
  (:require ["electron" :refer [ipcMain dialog app]]
            [cljs-bean.core :as bean]
            ["fs" :as fs]
            ["path" :as path]
            ["chokidar" :as watcher]
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

(defn- readdir
  [dir]
  (->> (tree-seq
        (fn [f] (.isDirectory (fs/statSync f) ()))
        (fn [d] (map #(.join path d %) (fs/readdirSync d)))
        dir)
       (doall)
       (vec)))

(defmethod handle :readdir [_window [_ dir]]
  (readdir dir))

(defmethod handle :unlink [_window [_ path]]
  (fs/unlinkSync path))

(defn- read-file
  [path]
  (.toString (fs/readFileSync path)))
(defmethod handle :readFile [_window [_ path]]
  (read-file path))

(defmethod handle :writeFile [_window [_ path content]]
  ;; TODO: handle error
  (fs/writeFileSync path content)
  (fs/statSync path))

(defmethod handle :rename [_window [_ old-path new-path]]
  (fs/renameSync old-path new-path))

(defmethod handle :stat [_window [_ path]]
  (fs/statSync path))

(defn- fix-win-path!
  [path]
  (when path
    (if utils/win32?
      (string/replace path "\\" "/")
      path)))

;; TODO: ignore according to mime types
(defn ignored-path?
  [dir path]
  (or
   (some #(string/starts-with? path (str dir "/" %))
         ["." "assets" "node_modules"])
   (some #(string/ends-with? path (str dir "/" %))
         [".swap" ".crswap" ".tmp"])))

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
                (remove (partial ignored-path? path))
                (filter #(contains? allowed-formats (get-ext %)))
                (map (fn [path]
                       (let [stat (fs/statSync path)]
                         (when-not (.isDirectory stat)
                           {:path (fix-win-path! path)
                            :content (read-file path)
                            :stat stat}))))
                (remove nil?))]
    (vec (cons {:path (fix-win-path! path)} result))))

;; TODO: Is it going to be slow if it's a huge directory
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

(defmethod handle :search [window [_ q]]
  (search/search-blocks q))

(defmethod handle :upsert-blocks [window [_ blocks]]
  (search/add-blocks! blocks))

(defmethod handle :delete-blocks [window [_ block-ids]]
  (search/delete-blocks! block-ids))

(defn- get-file-ext
  [file]
  (last (string/split file #"\.")))

(defonce file-watcher-chan "file-watcher")
(defn send-file-watcher! [^js win type payload]
  (.. win -webContents
      (send file-watcher-chan
            (bean/->js {:type type :payload payload}))))

(defn watch-dir!
  [win dir]
  (when (fs/existsSync dir)
    (let [watcher (.watch watcher dir
                          (clj->js
                           {:ignored (partial ignored-path? dir)
                            :ignoreInitial true
                            :persistent true
                            :awaitWriteFinish true}))]
      (.on watcher "add"
           (fn [path]
             (send-file-watcher! win "add"
                                 {:dir (fix-win-path! dir)
                                  :path (fix-win-path! path)
                                  :content (read-file path)
                                  :stat (fs/statSync path)})))
      (.on watcher "change"
           (fn [path]
             (send-file-watcher! win "change"
                                 {:dir (fix-win-path! dir)
                                  :path (fix-win-path! path)
                                  :content (read-file path)
                                  :stat (fs/statSync path)})))
      ;; (.on watcher "unlink"
      ;;      (fn [path]
      ;;        (send-file-watcher! win "unlink"
      ;;                            {:dir (fix-win-path! dir)
      ;;                             :path (fix-win-path! path)})))
      (.on watcher "error"
           (fn [path]
             (println "Watch error happened: "
                      {:path path})))

      (.on app "quit" #(.close watcher))

      true)))

(defmethod handle :addDirWatcher [window [_ dir]]
  (when dir
    (watch-dir! window dir)))

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
