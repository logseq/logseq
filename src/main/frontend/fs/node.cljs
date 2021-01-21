(ns frontend.fs.node
  (:require [frontend.fs.protocol :as protocol]
            [frontend.util :as util]
            [clojure.string :as string]
            [promesa.core :as p]
            [electron.ipc :as ipc]))

;; (defonce fs (when (util/electron?)
;;               (js/require "fs")))

;; (defonce path (when (util/electron?)
;;                 (js/require "path")))

;; (defn ls-dir [dir]
;;   (->> (tree-seq
;;         (fn [f] (.isDirectory (.statSync fs f) ()))
;;         (fn [d] (map #(.join path d %) (.readdirSync fs d)))
;;         dir)
;;        (apply concat)
;;        (doall)))

(defrecord Node []
  protocol/Fs
  (mkdir! [this dir]
    (ipc/ipc "mkdir" {:path dir}))
  (readdir [this dir]                   ; recursive
    (ipc/ipc "readdir" {:dir dir}))
  (unlink! [this path _opts]
    (ipc/ipc "unlink" {:path path}))
  (rmdir! [this dir]
    nil)
  (read-file [this dir path]
    (ipc/ipc "readFile" {:path (str dir "/" path)}))
  (write-file! [this repo dir path content opts]
    (ipc/ipc "writeFile" {:path (str dir "/" path)
                          :content content}))
  (rename! [this repo old-path new-path]
    (ipc/ipc "rename" {:old-path old-path
                       :new-path new-path}))
  (stat [this dir path]
    (ipc/ipc "stat" {:path (str dir path)})))
