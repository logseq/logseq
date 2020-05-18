(ns frontend.fs
  (:require [frontend.util :as util]
            [promesa.core :as p]
            ["/frontend/git_ext" :as git-ext]))

(set! (.-fs js/window) (js/LightningFS. "logseq"))
(js/git.plugins.set "fs" js/window.fs)
(set! (.-pfs js/window) js/window.fs.promises)

(defn mkdir
  [dir]
  (js/pfs.mkdir dir))

(defn readdir
  [dir]
  (js/pfs.readdir dir))

(defn rmdir
  [dir]
  (git-ext/rimraf dir js/pfs))

(defn read-file
  [dir path]
  (js/pfs.readFile (str dir "/" path)
                   (clj->js {:encoding "utf8"})))

(defn read-file-2
  [dir path]
  (js/pfs.readFile (str dir "/" path)
                   (clj->js {})))

(defn write-file
  [dir path content]
  (js/pfs.writeFile (str dir "/" path) content))

(defn stat
  [dir path]
  (js/pfs.stat (str dir "/" path)))

(defn create-if-not-exists
  ([dir path]
   (create-if-not-exists dir path ""))
  ([dir path initial-content]
   (util/p-handle
    (stat dir path)
    (fn [_stat] true)
    (fn [error]
      (write-file dir path initial-content)
      false))))

(defn file-exists?
  [dir path]
  (util/p-handle
   (stat dir path)
   (fn [_stat] true)
   (fn [_e] false)))

(comment
  (def dir "/notes")
  )
