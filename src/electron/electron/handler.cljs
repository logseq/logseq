(ns electron.handler
  (:require ["electron" :refer [ipcMain dialog]]
            [cljs-bean.core :as bean]
            ["fs" :as fs]
            ["path" :as path]
            [promesa.core :as p]
            [goog.object :as gobj]))

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
  (fs/writeFileSync path content))

(defmethod handle :rename [_window [_ old-path new-path]]
  (fs/renameSync old-path new-path))

(defmethod handle :stat [_window [_ path]]
  (fs/statSync path))

(defn- get-files
  [path]
  (let [result (->> (map
                      (fn [path]
                        (let [stat (fs/statSync path)]
                          (when-not (.isDirectory stat)
                            {:path path
                             :content (read-file path)
                             :stat stat})))
                      (readdir path))
                    (remove nil?))]
    (vec (cons {:path path} result))))

;; TODO: Is it going to be slow if it's a huge directory
(defmethod handle :openDir [window _messages]
  (let [result (.showOpenDialogSync dialog (bean/->js
                                            {:properties ["openDirectory"]}))
        path (first result)]
    (get-files path)))

(defmethod handle :getFiles [window [_ path]]
  (get-files path))

(defmethod handle :default [args]
  (println "Error: no ipc handler for: " (bean/->js args)))

(defn set-ipc-handler! [window]
  (.handle ipcMain "main"
           (fn [event args-js]
             (try
               (let [message (bean/->clj args-js)]
                 (bean/->js (handle window message)))
               (catch js/Error e
                 (println "IPC error: " e)
                 e)))))
