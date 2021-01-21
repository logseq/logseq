(ns electron.handler
  (:require ["electron" :refer [ipcMain]]
            [cljs-bean.core :as bean]
            ["fs" :as fs]
            ["path" :as path]))

(defmulti handle (fn [args] (keyword (first args))))

(defmethod handle :mkdir [[_ dir]]
  (fs/mkdirSync dir))

(defn- ls-dir [dir]
  (->> (tree-seq
        (fn [f] (.isDirectory (.statSync fs f) ()))
        (fn [d] (map #(.join path d %) (.readdirSync fs d)))
        dir)
       (apply concat)
       (doall)))

(defmethod handle :readdir [[_ dir]]
  (->> (tree-seq
        (fn [f] (.isDirectory (fs/statSync f) ()))
        (fn [d] (map #(.join path d %) (fs/readdirSync d)))
        dir)
       (doall)))

(defmethod handle :unlink [[_ path]]
  (fs/unlinkSync path))

(defmethod handle :readFile [[_ path]]
  (.toString (fs/readFileSync path)))

(defmethod handle :writeFile [[_ path content]]
  (fs/writeFileSync path content))

(defmethod handle :rename [[_ old-path new-path]]
  (fs/renameSync old-path new-path))

(defmethod handle :stat [[_ path]]
  (fs/statSync path))

(defmethod handle :default [args]
  (println "Error: no ipc handler for: " (bean/->js args)))

(defn set-ipc-handler! [window]
  (.handle ipcMain "main"
           (fn [event args-js]
             (println "received: " args-js)
             (try
               (let [message (bean/->clj args-js)]
                 (bean/->js (handle message)))
               (catch js/Error e
                 (println "IPC error: " e)
                 e)))))
