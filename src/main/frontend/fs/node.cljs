(ns frontend.fs.node
  (:require [frontend.fs.protocol :as protocol]
            [frontend.util :as util]
            [clojure.string :as string]
            [promesa.core :as p]
            [electron.ipc :as ipc]
            [cljs-bean.core :as bean]))

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
  (read-file [this dir path]
    (let [path (concat-path dir path)]
      (ipc/ipc "readFile" path)))
  (write-file! [this repo dir path content _opts]
    (let [path (concat-path dir path)]
      (ipc/ipc "writeFile" path content)))
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
