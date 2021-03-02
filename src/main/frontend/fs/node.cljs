(ns frontend.fs.node
  (:require [frontend.fs.protocol :as protocol]
            [frontend.util :as util]
            [frontend.db :as db]
            [clojure.string :as string]
            [promesa.core :as p]
            [electron.ipc :as ipc]
            [cljs-bean.core :as bean]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]))

(defn concat-path
  [dir path]
  (cond
    (nil? path)
    dir

    (string/starts-with? path dir)
    path

    :else
    (str (string/replace dir #"/$" "")
         (when path
           (str "/" (string/replace path #"^/" ""))))))

(defn- write-file-impl!
  [repo dir path content {:keys [ok-handler error-handler] :as opts} stat]
  (->
   (p/let [result (ipc/ipc "writeFile" path content)
           mtime (gobj/get result "mtime")]
     (db/set-file-last-modified-at! repo path mtime)
     (when ok-handler
       (ok-handler repo path result))
     result)
   (p/catch (fn [error]
              (if error-handler
                (error-handler error)
                (log/error :write-file-failed error)))))
  ;; (p/let [disk-mtime (when stat (gobj/get stat "mtime"))
  ;;         db-mtime (db/get-file-last-modified-at repo path)]
  ;;   (if (not= disk-mtime db-mtime)
  ;;     (js/alert (str "The file has been modified in your local disk! File path: " path
  ;;                    ", please save your changes and click the refresh button to reload it."))
  ;;     (->
  ;;      (p/let [result (ipc/ipc "writeFile" path content)
  ;;              mtime (gobj/get result "mtime")]
  ;;        (db/set-file-last-modified-at! repo path mtime)
  ;;        (when ok-handler
  ;;          (ok-handler repo path result))
  ;;        result)
  ;;      (p/catch (fn [error]
  ;;                 (if error-handler
  ;;                   (error-handler error)
  ;;                   (log/error :write-file-failed error)))))))
)

(defrecord Node []
  protocol/Fs
  (mkdir! [this dir]
    (ipc/ipc "mkdir" dir))
  (readdir [this dir]                   ; recursive
    (ipc/ipc "readdir" dir))
  (unlink! [this path _opts]
    (ipc/ipc "unlink" path))
  (rmdir! [this dir]
    nil)
  (read-file [this dir path _options]
    (let [path (concat-path dir path)]
      (ipc/ipc "readFile" path)))
  (write-file! [this repo dir path content {:keys [ok-handler error-handler] :as opts}]
    (let [path (concat-path dir path)]
      (->
       (p/let [stat (protocol/stat this dir path)]
         ;; update
         (write-file-impl! repo dir path content opts stat))
       (p/catch
        (fn [_error]
             ;; create
          (write-file-impl! repo dir path content opts nil))))))
  (rename! [this repo old-path new-path]
    (ipc/ipc "rename" old-path new-path))
  (stat [this dir path]
    (let [path (concat-path dir path)]
      (ipc/ipc "stat" path)))
  (open-dir [this ok-handler]
    (ipc/ipc "openDir" {}))
  (get-files [this path-or-handle ok-handler]
    (ipc/ipc "getFiles" path-or-handle))
  (watch-dir! [this dir]
    (ipc/ipc "addDirWatcher" dir)))
